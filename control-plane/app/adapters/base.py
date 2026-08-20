"""
THEDAL Control Plane — Base Execution Adapter Interface
=======================================================
Abstract execution strategy that isolates OS/environment differences (Native Linux vs Docker)
from business logic services (Terraform, Ansible, SSH, Health, Simulations).
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path


class ExecutionAdapter(ABC):
    """Abstract base class for THEDAL execution environments."""

    @property
    @abstractmethod
    def mode(self) -> str:
        """Returns the runtime mode ('native' or 'docker')."""
        pass

    @property
    @abstractmethod
    def display_name(self) -> str:
        """Returns human-readable name for UI badges ('Native Linux' or 'Docker')."""
        pass

    @abstractmethod
    def run_terraform(
        self,
        command: List[str],
        tf_dir: Path,
        log_action: str = "terraform"
    ) -> Tuple[int, str, Path]:
        """Executes an allowlisted Terraform operation and returns (exit_code, output, log_path)."""
        pass

    @abstractmethod
    def run_ansible(
        self,
        playbook: str,
        inventory: Path,
        extra_vars: Optional[Dict[str, Any]] = None,
        tags: Optional[List[str]] = None,
        log_action: str = "ansible"
    ) -> Tuple[int, str, Path]:
        """Executes an allowlisted Ansible playbook and returns (exit_code, output, log_path)."""
        pass

    @abstractmethod
    def run_script(
        self,
        script_path: Path,
        args: Optional[List[str]] = None,
        log_action: str = "script",
        cwd: Optional[Path] = None
    ) -> Tuple[int, str, Path]:
        """Executes an internal helper script safely and returns (exit_code, output, log_path)."""
        pass

    @abstractmethod
    def open_ssh_tunnel(
        self,
        local_bind_host: str,
        local_port: int,
        remote_host: str,
        remote_port: int,
        bastion_host: str,
        key_path: Path,
        username: str = "ubuntu"
    ) -> Dict[str, Any]:
        """Establishes a background SSH port-forwarding tunnel."""
        pass

    @abstractmethod
    def stop_ssh_tunnel(self, local_port: int) -> Dict[str, Any]:
        """Terminates an active SSH port-forwarding tunnel for the given local port."""
        pass

    @abstractmethod
    def get_local_paths(self) -> Dict[str, Path]:
        """Returns resolved filesystem paths for project workspaces, configs, keys, and logs."""
        pass

    @abstractmethod
    def get_runtime_status(self) -> Dict[str, Any]:
        """Returns runtime diagnostic metrics including container state, mounts, and tool health."""
        pass

    @abstractmethod
    def get_tool_versions(self) -> Dict[str, Any]:
        """Returns version info and availability for Terraform, Ansible, AWS CLI, and OpenSSH."""
        pass
