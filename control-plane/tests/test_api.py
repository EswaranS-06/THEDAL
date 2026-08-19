"""
THEDAL Control Plane — API & Page Route Unit Tests
"""

import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app
from app.models import EC2InstanceInfo, NetworkTopology


@pytest.fixture
def client():
    # Mock AWSService and TerraformService for fast and isolated unit tests
    with patch("app.services.aws.AWSService.get_connection_status") as mock_aws, \
         patch("app.services.aws.AWSService.get_instances") as mock_inst, \
         patch("app.services.aws.AWSService.get_network_topology") as mock_net, \
         patch("app.services.terraform.TerraformService.get_status") as mock_tf, \
         patch("app.services.terraform.TerraformService.get_outputs") as mock_out, \
         patch("app.services.terraform.TerraformService.get_version") as mock_ver:

        mock_aws.return_value = {
            "connected": True,
            "account": "123***789",
            "arn": "arn:aws:iam::123456789012:user/tester",
            "region": "ap-south-1",
            "error": None
        }

        mock_inst.return_value = [
            EC2InstanceInfo(
                name="THEDAL-wazuh",
                instance_id="i-0123456789abcdef0",
                instance_type="t3.xlarge",
                state="running",
                private_ip="10.10.10.33",
                public_ip=None,
                role="SIEM Manager",
                availability_zone="ap-south-1a",
                health="PASS"
            )
        ]

        mock_net.return_value = NetworkTopology(
            vpc_id="vpc-0123456789abcdef0",
            vpc_cidr="10.10.0.0/16",
            subnets=[{"id": "subnet-1", "name": "SOC Subnet", "cidr": "10.10.10.0/24", "is_public": False}],
            nat_gateway_present=False
        )

        mock_tf.return_value = {
            "status": "DEPLOYED",
            "resource_count": 25,
            "message": "Environment deployed"
        }

        mock_out.return_value = {
            "bastion_public_ip": "13.201.43.138",
            "wazuh_private_ip": "10.10.10.33"
        }

        mock_ver.return_value = "1.5.7"

        yield TestClient(app)


def test_page_dashboard(client):
    res = client.get("/")
    assert res.status_code == 200
    assert "Operations Overview" in res.text or "THEDAL Control Plane" in res.text


def test_page_resources(client):
    res = client.get("/resources")
    assert res.status_code == 200
    assert "EC2 Virtual Machine Fleet" in res.text


def test_page_operations(client):
    res = client.get("/operations")
    assert res.status_code == 200
    assert "Operations & Automation Console" in res.text


def test_page_learning(client):
    res = client.get("/learning")
    assert res.status_code == 200
    assert "SOC Analyst Learning Path" in res.text


def test_page_lab_view(client):
    res = client.get("/learning/lab/01-first-alert")
    assert res.status_code == 200
    assert "Your First Wazuh Alert" in res.text


def test_page_logs(client):
    res = client.get("/logs")
    assert res.status_code == 200
    assert "Operation Audit Logs" in res.text


def test_page_settings(client):
    res = client.get("/settings")
    assert res.status_code == 200
    assert "Control Plane Settings" in res.text


def test_api_status(client):
    res = client.get("/api/status")
    assert res.status_code == 200
    data = res.json()
    assert "aws_connected" in data
    assert "terraform_status" in data
    assert "environment_health" in data


def test_api_health(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert "overall_status" in data
    assert "checks" in data
    assert isinstance(data["checks"], list)


def test_api_learning_progress_and_stats(client):
    res = client.post("/api/learning/progress", json={
        "lab_id": "01-first-alert",
        "status": "In Progress",
        "notes": "Testing notes persistence"
    })
    assert res.status_code == 200
    assert res.json().get("success") is True

    stats_res = client.get("/api/learning/stats")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert "total_labs" in stats
    assert stats["total_labs"] > 0


def test_api_commands_dynamic(client):
    res = client.get("/api/commands/dynamic")
    assert res.status_code == 200
    cmds = res.json()
    assert isinstance(cmds, list)
    assert len(cmds) > 0
    assert any(c["id"] == "bastion-ssh" for c in cmds)


def test_api_aws_profiles(client):
    res = client.get("/api/aws/profiles")
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_api_safety_autostop(client):
    get_res = client.get("/api/safety/autostop")
    assert get_res.status_code == 200
    assert "enabled" in get_res.json()

    post_res = client.post("/api/safety/autostop", json={
        "enabled": True,
        "grace_period_minutes": 30
    })
    assert post_res.status_code == 200
    assert post_res.json()["enabled"] is True
    assert post_res.json()["grace_period_minutes"] == 30


def test_api_ssh_ensure_key(client):
    res = client.post("/api/ssh/ensure-key")
    assert res.status_code == 200
    assert "exists" in res.json()


def test_api_infrastructure_host_detail(client):
    res = client.get("/api/infrastructure/hosts/bastion")
    assert res.status_code == 200
    data = res.json()
    assert data["key"] == "bastion"
    assert "services" in data
    assert len(data["services"]) > 0

    not_found = client.get("/api/infrastructure/hosts/nonexistent")
    assert not_found.status_code == 404


def test_api_learning_catalog_and_search(client):
    labs_res = client.get("/api/learning/labs")
    assert labs_res.status_code == 200
    labs_data = labs_res.json()
    assert "labs" in labs_data
    assert len(labs_data["labs"]) >= 14

    detail_res = client.get("/api/learning/labs/01-first-alert")
    assert detail_res.status_code == 200
    assert "rendered_html" in detail_res.json()

    challenges_res = client.get("/api/learning/challenges")
    assert challenges_res.status_code == 200
    assert len(challenges_res.json()["challenges"]) >= 3

    challenge_detail = client.get("/api/learning/challenges/challenge-01")
    assert challenge_detail.status_code == 200
    assert "rendered_html" in challenge_detail.json()

    sol_res = client.get("/api/learning/challenges/challenge-01/solution")
    assert sol_res.status_code == 200
    assert "solution_html" in sol_res.json()

    search_res = client.get("/api/learning/search?q=Sysmon")
    assert search_res.status_code == 200
    assert len(search_res.json()["results"]) > 0


def test_api_operations_list_and_config(client):
    ops_res = client.get("/api/operations/list")
    assert ops_res.status_code == 200
    assert "logs" in ops_res.json()

    cfg_res = client.get("/api/settings/config")
    assert cfg_res.status_code == 200
    cfg = cfg_res.json()
    assert "app_name" in cfg
    assert "aws_region" in cfg
    assert "autostop" in cfg

