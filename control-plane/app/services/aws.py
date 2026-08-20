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

    @classmethod
    def get_host_detail(cls, host_key: str) -> Optional[Dict[str, Any]]:
        """Retrieves rich host telemetry, running services, and direct commands."""
        instances = cls.get_instances()
        target_inst = None
        hk_clean = host_key.lower().replace("thedal-", "").replace("thedal_", "").replace("socforge-", "").replace("socforge_", "")

        for inst in instances:
            curr_clean = inst.name.lower().replace("thedal-", "").replace("thedal_", "").replace("socforge-", "").replace("socforge_", "")
            if curr_clean == hk_clean or inst.name.lower() == host_key.lower():
                target_inst = inst
                break

        service_profiles = {
            "bastion": {
                "role_title": "Public Jumpbox & Forward Proxy",
                "os": "Ubuntu 22.04 LTS (Jammy Jellyfish)",
                "purpose": "Secure SSH ingress boundary and forward proxy for private subnet package downloads.",
                "services": [
                    {"name": "OpenSSH Server", "port": 22, "status": "Active / Listening", "type": "System Service"},
                    {"name": "Squid HTTP Proxy", "port": 3128, "status": "Active / Forwarding", "type": "Proxy Service"},
                    {"name": "UFW Firewall", "port": "N/A", "status": "Active / Enforced", "type": "Security Boundary"}
                ]
            },
            "wazuh": {
                "role_title": "SIEM Manager, Indexer & Dashboard",
                "os": "Ubuntu 22.04 LTS (Jammy Jellyfish)",
                "purpose": "Centralized log ingestion, real-time detection rule evaluation, and OpenSearch analytical indexer.",
                "services": [
                    {"name": "Wazuh Manager (wazuh-remoted)", "port": 1514, "status": "Active / Listening", "type": "Agent Ingestion"},
                    {"name": "Wazuh REST API", "port": 55000, "status": "Active / Authenticated", "type": "Management API"},
                    {"name": "Wazuh Indexer (OpenSearch)", "port": 9200, "status": "Active / Cluster Green", "type": "Search Backend"},
                    {"name": "Wazuh Dashboard", "port": 443, "status": "Active / Web UI", "type": "Analytics Portal"},
                    {"name": "Filebeat Forwarder", "port": "Local", "status": "Active / Streaming", "type": "Log Shipper"}
                ]
            },
            "windows": {
                "role_title": "Windows Server 2022 Endpoint (Sysmon)",
                "os": "Microsoft Windows Server 2022 Datacenter",
                "purpose": "Target Windows endpoint instrumented with Sysmon and PowerShell ScriptBlock logging for threat detection.",
                "services": [
                    {"name": "Sysmon (System Monitor)", "port": "EventLog", "status": "Active / Driver Loaded", "type": "Kernel Telemetry"},
                    {"name": "Wazuh Windows Agent", "port": "Agent Channel", "status": "Active / Connected", "type": "Log Shipper"},
                    {"name": "WinRM (Windows Remote Mgmt)", "port": 5986, "status": "Active / HTTPS", "type": "Remote Management"},
                    {"name": "PowerShell 5.1 / 7.x", "port": "N/A", "status": "Active / Auditing", "type": "Runtime Environment"}
                ]
            },
            "web": {
                "role_title": "Linux Web Target (Nginx, DVWA, Juice Shop)",
                "os": "Ubuntu 22.04 LTS (Jammy Jellyfish)",
                "purpose": "Multi-tier vulnerable web application host for AppSec telemetry analysis and auditd correlation.",
                "services": [
                    {"name": "Nginx Web Server", "port": 80, "status": "Active / Reverse Proxy", "type": "Web Server"},
                    {"name": "DVWA (Damn Vulnerable Web App)", "port": 80, "status": "Active / PHP-FPM", "type": "Vulnerable App"},
                    {"name": "OWASP Juice Shop (Docker)", "port": 3000, "status": "Active / Container", "type": "Modern Web App"},
                    {"name": "MariaDB SQL Database", "port": 3306, "status": "Active / Localhost", "type": "Database Backend"},
                    {"name": "Linux Auditd", "port": "Kernel", "status": "Active / Rules Loaded", "type": "System Audit"},
                    {"name": "Wazuh Linux Agent", "port": "Agent Channel", "status": "Active / Connected", "type": "Log Shipper"}
                ]
            },
            "attack": {
                "role_title": "Adversary Emulation Engine (Atomic Red Team)",
                "os": "Ubuntu 22.04 LTS (Jammy Jellyfish)",
                "purpose": "Attack platform loaded with Atomic Red Team test suites, PowerShell attack tools, and network probing utilities.",
                "services": [
                    {"name": "Atomic Red Team (Invoke-Atomic)", "port": "CLI", "status": "Installed / Ready", "type": "Attack Emulation"},
                    {"name": "PowerShell for Linux", "port": "CLI", "status": "Active", "type": "Execution Engine"},
                    {"name": "SQLMap / Curl / Nmap", "port": "CLI", "status": "Installed / Ready", "type": "Security Tooling"},
                    {"name": "Wazuh Linux Agent", "port": "Agent Channel", "status": "Active / Connected", "type": "Log Shipper"}
                ]
            }
        }

        if hk_clean not in service_profiles and not target_inst:
            return None

        profile = service_profiles.get(hk_clean, {
            "role_title": "THEDAL Managed Node",
            "os": "Linux / Windows",
            "purpose": "THEDAL Lab node for security exploration and telemetry analysis.",
            "services": []
        })

        if not target_inst:
            # Return template data if instance not in AWS yet
            return {
                "key": hk_clean,
                "name": f"thedal-{hk_clean}",
                "role": profile["role_title"],
                "state": "stopped",
                "instance_id": "i-unprovisioned",
                "instance_type": "t3.medium" if hk_clean in ["wazuh", "windows"] else "t3.small" if hk_clean == "web" else "t3.micro",
                "private_ip": "10.10.x.x",
                "public_ip": None,
                "health": "UNKNOWN",
                "os": profile["os"],
                "purpose": profile["purpose"],
                "services": profile["services"]
            }

        return {
            "key": hk_clean,
            "name": target_inst.name,
            "role": target_inst.role,
            "state": target_inst.state,
            "instance_id": target_inst.instance_id,
            "instance_type": target_inst.instance_type,
            "private_ip": target_inst.private_ip,
            "public_ip": target_inst.public_ip,
            "availability_zone": target_inst.availability_zone,
            "health": target_inst.health,
            "os": profile["os"],
            "purpose": profile["purpose"],
            "services": profile["services"]
        }

    @classmethod
    def get_bastion_ingress_cidrs(cls) -> List[str]:
        """Retrieves active authorized ingress CIDRs for SSH (port 22) on the Management Bastion Security Group."""
        try:
            ec2 = cls.get_client("ec2")
            response = ec2.describe_security_groups(
                Filters=[
                    {"Name": "tag:Project", "Values": ["THEDAL", "thedal", "SOCForge", "socforge"]}
                ]
            )
            cidrs = []
            for sg in response.get("SecurityGroups", []):
                sg_name = sg.get("GroupName", "").lower()
                if "management" in sg_name or "bastion" in sg_name:
                    for rule in sg.get("IpPermissions", []):
                        from_port = rule.get("FromPort")
                        to_port = rule.get("ToPort")
                        ip_proto = rule.get("IpProtocol")
                        if ip_proto in ("tcp", "-1") and (from_port is None or (from_port <= 22 and to_port >= 22)):
                            for ip_range in rule.get("IpRanges", []):
                                cidr = ip_range.get("CidrIp")
                                if cidr and cidr not in cidrs:
                                    cidrs.append(cidr)
            return cidrs
        except Exception:
            return []
