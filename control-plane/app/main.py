"""
THEDAL Control Plane — FastAPI Application Entrypoint
"""

from pathlib import Path
from typing import Optional, Dict, Any
from pydantic import BaseModel
from fastapi import FastAPI, Request, HTTPException, status, Query, Body
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from app.config import settings
from app.models import (
    SystemStatus, OperationRequest, OperationResponse,
    HealthCheckSummary, ManagementIPPreviewRequest, ManagementIPApplyRequest,
    ConnectivityCheckRequest
)
from app.services.terraform import TerraformService
from app.services.ansible import AnsibleService
from app.services.aws import AWSService
from app.services.ssh import SSHService
from app.services.health import HealthService
from app.services.operations import OperationsManager, SecurityValidationError, OperationLockError
from app.services.learning import LearningService
from app.services.commands import CommandService
from app.services.profiles import AWSProfileService
from app.services.autostop import SafetyService
from app.services.management_ip import ManagementIPService


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/api/docs",
    redoc_url=None
)

# Mount Static Files & Templates
app.mount("/static", StaticFiles(directory=str(settings.CONTROL_PLANE_DIR / "app" / "static")), name="static")
templates = Jinja2Templates(directory=str(settings.CONTROL_PLANE_DIR / "app" / "templates"))


# Request Models
class LabProgressUpdate(BaseModel):
    lab_id: str
    status: Optional[str] = None
    notes: Optional[str] = None
    bookmarked: Optional[bool] = None


class AWSProfileCreate(BaseModel):
    profile_name: str
    access_key_id: str
    secret_access_key: str
    region: str = "ap-south-1"


class AutoStopConfig(BaseModel):
    enabled: bool
    grace_period_minutes: int = 15


# ==============================================================================
# 1. HTML Page Routes
# ==============================================================================

@app.get("/", response_class=HTMLResponse)
async def page_dashboard(request: Request):
    aws_status = AWSService.get_connection_status()
    tf_status = TerraformService.get_status()
    instances = AWSService.get_instances()
    health_summary = HealthService.run_all_checks()

    running = sum(1 for i in instances if i.state == "running")
    total = len(instances)

    sys_status = SystemStatus(
        aws_connected=aws_status["connected"],
        aws_region=settings.AWS_DEFAULT_REGION,
        terraform_status=tf_status["status"],
        ansible_status="READY",
        environment_health=health_summary.overall_status,
        active_operation=OperationsManager.get_active_operation()
    )

    return templates.TemplateResponse(request=request, name="dashboard.html", context={
        "active_page": "dashboard",
        "status": sys_status,
        "aws": aws_status,
        "terraform": tf_status,
        "tf_version": TerraformService.get_version(),
        "instances": instances,
        "running_instances": running,
        "total_instances": total,
        "health_summary": health_summary,
        "recent_logs": OperationsManager.list_logs()[:5]
    })


@app.get("/resources", response_class=HTMLResponse)
async def page_resources(request: Request):
    instances = AWSService.get_instances()
    network = AWSService.get_network_topology()
    health_summary = HealthService.run_all_checks()
    tf_status = TerraformService.get_status()

    sys_status = SystemStatus(
        aws_connected=True,
        aws_region=settings.AWS_DEFAULT_REGION,
        terraform_status=tf_status["status"],
        ansible_status="READY",
        environment_health=health_summary.overall_status
    )

    return templates.TemplateResponse(request=request, name="resources.html", context={
        "active_page": "resources",
        "status": sys_status,
        "instances": instances,
        "network": network
    })


@app.get("/operations", response_class=HTMLResponse)
async def page_operations(request: Request):
    tf_status = TerraformService.get_status()
    health_summary = HealthService.run_all_checks()

    sys_status = SystemStatus(
        aws_connected=True,
        aws_region=settings.AWS_DEFAULT_REGION,
        terraform_status=tf_status["status"],
        ansible_status="READY",
        environment_health=health_summary.overall_status
    )

    return templates.TemplateResponse(request=request, name="operations.html", context={
        "active_page": "operations",
        "status": sys_status
    })


@app.get("/learning", response_class=HTMLResponse)
async def page_learning(request: Request):
    tf_status = TerraformService.get_status()
    health_summary = HealthService.run_all_checks()
    labs = LearningService.get_all_labs_with_progress()
    stats = LearningService.get_curriculum_stats()

    sys_status = SystemStatus(
        aws_connected=True,
        aws_region=settings.AWS_DEFAULT_REGION,
        terraform_status=tf_status["status"],
        ansible_status="READY",
        environment_health=health_summary.overall_status
    )

    return templates.TemplateResponse(request=request, name="learning.html", context={
        "active_page": "learning",
        "status": sys_status,
        "labs": labs,
        "stats": stats
    })


@app.get("/learning/lab/{lab_id}", response_class=HTMLResponse)
async def page_lab_view(request: Request, lab_id: str):
    lab_detail = LearningService.get_lab_detail(lab_id)
    if not lab_detail:
        raise HTTPException(status_code=404, detail="Lab not found in curriculum.")

    tf_status = TerraformService.get_status()
    health_summary = HealthService.run_all_checks()

    sys_status = SystemStatus(
        aws_connected=True,
        aws_region=settings.AWS_DEFAULT_REGION,
        terraform_status=tf_status["status"],
        ansible_status="READY",
        environment_health=health_summary.overall_status
    )

    return templates.TemplateResponse(request=request, name="lab_view.html", context={
        "active_page": "learning",
        "status": sys_status,
        "lab": lab_detail
    })


@app.get("/logs", response_class=HTMLResponse)
async def page_logs(request: Request, file: Optional[str] = None):
    logs = OperationsManager.list_logs()
    selected_log = file or (logs[0]["filename"] if logs else None)
    log_content = OperationsManager.read_log_file(selected_log) if selected_log else "No logs available."
    tf_status = TerraformService.get_status()
    health_summary = HealthService.run_all_checks()

    sys_status = SystemStatus(
        aws_connected=True,
        aws_region=settings.AWS_DEFAULT_REGION,
        terraform_status=tf_status["status"],
        ansible_status="READY",
        environment_health=health_summary.overall_status
    )

    return templates.TemplateResponse(request=request, name="logs.html", context={
        "active_page": "logs",
        "status": sys_status,
        "logs": logs,
        "selected_log": selected_log,
        "log_content": log_content
    })


@app.get("/settings", response_class=HTMLResponse)
async def page_settings(request: Request):
    tf_status = TerraformService.get_status()
    health_summary = HealthService.run_all_checks()
    ssh_info = SSHService.get_connection_info()
    dynamic_commands = CommandService.get_dynamic_commands()
    aws_profiles = AWSProfileService.list_profiles()
    autostop_status = SafetyService.get_autostop_status()

    sys_status = SystemStatus(
        aws_connected=True,
        aws_region=settings.AWS_DEFAULT_REGION,
        terraform_status=tf_status["status"],
        ansible_status="READY",
        environment_health=health_summary.overall_status
    )

    return templates.TemplateResponse(request=request, name="settings.html", context={
        "active_page": "settings",
        "status": sys_status,
        "config": settings,
        "ssh_info": ssh_info,
        "dynamic_commands": dynamic_commands,
        "aws_profiles": aws_profiles,
        "autostop": autostop_status
    })


# ==============================================================================
# 2. REST API Endpoints
# ==============================================================================

@app.get("/api/status", response_model=SystemStatus)
async def api_status():
    aws_status = AWSService.get_connection_status()
    tf_status = TerraformService.get_status()
    health_summary = HealthService.run_all_checks()

    return SystemStatus(
        aws_connected=aws_status["connected"],
        aws_region=settings.AWS_DEFAULT_REGION,
        terraform_status=tf_status["status"],
        ansible_status="READY",
        environment_health=health_summary.overall_status,
        active_operation=OperationsManager.get_active_operation()
    )


@app.get("/api/resources")
async def api_resources():
    return {
        "instances": AWSService.get_instances(),
        "network": AWSService.get_network_topology()
    }


@app.get("/api/terraform")
async def api_terraform():
    return {
        "status": TerraformService.get_status(),
        "outputs": TerraformService.get_outputs(),
        "version": TerraformService.get_version()
    }


@app.get("/api/health", response_model=HealthCheckSummary)
async def api_health():
    return HealthService.run_all_checks()


@app.post("/api/health/check")
async def api_health_check_post():
    summary = HealthService.run_all_checks()
    return {"success": True, "health": summary}


@app.post("/api/terraform/plan")
async def api_terraform_plan():
    try:
        code, out, log_path = TerraformService.plan()
        return {
            "success": code == 0,
            "message": "Terraform plan completed.",
            "log_file": log_path.name
        }
    except (OperationLockError, SecurityValidationError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/terraform/apply")
async def api_terraform_apply(req: OperationRequest):
    try:
        code, out, log_path = TerraformService.apply(confirmation=req.confirmation)
        return {
            "success": code == 0,
            "message": "Terraform apply completed.",
            "log_file": log_path.name
        }
    except (OperationLockError, SecurityValidationError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/terraform/destroy")
async def api_terraform_destroy(req: OperationRequest):
    try:
        code, out, log_path = TerraformService.destroy(
            confirmation=req.confirmation,
            confirmation_phrase=req.confirmation_phrase
        )
        return {
            "success": code == 0,
            "message": "Terraform destroy completed.",
            "log_file": log_path.name
        }
    except (OperationLockError, SecurityValidationError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ec2/start")
async def api_ec2_start():
    result = AWSService.start_instances()
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Failed to start instances"))
    return result


@app.post("/api/ec2/stop")
async def api_ec2_stop():
    result = AWSService.stop_instances()
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Failed to stop instances"))
    return result


@app.post("/api/inventory/generate")
async def api_inventory_generate():
    try:
        code, out, log_path = AnsibleService.generate_inventory()
        return {
            "success": code == 0,
            "message": "Ansible inventory generated.",
            "log_file": log_path.name
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ansible/playbook")
async def api_ansible_playbook(req: OperationRequest):
    try:
        code, out, log_path = AnsibleService.run_playbook(
            playbook_key=req.target or "",
            confirmation=req.confirmation
        )
        return {
            "success": code == 0,
            "message": f"Playbook '{req.target}' finished.",
            "log_file": log_path.name
        }
    except (OperationLockError, SecurityValidationError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ansible/provision")
async def api_ansible_provision(req: OperationRequest):
    try:
        code, out, log_path = AnsibleService.run_full_provision(confirmation=req.confirmation)
        return {
            "success": code == 0,
            "message": "Full system provisioning completed.",
            "log_file": log_path.name
        }
    except (OperationLockError, SecurityValidationError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/wazuh/tunnel/start")
async def api_wazuh_tunnel_start():
    result = SSHService.start_wazuh_tunnel()
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Failed to start SSH tunnel"))
    return result


@app.get("/api/logs/download")
async def api_logs_download(file: str = Query(...)):
    safe_path = (settings.LOGS_DIR / file).resolve()
    if not str(safe_path).startswith(str(settings.LOGS_DIR.resolve())):
        raise HTTPException(status_code=400, detail="Invalid log file path.")
    if not safe_path.exists():
        raise HTTPException(status_code=404, detail="Log file not found.")
    return FileResponse(path=safe_path, filename=file, media_type="text/plain")


# ==============================================================================
# 3. Learning Portal, Dynamic Commands & Safety APIs
# ==============================================================================

@app.post("/api/learning/progress")
async def api_learning_progress(update: LabProgressUpdate):
    try:
        res = LearningService.update_progress(
            lab_id=update.lab_id,
            status=update.status,
            notes=update.notes,
            bookmarked=update.bookmarked
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/learning/stats")
async def api_learning_stats():
    return LearningService.get_curriculum_stats()


@app.get("/api/commands/dynamic")
async def api_commands_dynamic():
    return CommandService.get_dynamic_commands()


@app.get("/api/aws/profiles")
async def api_aws_profiles():
    return AWSProfileService.list_profiles()


@app.post("/api/aws/profiles/create")
async def api_aws_profiles_create(prof: AWSProfileCreate):
    try:
        res = AWSProfileService.save_profile(
            profile_name=prof.profile_name,
            access_key_id=prof.access_key_id,
            secret_access_key=prof.secret_access_key,
            region=prof.region
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/safety/autostop")
async def api_safety_autostop_get():
    return SafetyService.get_autostop_status()


@app.post("/api/safety/autostop")
async def api_safety_autostop_post(config: AutoStopConfig):
    return SafetyService.configure_autostop(
        enabled=config.enabled,
        grace_period_minutes=config.grace_period_minutes
    )


@app.post("/api/ssh/ensure-key")
async def api_ssh_ensure_key():
    return SafetyService.ensure_ssh_key()


@app.get("/api/infrastructure/hosts/{host_key}")
async def api_infrastructure_host_detail(host_key: str):
    detail = AWSService.get_host_detail(host_key)
    if not detail:
        raise HTTPException(status_code=404, detail=f"Host '{host_key}' not found.")
    return detail


@app.get("/api/learning/labs")
async def api_learning_labs():
    all_labs = LearningService.get_all_labs_with_progress()
    regular_labs = [l for l in all_labs if not l["id"].startswith("challenge-")]
    return {
        "labs": regular_labs,
        "stats": LearningService.get_curriculum_stats()
    }


@app.get("/api/learning/labs/{lab_id}")
async def api_learning_lab_detail(lab_id: str):
    detail = LearningService.get_workspace(lab_id)
    if not detail:
        raise HTTPException(status_code=404, detail=f"Lab '{lab_id}' not found in curriculum.")
    return detail


@app.get("/api/learning/labs/{lab_id}/workspace")
async def api_learning_lab_workspace(lab_id: str):
    workspace = LearningService.get_workspace(lab_id)
    if not workspace:
        raise HTTPException(status_code=404, detail=f"Workspace for '{lab_id}' not found.")
    return workspace


@app.post("/api/learning/evidence")
async def api_learning_evidence_add(evidence: Dict[str, Any] = Body(...)):
    try:
        lab_id = evidence.get("lab_id")
        source = evidence.get("source", "Analyst Finding")
        event_id = evidence.get("event_id", "")
        timestamp = evidence.get("timestamp", "")
        finding = evidence.get("finding", "")
        if not lab_id or not finding:
            raise HTTPException(status_code=400, detail="lab_id and finding are required.")
        return LearningService.add_evidence(lab_id, source, event_id, timestamp, finding)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/learning/evidence/{evidence_id}")
async def api_learning_evidence_delete(evidence_id: int):
    try:
        return LearningService.delete_evidence(evidence_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/learning/checklist")
async def api_learning_checklist_save(payload: Dict[str, Any] = Body(...)):
    try:
        lab_id = payload.get("lab_id")
        checklist = payload.get("checklist", [])
        if not lab_id:
            raise HTTPException(status_code=400, detail="lab_id is required.")
        return LearningService.save_checklist(lab_id, checklist)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/learning/verdict")
async def api_learning_verdict_save(payload: Dict[str, Any] = Body(...)):
    try:
        lab_id = payload.get("lab_id")
        verdict = payload.get("verdict", "")
        if not lab_id:
            raise HTTPException(status_code=400, detail="lab_id is required.")
        return LearningService.save_verdict(lab_id, verdict)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/learning/answers")
async def api_learning_answer_submit(payload: Dict[str, Any] = Body(...)):
    try:
        lab_id = payload.get("lab_id")
        question_id = payload.get("question_id")
        selected_option = payload.get("selected_option", "")
        is_correct = payload.get("is_correct", False)
        if not lab_id or not question_id:
            raise HTTPException(status_code=400, detail="lab_id and question_id are required.")
        return LearningService.save_answer(lab_id, question_id, selected_option, is_correct)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/learning/reset/{lab_id}")
async def api_learning_reset(lab_id: str):
    try:
        return LearningService.reset_lab(lab_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/learning/start-required-hosts")
async def api_learning_start_required_hosts(payload: Dict[str, Any] = Body(...)):
    try:
        host_keys = payload.get("host_keys", [])
        instances = AWSService.get_instances()
        instance_ids = []
        for key in host_keys:
            node = next((i for i in instances if key in i.name.lower()), None)
            if node and node.state != "running":
                instance_ids.append(node.instance_id)

        if not instance_ids:
            return {"success": True, "message": "All required hosts are already running."}

        return AWSService.start_instances(instance_ids=instance_ids)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/learning/challenges")
async def api_learning_challenges():
    return {
        "challenges": LearningService.get_challenges()
    }


@app.get("/api/learning/challenges/{challenge_id}")
async def api_learning_challenge_detail(challenge_id: str):
    detail = LearningService.get_challenge_detail(challenge_id)
    if not detail:
        raise HTTPException(status_code=404, detail=f"Challenge '{challenge_id}' not found.")
    return detail


@app.get("/api/learning/challenges/{challenge_id}/solution")
async def api_learning_challenge_solution(challenge_id: str):
    sol = LearningService.get_challenge_solution(challenge_id)
    if not sol:
        raise HTTPException(status_code=404, detail=f"Solution for '{challenge_id}' not found.")
    return sol


@app.get("/api/learning/search")
async def api_learning_search(q: str = Query(..., min_length=1)):
    return {
        "query": q,
        "results": LearningService.search_content(q)
    }


@app.get("/api/operations/list")
async def api_operations_list():
    return {
        "active_operation": OperationsManager.get_active_operation(),
        "logs": OperationsManager.list_logs()
    }


@app.get("/api/operations/detail/{file}")
async def api_operations_detail(file: str):
    logs = OperationsManager.list_logs()
    meta = next((item for item in logs if item["filename"] == file), None)
    content = OperationsManager.read_log_file(file)
    return {
        "filename": file,
        "metadata": meta,
        "content": content
    }


@app.get("/api/settings/config")
async def api_settings_config():
    return {
        "app_name": settings.APP_NAME,
        "app_version": settings.APP_VERSION,
        "aws_region": settings.AWS_DEFAULT_REGION,
        "terraform_dir": str(settings.TERRAFORM_DIR),
        "ansible_dir": str(settings.ANSIBLE_DIR),
        "ssh_key_path": str(settings.SSH_KEY_PATH),
        "logs_dir": str(settings.LOGS_DIR),
        "autostop": SafetyService.get_autostop_status(),
        "profiles": AWSProfileService.list_profiles(),
        "ssh_info": SSHService.get_connection_info()
    }


# ==============================================================================
# Dynamic SSH Access & Management IP Endpoints
# ==============================================================================

@app.get("/api/management-ip/status")
async def api_management_ip_status():
    """Retrieves current detected IP, configured CIDR, status, and drift state."""
    try:
        return ManagementIPService.get_status()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to assess management IP status: {str(e)}"
        )


@app.post("/api/management-ip/preview")
async def api_management_ip_preview(req: ManagementIPPreviewRequest):
    """Generates a dry-run Terraform execution plan for the proposed CIDR."""
    try:
        return ManagementIPService.preview_sync(req.cidr)
    except SecurityValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except OperationLockError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate Terraform plan preview: {str(e)}"
        )


@app.post("/api/management-ip/apply")
async def api_management_ip_apply(req: ManagementIPApplyRequest):
    """Applies the CIDR update to Terraform, executes apply, and verifies TCP port 22."""
    if not req.confirmation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Confirmation is required to apply management CIDR changes."
        )

    try:
        return ManagementIPService.apply_sync(
            new_cidr=req.cidr,
            mode=req.mode or "automatic",
            understand_open_risk=req.understand_open_risk or False
        )
    except SecurityValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except OperationLockError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to apply management IP update: {str(e)}"
        )


@app.post("/api/management-ip/check-connectivity")
async def api_management_ip_check_connectivity(req: ConnectivityCheckRequest = Body(default=ConnectivityCheckRequest())):
    """Verifies TCP port 22 reachability on the Bastion or specified host."""
    host = req.host
    if not host:
        instances = AWSService.get_instances()
        bastion_inst = next((i for i in instances if "bastion" in i.name.lower() or "jumpbox" in i.name.lower()), None)
        host = bastion_inst.public_ip if bastion_inst and bastion_inst.state == "running" else None

    if not host:
        return {
            "reachable": False,
            "host": None,
            "port": req.port or 22,
            "message": "No running Bastion host with public IPv4 address found."
        }

    reachable, error_msg = ManagementIPService.check_port_22(host, timeout=3.0)
    return {
        "reachable": reachable,
        "host": host,
        "port": req.port or 22,
        "message": "Port 22 is reachable on Bastion" if reachable else error_msg
    }


@app.get("/api/management-ip/history")
async def api_management_ip_history(limit: int = Query(5, ge=1, le=50)):
    """Retrieves recent management IP synchronization audit history."""
    return {
        "history": ManagementIPService.get_sync_history(limit=limit)
    }

