# ==============================================================================
# SOCForge — AWS Provider Configuration
# ==============================================================================
# Authenticates using standard AWS credential resolution (AWS CLI, env vars,
# IAM roles). No static credentials are hard-coded.
# ==============================================================================

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}
