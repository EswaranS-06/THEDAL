"""
THEDAL Control Plane — Runtime Mode & Execution Service
======================================================
Detects active execution mode (Native Linux vs Docker) and provisions the appropriate
ExecutionAdapter for seamless single-codebase operations.
"""

import os
import json
from pathlib import Path
from typing import Dict, Any, Optional

from app.adapters.base import ExecutionAdapter
from app.adapters.native import NativeExecutionAdapter
from app.adapters.docker import DockerExecutionAdapter
from app.config import settings


class RuntimeService:
    """Detects and provides the execution runtime environment."""

    _adapter_instance: Optional[ExecutionAdapter] = None

    @classmethod
    def is_docker_environment(cls) -> bool:
        """Heuristic check for Docker container environment."""
        # 1. Standard /.dockerenv file
        if Path("/.dockerenv").exists():
            return True

        # 2. Podman / OCI container indicator
        if Path("/run/.containerenv").exists():
            return True

        # 3. /proc/1/cgroup inspection
        try:
            cgroup_path = Path("/proc/1/cgroup")
            if cgroup_path.exists():
                content = cgroup_path.read_text(encoding="utf-8")
                if "docker" in content or "containerd" in content or "kubepods" in content:
                    return True
        except Exception:
            pass

        return False

    @classmethod
    def get_runtime_mode(cls) -> str:
        """
        Determines active runtime mode following strict precedence:
        1. Explicit THEDAL_MODE env var ("native" | "docker")
        2. Persistent metadata file (control-plane/data/runtime_mode.json)
        3. Automatic container environment detection
        """
        # 1. Explicit Environment Variable
        env_mode = os.getenv("THEDAL_MODE", "").strip().lower()
        if env_mode in ("native", "docker"):
            return env_mode

        # 2. Installation / configuration metadata file
        meta_file = Path(settings.CONTROL_PLANE_DIR) / "data" / "runtime_mode.json"
        if meta_file.exists():
            try:
                data = json.loads(meta_file.read_text(encoding="utf-8"))
                saved_mode = data.get("mode", "").strip().lower()
                if saved_mode in ("native", "docker"):
                    return saved_mode
            except Exception:
                pass

        # 3. Safe Automatic Detection
        if cls.is_docker_environment():
            return "docker"

        return "native"

    @classmethod
    def set_runtime_mode(cls, mode: str) -> None:
        """Persists explicit runtime mode configuration."""
        if mode not in ("native", "docker"):
            raise ValueError(f"Invalid runtime mode: {mode}. Must be 'native' or 'docker'.")

        data_dir = Path(settings.CONTROL_PLANE_DIR) / "data"
        data_dir.mkdir(parents=True, exist_ok=True)
        meta_file = data_dir / "runtime_mode.json"
        meta_file.write_text(json.dumps({"mode": mode}, indent=2), encoding="utf-8")
        cls._adapter_instance = None  # Reset singleton cache

    @classmethod
    def get_execution_adapter(cls) -> ExecutionAdapter:
        """Returns the configured ExecutionAdapter singleton."""
        mode = cls.get_runtime_mode()
        if cls._adapter_instance is None or cls._adapter_instance.mode != mode:
            if mode == "docker":
                cls._adapter_instance = DockerExecutionAdapter()
            else:
                cls._adapter_instance = NativeExecutionAdapter()

        return cls._adapter_instance

    @classmethod
    def get_runtime_info(cls) -> Dict[str, Any]:
        """Provides runtime overview, adapter status, tool availability, and host network warning checks."""
        adapter = cls.get_execution_adapter()
        tools = adapter.get_tool_versions()
        runtime_diag = adapter.get_runtime_status()

        # Network binding check
        bind_host = os.getenv("THEDAL_BIND_HOST", settings.HOST)
        bind_port = int(os.getenv("THEDAL_BIND_PORT", str(settings.PORT)))
        is_open_bind = bind_host in ("0.0.0.0", "::")

        return {
            "mode": adapter.mode,
            "display_name": adapter.display_name,
            "is_container": runtime_diag.get("is_container", False),
            "tools": tools,
            "runtime_diagnostics": runtime_diag,
            "network": {
                "bind_host": bind_host,
                "bind_port": bind_port,
                "is_open_bind": is_open_bind,
                "warning": "Control Plane is bound to 0.0.0.0. Ensure your host firewall restricts access if connected to public networks." if is_open_bind else None,
            }
        }
