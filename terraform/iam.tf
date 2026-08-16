# ==============================================================================
# SOCForge — IAM Roles & Instance Profiles (Phase 3)
# ==============================================================================
# Provides least-privilege IAM roles and instance profiles for EC2 instances
# to enable Systems Manager (SSM) agent management and CloudWatch metrics.
# ==============================================================================

# ------------------------------------------------------------------------------
# 1. EC2 Base IAM Role
# ------------------------------------------------------------------------------
resource "aws_iam_role" "ec2_base_role" {
  name        = "${local.name_prefix}-ec2-base-role"
  description = "Base IAM role for SOCForge EC2 instances with SSM and CloudWatch capability"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(
    local.iam_tags,
    {
      Name = "${local.name_prefix}-ec2-base-role"
    }
  )
}

# ------------------------------------------------------------------------------
# 2. Attach AWS Managed Policy: AmazonSSMManagedInstanceCore
# ------------------------------------------------------------------------------
# Enables AWS Systems Manager core functionality for remote session management,
# inventory collection, and secure command execution without opening inbound ports.
resource "aws_iam_role_policy_attachment" "ssm_core" {
  role       = aws_iam_role.ec2_base_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# ------------------------------------------------------------------------------
# 3. Custom CloudWatch Telemetry Policy (Least Privilege)
# ------------------------------------------------------------------------------
resource "aws_iam_policy" "cloudwatch_telemetry" {
  name        = "${local.name_prefix}-ec2-cloudwatch-policy"
  description = "Allows SOCForge instances to push metrics and logs to CloudWatch"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "*"
      }
    ]
  })

  tags = merge(
    local.iam_tags,
    {
      Name = "${local.name_prefix}-ec2-cloudwatch-policy"
    }
  )
}

resource "aws_iam_role_policy_attachment" "cloudwatch_attach" {
  role       = aws_iam_role.ec2_base_role.name
  policy_arn = aws_iam_policy.cloudwatch_telemetry.arn
}

# ------------------------------------------------------------------------------
# 4. IAM Instance Profile
# ------------------------------------------------------------------------------
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${local.name_prefix}-ec2-instance-profile"
  role = aws_iam_role.ec2_base_role.name

  tags = merge(
    local.iam_tags,
    {
      Name = "${local.name_prefix}-ec2-instance-profile"
    }
  )
}
