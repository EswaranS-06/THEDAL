# ==============================================================================
# SOCForge — Local Values & Data Sources
# ==============================================================================

# Query available Availability Zones dynamically in the configured AWS region.
# This avoids hardcoding AZ names (e.g. ap-south-1a) which vary across AWS accounts.
data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  # Single Availability Zone selection for Phase 2:
  # Using a single AZ minimizes complexity, eliminates cross-AZ data transfer fees,
  # and keeps infrastructure lean for security training exercises.
  selected_az = data.aws_availability_zones.available.names[0]

  # Common resource tags specific to functional components
  networking_tags = {
    Component = "networking"
  }

  security_tags = {
    Component = "security"
  }

  iam_tags = {
    Component = "iam"
  }

  # Standardized resource name prefix
  name_prefix = var.project_name
}
