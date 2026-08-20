"""
SOCForge Control Plane — Dynamic SSH Access & Management IP Automation Service
=============================================================================
Manages automatic public IPv4 detection, Terraform CIDR synchronization,
infrastructure drift detection, TCP port 22 verification, and audit logging.
"""

import re
import socket
import urllib.request
import urllib.error
import ipaddress
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

from app.config import settings
from app.services.aws import AWSService
from app.services.operations import OperationsManager, SecurityValidationError


class ManagementIPService:
    """
    Manages detection, validation, Terraform state reconciliation, and connectivity
    verification for dynamic operator SSH access to the AWS Management Bastion.
    """

    DB_PATH = Path(settings.CONTROL_PLANE_DIR) / "data" / "learner_state.db"

    # Multi-provider fallback endpoints for resilient public IPv4 detection
    IP_PROVIDERS = [
        "https://api.ipify.org?format=text",
        "https://icanhazip.com",
        "https://checkip.amazonaws.com",
        "https://ifconfig.me/ip",
        "https://ipinfo.io/ip",
    ]

    IPV4_REGEX = re.compile(r"^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$")

    @classmethod
    def _init_db(cls):
        """Initializes SQLite metadata table for tracking sync history."""
        try:
            cls.DB_PATH.parent.mkdir(parents=True, exist_ok=True)
            with sqlite3.connect(str(cls.DB_PATH)) as conn:
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS management_ip_history (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        previous_cidr TEXT,
                        applied_cidr TEXT,
                        detected_ip TEXT,
                        access_mode TEXT,
                        status TEXT,
                        timestamp TEXT,
                        actor TEXT
                    )
                """)
                conn.commit()
        except Exception:
            pass

    @classmethod
    def detect_public_ip(cls) -> Optional[str]:
        """
        Detects current public IPv4 address using resilient multi-provider fallback.
        Validates IPv4 format and ensures no malicious or malformed response is returned.
        """
        for url in cls.IP_PROVIDERS:
            try:
                req = urllib.request.Request(
                    url,
                    headers={"User-Agent": "SOCForge-ControlPlane/1.0 (PublicIPCheck)"}
                )
                with urllib.request.urlopen(req, timeout=3.0) as resp:
                    if resp.status == 200:
                        raw_body = resp.read().decode("utf-8", errors="ignore").strip()
                        if cls.IPV4_REGEX.match(raw_body):
                            # Validate proper IPv4 address range
                            ip_obj = ipaddress.IPv4Address(raw_body)
                            if not ip_obj.is_multicast and not ip_obj.is_loopback:
                                return str(ip_obj)
            except Exception:
                continue
        return None

    @classmethod
    def validate_cidr(cls, cidr: str) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Validates whether a string is a valid IPv4 CIDR block.
        Returns (is_valid, normalized_cidr, error_message).
        """
        clean_cidr = (cidr or "").strip()
        if not clean_cidr:
            return False, None, "CIDR block cannot be empty."

        # If user passed a single IP without suffix, default to /32
        if "/" not in clean_cidr:
            clean_cidr = f"{clean_cidr}/32"

        try:
            net = ipaddress.IPv4Network(clean_cidr, strict=False)
            return True, str(net), None
        except ValueError as e:
            return False, None, f"Invalid IPv4 CIDR block '{cidr}': {str(e)}"

    @classmethod
    def is_ip_in_cidr(cls, ip_str: Optional[str], cidr_str: Optional[str]) -> bool:
        """
        Determines whether the given IPv4 address belongs to the specified CIDR network.
        """
        if not ip_str or not cidr_str:
            return False
        try:
            ip = ipaddress.ip_address(ip_str.strip())
            net = ipaddress.ip_network(cidr_str.strip(), strict=False)
            return ip in net
        except Exception:
            return False

    @classmethod
    def get_configured_cidr(cls) -> str:
        """
        Reads the active administrative CIDR configured for Terraform.
        Checks terraform/admin_ip.auto.tfvars first, then terraform.tfvars, and defaults to 127.0.0.1/32.
        """
        tf_dir = Path(settings.TERRAFORM_DIR)
        auto_tfvars = tf_dir / "admin_ip.auto.tfvars"
        main_tfvars = tf_dir / "terraform.tfvars"

        # 1. Check auto.tfvars
        if auto_tfvars.exists():
            try:
                content = auto_tfvars.read_text(encoding="utf-8")
                match = re.search(r'admin_cidr\s*=\s*"([^"]+)"', content)
                if match:
                    return match.group(1).strip()
            except Exception:
                pass

        # 2. Check terraform.tfvars
        if main_tfvars.exists():
            try:
                content = main_tfvars.read_text(encoding="utf-8")
                match = re.search(r'admin_cidr\s*=\s*"([^"]+)"', content)
                if match:
                    return match.group(1).strip()
            except Exception:
                pass

        return "127.0.0.1/32"

    @classmethod
    def check_port_22(cls, host: Optional[str], timeout: float = 3.0) -> Tuple[bool, Optional[str]]:
        """
        Safely attempts non-interactive TCP connection to port 22 on the target host.
        """
        if not host or host in ("10.10.x.x", "unknown", "None", ""):
            return False, "Host IP not available for TCP check."

        try:
            with socket.create_connection((host, 22), timeout=timeout):
                return True, None
        except socket.timeout:
            return False, f"Connection timed out (port 22 unreachable on {host})."
        except ConnectionRefusedError:
            return False, f"Connection refused by host {host}:22 (OpenSSH service stopped)."
        except Exception as e:
            return False, f"TCP connectivity failed to {host}:22: {str(e)}"

    @classmethod
    def get_sync_history(cls, limit: int = 5) -> List[Dict[str, Any]]:
        """Retrieves recent management IP synchronization audit records."""
        cls._init_db()
        try:
            with sqlite3.connect(str(cls.DB_PATH)) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT * FROM management_ip_history ORDER BY id DESC LIMIT ?",
                    (limit,)
                )
                return [dict(row) for row in cursor.fetchall()]
        except Exception:
            return []

    @classmethod
    def get_status(cls) -> Dict[str, Any]:
        """
        Performs full status assessment:
        1. Detects current public IPv4 address.
        2. Loads configured Terraform CIDR.
        3. Evaluates IP match coverage.
        4. Queries AWS Security Group active rules to detect drift.
        5. Performs non-interactive TCP port 22 check if Bastion is running.
        """
        cls._init_db()
        detected_ip = cls.detect_public_ip()
        configured_cidr = cls.get_configured_cidr()

        # Find live Bastion public IP
        instances = AWSService.get_instances()
        bastion_inst = next((i for i in instances if "bastion" in i.name.lower() or "jumpbox" in i.name.lower()), None)
        live_bastion_ip = bastion_inst.public_ip if bastion_inst and bastion_inst.state == "running" else None

        # Check AWS security group drift
        aws_cidrs = AWSService.get_bastion_ingress_cidrs()
        has_drift = False
        if aws_cidrs and configured_cidr not in aws_cidrs and "0.0.0.0/0" not in aws_cidrs:
            has_drift = True

        # Check coverage
        is_match = False
        if detected_ip:
            is_match = cls.is_ip_in_cidr(detected_ip, configured_cidr)

        # Port 22 connectivity check
        port_22_reachable = None
        if live_bastion_ip:
            port_22_reachable, _ = cls.check_port_22(live_bastion_ip, timeout=2.5)

        # Access mode determination
        access_mode = "custom"
        if configured_cidr == "0.0.0.0/0":
            access_mode = "open"
        elif detected_ip and (configured_cidr == f"{detected_ip}/32" or configured_cidr == f"{detected_ip}/24"):
            access_mode = "automatic"

        # Determine overarching status
        if configured_cidr == "0.0.0.0/0":
            status = "OPEN_ACCESS"
            message = "Inbound SSH open to all IPv4 addresses (0.0.0.0/0). Use only for temporary lab testing."
        elif not detected_ip:
            status = "UNKNOWN"
            message = "Unable to detect your current public IPv4 address. Verify internet connectivity."
        elif is_match:
            if has_drift:
                status = "DRIFT"
                message = f"Public IP ({detected_ip}) is covered, but AWS Security Group rules differ from Terraform state."
            else:
                status = "READY"
                message = f"SSH Access Ready: Current network ({detected_ip}) is authorized under {configured_cidr}."
        else:
            status = "MISMATCH"
            message = f"Public IP changed to {detected_ip}. Configured allowed CIDR is {configured_cidr}. SSH access may fail."

        # Fetch last update metadata
        history = cls.get_sync_history(limit=1)
        last_sync = history[0] if history else None

        return {
            "detected_ip": detected_ip,
            "configured_cidr": configured_cidr,
            "effective_cidr": configured_cidr,
            "status": status,
            "is_match": is_match,
            "has_drift": has_drift,
            "live_bastion_ip": live_bastion_ip,
            "port_22_reachable": port_22_reachable,
            "access_mode": access_mode,
            "last_sync_timestamp": last_sync.get("timestamp") if last_sync else None,
            "previous_ip": last_sync.get("previous_cidr") if last_sync else None,
            "aws_allowed_cidrs": aws_cidrs,
            "message": message
        }

    @classmethod
    def preview_sync(cls, new_cidr: str) -> Dict[str, Any]:
        """
        Generates a dry-run Terraform execution plan showing exact proposed changes.
        """
        valid, clean_cidr, err = cls.validate_cidr(new_cidr)
        if not valid or not clean_cidr:
            raise SecurityValidationError(err or "Invalid CIDR block.")

        # Execute terraform plan with new variable override
        cmd = ["terraform", "plan", f"-var=admin_cidr={clean_cidr}", "-no-color"]
        exit_code, output, log_path = OperationsManager.run_command(
            cmd,
            settings.TERRAFORM_DIR,
            "sync_mgmt_ip_plan"
        )

        return {
            "success": exit_code == 0,
            "proposed_cidr": clean_cidr,
            "plan_output": output,
            "log_file": log_path.name,
            "exit_code": exit_code
        }

    @classmethod
    def apply_sync(
        cls,
        new_cidr: str,
        mode: str = "automatic",
        actor: str = "Local Control Plane",
        understand_open_risk: bool = False
    ) -> Dict[str, Any]:
        """
        Persistently applies the new management CIDR:
        1. Validates new CIDR block.
        2. Writes terraform/admin_ip.auto.tfvars and updates terraform.tfvars.
        3. Executes `terraform apply -auto-approve -var=admin_cidr=...`.
        4. Verifies TCP port 22 connectivity on the live Bastion IP.
        5. Records structured audit log in SQLite and control-plane audit logs.
        """
        valid, clean_cidr, err = cls.validate_cidr(new_cidr)
        if not valid or not clean_cidr:
            raise SecurityValidationError(err or "Invalid CIDR block.")

        if clean_cidr == "0.0.0.0/0" and not understand_open_risk:
            raise SecurityValidationError("Explicit acknowledgment of security risk is required for 0.0.0.0/0.")

        previous_cidr = cls.get_configured_cidr()
        detected_ip = cls.detect_public_ip()

        # Update local Terraform auto.tfvars configuration file
        tf_dir = Path(settings.TERRAFORM_DIR)
        auto_tfvars = tf_dir / "admin_ip.auto.tfvars"
        main_tfvars = tf_dir / "terraform.tfvars"

        try:
            # Write dedicated auto.tfvars file (always loaded by Terraform)
            auto_tfvars.write_text(
                f"# SOCForge Management Ingress Configuration\n# Auto-generated by Control Plane on {datetime.utcnow().isoformat()}Z\nadmin_cidr = \"{clean_cidr}\"\n",
                encoding="utf-8"
            )

            # Also update terraform.tfvars if it exists
            if main_tfvars.exists():
                content = main_tfvars.read_text(encoding="utf-8")
                if re.search(r'admin_cidr\s*=\s*"[^"]*"', content):
                    updated = re.sub(r'admin_cidr\s*=\s*"[^"]*"', f'admin_cidr = "{clean_cidr}"', content)
                    main_tfvars.write_text(updated, encoding="utf-8")
        except Exception as e:
            raise SecurityValidationError(f"Failed to persist configuration to Terraform files: {str(e)}")

        # Run Terraform Apply targeting the management security group rules for rapid deployment
        cmd = [
            "terraform",
            "apply",
            "-auto-approve",
            f"-var=admin_cidr={clean_cidr}",
            "-target=aws_security_group.management",
            "-target=aws_security_group_rule.mgmt_ingress_ssh",
            "-no-color"
        ]

        exit_code, output, log_path = OperationsManager.run_command(
            cmd,
            settings.TERRAFORM_DIR,
            "sync_mgmt_ip_apply"
        )

        apply_success = exit_code == 0

        # Run post-apply connectivity verification
        instances = AWSService.get_instances()
        bastion_inst = next((i for i in instances if "bastion" in i.name.lower() or "jumpbox" in i.name.lower()), None)
        live_bastion_ip = bastion_inst.public_ip if bastion_inst and bastion_inst.state == "running" else None

        port_22_reachable = None
        conn_error = None
        if live_bastion_ip and apply_success:
            port_22_reachable, conn_error = cls.check_port_22(live_bastion_ip, timeout=3.0)

        # Record audit log in SQLite
        cls._init_db()
        timestamp_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
        try:
            with sqlite3.connect(str(cls.DB_PATH)) as conn:
                conn.execute(
                    """
                    INSERT INTO management_ip_history
                    (previous_cidr, applied_cidr, detected_ip, access_mode, status, timestamp, actor)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        previous_cidr,
                        clean_cidr,
                        detected_ip or "unknown",
                        mode,
                        "SUCCESS" if apply_success else "FAILED",
                        timestamp_str,
                        actor
                    )
                )
                conn.commit()
        except Exception:
            pass

        return {
            "success": apply_success,
            "previous_cidr": previous_cidr,
            "applied_cidr": clean_cidr,
            "detected_ip": detected_ip,
            "live_bastion_ip": live_bastion_ip,
            "port_22_reachable": port_22_reachable,
            "connectivity_message": "Port 22 is reachable on Bastion" if port_22_reachable else conn_error,
            "log_file": log_path.name,
            "exit_code": exit_code
        }
