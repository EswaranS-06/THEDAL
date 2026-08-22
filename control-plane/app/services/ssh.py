"""
THEDAL Control Plane — SSH Connection & Tunnel Helper Service
"""

import subprocess
from typing import Dict, Any, List
from pathlib import Path

from app.config import settings
from app.services.terraform import TerraformService


class SSHService:
    """
    Provides connection commands and manages the local Wazuh dashboard SSH tunnel.
    """

    @classmethod
    def get_connection_info(cls) -> Dict[str, Any]:
        """Generates connection strings from live AWS instances and Terraform outputs."""
        from app.services.aws import AWSService
        instances = AWSService.get_instances()
        outputs = TerraformService.get_outputs()

        bastion_node = next((i for i in instances if "bastion" in i.name.lower() and i.public_ip and i.public_ip != "None"), None)
        if bastion_node and bastion_node.public_ip:
            bastion_ip = bastion_node.public_ip
        else:
            bastion_ip = outputs.get("bastion_public_ip", "<BASTION_PUBLIC_IP>")
        key_path = str(settings.SSH_KEY_PATH)

        nodes = [
            {
                "name": "Bastion Jumpbox",
                "ip": bastion_ip,
                "user": "ubuntu",
                "type": "Direct SSH",
                "command": f"ssh -i {key_path} ubuntu@{bastion_ip}"
            },
            {
                "name": "Wazuh SIEM Host",
                "ip": "10.10.10.33",
                "user": "ubuntu",
                "type": "ProxyJump via Bastion",
                "command": f"ssh -i {key_path} -o ProxyJump=ubuntu@{bastion_ip} ubuntu@10.10.10.33"
            },
            {
                "name": "Linux Web Target",
                "ip": "10.10.30.148",
                "user": "ubuntu",
                "type": "ProxyJump via Bastion",
                "command": f"ssh -i {key_path} -o ProxyJump=ubuntu@{bastion_ip} ubuntu@10.10.30.148"
            },
            {
                "name": "Linux Attack Host",
                "ip": "10.10.20.114",
                "user": "ubuntu",
                "type": "ProxyJump via Bastion",
                "command": f"ssh -i {key_path} -o ProxyJump=ubuntu@{bastion_ip} ubuntu@10.10.20.114"
            },
            {
                "name": "Windows Endpoint",
                "ip": "10.10.10.254",
                "user": "Administrator",
                "type": "WinRM Tunnel via Bastion",
                "command": f"ssh -i {key_path} -N -L 0.0.0.0:5985:10.10.10.254:5985 ubuntu@{bastion_ip}"
            }
        ]

        return {
            "key_path": key_path,
            "bastion_public_ip": bastion_ip,
            "wazuh_tunnel_command": f"ssh -i {key_path} -N -L 0.0.0.0:8443:10.10.10.33:443 ubuntu@{bastion_ip}",
            "nodes": nodes
        }

    @classmethod
    def start_wazuh_tunnel(cls) -> Dict[str, Any]:
        """Starts the local SSH port forwarding tunnel bound to 0.0.0.0:8443 in the background."""
        import socket
        from app.services.aws import AWSService

        # Check if local port 8443 is already listening
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(1.0)
            if s.connect_ex(("127.0.0.1", 8443)) == 0 or s.connect_ex(("0.0.0.0", 8443)) == 0:
                return {
                    "success": True,
                    "message": "Wazuh tunnel is already active on port 8443 (bound to 0.0.0.0:8443)",
                    "url": "https://localhost:8443"
                }

        # Always prioritize live EC2 instance public IP over potentially stale Terraform outputs
        instances = AWSService.get_instances()
        bastion_node = next((i for i in instances if "bastion" in i.name.lower() and i.public_ip and i.public_ip != "None"), None)
        if bastion_node and bastion_node.public_ip:
            bastion_ip = bastion_node.public_ip
        else:
            outputs = TerraformService.get_outputs()
            bastion_ip = outputs.get("bastion_public_ip")

        if not bastion_ip or bastion_ip == "<BASTION_PUBLIC_IP>":
            return {
                "success": False,
                "error": "Bastion host is not running or public IP is not available. Please ensure infrastructure is deployed and running."
            }

        wazuh_node = next((i for i in instances if "wazuh" in i.name.lower() and i.private_ip and i.private_ip != "None"), None)
        if wazuh_node and wazuh_node.private_ip:
            wazuh_ip = wazuh_node.private_ip
        else:
            outputs = TerraformService.get_outputs()
            wazuh_ip = outputs.get("wazuh_private_ip", "10.10.10.33")

        key_path = settings.SSH_KEY_PATH
        if not key_path.exists():
            return {
                "success": False,
                "error": f"SSH private key not found at {key_path}. Ensure your key is configured in Settings."
            }

        cmd = [
            "ssh",
            "-i", str(key_path),
            "-o", "BatchMode=yes",
            "-o", "StrictHostKeyChecking=no",
            "-o", "UserKnownHostsFile=/dev/null",
            "-o", "LogLevel=ERROR",
            "-o", "ConnectTimeout=5",
            "-f", "-N",
            "-L", f"0.0.0.0:8443:{wazuh_ip}:443",
            f"ubuntu@{bastion_ip}"
        ]

        try:
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
            if res.returncode == 0:
                return {
                    "success": True,
                    "message": f"Wazuh tunnel established on 0.0.0.0:8443 (accessible across network)",
                    "url": "https://localhost:8443"
                }
            stderr = res.stderr.strip()
            if "Address already in use" in stderr:
                return {
                    "success": True,
                    "message": "Wazuh tunnel is already active on port 8443",
                    "url": "https://localhost:8443"
                }
            return {
                "success": False,
                "error": stderr or f"SSH tunnel exited with return code {res.returncode}"
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    @classmethod
    def ensure_winrm_tunnel(cls) -> Dict[str, Any]:
        """
        Ensures the local SSH port forwarding tunnel (127.0.0.1:5985 -> Windows_IP:5985)
        is active via Bastion before Ansible connects to Windows.
        """
        import socket
        from app.services.aws import AWSService

        # Check if local port 5985 is already open
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(1.0)
            if s.connect_ex(("127.0.0.1", 5985)) == 0:
                return {
                    "success": True,
                    "message": "WinRM tunnel is already active on 127.0.0.1:5985",
                    "port": 5985
                }

        instances = AWSService.get_instances()
        bastion_node = next((i for i in instances if "bastion" in i.name.lower() and i.public_ip and i.public_ip != "None"), None)
        if bastion_node and bastion_node.public_ip:
            bastion_ip = bastion_node.public_ip
        else:
            outputs = TerraformService.get_outputs()
            bastion_ip = outputs.get("bastion_public_ip")

        if not bastion_ip or bastion_ip == "<BASTION_PUBLIC_IP>":
            return {
                "success": False,
                "error": "Bastion host is not running or public IP is not available."
            }

        windows_node = next((i for i in instances if "windows" in i.name.lower() and i.private_ip and i.private_ip != "None"), None)
        if windows_node and windows_node.private_ip:
            windows_ip = windows_node.private_ip
        else:
            outputs = TerraformService.get_outputs()
            windows_ip = outputs.get("windows_private_ip", "10.10.10.212")

        key_path = settings.SSH_KEY_PATH
        if not key_path.exists():
            return {
                "success": False,
                "error": f"SSH private key not found at {key_path}."
            }

        cmd = [
            "ssh",
            "-i", str(key_path),
            "-o", "BatchMode=yes",
            "-o", "StrictHostKeyChecking=no",
            "-o", "UserKnownHostsFile=/dev/null",
            "-o", "LogLevel=ERROR",
            "-o", "ExitOnForwardFailure=yes",
            "-o", "ConnectTimeout=5",
            "-f", "-N",
            "-L", f"127.0.0.1:5985:{windows_ip}:5985",
            f"ubuntu@{bastion_ip}"
        ]

        try:
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
            if res.returncode == 0:
                return {
                    "success": True,
                    "message": f"WinRM tunnel established to {windows_ip}:5985 via Bastion",
                    "port": 5985
                }
            stderr = res.stderr.strip()
            if "Address already in use" in stderr:
                return {
                    "success": True,
                    "message": "WinRM tunnel is already active on port 5985",
                    "port": 5985
                }
            return {
                "success": False,
                "error": stderr or f"SSH tunnel exited with return code {res.returncode}"
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

