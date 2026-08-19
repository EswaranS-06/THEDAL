"""
THEDAL Control Plane — Security & Guardrail Unit Tests
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.operations import OperationsManager, SecurityValidationError
from app.services.terraform import TerraformService
from app.services.ansible import AnsibleService


@pytest.fixture
def client():
    return TestClient(app)


def test_no_arbitrary_command_endpoint(client):
    """Verify that no arbitrary shell command execution endpoint exists."""
    response = client.post("/api/execute", json={"command": "whoami"})
    assert response.status_code == 404

    response = client.post("/api/run", json={"command": "id"})
    assert response.status_code == 404

    response = client.post("/api/shell", json={"command": "ls"})
    assert response.status_code == 404


def test_destroy_requires_confirmation_and_phrase(client):
    """Verify that terraform destroy rejects requests without confirmation and phrase."""
    # 1. Missing confirmation boolean
    with pytest.raises(SecurityValidationError):
        TerraformService.destroy(confirmation=False, confirmation_phrase="DESTROY THEDAL")

    # 2. Missing phrase
    with pytest.raises(SecurityValidationError):
        TerraformService.destroy(confirmation=True, confirmation_phrase=None)

    # 3. Wrong phrase
    with pytest.raises(SecurityValidationError):
        TerraformService.destroy(confirmation=True, confirmation_phrase="destroy please")

    # 4. API endpoint validation
    res = client.post("/api/terraform/destroy", json={
        "action": "destroy",
        "confirmation": True,
        "confirmation_phrase": "invalid"
    })
    assert res.status_code == 400


def test_apply_requires_confirmation(client):
    """Verify that terraform apply requires explicit confirmation."""
    with pytest.raises(SecurityValidationError):
        TerraformService.apply(confirmation=False)

    res = client.post("/api/terraform/apply", json={
        "action": "apply",
        "confirmation": False
    })
    assert res.status_code == 400


def test_ansible_playbook_allowlist(client):
    """Verify that only pre-approved playbooks can be dispatched."""
    with pytest.raises(SecurityValidationError):
        AnsibleService.run_playbook(playbook_key="malicious-custom.yml", confirmation=True)

    res = client.post("/api/ansible/playbook", json={
        "action": "playbook",
        "target": "malicious_script",
        "confirmation": True
    })
    assert res.status_code == 400


def test_path_traversal_on_logs(client):
    """Verify that path traversal attempts on log retrieval are blocked."""
    with pytest.raises(SecurityValidationError):
        OperationsManager.read_log_file("../../etc/passwd")

    res = client.get("/api/logs/download?file=../../etc/passwd")
    assert res.status_code == 400
