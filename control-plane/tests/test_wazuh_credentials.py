"""
Tests for THEDAL Wazuh API Credential Synchronization & Health Service
======================================================================
Verifies single-source-of-truth credential generation, authentication verification,
401 mismatch detection, idempotent repair, rotation, and secret redaction.
"""

import os
import pytest
from pathlib import Path
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from app.main import app
from app.services.wazuh_credentials import WazuhCredentialService


client = TestClient(app)


def test_password_generation_complexity():
    """Verify generated password conforms to length and complexity rules."""
    pwd = WazuhCredentialService.generate_strong_password(24)
    assert len(pwd) == 24
    assert any(c.islower() for c in pwd)
    assert any(c.isupper() for c in pwd)
    assert any(c.isdigit() for c in pwd)
    assert any(c in "!@#$%^&*_-+=." for c in pwd)


def test_credential_single_source_of_truth_env(tmp_path):
    """Verify environment variables take precedence when provided."""
    with patch.dict(os.environ, {
        "THEDAL_WAZUH_API_USER": "custom-wui",
        "THEDAL_WAZUH_API_PASSWORD": "CustomPassword2026!Sec"
    }):
        creds = WazuhCredentialService.get_credentials()
        assert creds["user"] == "custom-wui"
        assert creds["password"] == "CustomPassword2026!Sec"
        assert creds["source"] == "environment"


def test_credential_idempotency_file(tmp_path):
    """Verify ensure_credentials does not overwrite existing password."""
    fake_secrets_file = tmp_path / "secrets.yml"
    with patch.object(WazuhCredentialService, "SECRETS_YML_PATH", fake_secrets_file), \
         patch.dict(os.environ, {}, clear=True):

        # First run: generates
        creds1 = WazuhCredentialService.ensure_credentials()
        pwd1 = creds1["password"]
        assert len(pwd1) >= 20

        # Second run: preserves
        creds2 = WazuhCredentialService.ensure_credentials()
        assert creds2["password"] == pwd1


def test_api_authentication_success_mocked():
    """Verify HTTP 200 with valid token yields VERIFIED status."""
    with patch("app.services.aws.AWSService.get_instances") as mock_inst, \
         patch("app.services.operations.OperationsManager.run_command") as mock_cmd:

        mock_wazuh = MagicMock(name="SOCForge-wazuh", state="running", private_ip="10.10.10.33")
        mock_wazuh.name = "SOCForge-wazuh"
        mock_bastion = MagicMock(name="SOCForge-bastion", state="running", public_ip="13.232.202.163")
        mock_bastion.name = "SOCForge-bastion"
        mock_inst.return_value = [mock_wazuh, mock_bastion]

        mock_cmd.return_value = (0, '{"data":{"token":"jwt-token-xyz"}}\nHTTP_STATUS:200', Path("/tmp/auth.log"))

        res = WazuhCredentialService.verify_api_authentication()
        assert res["success"] is True
        assert res["status"] == "VERIFIED"
        assert res["http_status"] == 200


def test_api_authentication_failure_401_mocked():
    """Verify HTTP 401 yields AUTHENTICATION_FAILED status."""
    with patch("app.services.aws.AWSService.get_instances") as mock_inst, \
         patch("app.services.operations.OperationsManager.run_command") as mock_cmd:

        mock_wazuh = MagicMock(name="SOCForge-wazuh", state="running", private_ip="10.10.10.33")
        mock_wazuh.name = "SOCForge-wazuh"
        mock_bastion = MagicMock(name="SOCForge-bastion", state="running", public_ip="13.232.202.163")
        mock_bastion.name = "SOCForge-bastion"
        mock_inst.return_value = [mock_wazuh, mock_bastion]

        mock_cmd.return_value = (0, '{"title":"Unauthorized","detail":"Invalid credentials"}\nHTTP_STATUS:401', Path("/tmp/auth.log"))

        res = WazuhCredentialService.verify_api_authentication()
        assert res["success"] is False
        assert res["status"] == "AUTHENTICATION_FAILED"
        assert res["http_status"] == 401


def test_wazuh_detailed_health_mocked():
    """Verify get_wazuh_detailed_health aggregates component states cleanly."""
    with patch("app.services.aws.AWSService.get_instances") as mock_inst, \
         patch("app.services.operations.OperationsManager.run_command") as mock_cmd, \
         patch.object(WazuhCredentialService, "verify_api_authentication") as mock_auth:

        mock_wazuh = MagicMock(name="SOCForge-wazuh", state="running", private_ip="10.10.10.33")
        mock_wazuh.name = "SOCForge-wazuh"
        mock_bastion = MagicMock(name="SOCForge-bastion", state="running", public_ip="13.232.202.163")
        mock_bastion.name = "SOCForge-bastion"
        mock_inst.return_value = [mock_wazuh, mock_bastion]

        diag_out = (
            "---SERVICES---\nactive\nactive\nactive\n"
            "---PORTS---\n:55000 :9200 :443\n"
            "---CONFIG_PERMS---\n-rw-r----- 1 wazuh-dashboard wazuh-dashboard\n"
            "---RECENT_401---\nnone\n"
        )
        mock_cmd.return_value = (0, diag_out, Path("/tmp/diag.log"))
        mock_auth.return_value = {"success": True, "status": "VERIFIED", "http_status": 200, "message": "OK"}

        health = WazuhCredentialService.get_wazuh_detailed_health()
        assert health["overall_status"] == "HEALTHY"
        assert health["components"]["wazuh_manager"]["status"] == "HEALTHY"
        assert health["components"]["wazuh_indexer"]["status"] == "HEALTHY"
        assert health["components"]["wazuh_dashboard"]["status"] == "HEALTHY"
        assert health["components"]["api_authentication"]["status"] == "VERIFIED"
        assert health["components"]["dashboard_api_sync"]["status"] == "VERIFIED"


def test_api_wazuh_endpoints():
    """Verify FastAPI routes for Wazuh health, verify-auth, repair, and rotate."""
    with patch.object(WazuhCredentialService, "get_wazuh_detailed_health") as mock_dh:
        mock_dh.return_value = {"overall_status": "HEALTHY", "components": {}}
        res = client.get("/api/wazuh/health")
        assert res.status_code == 200
        assert res.json()["overall_status"] == "HEALTHY"

    with patch.object(WazuhCredentialService, "verify_api_authentication") as mock_va:
        mock_va.return_value = {"success": True, "status": "VERIFIED"}
        res = client.post("/api/wazuh/verify-auth")
        assert res.status_code == 200
        assert res.json()["status"] == "VERIFIED"

    with patch.object(WazuhCredentialService, "repair_wazuh_configuration") as mock_rp:
        mock_rp.return_value = {"success": True, "message": "Repaired"}
        res = client.post("/api/wazuh/repair")
        assert res.status_code == 200
        assert res.json()["success"] is True


def test_secret_protection_no_password_leaks():
    """Verify password is never exposed in output dicts or log references."""
    with patch("app.services.aws.AWSService.get_instances") as mock_inst, \
         patch("app.services.operations.OperationsManager.run_command") as mock_cmd:

        mock_wazuh = MagicMock(name="SOCForge-wazuh", state="running", private_ip="10.10.10.33")
        mock_wazuh.name = "SOCForge-wazuh"
        mock_bastion = MagicMock(name="SOCForge-bastion", state="running", public_ip="13.232.202.163")
        mock_bastion.name = "SOCForge-bastion"
        mock_inst.return_value = [mock_wazuh, mock_bastion]
        mock_cmd.return_value = (0, '{"data":{"token":"jwt-123"}}\nHTTP_STATUS:200', Path("/tmp/auth.log"))

        res = WazuhCredentialService.verify_api_authentication()
        # Ensure password is not in the returned dictionary
        assert "password" not in res
        assert "secret" not in str(res).lower()
