"""
THEDAL Control Plane — Health Check & Diagnostics Service
=========================================================
Executes unified health diagnostics across infrastructure, networking,
EC2 compute fleet, Wazuh SIEM stack, and API credential synchronization.
"""

from typing import List
from datetime import datetime

from app.config import settings
from app.models import HealthCheckItem, HealthCheckSummary
from app.services.terraform import TerraformService
from app.services.aws import AWSService
from app.services.wazuh_credentials import WazuhCredentialService


class HealthService:
    """
    Executes unified health diagnostics across infrastructure, networking, and SIEM services.
    """

    @classmethod
    def run_all_checks(cls, deep_check: bool = False) -> HealthCheckSummary:
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

        # 6. Check Wazuh SIEM Credentials & Service Sync
        wazuh_node = next((i for i in instances if "wazuh" in i.name.lower() or "siem" in i.name.lower()), None)
        secrets_exist = WazuhCredentialService.SECRETS_YML_PATH.exists()

        if wazuh_node and wazuh_node.state == "running":
            if deep_check:
                try:
                    wazuh_diag = WazuhCredentialService.get_wazuh_detailed_health()
                    comps = wazuh_diag.get("components", {})

                    # Wazuh Manager
                    mgr_stat = comps.get("wazuh_manager", {}).get("status", "UNKNOWN")
                    checks.append(HealthCheckItem(
                        component="Wazuh Manager Service",
                        status="PASS" if mgr_stat == "HEALTHY" else "FAIL" if mgr_stat == "OFFLINE" else "WARNING",
                        message=comps.get("wazuh_manager", {}).get("message", "Status checked")
                    ))

                    # Wazuh Dashboard
                    dash_stat = comps.get("wazuh_dashboard", {}).get("status", "UNKNOWN")
                    checks.append(HealthCheckItem(
                        component="Wazuh Dashboard Service",
                        status="PASS" if dash_stat == "HEALTHY" else "FAIL" if dash_stat == "OFFLINE" else "WARNING",
                        message=comps.get("wazuh_dashboard", {}).get("message", "Status checked")
                    ))

                    # Wazuh API Auth & Dashboard Sync
                    auth_stat = comps.get("api_authentication", {}).get("status", "UNKNOWN")
                    sync_stat = comps.get("dashboard_api_sync", {}).get("status", "UNKNOWN")

                    checks.append(HealthCheckItem(
                        component="Wazuh API & Dashboard Sync",
                        status="PASS" if auth_stat == "VERIFIED" and sync_stat == "VERIFIED" else "FAIL" if auth_stat == "AUTHENTICATION_FAILED" or sync_stat == "MISMATCH" else "WARNING",
                        message="Credentials verified & synchronized" if auth_stat == "VERIFIED" and sync_stat == "VERIFIED" else "Credential mismatch detected (401 Unauthorized)" if auth_stat == "AUTHENTICATION_FAILED" or sync_stat == "MISMATCH" else "Wazuh API check pending"
                    ))
                except Exception as e:
                    checks.append(HealthCheckItem(
                        component="Wazuh SIEM Health",
                        status="WARNING",
                        message=f"Could not complete Wazuh health probe: {str(e)}"
                    ))
            else:
                checks.append(HealthCheckItem(
                    component="Wazuh SIEM Stack",
                    status="PASS" if secrets_exist else "WARNING",
                    message="Credentials configured & Wazuh instance running" if secrets_exist else "Secrets file missing"
                ))
        elif wazuh_node:
            checks.append(HealthCheckItem(
                component="Wazuh SIEM Stack",
                status="WARNING",
                message=f"Wazuh EC2 instance is {wazuh_node.state.upper()}"
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
