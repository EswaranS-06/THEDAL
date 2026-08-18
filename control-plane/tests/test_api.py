"""
SOCForge Control Plane — API & Page Route Unit Tests
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
                name="SOCForge-wazuh",
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
    assert "SOCForge Control Center" in res.text


def test_page_resources(client):
    res = client.get("/resources")
    assert res.status_code == 200
    assert "EC2 Virtual Machine Fleet" in res.text


def test_page_operations(client):
    res = client.get("/operations")
    assert res.status_code == 200
    assert "Operations & Automation Console" in res.text


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
