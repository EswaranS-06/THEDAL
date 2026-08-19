"""
THEDAL Control Plane — FastAPI Application Entrypoint
"""

from pathlib import Path
from typing import Optional
from fastapi import FastAPI, Request, HTTPException, status, Query
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from app.config import settings
from app.models import (
    SystemStatus, OperationRequest, OperationResponse,
    HealthCheckSummary
)
from app.services.terraform import TerraformService
from app.services.ansible import AnsibleService
from app.services.aws import AWSService
from app.services.ssh import SSHService
from app.services.health import HealthService
from app.services.operations import OperationsManager, SecurityValidationError, OperationLockError


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/api/docs",
    redoc_url=None
)

# Mount Static Files & Templates
app.mount("/static", StaticFiles(directory=str(settings.CONTROL_PLANE_DIR / "app" / "static")), name="static")
templates = Jinja2Templates(directory=str(settings.CONTROL_PLANE_DIR / "app" / "templates"))


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

    sys_status = SystemStatus(
        aws_connected=True,
        aws_region=settings.AWS_DEFAULT_REGION,
        terraform_status=tf_status["status"],
        ansible_status="READY",
        environment_health=health_summary.overall_status
    )

    return templates.TemplateResponse(request=request, name="learning.html", context={
        "active_page": "learning",
        "status": sys_status
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
        "ssh_info": ssh_info
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
        raise HTTPException(status_code=500, detail=result.get("error", "Failed to start SSH tunnel"))
    return result


@app.get("/api/logs/download")
async def api_logs_download(file: str = Query(...)):
    safe_path = (settings.LOGS_DIR / file).resolve()
    if not str(safe_path).startswith(str(settings.LOGS_DIR.resolve())):
        raise HTTPException(status_code=400, detail="Invalid log file path.")
    if not safe_path.exists():
        raise HTTPException(status_code=404, detail="Log file not found.")
    return FileResponse(path=safe_path, filename=file, media_type="text/plain")
