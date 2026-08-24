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
# Static Private IPv4 Addresses
# ------------------------------------------------------------------------------
variable "bastion_private_ip" {
  type        = string
  description = "Static internal private IPv4 address for the Management Bastion host"
  default     = "10.10.1.10"
}

variable "wazuh_private_ip" {
  type        = string
  description = "Static internal private IPv4 address for the Wazuh SIEM server"
  default     = "10.10.10.10"
}

variable "windows_private_ip" {
  type        = string
  description = "Static internal private IPv4 address for the Windows employee endpoint"
  default     = "10.10.10.20"
}

variable "attack_private_ip" {
  type        = string
  description = "Static internal private IPv4 address for the Atomic Red Team attack simulation node"
  default     = "10.10.20.10"
}

variable "web_private_ip" {
  type        = string
  description = "Static internal private IPv4 address for the Linux Web target server"
  default     = "10.10.30.10"
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

# ------------------------------------------------------------------------------
# Compute & Sizing Variables (Phase 4)
# ------------------------------------------------------------------------------
variable "bastion_instance_type" {
  type        = string
  description = "EC2 instance type for the Management Bastion host"
  default     = "t3.micro"
}

variable "wazuh_instance_type" {
  type        = string
  description = "EC2 instance type for the Wazuh SIEM server (t3.medium minimum for 1-25 agents; t3.xlarge for standard production)"
  default     = "t3.medium"
}

variable "windows_instance_type" {
  type        = string
  description = "EC2 instance type for the Windows employee endpoint (t3.medium recommended for Windows Server)"
  default     = "t3.medium"
}

variable "web_instance_type" {
  type        = string
  description = "EC2 instance type for the Linux Web server (Nginx + DVWA + Juice Shop Docker)"
  default     = "t3.small"
}

variable "attack_instance_type" {
  type        = string
  description = "EC2 instance type for the Atomic Red Team attack simulation node"
  default     = "t3.micro"
}

variable "wazuh_root_volume_size" {
  type        = number
  description = "Root EBS storage size in GB for the Wazuh SIEM server (requires more storage for index retention)"
  default     = 50
}

variable "ubuntu_ami_id" {
  type        = string
  description = "Optional custom AMI ID for Ubuntu instances. If empty, latest Ubuntu 22.04 LTS AMI is queried dynamically."
  default     = ""
}

variable "windows_ami_id" {
  type        = string
  description = "Optional custom AMI ID for Windows instance. If empty, latest Windows Server 2022 Base AMI is queried dynamically."
  default     = ""
}
