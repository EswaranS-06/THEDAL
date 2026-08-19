"""
THEDAL Control Plane — AWS Read & Safe Lifecycle Service
"""

import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from typing import Dict, Any, List, Optional

from app.config import settings
from app.models import EC2InstanceInfo, NetworkTopology


class AWSService:
    """
    Manages AWS SDK operations strictly for READ queries and safe EC2 start/stop actions.
    NEVER deletes or terminates resources directly (Terraform manages destruction).
    """

    @classmethod
    def get_client(cls, service_name: str, region_name: Optional[str] = None):
        region = region_name or settings.AWS_DEFAULT_REGION
        return boto3.client(service_name, region_name=region)

    @classmethod
    def get_connection_status(cls) -> Dict[str, Any]:
        """Validates AWS authentication using the local credential chain."""
        try:
            sts = cls.get_client("sts")
            identity = sts.get_caller_identity()
            account = identity.get("Account", "Unknown")
            masked_account = f"{account[:3]}***{account[-3:]}" if len(account) >= 6 else account

            return {
                "connected": True,
                "account": masked_account,
                "arn": identity.get("Arn", "Unknown"),
                "region": settings.AWS_DEFAULT_REGION,
                "error": None
            }
        except (NoCredentialsError, ClientError) as e:
            return {
                "connected": False,
                "account": None,
                "arn": None,
                "region": settings.AWS_DEFAULT_REGION,
                "error": str(e)
            }
        except Exception as e:
            return {
                "connected": False,
                "account": None,
                "arn": None,
                "region": settings.AWS_DEFAULT_REGION,
                "error": str(e)
            }

    @classmethod
    def get_instances(cls) -> List[EC2InstanceInfo]:
        """Retrieves live instance status for THEDAL instances (with SOCForge legacy support)."""
        instances = []
        try:
            ec2 = cls.get_client("ec2")
            # Query instances tagged with Project=THEDAL or SOCForge
            response = ec2.describe_instances(
                Filters=[
                    {"Name": "tag:Project", "Values": ["THEDAL", "thedal", "SOCForge", "socforge"]}
                ]
            )

            role_mapping = {
                "bastion": "Public Jumpbox & Forward Proxy",
                "wazuh": "SIEM Manager, Indexer & Dashboard",
                "windows": "Windows Server 2022 Endpoint (Sysmon)",
                "web": "Linux Web Target (Nginx, DVWA, Juice Shop)",
                "attack": "Adversary Emulation Engine (Atomic Red Team)"
            }

            for reservation in response.get("Reservations", []):
                for inst in reservation.get("Instances", []):
                    # Skip terminated instances
                    if inst.get("State", {}).get("Name") == "terminated":
                        continue

                    name = "Unknown"
                    for tag in inst.get("Tags", []):
                        if tag.get("Key") == "Name":
                            name = tag.get("Value", "Unknown")
                            break

                    role_key = name.lower().replace("thedal-", "").replace("thedal_", "").replace("socforge-", "").replace("socforge_", "")
                    role = role_mapping.get(role_key, "THEDAL Lab Node")
                    state_name = inst.get("State", {}).get("Name", "unknown")

                    health = "PASS" if state_name == "running" else "WARNING" if state_name == "stopped" else "UNKNOWN"

                    instances.append(EC2InstanceInfo(
                        name=name,
                        instance_id=inst.get("InstanceId", ""),
                        instance_type=inst.get("InstanceType", ""),
                        state=state_name,
                        private_ip=inst.get("PrivateIpAddress", "N/A"),
                        public_ip=inst.get("PublicIpAddress"),
                        role=role,
                        availability_zone=inst.get("Placement", {}).get("AvailabilityZone", ""),
                        health=health
                    ))

        except Exception:
            pass

        return instances

    @classmethod
    def get_network_topology(cls) -> NetworkTopology:
        """Retrieves VPC and subnet details."""
        try:
            ec2 = cls.get_client("ec2")
            vpcs = ec2.describe_vpcs(
                Filters=[{"Name": "tag:Project", "Values": ["THEDAL", "thedal", "SOCForge", "socforge"]}]
            ).get("Vpcs", [])

            if not vpcs:
                return NetworkTopology()

            vpc = vpcs[0]
            vpc_id = vpc.get("VpcId")
            cidr = vpc.get("CidrBlock", "10.10.0.0/16")

            subnets_resp = ec2.describe_subnets(
                Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
            ).get("Subnets", [])

            subnets = []
            for s in subnets_resp:
                s_name = "Subnet"
                for t in s.get("Tags", []):
                    if t.get("Key") == "Name":
                        s_name = t.get("Value")
                subnets.append({
                    "id": s.get("SubnetId"),
                    "name": s_name,
                    "cidr": s.get("CidrBlock"),
                    "az": s.get("AvailabilityZone"),
                    "is_public": s.get("MapPublicIpOnLaunch", False)
                })

            return NetworkTopology(
                vpc_id=vpc_id,
                vpc_cidr=cidr,
                subnets=subnets,
                nat_gateway_present=False
            )
        except Exception:
            return NetworkTopology()

    @classmethod
    def start_instances(cls, instance_ids: Optional[List[str]] = None) -> Dict[str, Any]:
        """Starts stopped EC2 instances using the AWS API."""
        try:
            ec2 = cls.get_client("ec2")
            if not instance_ids:
                # Find all stopped THEDAL instances
                instances = cls.get_instances()
                instance_ids = [i.instance_id for i in instances if i.state == "stopped"]

            if not instance_ids:
                return {"success": True, "message": "No stopped instances found to start."}

            ec2.start_instances(InstanceIds=instance_ids)
            return {
                "success": True,
                "message": f"Successfully initiated start for {len(instance_ids)} instance(s): {', '.join(instance_ids)}"
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    @classmethod
    def stop_instances(cls, instance_ids: Optional[List[str]] = None) -> Dict[str, Any]:
        """Stops running EC2 instances safely (preserves EBS state)."""
        try:
            ec2 = cls.get_client("ec2")
            if not instance_ids:
                # Find all running THEDAL instances
                instances = cls.get_instances()
                instance_ids = [i.instance_id for i in instances if i.state == "running"]

            if not instance_ids:
                return {"success": True, "message": "No running instances found to stop."}

            ec2.stop_instances(InstanceIds=instance_ids)
            return {
                "success": True,
                "message": f"Successfully initiated stop for {len(instance_ids)} instance(s): {', '.join(instance_ids)}"
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
