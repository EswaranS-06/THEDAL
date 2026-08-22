# ==============================================================================
# SOCForge — Terraform Outputs
# ==============================================================================
# Provides networking, security, compute, and structured inventory data for
# the Ansible configuration layer.
# ==============================================================================

# ------------------------------------------------------------------------------
# 1. VPC & Networking Outputs
# ------------------------------------------------------------------------------
output "vpc_id" {
  description = "The ID of the provisioned SOCForge VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "The CIDR block allocated to the SOCForge VPC"
  value       = aws_vpc.main.cidr_block
}

output "availability_zone" {
  description = "The single selected AWS Availability Zone hosting all SOCForge subnets"
  value       = local.selected_az
}

output "management_subnet_id" {
  description = "The ID of the public Management subnet"
  value       = aws_subnet.management.id
}

output "management_subnet_cidr" {
  description = "The CIDR block of the public Management subnet"
  value       = aws_subnet.management.cidr_block
}

output "soc_subnet_id" {
  description = "The ID of the private SOC / SIEM subnet"
  value       = aws_subnet.soc.id
}

output "soc_subnet_cidr" {
  description = "The CIDR block of the private SOC / SIEM subnet"
  value       = aws_subnet.soc.cidr_block
}

output "attack_subnet_id" {
  description = "The ID of the private Attack simulation subnet"
  value       = aws_subnet.attack.id
}

output "attack_subnet_cidr" {
  description = "The CIDR block of the private Attack simulation subnet"
  value       = aws_subnet.attack.cidr_block
}

output "web_subnet_id" {
  description = "The ID of the private Target / Web application subnet"
  value       = aws_subnet.web.id
}

output "web_subnet_cidr" {
  description = "The CIDR block of the private Target / Web application subnet"
  value       = aws_subnet.web.cidr_block
}

output "public_route_table_id" {
  description = "The ID of the public route table associated with Management subnet"
  value       = aws_route_table.public.id
}

output "private_route_table_id" {
  description = "The ID of the private route table associated with SOC, Attack, and Web subnets"
  value       = aws_route_table.private.id
}

output "internet_gateway_id" {
  description = "The ID of the Internet Gateway attached to the VPC"
  value       = aws_internet_gateway.igw.id
}

# ------------------------------------------------------------------------------
# 2. Security Groups & IAM Outputs
# ------------------------------------------------------------------------------
output "management_security_group_id" {
  description = "Security group ID for the Management bastion host"
  value       = aws_security_group.management.id
}

output "soc_security_group_id" {
  description = "Security group ID for the Wazuh SIEM server"
  value       = aws_security_group.soc.id
}

output "windows_security_group_id" {
  description = "Security group ID for the Windows employee endpoint"
  value       = aws_security_group.windows.id
}

output "web_security_group_id" {
  description = "Security group ID for the Linux Web target server"
  value       = aws_security_group.web.id
}

output "attack_security_group_id" {
  description = "Security group ID for the Atomic Red Team attack simulation node"
  value       = aws_security_group.attack.id
}

output "ec2_instance_profile_name" {
  description = "Name of the IAM instance profile for SOCForge EC2 instances"
  value       = aws_iam_instance_profile.ec2_profile.name
}

output "ec2_instance_profile_arn" {
  description = "ARN of the IAM instance profile for SOCForge EC2 instances"
  value       = aws_iam_instance_profile.ec2_profile.arn
}

output "ec2_role_arn" {
  description = "ARN of the EC2 base IAM role"
  value       = aws_iam_role.ec2_base_role.arn
}

output "ssh_key_name" {
  description = "Name of the configured SSH key pair for EC2 instances"
  value       = var.ssh_key_name
}

# ------------------------------------------------------------------------------
# 3. EC2 Compute Instance Outputs (Phase 4)
# ------------------------------------------------------------------------------

# Bastion Host
output "bastion_instance_id" {
  description = "EC2 Instance ID for Management Bastion"
  value       = aws_instance.bastion.id
}

output "bastion_private_ip" {
  description = "Private IPv4 address for Management Bastion"
  value       = aws_instance.bastion.private_ip
}

output "bastion_public_ip" {
  description = "Public IPv4 address for Management Bastion (SSH Jumpbox)"
  value       = aws_instance.bastion.public_ip
}

# Wazuh Server
output "wazuh_instance_id" {
  description = "EC2 Instance ID for Wazuh SIEM Server"
  value       = aws_instance.wazuh.id
}

output "wazuh_private_ip" {
  description = "Private IPv4 address for Wazuh SIEM Server"
  value       = aws_instance.wazuh.private_ip
}

output "wazuh_public_ip" {
  description = "Public IPv4 address for Wazuh SIEM Server"
  value       = aws_instance.wazuh.public_ip
}

# Windows Endpoint
output "windows_instance_id" {
  description = "EC2 Instance ID for Windows Employee Endpoint"
  value       = aws_instance.windows.id
}

output "windows_private_ip" {
  description = "Private IPv4 address for Windows Employee Endpoint"
  value       = aws_instance.windows.private_ip
}

# Linux Web Server
output "web_instance_id" {
  description = "EC2 Instance ID for Linux Web Target Server"
  value       = aws_instance.web.id
}

output "web_private_ip" {
  description = "Private IPv4 address for Linux Web Target Server"
  value       = aws_instance.web.private_ip
}

output "web_public_ip" {
  description = "Public IPv4 address for Linux Web Target Server"
  value       = aws_instance.web.public_ip
}

# Attack Node
output "attack_instance_id" {
  description = "EC2 Instance ID for Atomic Red Team Attack Node"
  value       = aws_instance.attack.id
}

output "attack_private_ip" {
  description = "Private IPv4 address for Atomic Red Team Attack Node"
  value       = aws_instance.attack.private_ip
}

# ------------------------------------------------------------------------------
# 4. Structured Ansible Inventory Handoff
# ------------------------------------------------------------------------------
output "ansible_inventory_hosts" {
  description = "Structured inventory metadata used by scripts/generate-inventory.py to generate hosts.ini"
  value = {
    bastion = {
      name       = "bastion"
      os_family  = "linux"
      role       = "bastion"
      private_ip = aws_instance.bastion.private_ip
      public_ip  = aws_instance.bastion.public_ip
      user       = "ubuntu"
    }
    wazuh = {
      name       = "wazuh"
      os_family  = "linux"
      role       = "siem"
      private_ip = aws_instance.wazuh.private_ip
      public_ip  = aws_instance.wazuh.public_ip
      user       = "ubuntu"
    }
    web = {
      name       = "web"
      os_family  = "linux"
      role       = "web-target"
      private_ip = aws_instance.web.private_ip
      public_ip  = aws_instance.web.public_ip
      user       = "ubuntu"
    }
    attack = {
      name       = "attack"
      os_family  = "linux"
      role       = "attacker"
      private_ip = aws_instance.attack.private_ip
      public_ip  = ""
      user       = "ubuntu"
    }
    windows = {
      name       = "windows"
      os_family  = "windows"
      role       = "endpoint"
      private_ip = aws_instance.windows.private_ip
      public_ip  = ""
      user       = "Administrator"
    }
  }
}
