# ==============================================================================
# SOCForge — Terraform Variables
# ==============================================================================

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
