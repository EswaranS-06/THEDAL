"""
SOCForge Control Plane — Terraform Lifecycle Service
"""

import json
import subprocess
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path

from app.config import settings
from app.services.operations import OperationsManager, SecurityValidationError


class TerraformService:
    """
    Manages Terraform read-only operations and confirmed lifecycle executions.
    """

    @classmethod
    def get_version(cls) -> str:
        try:
            res = subprocess.run(
                ["terraform", "version", "-json"],
                cwd=str(settings.TERRAFORM_DIR),
                capture_output=True,
                text=True,
                timeout=5
            )
            if res.returncode == 0:
                data = json.loads(res.stdout)
                return data.get("terraform_version", "unknown")
        except Exception:
            pass
        return "1.x"

    @classmethod
    def get_outputs(cls) -> Dict[str, Any]:
        """Reads Terraform outputs safely without modifying state."""
        try:
            res = subprocess.run(
                ["terraform", "output", "-json"],
                cwd=str(settings.TERRAFORM_DIR),
                capture_output=True,
                text=True,
                timeout=10
            )
            if res.returncode == 0 and res.stdout.strip():
                raw = json.loads(res.stdout)
                outputs = {}
                for k, v in raw.items():
                    outputs[k] = v.get("value")
                return outputs
        except Exception:
            pass
        return {}

    @classmethod
    def get_state_resources(cls) -> List[str]:
        """Lists managed resources from Terraform state."""
        try:
            res = subprocess.run(
                ["terraform", "state", "list"],
                cwd=str(settings.TERRAFORM_DIR),
                capture_output=True,
                text=True,
                timeout=10
            )
            if res.returncode == 0:
                return [line.strip() for line in res.stdout.splitlines() if line.strip()]
        except Exception:
            pass
        return []

    @classmethod
    def get_status(cls) -> Dict[str, Any]:
        """Determines the current high-level status of the Terraform environment."""
        tf_dir = settings.TERRAFORM_DIR
        dot_terraform = tf_dir / ".terraform"
        tfstate = tf_dir / "terraform.tfstate"

        if not dot_terraform.exists():
            return {
                "status": "NOT_INITIALIZED",
                "resource_count": 0,
                "message": "Terraform directory has not been initialized."
            }

        resources = cls.get_state_resources()
        count = len(resources)

        if count == 0:
            return {
                "status": "READY",
                "resource_count": 0,
                "message": "Terraform is initialized but no resources are currently deployed."
            }

        return {
            "status": "DEPLOYED",
            "resource_count": count,
            "message": f"Environment deployed with {count} managed resources."
        }

    @classmethod
    def plan(cls) -> Tuple[int, str, Path]:
        """Generates an execution plan."""
        cmd = ["terraform", "plan", "-no-color"]
        return OperationsManager.run_command(cmd, settings.TERRAFORM_DIR, "terraform_plan")

    @classmethod
    def apply(cls, confirmation: bool = False) -> Tuple[int, str, Path]:
        """
        Executes terraform apply with explicit confirmation guardrail.
        """
        if not confirmation:
            raise SecurityValidationError("Explicit confirmation is required to deploy infrastructure.")

        cmd = ["terraform", "apply", "-auto-approve", "-no-color"]
        return OperationsManager.run_command(cmd, settings.TERRAFORM_DIR, "terraform_apply")

    @classmethod
    def destroy(cls, confirmation: bool, confirmation_phrase: Optional[str]) -> Tuple[int, str, Path]:
        """
        Executes terraform destroy with mandatory double-confirmation and typed phrase verification.
        """
        if not confirmation:
            raise SecurityValidationError("Explicit confirmation checkbox is required for destruction.")

        expected_phrase = settings.REQUIRE_DESTROY_CONFIRMATION_PHRASE
        if not confirmation_phrase or confirmation_phrase.strip() != expected_phrase:
            raise SecurityValidationError(
                f"Destruction rejected: You must type the exact phrase '{expected_phrase}'."
            )

        cmd = ["terraform", "destroy", "-auto-approve", "-no-color"]
        return OperationsManager.run_command(cmd, settings.TERRAFORM_DIR, "terraform_destroy")
