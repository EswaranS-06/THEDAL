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
        """Generates connection strings from Terraform outputs."""
        outputs = TerraformService.get_outputs()
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
                "command": f"ssh -i {key_path} -N -L 5985:10.10.10.254:5985 ubuntu@{bastion_ip}"
            }
        ]

        return {
            "key_path": key_path,
            "bastion_public_ip": bastion_ip,
            "wazuh_tunnel_command": f"ssh -i {key_path} -N -L 8443:10.10.10.33:443 ubuntu@{bastion_ip}",
            "nodes": nodes
        }

    @classmethod
    def start_wazuh_tunnel(cls) -> Dict[str, Any]:
        """Starts the local SSH port forwarding tunnel in the background."""
        outputs = TerraformService.get_outputs()
        bastion_ip = outputs.get("bastion_public_ip")
        if not bastion_ip:
            return {"success": False, "error": "Bastion IP not found in Terraform outputs."}

        key_path = str(settings.SSH_KEY_PATH)
        cmd = [
            "ssh",
            "-i", key_path,
            "-o", "StrictHostKeyChecking=no",
            "-f", "-N",
            "-L", "8443:10.10.10.33:443",
            f"ubuntu@{bastion_ip}"
        ]

        try:
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
            if res.returncode == 0:
                return {
                    "success": True,
                    "message": "Wazuh tunnel established at https://localhost:8443",
                    "url": "https://localhost:8443"
                }
            return {"success": False, "error": res.stderr}
        except Exception as e:
            return {"success": False, "error": str(e)}
