"""
Tests for THEDAL Multi-Mode Runtime Adapters & Execution Service
===============================================================
Verifies Native and Docker execution adapter behaviors, runtime detection logic,
toolchain availability probing, and runtime status endpoints.
"""

import os
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from app.main import app
from app.services.runtime import RuntimeService
from app.adapters.native import NativeExecutionAdapter
from app.adapters.docker import DockerExecutionAdapter


client = TestClient(app)


def test_native_adapter_properties():
    """Verify NativeExecutionAdapter returns correct mode and display name."""
    adapter = NativeExecutionAdapter()
    assert adapter.mode == "native"
    assert adapter.display_name == "Native Linux"
    status = adapter.get_runtime_status()
    assert status["is_container"] is False
    assert "paths" in status


def test_docker_adapter_properties():
    """Verify DockerExecutionAdapter returns correct mode and display name."""
    adapter = DockerExecutionAdapter()
    assert adapter.mode == "docker"
    assert adapter.display_name == "Docker"
    status = adapter.get_runtime_status()
    assert status["is_container"] is True
    assert "mounts" in status
    assert status["ports"]["control_plane"] == 8080
    assert status["ports"]["wazuh_tunnel"] == 8443


def test_runtime_mode_detection_env():
    """Verify explicit THEDAL_MODE environment variable takes highest priority."""
    with patch.dict(os.environ, {"THEDAL_MODE": "docker"}):
        RuntimeService._adapter_instance = None
        assert RuntimeService.get_runtime_mode() == "docker"
        adapter = RuntimeService.get_execution_adapter()
        assert isinstance(adapter, DockerExecutionAdapter)

    with patch.dict(os.environ, {"THEDAL_MODE": "native"}):
        RuntimeService._adapter_instance = None
        assert RuntimeService.get_runtime_mode() == "native"
        adapter = RuntimeService.get_execution_adapter()
        assert isinstance(adapter, NativeExecutionAdapter)


def test_api_runtime_status_endpoint():
    """Verify GET /api/runtime/status returns valid RuntimeModeStatus schema."""
    res = client.get("/api/runtime/status")
    assert res.status_code == 200
    data = res.json()
    assert data["mode"] in ("native", "docker")
    assert "tools" in data
    assert "terraform" in data["tools"]
    assert "ansible" in data["tools"]
    assert "aws_cli" in data["tools"]
    assert "ssh" in data["tools"]
    assert "network" in data


def test_api_runtime_mode_switch():
    """Verify POST /api/runtime/mode switches and validates mode changes."""
    res = client.post("/api/runtime/mode", json={"mode": "docker"})
    assert res.status_code == 200
    assert res.json()["success"] is True

    # Invalid mode
    res_bad = client.post("/api/runtime/mode", json={"mode": "invalid-mode"})
    assert res_bad.status_code == 400

    # Reset to native
    client.post("/api/runtime/mode", json={"mode": "native"})
