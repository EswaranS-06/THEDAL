"""
THEDAL Control Plane — Health Check & Diagnostics Service
"""

from typing import List
from datetime import datetime

from app.config import settings
from app.models import HealthCheckItem, HealthCheckSummary
from app.services.terraform import TerraformService
from app.services.aws import AWSService


class HealthService:
    """
    Executes unified health diagnostics across infrastructure, networking, and SIEM services.
    """

    @classmethod
    def run_all_checks(cls) -> HealthCheckSummary:
        checks: List[HealthCheckItem] = []

        # 1. Check SSH Key
        key_exists = settings.SSH_KEY_PATH.exists()
        checks.append(HealthCheckItem(
            component="Local SSH Key",
            status="PASS" if key_exists else "FAIL",
            message="THEDAL SSH private key present" if key_exists else f"Key missing at {settings.SSH_KEY_PATH}"
        ))

        # 2. Check AWS Connectivity
        aws_status = AWSService.get_connection_status()
        checks.append(HealthCheckItem(
            component="AWS Authentication",
            status="PASS" if aws_status["connected"] else "FAIL",
            message=f"Connected to {aws_status['region']} (Account: {aws_status['account']})" if aws_status["connected"] else f"AWS Auth Error: {aws_status['error']}"
        ))

        # 3. Check Terraform Status
        tf_status = TerraformService.get_status()
        checks.append(HealthCheckItem(
            component="Terraform Infrastructure",
            status="PASS" if tf_status["status"] == "DEPLOYED" else "WARNING" if tf_status["status"] == "READY" else "FAIL",
            message=tf_status["message"]
        ))

        # 4. Check EC2 Instances
        instances = AWSService.get_instances()
        if instances:
            running_count = sum(1 for i in instances if i.state == "running")
            total_count = len(instances)
            status = "PASS" if running_count == total_count else "WARNING" if running_count > 0 else "FAIL"
            checks.append(HealthCheckItem(
                component="EC2 Compute Fleet",
                status=status,
                message=f"{running_count}/{total_count} THEDAL lab nodes running"
            ))

            for inst in instances:
                checks.append(HealthCheckItem(
                    component=f"Node: {inst.name}",
                    status="PASS" if inst.state == "running" else "WARNING",
                    message=f"State: {inst.state.upper()} | Type: {inst.instance_type} | IP: {inst.private_ip}"
                ))
        else:
            checks.append(HealthCheckItem(
                component="EC2 Compute Fleet",
                status="WARNING",
                message="No active THEDAL EC2 instances detected."
            ))

        # 5. Check Inventory File
        inv_file = settings.ANSIBLE_DIR / "inventory" / "hosts.ini"
        inv_exists = inv_file.exists() and inv_file.stat().st_size > 0
        checks.append(HealthCheckItem(
            component="Ansible Inventory",
            status="PASS" if inv_exists else "WARNING",
            message="Ansible hosts.ini generated" if inv_exists else "Inventory file missing. Run 'Generate Inventory'."
        ))

        # Calculate overall status
        statuses = [c.status for c in checks]
        if "FAIL" in statuses:
            overall = "DEGRADED"
        elif "WARNING" in statuses:
            overall = "DEGRADED" if any(c.component == "EC2 Compute Fleet" and c.status == "WARNING" for c in checks) else "HEALTHY"
        else:
            overall = "HEALTHY"

        return HealthCheckSummary(
            overall_status=overall,
            timestamp=datetime.utcnow(),
            checks=checks
        )
