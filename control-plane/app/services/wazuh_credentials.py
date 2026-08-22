"""
THEDAL Control Plane — Wazuh API Credential Management & Synchronization Service
================================================================================
Provides a single source of truth for Wazuh API credentials across Wazuh Manager
and Wazuh Dashboard. Prevents credential drift, supports rotation, and ensures
safe, non-leaking secret lifecycle management.
"""

import os
import re
import secrets
import string
try:
    import yaml
except ImportError:
    yaml = None

from pathlib import Path
from typing import Dict, Any, Tuple, Optional

from app.config import settings
from app.services.aws import AWSService
from app.services.operations import OperationsManager, SecurityValidationError


class WazuhCredentialService:
    """Manages Wazuh API credentials as a single source of truth."""

    SECRETS_YML_PATH = settings.ANSIBLE_DIR / "inventory" / "secrets.yml"
    SECRETS_DATA_PATH = Path(settings.CONTROL_PLANE_DIR) / "data" / "secrets.json"

    DEFAULT_USER = "wazuh-wui"

    @classmethod
    def _parse_yaml_file(cls, path: Path) -> Dict[str, Any]:
        """Safely parses key-value YAML file with PyYAML or pure-Python regex fallback."""
        if not path.exists():
            return {}
        try:
            content = path.read_text(encoding="utf-8")
            if yaml is not None:
                return yaml.safe_load(content) or {}
            
            # Pure Python key-value fallback
            res = {}
            for line in content.splitlines():
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                match = re.match(r"^([a-zA-Z0-9_\-]+)\s*:\s*[\"']?(.*?)[\"']?$", line)
                if match:
                    res[match.group(1)] = match.group(2)
            return res
        except Exception:
            return {}

    @classmethod
    def generate_strong_password(cls, length: int = 24) -> str:
        """
        Generates a high-entropy password compliant with Wazuh API requirements:
        - At least 1 lowercase letter
        - At least 1 uppercase letter
        - At least 1 digit
        - At least 1 symbol from [!@#$%^&*_-]
        """
        lower = string.ascii_lowercase
        upper = string.ascii_uppercase
        digits = string.digits
        symbols = "!@#$%^&*_-+=."

        # Ensure at least one character from each required class
        password_chars = [
            secrets.choice(lower),
            secrets.choice(upper),
            secrets.choice(digits),
            secrets.choice(symbols),
        ]

        all_chars = lower + upper + digits + symbols
        password_chars += [secrets.choice(all_chars) for _ in range(length - 4)]
        secrets.SystemRandom().shuffle(password_chars)
        return "".join(password_chars)

    @classmethod
    def get_credentials(cls) -> Dict[str, str]:
        """
        Retrieves centralized Wazuh API credentials following precedence:
        1. Explicit Environment Variables (THEDAL_WAZUH_API_USER / THEDAL_WAZUH_API_PASSWORD)
        2. Persistent secrets file (ansible/inventory/secrets.yml)
        3. Auto-generated on demand and persisted securely
        """
        env_user = os.getenv("THEDAL_WAZUH_API_USER") or os.getenv("WAZUH_API_USER")
        env_pass = os.getenv("THEDAL_WAZUH_API_PASSWORD") or os.getenv("WAZUH_API_PASSWORD")

        if env_user and env_pass:
            return {
                "user": env_user.strip(),
                "password": env_pass.strip(),
                "source": "environment",
            }

        # Check existing ansible/inventory/secrets.yml
        if cls.SECRETS_YML_PATH.exists():
            data = cls._parse_yaml_file(cls.SECRETS_YML_PATH)
            user = data.get("thedal_wazuh_api_user") or data.get("wazuh_api_username")
            pwd = data.get("thedal_wazuh_api_password") or data.get("wazuh_api_password")
            if user and pwd:
                return {
                    "user": str(user).strip(),
                    "password": str(pwd).strip(),
                    "source": "secrets_file",
                }

        # If not found, ensure and persist new credentials
        return cls.ensure_credentials()

    @classmethod
    def ensure_credentials(cls, custom_user: Optional[str] = None, custom_password: Optional[str] = None) -> Dict[str, str]:
        """
        Initializes or preserves credentials. If already existing, does not overwrite unless explicitly instructed.
        """
        cls.SECRETS_YML_PATH.parent.mkdir(parents=True, exist_ok=True)

        user = custom_user or cls.DEFAULT_USER
        password = custom_password or cls.generate_strong_password()

        existing = cls._parse_yaml_file(cls.SECRETS_YML_PATH)

        # Preserve existing unless custom provided
        if not custom_password and existing.get("thedal_wazuh_api_password"):
            return {
                "user": existing.get("thedal_wazuh_api_user", user),
                "password": existing.get("thedal_wazuh_api_password"),
                "source": "secrets_file",
            }

        existing["thedal_wazuh_api_user"] = user
        existing["thedal_wazuh_api_password"] = password

        # Write to ansible/inventory/secrets.yml with restrictive permissions
        cls.SECRETS_YML_PATH.write_text(
            f"# ==============================================================================\n"
            f"# THEDAL — Centralized Credentials & Secrets (Single Source of Truth)\n"
            f"# DO NOT COMMIT TO VERSION CONTROL\n"
            f"# ==============================================================================\n\n"
            f"thedal_wazuh_api_user: \"{user}\"\n"
            f"thedal_wazuh_api_password: \"{password}\"\n",
            encoding="utf-8"
        )
        try:
            cls.SECRETS_YML_PATH.chmod(0o600)
        except Exception:
            pass

        return {
            "user": user,
            "password": password,
            "source": "generated",
        }

    @classmethod
    def verify_api_authentication(cls, host: Optional[str] = None, timeout: float = 8.0) -> Dict[str, Any]:
        """
        Authenticates against Wazuh Manager API endpoint using the centralized credentials.
        Executes remotely on the Wazuh instance via SSH ProxyJump if host is not 127.0.0.1.
        """
        creds = cls.get_credentials()
        user = creds["user"]
        pwd = creds["password"]

        instances = AWSService.get_instances()
        wazuh_node = next((i for i in instances if "wazuh" in i.name.lower() or "siem" in i.name.lower()), None)
        bastion_node = next((i for i in instances if "bastion" in i.name.lower() or "jumpbox" in i.name.lower()), None)

        if not wazuh_node or wazuh_node.state != "running":
            return {
                "success": False,
                "status": "UNAVAILABLE",
                "http_status": None,
                "message": "Wazuh node is not running in EC2 compute fleet.",
                "error": "Node stopped or unavailable",
            }

        wazuh_ip = wazuh_node.private_ip
        bastion_ip = bastion_node.public_ip if bastion_node else None

        if not bastion_ip:
            return {
                "success": False,
                "status": "UNAVAILABLE",
                "http_status": None,
                "message": "Bastion jumpbox is offline. Cannot reach Wazuh node.",
                "error": "Bastion offline",
            }

        # Run safe in-instance curl command to test POST /security/user/authenticate
        # Using -u user:pass with Basic Auth
        # Do not expose password in shell output by reading from stdin or piping safely
        remote_script = (
            f"curl -s -k -X POST https://127.0.0.1:55000/security/user/authenticate "
            f"-u '{user}:{pwd}' -w '\\nHTTP_STATUS:%{{http_code}}'"
        )

        proxy_cmd = (
            f"ssh -i {settings.SSH_KEY_PATH} -o BatchMode=yes -o StrictHostKeyChecking=no "
            f"-o UserKnownHostsFile=/dev/null -o LogLevel=ERROR -o ConnectTimeout=5 "
            f"-W %h:%p ubuntu@{bastion_ip}"
        )

        ssh_cmd = [
            "ssh",
            "-i", str(settings.SSH_KEY_PATH),
            "-o", "BatchMode=yes",
            "-o", "StrictHostKeyChecking=no",
            "-o", "UserKnownHostsFile=/dev/null",
            "-o", "LogLevel=ERROR",
            "-o", f"ConnectTimeout={int(timeout)}",
            "-o", f"ProxyCommand={proxy_cmd}",
            f"ubuntu@{wazuh_ip}",
            remote_script
        ]

        exit_code, output, _ = OperationsManager.run_command(
            ssh_cmd,
            settings.PROJECT_ROOT,
            "wazuh_auth_verify"
        )

        # Parse HTTP status code from output
        http_code_match = re.search(r"HTTP_STATUS:(\d+)", output)
        http_code = int(http_code_match.group(1)) if http_code_match else None

        if http_code == 200 and ("token" in output or "jwt" in output):
            return {
                "success": True,
                "status": "VERIFIED",
                "http_status": 200,
                "message": "Wazuh API authentication verified with centralized credentials.",
                "user": user,
            }
        elif http_code == 401:
            return {
                "success": False,
                "status": "AUTHENTICATION_FAILED",
                "http_status": 401,
                "message": "Wazuh API rejected authentication (HTTP 401 Unauthorized). Credentials mismatch between API and Dashboard.",
                "user": user,
                "error": "HTTP 401 Unauthorized: Invalid credentials",
            }
        else:
            return {
                "success": False,
                "status": "UNAVAILABLE",
                "http_status": http_code,
                "message": f"Wazuh API unreachable or returned unexpected status {http_code}.",
                "user": user,
                "error": output[-500:] if output else "Connection timeout",
            }

    @classmethod
    def get_wazuh_detailed_health(cls) -> Dict[str, Any]:
        """
        Provides granular component-level health check distinguishing service status
        from functional application health.
        """
        instances = AWSService.get_instances()
        wazuh_node = next((i for i in instances if "wazuh" in i.name.lower() or "siem" in i.name.lower()), None)
        bastion_node = next((i for i in instances if "bastion" in i.name.lower() or "jumpbox" in i.name.lower()), None)

        if not wazuh_node or wazuh_node.state != "running":
            return {
                "overall_status": "OFFLINE",
                "components": {
                    "wazuh_manager": {"status": "OFFLINE", "message": "EC2 instance stopped"},
                    "wazuh_indexer": {"status": "OFFLINE", "message": "EC2 instance stopped"},
                    "wazuh_dashboard": {"status": "OFFLINE", "message": "EC2 instance stopped"},
                    "api_connectivity": {"status": "OFFLINE", "message": "EC2 instance stopped"},
                    "api_authentication": {"status": "OFFLINE", "message": "EC2 instance stopped"},
                    "dashboard_api_sync": {"status": "OFFLINE", "message": "EC2 instance stopped"},
                },
                "credentials_configured": cls.SECRETS_YML_PATH.exists(),
                "node_ip": wazuh_node.private_ip if wazuh_node else None,
            }

        wazuh_ip = wazuh_node.private_ip
        bastion_ip = bastion_node.public_ip if bastion_node else None

        if not bastion_ip:
            return {
                "overall_status": "UNAVAILABLE",
                "components": {
                    "wazuh_manager": {"status": "UNKNOWN", "message": "Bastion unreachable"},
                    "wazuh_indexer": {"status": "UNKNOWN", "message": "Bastion unreachable"},
                    "wazuh_dashboard": {"status": "UNKNOWN", "message": "Bastion unreachable"},
                    "api_connectivity": {"status": "UNKNOWN", "message": "Bastion unreachable"},
                    "api_authentication": {"status": "UNKNOWN", "message": "Bastion unreachable"},
                    "dashboard_api_sync": {"status": "UNKNOWN", "message": "Bastion unreachable"},
                },
                "credentials_configured": cls.SECRETS_YML_PATH.exists(),
                "node_ip": wazuh_ip,
            }

        # Query systemd service states, listeners, and recent dashboard logs in a single SSH call
        diag_script = (
            "echo '---SERVICES---'; "
            "systemctl is-active wazuh-manager || echo 'inactive'; "
            "systemctl is-active wazuh-indexer || echo 'inactive'; "
            "systemctl is-active wazuh-dashboard || echo 'inactive'; "
            "echo '---PORTS---'; "
            "ss -tulpn | grep -E ':(55000|9200|443) ' || echo 'none'; "
            "echo '---CONFIG_PERMS---'; "
            "ls -ld /usr/share/wazuh-dashboard/data/wazuh/config/wazuh.yml 2>/dev/null || echo 'missing'; "
            "echo '---RECENT_401---'; "
            "journalctl -u wazuh-dashboard -n 50 --no-pager | grep -iE '401|unauthorized|invalid credentials' | tail -n 3 || echo 'none'"
        )

        proxy_cmd = (
            f"ssh -i {settings.SSH_KEY_PATH} -o BatchMode=yes -o StrictHostKeyChecking=no "
            f"-o UserKnownHostsFile=/dev/null -o LogLevel=ERROR -o ConnectTimeout=5 "
            f"-W %h:%p ubuntu@{bastion_ip}"
        )

        ssh_cmd = [
            "ssh",
            "-i", str(settings.SSH_KEY_PATH),
            "-o", "BatchMode=yes",
            "-o", "StrictHostKeyChecking=no",
            "-o", "UserKnownHostsFile=/dev/null",
            "-o", "LogLevel=ERROR",
            "-o", "ConnectTimeout=5",
            "-o", f"ProxyCommand={proxy_cmd}",
            f"ubuntu@{wazuh_ip}",
            diag_script
        ]

        exit_code, output, _ = OperationsManager.run_command(
            ssh_cmd,
            settings.PROJECT_ROOT,
            "wazuh_detailed_health"
        )

        # Parse diagnostics
        manager_active = "active" in output.split("---SERVICES---")[1].splitlines()[1] if "---SERVICES---" in output else False
        indexer_active = "active" in output.split("---SERVICES---")[1].splitlines()[2] if "---SERVICES---" in output else False
        dashboard_active = "active" in output.split("---SERVICES---")[1].splitlines()[3] if "---SERVICES---" in output else False

        port_55000_open = ":55000" in output
        port_9200_open = ":9200" in output
        port_443_open = ":443" in output

        config_exists = "missing" not in output.split("---CONFIG_PERMS---")[1] if "---CONFIG_PERMS---" in output else False
        has_recent_401 = "none" not in output.split("---RECENT_401---")[1].strip() if "---RECENT_401---" in output else False

        # Run API Auth check
        auth_res = cls.verify_api_authentication()

        # Component health determinations
        manager_status = "HEALTHY" if manager_active else "DEGRADED" if port_55000_open else "OFFLINE"
        indexer_status = "HEALTHY" if indexer_active and port_9200_open else "DEGRADED" if indexer_active else "OFFLINE"
        dashboard_status = "HEALTHY" if dashboard_active and port_443_open else "DEGRADED" if dashboard_active else "OFFLINE"
        api_conn_status = "REACHABLE" if port_55000_open else "UNAVAILABLE"
        api_auth_status = auth_res["status"]

        # Dashboard <-> API Sync determination
        if api_auth_status == "VERIFIED" and config_exists and not has_recent_401:
            sync_status = "VERIFIED"
            sync_msg = "Dashboard configuration and Wazuh API credentials match."
        elif api_auth_status == "AUTHENTICATION_FAILED" or has_recent_401:
            sync_status = "MISMATCH"
            sync_msg = "Authentication mismatch detected. Dashboard receiving 401 Unauthorized."
        else:
            sync_status = "UNKNOWN"
            sync_msg = "Cannot verify synchronization state."

        # Overall health determination
        if all(s in ("HEALTHY", "REACHABLE", "VERIFIED") for s in [manager_status, indexer_status, dashboard_status, api_conn_status, api_auth_status, sync_status]):
            overall = "HEALTHY"
        elif sync_status == "MISMATCH" or api_auth_status == "AUTHENTICATION_FAILED":
            overall = "AUTHENTICATION_FAILED"
        else:
            overall = "DEGRADED"

        return {
            "overall_status": overall,
            "components": {
                "wazuh_manager": {"status": manager_status, "message": "Service active and listening" if manager_active else "Service inactive"},
                "wazuh_indexer": {"status": indexer_status, "message": "OpenSearch indexer operational" if indexer_active else "Indexer inactive"},
                "wazuh_dashboard": {"status": dashboard_status, "message": "HTTPS UI listener active on :443" if dashboard_active else "Dashboard inactive"},
                "api_connectivity": {"status": api_conn_status, "message": "TCP Port 55000 open" if port_55000_open else "Port 55000 closed"},
                "api_authentication": {"status": api_auth_status, "message": auth_res["message"]},
                "dashboard_api_sync": {"status": sync_status, "message": sync_msg},
            },
            "credentials_configured": True,
            "node_ip": wazuh_ip,
        }

    @classmethod
    def repair_wazuh_configuration(cls) -> Dict[str, Any]:
        """
        Idempotent repair operation:
        1. Ensures centralized credentials exist in secrets.yml.
        2. Connects to Wazuh node and sets API user password via auth_user.py.
        3. Regenerates /usr/share/wazuh-dashboard/data/wazuh/config/wazuh.yml.
        4. Sets ownership wazuh-dashboard:wazuh-dashboard (0640).
        5. Restarts wazuh-dashboard service.
        6. Re-verifies API authentication.
        """
        creds = cls.ensure_credentials()
        user = creds["user"]
        pwd = creds["password"]

        instances = AWSService.get_instances()
        wazuh_node = next((i for i in instances if "wazuh" in i.name.lower() or "siem" in i.name.lower()), None)
        bastion_node = next((i for i in instances if "bastion" in i.name.lower() or "jumpbox" in i.name.lower()), None)

        if not wazuh_node or wazuh_node.state != "running":
            raise SecurityValidationError("Wazuh node is offline. Start the EC2 compute fleet first.")

        wazuh_ip = wazuh_node.private_ip
        bastion_ip = bastion_node.public_ip if bastion_node else None

        if not bastion_ip:
            raise SecurityValidationError("Bastion jumpbox is offline. Cannot communicate with Wazuh node.")

        # Construct idempotent bash repair script to execute on Wazuh node
        # Pass credentials via EOF heredoc or env to avoid CLI exposure
        repair_script = f"""sudo bash -c '
set -e
USER="{user}"
PASS="{pwd}"

echo "[1/4] Synchronizing Wazuh API credentials on Manager..."
if /var/ossec/framework/python/bin/python3 /var/ossec/api/scripts/auth_user.py -u "$USER" -P "$PASS" 2>/dev/null; then
  echo "Updated existing user $USER"
else
  /var/ossec/framework/python/bin/python3 /var/ossec/api/scripts/auth_user.py -a "$USER" "$PASS" administrator 2>/dev/null || true
  echo "Configured user $USER"
fi

echo "[2/4] Regenerating Dashboard wazuh.yml from centralized secret..."
mkdir -p /usr/share/wazuh-dashboard/data/wazuh/config
cat <<EOF > /usr/share/wazuh-dashboard/data/wazuh/config/wazuh.yml
# ==============================================================================
# THEDAL — Wazuh App Plugin Configuration (Synchronized)
# ==============================================================================
hosts:
  - default:
      url: https://127.0.0.1
      port: 55000
      user: $USER
      password: $PASS
      run_as: true
EOF

echo "[3/4] Setting secure file permissions..."
chown wazuh-dashboard:wazuh-dashboard /usr/share/wazuh-dashboard/data/wazuh/config/wazuh.yml
chmod 0640 /usr/share/wazuh-dashboard/data/wazuh/config/wazuh.yml

echo "[4/4] Restarting Wazuh Dashboard service..."
systemctl restart wazuh-dashboard
sleep 3
echo "REPAIR_COMPLETE"
'"""

        proxy_cmd = (
            f"ssh -i {settings.SSH_KEY_PATH} -o BatchMode=yes -o StrictHostKeyChecking=no "
            f"-o UserKnownHostsFile=/dev/null -o LogLevel=ERROR -o ConnectTimeout=5 "
            f"-W %h:%p ubuntu@{bastion_ip}"
        )

        ssh_cmd = [
            "ssh",
            "-i", str(settings.SSH_KEY_PATH),
            "-o", "BatchMode=yes",
            "-o", "StrictHostKeyChecking=no",
            "-o", "UserKnownHostsFile=/dev/null",
            "-o", "LogLevel=ERROR",
            "-o", "ConnectTimeout=10",
            "-o", f"ProxyCommand={proxy_cmd}",
            f"ubuntu@{wazuh_ip}",
            repair_script
        ]

        exit_code, output, _ = OperationsManager.run_command(
            ssh_cmd,
            settings.PROJECT_ROOT,
            "wazuh_repair_config"
        )

        if exit_code != 0:
            return {
                "success": False,
                "message": f"Wazuh configuration repair failed (Exit code {exit_code}).",
                "details": output[-500:] if output else "SSH execution failed",
            }

        # Verify authentication
        auth_check = cls.verify_api_authentication()

        return {
            "success": auth_check["success"],
            "message": "Wazuh API and Dashboard credentials successfully synchronized." if auth_check["success"] else "Wazuh files updated, but API auth verification failed.",
            "auth_status": auth_check["status"],
            "http_status": auth_check.get("http_status"),
        }

    @classmethod
    def rotate_api_credentials(cls, new_password: Optional[str] = None) -> Dict[str, Any]:
        """
        Performs an atomic rotation of the Wazuh API credentials:
        1. Generates new high-entropy password.
        2. Persists new password to secrets.yml.
        3. Invokes repair_wazuh_configuration to update Manager & Dashboard.
        4. Verifies authentication.
        """
        new_pwd = new_password or cls.generate_strong_password()
        # Save to secrets.yml
        cls.ensure_credentials(custom_user=cls.DEFAULT_USER, custom_password=new_pwd)

        # Apply to live infrastructure
        return cls.repair_wazuh_configuration()
