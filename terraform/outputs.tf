# ==============================================================================
# SOCForge — Terraform Outputs
# ==============================================================================
# Provides networking identifiers and CIDR ranges for future infrastructure
# layers (Security Groups, EC2) and Ansible inventory generation.
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
