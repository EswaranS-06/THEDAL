"""
Tests for THEDAL Lab Simulation Engine & Security Controls
==========================================================
Verifies allowlisted adversary threat execution, arbitrary command rejection,
simulation catalog completeness, and API endpoints.
"""

import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from pathlib import Path

from app.main import app
from app.services.simulations import SimulationService
from app.services.operations import SecurityValidationError


client = TestClient(app)


def test_simulation_catalog():
    """Verify SimulationService catalog returns expected allowlisted suites."""
    catalog = SimulationService.get_catalog()
    assert "atomic_tests" in catalog
    assert "web_scenarios" in catalog
    assert "baseline_events" in catalog

    atomic_techs = [t["technique"] for t in catalog["atomic_tests"]]
    assert "T1082" in atomic_techs
    assert "T1059.001" in atomic_techs
    assert "T1003.001" in atomic_techs

    web_scenarios = [s["scenario"] for s in catalog["web_scenarios"]]
    assert "DVWA-SQLI" in web_scenarios
    assert "JUICESHOP-AUTH" in web_scenarios


def test_arbitrary_technique_rejection():
    """Verify SimulationService rejects unapproved techniques and command injection attempts."""
    with pytest.raises(SecurityValidationError) as excinfo:
        SimulationService.run_simulation("atomic", "T9999_UNKNOWN", confirm=True)
    assert "Invalid or unapproved" in str(excinfo.value)

    with pytest.raises(SecurityValidationError) as excinfo:
        SimulationService.run_simulation("atomic", "; rm -rf / ;", confirm=True)
    assert "Invalid or unapproved" in str(excinfo.value)

    with pytest.raises(SecurityValidationError) as excinfo:
        SimulationService.run_simulation("web", "MALICIOUS_CUSTOM", confirm=True)
    assert "Invalid or unapproved" in str(excinfo.value)


def test_simulation_requires_confirmation():
    """Verify simulations reject execution without explicit confirmation."""
    with pytest.raises(SecurityValidationError) as excinfo:
        SimulationService.run_simulation("atomic", "T1082", confirm=False)
    assert "Confirmation is required" in str(excinfo.value)


def test_simulation_execution_mocked():
    """Verify run_simulation executes SSH wrapper cleanly when confirmed."""
    with patch("app.services.aws.AWSService.get_instances") as mock_inst, \
         patch("app.services.operations.OperationsManager.run_command") as mock_cmd:

        mock_bastion = MagicMock()
        mock_bastion.name = "SOCForge-bastion"
        mock_bastion.state = "running"
        mock_bastion.public_ip = "13.232.202.163"

        mock_attack = MagicMock()
        mock_attack.name = "SOCForge-attack"
        mock_attack.state = "running"
        mock_attack.private_ip = "10.10.20.114"

        mock_inst.return_value = [mock_bastion, mock_attack]
        mock_cmd.return_value = (0, "Simulated T1082 command output", Path("/tmp/sim.log"))

        result = SimulationService.run_simulation("atomic", "T1082", confirm=True)
        assert result["status"] == "COMPLETED"
        assert result["identifier"] == "T1082"
        assert result["simulation_id"].startswith("sim-")


def test_api_simulations_catalog_endpoint():
    """Verify GET /api/simulations/catalog endpoint."""
    res = client.get("/api/simulations/catalog")
    assert res.status_code == 200
    data = res.json()
    assert len(data["atomic_tests"]) > 0


def test_api_simulations_run_validation():
    """Verify POST /api/simulations/run returns HTTP 400 on unapproved payloads."""
    res = client.post(
        "/api/simulations/run",
        json={"simulation_type": "atomic", "identifier": "INVALID_TECHNIQUE", "confirmation": True}
    )
    assert res.status_code == 400
    assert "Invalid or unapproved" in res.json()["detail"]
