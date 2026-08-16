# ==============================================================================
# SOCForge — Terraform Outputs
# ==============================================================================
# Provides networking, security group, and IAM identifiers for future
# infrastructure layers (EC2 instances) and Ansible dynamic inventory generation.
# ==============================================================================

# ------------------------------------------------------------------------------
# VPC Outputs
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

# ------------------------------------------------------------------------------
# Subnet Outputs
# ------------------------------------------------------------------------------
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

# ------------------------------------------------------------------------------
# Routing & Gateway Outputs
# ------------------------------------------------------------------------------
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
# Security Group Outputs (Phase 3)
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

# ------------------------------------------------------------------------------
# IAM & Access Outputs (Phase 3)
# ------------------------------------------------------------------------------
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
