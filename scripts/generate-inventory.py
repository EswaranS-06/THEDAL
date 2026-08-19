#!/usr/bin/env python3
"""
THEDAL — Dynamic Ansible Inventory Generator
Threat Hunting, Exploration, Detection, Analysis and Learn
==============================================================================
Reads structured Terraform JSON outputs (`terraform output -json`) and
generates a deterministic Ansible `hosts.ini` inventory configured for
SSH ProxyJump bastion routing and WinRM Windows management.

Usage:
    python3 scripts/generate-inventory.py [--terraform-dir terraform] [--output ansible/inventory/hosts.ini]
    python3 scripts/generate-inventory.py --input-json terraform_outputs.json
==============================================================================
"""

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path


def get_default_key_path() -> str:
    primary = Path.home() / ".ssh" / "thedal_key"
    if primary.exists():
        return str(primary)
    return str(Path.home() / ".ssh" / "socforge_key")


def get_terraform_outputs(terraform_dir: str) -> dict:
    """Executes `terraform output -json` in the specified directory."""
    tf_path = Path(terraform_dir).resolve()
    if not tf_path.is_dir():
        raise FileNotFoundError(f"Terraform directory '{tf_path}' does not exist.")

    cmd = ["terraform", f"-chdir={tf_path}", "output", "-json"]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        return json.loads(result.stdout)
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] Failed to execute '{' '.join(cmd)}':", file=sys.stderr)
        print(e.stderr, file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"[ERROR] Failed to parse Terraform JSON output: {e}", file=sys.stderr)
        sys.exit(1)


def parse_inventory_data(tf_outputs: dict) -> dict:
    """Extracts host metadata from structured or individual Terraform outputs."""
    hosts = {}

    # Check for structured inventory map first
    if "ansible_inventory_hosts" in tf_outputs and "value" in tf_outputs["ansible_inventory_hosts"]:
        hosts = tf_outputs["ansible_inventory_hosts"]["value"]
    else:
        # Fallback to individual output keys
        def get_val(key, default=""):
            return tf_outputs.get(key, {}).get("value", default)

        hosts = {
            "bastion": {
                "name": "bastion",
                "os_family": "linux",
                "role": "bastion",
                "private_ip": get_val("bastion_private_ip"),
                "public_ip": get_val("bastion_public_ip"),
                "user": "ubuntu",
            },
            "wazuh": {
                "name": "wazuh",
                "os_family": "linux",
                "role": "siem",
                "private_ip": get_val("wazuh_private_ip"),
                "public_ip": "",
                "user": "ubuntu",
            },
            "web": {
                "name": "web",
                "os_family": "linux",
                "role": "web-target",
                "private_ip": get_val("web_private_ip"),
                "public_ip": "",
                "user": "ubuntu",
            },
            "attack": {
                "name": "attack",
                "os_family": "linux",
                "role": "attacker",
                "private_ip": get_val("attack_private_ip"),
                "public_ip": "",
                "user": "ubuntu",
            },
            "windows": {
                "name": "windows",
                "os_family": "windows",
                "role": "endpoint",
                "private_ip": get_val("windows_private_ip"),
                "public_ip": "",
                "user": "Administrator",
            },
        }

    return hosts


def generate_ini(hosts: dict, key_path: str = None) -> str:
    """Renders the INI-formatted Ansible inventory."""
    resolved_key = key_path or get_default_key_path()
    bastion_host = hosts.get("bastion", {})
    bastion_public_ip = bastion_host.get("public_ip", "") or "<BASTION_PUBLIC_IP>"
    bastion_user = bastion_host.get("user", "ubuntu")

    wazuh_ip = hosts.get("wazuh", {}).get("private_ip", "<WAZUH_PRIVATE_IP>")
    web_ip = hosts.get("web", {}).get("private_ip", "<WEB_PRIVATE_IP>")
    attack_ip = hosts.get("attack", {}).get("private_ip", "<ATTACK_PRIVATE_IP>")
    windows_ip = hosts.get("windows", {}).get("private_ip", "<WINDOWS_PRIVATE_IP>")

    lines = [
        "# ==============================================================================",
        "# THEDAL — Auto-Generated Ansible Inventory",
        "# ==============================================================================",
        "# Generated automatically from Terraform outputs. Do NOT edit manually.",
        "# ==============================================================================",
        "",
        "[bastion]",
        f"bastion ansible_host={bastion_public_ip} ansible_user={bastion_user} ansible_ssh_private_key_file={resolved_key}",
        "",
        "[internal_linux]",
        f"wazuh ansible_host={wazuh_ip} ansible_user=ubuntu ansible_ssh_private_key_file={resolved_key}",
        f"web ansible_host={web_ip} ansible_user=ubuntu ansible_ssh_private_key_file={resolved_key}",
        f"attack ansible_host={attack_ip} ansible_user=ubuntu ansible_ssh_private_key_file={resolved_key}",
        "",
        "[internal_linux:vars]",
        f"# Internal Linux nodes communicate via Bastion ProxyJump",
        f"ansible_ssh_common_args='-o ProxyJump={bastion_user}@{bastion_public_ip} -o StrictHostKeyChecking=no'",
        "",
        "[windows]",
        f"windows ansible_host=127.0.0.1 ansible_port=5985 windows_internal_ip={windows_ip} ansible_user=Administrator ansible_connection=winrm ansible_winrm_server_cert_validation=ignore",
        "",
        "[linux:children]",
        "bastion",
        "internal_linux",
        "",
        "[soc_stack:children]",
        "internal_linux",
        "windows",
        "",
        "[all:vars]",
        f"bastion_public_ip={bastion_public_ip}",
        f"bastion_private_ip={bastion_host.get('private_ip', '')}",
        "ansible_python_interpreter=/usr/bin/python3",
    ]

    return "\n".join(lines) + "\n"


def main():
    default_key = get_default_key_path()
    parser = argparse.ArgumentParser(description="Generate Ansible inventory from Terraform outputs.")
    parser.add_argument("--terraform-dir", default="terraform", help="Path to terraform project directory (default: terraform)")
    parser.add_argument("--input-json", help="Path to pre-extracted terraform output JSON file")
    parser.add_argument("--output", default="ansible/inventory/hosts.ini", help="Target hosts.ini path (default: ansible/inventory/hosts.ini)")
    parser.add_argument("--key-path", default=default_key, help=f"Path to operator SSH private key (default: {default_key})")
    parser.add_argument("--dry-run", action="store_true", help="Print generated inventory to stdout without writing to file")

    args = parser.parse_args()

    if args.input_json:
        with open(args.input_json, "r", encoding="utf-8") as f:
            tf_outputs = json.load(f)
    else:
        tf_outputs = get_terraform_outputs(args.terraform_dir)

    hosts = parse_inventory_data(tf_outputs)
    ini_content = generate_ini(hosts, key_path=args.key_path)

    if args.dry_run:
        print(ini_content)
        return

    out_path = Path(args.output).resolve()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(ini_content, encoding="utf-8")
    print(f"[OK] Successfully generated Ansible inventory at: {out_path}")


if __name__ == "__main__":
    main()
