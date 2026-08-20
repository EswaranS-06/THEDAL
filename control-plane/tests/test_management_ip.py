"""
Tests for SOCForge Dynamic SSH Access & Management IP Service
============================================================
Validates public IPv4 detection, CIDR validation, IP containment,
drift detection, safety guardrails, and FastAPI management IP endpoints.
"""

import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from app.main import app
from app.services.management_ip import ManagementIPService


client = TestClient(app)


def test_cidr_validation():
    """Verify CIDR validation rejects malformed networks and accepts valid ones."""
    # Valid CIDRs
    valid, cidr, err = ManagementIPService.validate_cidr("122.167.158.64/32")
    assert valid is True
    assert cidr == "122.167.158.64/32"
    assert err is None

    valid, cidr, err = ManagementIPService.validate_cidr("122.167.158.0/24")
    assert valid is True
    assert cidr == "122.167.158.0/24"

    valid, cidr, err = ManagementIPService.validate_cidr("0.0.0.0/0")
    assert valid is True
    assert cidr == "0.0.0.0/0"

    # Default single IP to /32
    valid, cidr, err = ManagementIPService.validate_cidr("122.167.158.64")
    assert valid is True
    assert cidr == "122.167.158.64/32"

    # Invalid CIDRs
    valid, cidr, err = ManagementIPService.validate_cidr("999.999.999.999/32")
    assert valid is False
    assert "Invalid" in err

    valid, cidr, err = ManagementIPService.validate_cidr("not-an-ip")
    assert valid is False

    valid, cidr, err = ManagementIPService.validate_cidr("")
    assert valid is False


def test_ip_matching():
    """Verify IP network containment logic matches expected mathematical definitions."""
    # Exact host match
    assert ManagementIPService.is_ip_in_cidr("122.167.158.64", "122.167.158.64/32") is True
    # Subnet containment
    assert ManagementIPService.is_ip_in_cidr("122.167.158.64", "122.167.158.0/24") is True
    # Open access containment
    assert ManagementIPService.is_ip_in_cidr("122.167.158.64", "0.0.0.0/0") is True
    # Mismatch
    assert ManagementIPService.is_ip_in_cidr("122.167.158.64", "106.200.21.252/32") is False
    assert ManagementIPService.is_ip_in_cidr("122.167.158.64", "192.168.1.0/24") is False
    # None / Empty safety
    assert ManagementIPService.is_ip_in_cidr(None, "122.167.158.0/24") is False
    assert ManagementIPService.is_ip_in_cidr("122.167.158.64", None) is False


def test_public_ip_detection_mocked():
    """Verify public IP detection succeeds with valid IPv4 and handles failure gracefully."""
    with patch("urllib.request.urlopen") as mock_urlopen:
        mock_resp = MagicMock()
        mock_resp.status = 200
        mock_resp.read.return_value = b"203.0.113.50\n"
        mock_urlopen.return_value.__enter__.return_value = mock_resp

        ip = ManagementIPService.detect_public_ip()
        assert ip == "203.0.113.50"


def test_api_management_ip_status():
    """Verify GET /api/management-ip/status returns expected schema."""
    with patch.object(ManagementIPService, "detect_public_ip", return_value="122.167.158.64"), \
         patch.object(ManagementIPService, "get_configured_cidr", return_value="106.200.21.252/32"):
        res = client.get("/api/management-ip/status")
        assert res.status_code == 200
        data = res.json()
        assert data["detected_ip"] == "122.167.158.64"
        assert data["configured_cidr"] == "106.200.21.252/32"
        assert data["status"] == "MISMATCH"
        assert data["is_match"] is False


def test_api_management_ip_preview_validation():
    """Verify POST /api/management-ip/preview validates CIDR inputs."""
    res = client.post("/api/management-ip/preview", json={"cidr": "invalid-cidr"})
    assert res.status_code == 400


def test_api_management_ip_apply_open_risk_gate():
    """Verify POST /api/management-ip/apply requires risk acknowledgment for 0.0.0.0/0."""
    res = client.post(
        "/api/management-ip/apply",
        json={"cidr": "0.0.0.0/0", "confirmation": True, "understand_open_risk": False}
    )
    assert res.status_code == 400
    assert "Explicit acknowledgment" in res.json()["detail"]


def test_api_management_ip_check_connectivity():
    """Verify POST /api/management-ip/check-connectivity returns socket test results."""
    with patch.object(ManagementIPService, "check_port_22", return_value=(True, None)):
        res = client.post(
            "/api/management-ip/check-connectivity",
            json={"host": "13.232.202.163", "port": 22}
        )
        assert res.status_code == 200
        data = res.json()
        assert data["reachable"] is True
        assert data["host"] == "13.232.202.163"
