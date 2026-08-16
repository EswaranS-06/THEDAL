# ==============================================================================
# SOCForge — EC2 Access & SSH Key Pair Management (Phase 3)
# ==============================================================================
# Manages the AWS EC2 Key Pair for Linux bastion and instance administration.
# NOTE: To protect security, private keys are NEVER generated or stored in
# Terraform state. The user generates their key locally and provides the public key.
# ==============================================================================

# ------------------------------------------------------------------------------
# EC2 SSH Key Pair
# ------------------------------------------------------------------------------
# Registers the user's public key in AWS if provided via `var.ssh_public_key`.
resource "aws_key_pair" "main" {
  count      = var.ssh_public_key != "" ? 1 : 0
  key_name   = var.ssh_key_name
  public_key = trimspace(var.ssh_public_key)

  tags = merge(
    local.security_tags,
    {
      Name = "${local.name_prefix}-keypair"
    }
  )
}
