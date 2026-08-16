# ==============================================================================
# SOCForge — Terraform Variables
# ==============================================================================

# ------------------------------------------------------------------------------
# Provider & Environment Variables
# ------------------------------------------------------------------------------
variable "aws_region" {
  type        = string
  description = "Target AWS region for deploying the SOCForge VPC and networking resources"
  default     = "ap-south-1"
}

variable "project_name" {
  type        = string
  description = "Project name identifier used in resource naming and tags"
  default     = "SOCForge"
}

variable "environment" {
  type        = string
  description = "Deployment environment tag (e.g. lab, dev, prod)"
  default     = "lab"
}

# ------------------------------------------------------------------------------
# Network CIDR Blocks
# ------------------------------------------------------------------------------
variable "vpc_cidr" {
  type        = string
  description = "IPv4 CIDR block for the dedicated SOCForge VPC"
  default     = "10.10.0.0/16"
}

variable "management_subnet_cidr" {
  type        = string
  description = "IPv4 CIDR block for the public Management subnet"
  default     = "10.10.1.0/24"
}

variable "soc_subnet_cidr" {
  type        = string
  description = "IPv4 CIDR block for the private SOC / SIEM subnet"
  default     = "10.10.10.0/24"
}

variable "attack_subnet_cidr" {
  type        = string
  description = "IPv4 CIDR block for the private Attack simulation subnet"
  default     = "10.10.20.0/24"
}

variable "web_subnet_cidr" {
  type        = string
  description = "IPv4 CIDR block for the private Target / Web application subnet"
  default     = "10.10.30.0/24"
}

# ------------------------------------------------------------------------------
# Access Control & Security Variables (Phase 3)
# ------------------------------------------------------------------------------
variable "admin_cidr" {
  type        = string
  description = "IPv4 CIDR block allowed for administrative ingress (SSH/RDP/HTTPS). Must be restricted to operator public IP (e.g. 203.0.113.50/32). Never set to 0.0.0.0/0 in production."
  default     = "127.0.0.1/32"
}

variable "ssh_key_name" {
  type        = string
  description = "Name of the EC2 Key Pair registered in AWS for SSH access to Linux instances"
  default     = "SOCForge-key"
}

variable "ssh_public_key" {
  type        = string
  description = "Public key material for the EC2 SSH Key Pair (e.g. 'ssh-ed25519 AAAA...'). If provided, Terraform registers the key pair in AWS."
  default     = ""
}
