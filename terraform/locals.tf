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

  # Common resource tags specific to the networking component
  networking_tags = {
    Component = "networking"
  }

  # Standardized resource name prefix
  name_prefix = var.project_name
}
