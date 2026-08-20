"""
THEDAL Control Plane — Docker Execution Adapter
===============================================
Executes operations within an isolated, self-contained Docker container environment.
"""

import os
import shutil
import socket
import subprocess
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path

from app.adapters.base import ExecutionAdapter
from app.config import settings
from app.services.operations import OperationsManager, SecurityValidationError


class DockerExecutionAdapter(ExecutionAdapter):
    """Execution adapter for Docker containerized environments."""

    @property
    def mode(self) -> str:
        return "docker"

    @property
    def display_name(self) -> str:
        return "Docker"

    def run_terraform(
        self,
        command: List[str],
        tf_dir: Path,
        log_action: str = "terraform"
    ) -> Tuple[int, str, Path]:
        if not shutil.which("terraform"):
            raise SecurityValidationError("Terraform executable not found in container runtime.")
        return OperationsManager.run_command(command, tf_dir, log_action)

    def run_ansible(
        self,
        playbook: str,
        inventory: Path,
        extra_vars: Optional[Dict[str, Any]] = None,
        tags: Optional[List[str]] = None,
        log_action: str = "ansible"
    ) -> Tuple[int, str, Path]:
        if not shutil.which("ansible-playbook"):
            raise SecurityValidationError("Ansible-playbook executable not found in container runtime.")

        cmd = [
            "ansible-playbook",
            "-i", str(inventory),
            f"playbooks/{playbook}.yml",
            "-v"
        ]

        if tags:
            cmd.extend(["--tags", ",".join(tags)])

        if extra_vars:
            import json
            cmd.extend(["--extra-vars", json.dumps(extra_vars)])

        return OperationsManager.run_command(cmd, settings.ANSIBLE_DIR, log_action)

    def run_script(
        self,
        script_path: Path,
        args: Optional[List[str]] = None,
        log_action: str = "script",
        cwd: Optional[Path] = None
    ) -> Tuple[int, str, Path]:
        target_cwd = cwd or script_path.parent
        cmd = [str(script_path)] + (args or [])
        return OperationsManager.run_command(cmd, target_cwd, log_action)

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
        # Test if port is already active
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(1.0)
            if s.connect_ex((local_bind_host if local_bind_host != "0.0.0.0" else "127.0.0.1", local_port)) == 0:
                return {
                    "success": True,
                    "message": f"Docker tunnel is already active on port {local_port}",
                    "url": f"https://localhost:{local_port}"
                }

        cmd = [
            "ssh",
            "-i", str(key_path),
            "-o", "StrictHostKeyChecking=no",
            "-o", "UserKnownHostsFile=/dev/null",
            "-o", "ConnectTimeout=5",
            "-o", "ServerAliveInterval=30",
            "-o", "ServerAliveCountMax=3",
            "-f", "-N",
            "-L", f"{local_bind_host}:{local_port}:{remote_host}:{remote_port}",
            f"{username}@{bastion_host}"
        ]

        try:
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
            if res.returncode == 0:
                return {
                    "success": True,
                    "message": f"Docker tunnel established on {local_bind_host}:{local_port} (mapped to host)",
                    "url": f"https://localhost:{local_port}"
                }
            stderr = res.stderr.strip()
            if "Address already in use" in stderr:
                return {
                    "success": True,
                    "message": f"Docker tunnel is already active on port {local_port}",
                    "url": f"https://localhost:{local_port}"
                }
            return {
                "success": False,
                "error": stderr or f"SSH tunnel exited with return code {res.returncode}"
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    def stop_ssh_tunnel(self, local_port: int) -> Dict[str, Any]:
        try:
            cmd = ["pkill", "-f", f"ssh.*-L.*:{local_port}:"]
            res = subprocess.run(cmd, capture_output=True, text=True)
            return {
                "success": True,
                "message": f"Docker tunnel on port {local_port} stopped."
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_local_paths(self) -> Dict[str, Path]:
        return {
            "root": settings.PROJECT_ROOT,
            "terraform": settings.TERRAFORM_DIR,
            "ansible": settings.ANSIBLE_DIR,
            "scripts": settings.SCRIPTS_DIR,
            "logs": settings.LOGS_DIR,
            "ssh_key": settings.SSH_KEY_PATH,
        }

    def get_runtime_status(self) -> Dict[str, Any]:
        # Check volume mount health
        aws_mount = (Path.home() / ".aws").exists()
        ssh_mount = (Path.home() / ".ssh").exists()
        data_mount = (Path(settings.CONTROL_PLANE_DIR) / "data").exists()

        return {
            "mode": self.mode,
            "display_name": self.display_name,
            "is_container": True,
            "os": "Linux (Container)",
            "user": os.getenv("USER", "thedal"),
            "mounts": {
                "aws_credentials": {"mounted": aws_mount, "path": str(Path.home() / ".aws")},
                "ssh_key": {"mounted": ssh_mount, "path": str(Path.home() / ".ssh")},
                "data_persistence": {"mounted": data_mount, "path": str(Path(settings.CONTROL_PLANE_DIR) / "data")},
            },
            "ports": {
                "control_plane": 8080,
                "wazuh_tunnel": 8443,
            }
        }

    def get_tool_versions(self) -> Dict[str, Any]:
        tools = {}
        # In-container Terraform
        tf_path = shutil.which("terraform")
        if tf_path:
            try:
                out = subprocess.check_output([tf_path, "version"], text=True, timeout=2)
                tools["terraform"] = {"available": True, "version": out.splitlines()[0], "path": tf_path}
            except Exception:
                tools["terraform"] = {"available": True, "version": "Unknown", "path": tf_path}
        else:
            tools["terraform"] = {"available": False, "version": None, "path": None}

        # In-container Ansible
        ans_path = shutil.which("ansible")
        if ans_path:
            try:
                out = subprocess.check_output([ans_path, "--version"], text=True, timeout=2)
                tools["ansible"] = {"available": True, "version": out.splitlines()[0], "path": ans_path}
            except Exception:
                tools["ansible"] = {"available": True, "version": "Unknown", "path": ans_path}
        else:
            tools["ansible"] = {"available": False, "version": None, "path": None}

        # In-container AWS CLI
        aws_path = shutil.which("aws")
        if aws_path:
            try:
                out = subprocess.check_output([aws_path, "--version"], text=True, timeout=2)
                tools["aws_cli"] = {"available": True, "version": out.splitlines()[0], "path": aws_path}
            except Exception:
                tools["aws_cli"] = {"available": True, "version": "Unknown", "path": aws_path}
        else:
            tools["aws_cli"] = {"available": False, "version": None, "path": None}

        # In-container SSH Client
        ssh_path = shutil.which("ssh")
        if ssh_path:
            try:
                res = subprocess.run([ssh_path, "-V"], capture_output=True, text=True, timeout=2)
                ver = (res.stderr or res.stdout).strip()
                tools["ssh"] = {"available": True, "version": ver, "path": ssh_path}
            except Exception:
                tools["ssh"] = {"available": True, "version": "OpenSSH", "path": ssh_path}
        else:
            tools["ssh"] = {"available": False, "version": None, "path": None}

        return tools
