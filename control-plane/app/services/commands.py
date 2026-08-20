"""
THEDAL Control Plane — Dynamic Operator Command Generator
Generates live, copyable CLI commands using current AWS/Terraform state and IPs.
"""

from typing import List, Dict, Any
from app.services.aws import AWSService
from app.services.terraform import TerraformService
from app.config import settings


class CommandService:
    """Dynamically generates operator CLI commands from live cloud discovery."""

    @classmethod
    def get_dynamic_commands(cls) -> List[Dict[str, Any]]:
        """Extract live IPs from Terraform and AWS EC2 to generate exact commands."""
        instances = AWSService.get_instances()
        tf_outputs = TerraformService.get_outputs()
        ssh_key = settings.SSH_KEY_PATH

        bastion_pub = tf_outputs.get("bastion_public_ip", "<BASTION_PUBLIC_IP>")
        if bastion_pub == "<BASTION_PUBLIC_IP>":
            bastion_node = next((i for i in instances if "bastion" in i.name.lower() and i.public_ip), None)
            if bastion_node and bastion_node.public_ip:
                bastion_pub = bastion_node.public_ip

        # Lookup private IPs
        node_ips = {}
        for inst in instances:
            key_name = inst.name.lower().replace("socforge-", "").replace("thedal-", "")
            if inst.private_ip:
                node_ips[key_name] = inst.private_ip

        wazuh_ip = node_ips.get("wazuh", tf_outputs.get("wazuh_private_ip", "10.10.10.33"))
        web_ip = node_ips.get("web", "10.10.30.148")
        attack_ip = node_ips.get("attack", "10.10.20.114")
        windows_ip = node_ips.get("windows", "10.10.10.254")

        commands = [
            {
                "id": "bastion-ssh",
                "category": "SSH Access",
                "target": "Bastion Jumpbox",
                "title": "Bastion Jumpbox SSH",
                "target_host": "bastion",
                "ip": bastion_pub,
                "description": "Direct SSH connection to the public Bastion jumpbox",
                "command": f"ssh -i {ssh_key} ubuntu@{bastion_pub}"
            },
            {
                "id": "wazuh-ssh",
                "category": "SSH Access",
                "target": "Wazuh SIEM Host",
                "title": "Wazuh SIEM ProxyJump SSH",
                "target_host": "wazuh",
                "ip": wazuh_ip,
                "description": "ProxyJump SSH into the private Wazuh SIEM Manager node",
                "command": f"ssh -i {ssh_key} -o ProxyJump=ubuntu@{bastion_pub} ubuntu@{wazuh_ip}"
            },
            {
                "id": "wazuh-tunnel",
                "category": "SIEM UI Tunnel",
                "target": "Wazuh Dashboards",
                "title": "Wazuh Dashboard Port Forward (8443)",
                "target_host": "wazuh",
                "ip": f"{wazuh_ip}:443 -> localhost:8443",
                "description": "Local port forwarding tunnel to access OpenSearch Dashboards at https://localhost:8443",
                "command": f"ssh -i {ssh_key} -N -L 8443:{wazuh_ip}:443 ubuntu@{bastion_pub}"
            },
            {
                "id": "web-ssh",
                "category": "SSH Access",
                "target": "Linux Web Target",
                "title": "Linux Web Target ProxyJump SSH",
                "target_host": "web",
                "ip": web_ip,
                "description": "ProxyJump SSH into DVWA & OWASP Juice Shop host",
                "command": f"ssh -i {ssh_key} -o ProxyJump=ubuntu@{bastion_pub} ubuntu@{web_ip}"
            },
            {
                "id": "attack-ssh",
                "category": "SSH Access",
                "target": "Adversary Attack Host",
                "title": "Adversary Attack Host ProxyJump SSH",
                "target_host": "attack",
                "ip": attack_ip,
                "description": "ProxyJump SSH into the Atomic Red Team attack simulation host",
                "command": f"ssh -i {ssh_key} -o ProxyJump=ubuntu@{bastion_pub} ubuntu@{attack_ip}"
            },
            {
                "id": "windows-winrm",
                "category": "Windows Management",
                "target": "Windows Endpoint",
                "title": "Windows WinRM Port Forward (5985)",
                "target_host": "windows",
                "ip": f"{windows_ip}:5985",
                "description": "PowerShell remote session to Windows Server endpoint via Bastion",
                "command": f"ssh -i {ssh_key} -N -L 5985:{windows_ip}:5985 ubuntu@{bastion_pub}"
            },
            {
                "id": "ansible-test",
                "category": "Automation",
                "target": "All Managed Hosts",
                "title": "Ansible Ping Check",
                "target_host": "all",
                "ip": "Private Subnets",
                "description": "Ping all managed inventory nodes via Ansible",
                "command": f"ansible all -i ansible/inventory/hosts.ini -m ping"
            }
        ]

        return commands
