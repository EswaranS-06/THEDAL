"""
THEDAL Control Plane — SSH Key Lifecycle & Safe Auto-Stop Service
Provides automated Ed25519 keypair generation and configurable safety auto-stop.
"""

import os
import subprocess
from pathlib import Path
from typing import Dict, Any, Optional
from app.config import settings
from app.services.aws import AWSService


class SafetyService:
    """Manages SSH key generation and safe auto-stop monitoring."""

    _auto_stop_config = {
        "enabled": False,
        "grace_period_minutes": 15,
        "monitored_services": ["docker", "juice-shop", "wazuh-manager"],
        "last_action": "None (Monitoring Inactive)",
        "last_evaluated": None
    }

    @classmethod
    def ensure_ssh_key(cls) -> Dict[str, Any]:
        """
        Ensure Ed25519 SSH keypair exists locally.
        Creates ~/.ssh/thedal_key with chmod 600 if missing.
        """
        key_path = Path(settings.SSH_KEY_PATH)
        pub_path = Path(f"{settings.SSH_KEY_PATH}.pub")

        if key_path.exists() and pub_path.exists():
            return {
                "exists": True,
                "path": str(key_path),
                "created": False,
                "message": "SSH key already exists"
            }

        # Check fallback
        fallback = Path.home() / ".ssh" / "socforge_key"
        if fallback.exists():
            return {
                "exists": True,
                "path": str(fallback),
                "created": False,
                "message": "Legacy SSH key found"
            }

        key_path.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
        cmd = [
            "ssh-keygen", "-t", "ed25519", "-f", str(key_path),
            "-N", "", "-C", "thedal-operator-key"
        ]
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode != 0:
            return {"exists": False, "error": res.stderr}

        os.chmod(key_path, 0o600)
        os.chmod(pub_path, 0o644)

        return {
            "exists": True,
            "path": str(key_path),
            "created": True,
            "message": "Ed25519 SSH keypair generated successfully"
        }

    @classmethod
    def get_autostop_status(cls) -> Dict[str, Any]:
        """Return current auto-stop configuration."""
        return dict(cls._auto_stop_config)

    @classmethod
    def configure_autostop(cls, enabled: bool, grace_period_minutes: int = 15) -> Dict[str, Any]:
        """Configure safety auto-stop policy (Does NOT run terraform destroy)."""
        cls._auto_stop_config["enabled"] = enabled
        cls._auto_stop_config["grace_period_minutes"] = max(5, grace_period_minutes)
        cls._auto_stop_config["last_action"] = f"Configured (Enabled={enabled})"
        return dict(cls._auto_stop_config)

    @classmethod
    def evaluate_and_stop_if_failed(cls, health_status: str) -> Dict[str, Any]:
        """
        Evaluate health status. If auto-stop is enabled and health is critical,
        trigger EC2 stop (NOT destroy).
        """
        if not cls._auto_stop_config["enabled"]:
            return {"action_taken": "none", "reason": "Auto-stop disabled"}

        if health_status == "OFFLINE":
            # Safely stop EC2 to prevent runaway compute costs
            AWSService.stop_all_instances()
            cls._auto_stop_config["last_action"] = "Stopped EC2 Compute Fleet due to critical failure"
            return {"action_taken": "ec2_stopped", "reason": "Environment OFFLINE"}

        return {"action_taken": "none", "status": health_status}
