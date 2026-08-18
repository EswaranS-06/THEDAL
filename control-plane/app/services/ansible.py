"""
SOCForge Control Plane — Ansible Configuration & Inventory Service
"""

import sys
from typing import Dict, Any, List, Tuple
from pathlib import Path

from app.config import settings
from app.services.operations import OperationsManager, SecurityValidationError


class AnsibleService:
    """
    Manages execution of specific Ansible playbooks and dynamic inventory generation.
    """

    ALLOWED_PLAYBOOKS = {
        "bootstrap": "bootstrap.yml",
        "linux-base": "linux-base.yml",
        "windows-base": "windows-base.yml",
        "wazuh": "wazuh.yml",
        "windows-agent": "windows-agent.yml",
        "web-target": "web-target.yml",
        "juice-shop": "juice-shop.yml",
        "atomic-red-team": "atomic-red-team.yml",
        "web-attack": "web-attack.yml",
    }

    @classmethod
    def generate_inventory(cls) -> Tuple[int, str, Path]:
        """Runs the inventory generation script."""
        script_path = settings.SCRIPTS_DIR / "generate-inventory.py"
        if not script_path.exists():
            raise SecurityValidationError("Inventory generation script not found.")

        cmd = [sys.executable, str(script_path)]
        return OperationsManager.run_command(cmd, settings.PROJECT_ROOT, "generate_inventory")

    @classmethod
    def run_playbook(cls, playbook_key: str, confirmation: bool = True) -> Tuple[int, str, Path]:
        """Runs an allowlisted Ansible playbook."""
        if not confirmation:
            raise SecurityValidationError("Confirmation required to execute playbook.")

        if playbook_key not in cls.ALLOWED_PLAYBOOKS:
            raise SecurityValidationError(f"Invalid playbook '{playbook_key}'. Allowed: {list(cls.ALLOWED_PLAYBOOKS.keys())}")

        playbook_file = cls.ALLOWED_PLAYBOOKS[playbook_key]
        playbook_path = settings.ANSIBLE_DIR / "playbooks" / playbook_file

        if not playbook_path.exists():
            raise SecurityValidationError(f"Playbook file '{playbook_file}' does not exist on disk.")

        inventory_path = settings.ANSIBLE_DIR / "inventory" / "hosts.ini"
        cmd = [
            "ansible-playbook",
            "-i", str(inventory_path),
            str(playbook_path)
        ]
        return OperationsManager.run_command(cmd, settings.ANSIBLE_DIR, f"ansible_{playbook_key}")

    @classmethod
    def run_full_provision(cls, confirmation: bool = True) -> Tuple[int, str, Path]:
        """Runs all provisioning stages sequentially."""
        if not confirmation:
            raise SecurityValidationError("Confirmation required for full provisioning.")

        inventory_path = settings.ANSIBLE_DIR / "inventory" / "hosts.ini"
        playbooks = [
            "bootstrap.yml",
            "linux-base.yml",
            "windows-base.yml",
            "wazuh.yml",
            "windows-agent.yml",
            "web-target.yml",
            "juice-shop.yml",
            "atomic-red-team.yml",
            "web-attack.yml"
        ]
        
        playbook_paths = [str(settings.ANSIBLE_DIR / "playbooks" / p) for p in playbooks]
        cmd = ["ansible-playbook", "-i", str(inventory_path)] + playbook_paths
        return OperationsManager.run_command(cmd, settings.ANSIBLE_DIR, "ansible_full_provision")
