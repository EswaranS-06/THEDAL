# ==============================================================================
# SOCForge — EC2 Compute Infrastructure (Phase 4)
# ==============================================================================
# Provisions the five core virtual machines:
# 1. Management Bastion (Public subnet - SSH Jumpbox)
# 2. Wazuh SIEM Server (Private SOC subnet)
# 3. Windows Employee Endpoint (Private SOC subnet)
# 4. Linux Web Server (Private Web subnet)
# 5. Attack Simulation Node (Private Attack subnet)
# ==============================================================================

# ------------------------------------------------------------------------------
# 1. Dynamic AMI Discovery (x86_64 architecture)
# ------------------------------------------------------------------------------

# Latest Canonical Ubuntu 22.04 LTS (Jammy) for Linux workloads
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  filter {
    name   = "architecture"
    values = ["x86_64"]
  }
}

# Latest Amazon Windows Server 2022 Full Base
data "aws_ami" "windows" {
  most_recent = true
  owners      = ["801119661308"] # Amazon

  filter {
    name   = "name"
    values = ["Windows_Server-2022-English-Full-Base-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  filter {
    name   = "architecture"
    values = ["x86_64"]
  }
}

locals {
  ubuntu_ami_id  = var.ubuntu_ami_id != "" ? var.ubuntu_ami_id : data.aws_ami.ubuntu.id
  windows_ami_id = var.windows_ami_id != "" ? var.windows_ami_id : data.aws_ami.windows.id
  ssh_key_name   = length(aws_key_pair.main) > 0 ? aws_key_pair.main[0].key_name : var.ssh_key_name
}

# ------------------------------------------------------------------------------
# 2. Bastion Host (Management Subnet - Public Access Point)
# ------------------------------------------------------------------------------
resource "aws_instance" "bastion" {
  ami                         = local.ubuntu_ami_id
  instance_type               = var.bastion_instance_type
  subnet_id                   = aws_subnet.management.id
  vpc_security_group_ids      = [aws_security_group.management.id]
  key_name                    = local.ssh_key_name
  iam_instance_profile        = aws_iam_instance_profile.ec2_profile.name
  associate_public_ip_address = true

  root_block_device {
    volume_size           = 20
    volume_type           = "gp3"
    encrypted             = true
    delete_on_termination = true
    tags = merge(
      local.compute_tags,
      {
        Name = "${local.name_prefix}-bastion-root-disk"
      }
    )
  }

  tags = merge(
    local.compute_tags,
    {
      Name = "${local.name_prefix}-bastion"
      Role = "bastion"
    }
  )
}

# ------------------------------------------------------------------------------
# 3. Wazuh SIEM Server (Private SOC Subnet)
# ------------------------------------------------------------------------------
resource "aws_instance" "wazuh" {
  ami                         = local.ubuntu_ami_id
  instance_type               = var.wazuh_instance_type
  subnet_id                   = aws_subnet.soc.id
  vpc_security_group_ids      = [aws_security_group.soc.id]
  key_name                    = local.ssh_key_name
  iam_instance_profile        = aws_iam_instance_profile.ec2_profile.name
  associate_public_ip_address = false

  root_block_device {
    volume_size           = var.wazuh_root_volume_size
    volume_type           = "gp3"
    encrypted             = true
    delete_on_termination = true
    tags = merge(
      local.compute_tags,
      {
        Name = "${local.name_prefix}-wazuh-root-disk"
      }
    )
  }

  tags = merge(
    local.compute_tags,
    {
      Name = "${local.name_prefix}-wazuh"
      Role = "siem"
    }
  )
}

# ------------------------------------------------------------------------------
# 4. Windows Employee Endpoint (Private SOC Subnet)
# ------------------------------------------------------------------------------
resource "aws_instance" "windows" {
  ami                         = local.windows_ami_id
  instance_type               = var.windows_instance_type
  subnet_id                   = aws_subnet.soc.id
  vpc_security_group_ids      = [aws_security_group.windows.id]
  key_name                    = local.ssh_key_name
  iam_instance_profile        = aws_iam_instance_profile.ec2_profile.name
  associate_public_ip_address = false

  user_data = <<-EOF
    <powershell>
    $admin = [adsi]("WinNT://./Administrator, user")
    $admin.SetPassword("SOCForge@2026!Sec")
    $admin.SetInfo()
    Enable-PSRemoting -Force -SkipNetworkProfileCheck
    Set-Item -Path WSMan:\localhost\Service\Auth\Basic -Value $true
    Set-Item -Path WSMan:\localhost\Service\Auth\Negotiate -Value $true
    Set-Item -Path WSMan:\localhost\Service\AllowUnencrypted -Value $true
    New-NetFirewallRule -Name "WinRM-HTTP" -DisplayName "WinRM HTTP" -Enabled True -Direction Inbound -Protocol TCP -LocalPort 5985 -Action Allow
    New-NetFirewallRule -Name "WinRM-HTTPS" -DisplayName "WinRM HTTPS" -Enabled True -Direction Inbound -Protocol TCP -LocalPort 5986 -Action Allow
    Restart-Service WinRM
    </powershell>
  EOF

  root_block_device {
    volume_size           = 50
    volume_type           = "gp3"
    encrypted             = true
    delete_on_termination = true
    tags = merge(
      local.compute_tags,
      {
        Name = "${local.name_prefix}-windows-root-disk"
      }
    )
  }

  tags = merge(
    local.compute_tags,
    {
      Name = "${local.name_prefix}-windows"
      Role = "endpoint"
    }
  )
}

# ------------------------------------------------------------------------------
# 5. Linux Web Target Server (Private Web Subnet)
# ------------------------------------------------------------------------------
resource "aws_instance" "web" {
  ami                         = local.ubuntu_ami_id
  instance_type               = var.web_instance_type
  subnet_id                   = aws_subnet.web.id
  vpc_security_group_ids      = [aws_security_group.web.id]
  key_name                    = local.ssh_key_name
  iam_instance_profile        = aws_iam_instance_profile.ec2_profile.name
  associate_public_ip_address = false

  root_block_device {
    volume_size           = 20
    volume_type           = "gp3"
    encrypted             = true
    delete_on_termination = true
    tags = merge(
      local.compute_tags,
      {
        Name = "${local.name_prefix}-web-root-disk"
      }
    )
  }

  tags = merge(
    local.compute_tags,
    {
      Name = "${local.name_prefix}-web"
      Role = "web-target"
    }
  )
}

# ------------------------------------------------------------------------------
# 6. Attack Simulation Host (Private Attack Subnet)
# ------------------------------------------------------------------------------
resource "aws_instance" "attack" {
  ami                         = local.ubuntu_ami_id
  instance_type               = var.attack_instance_type
  subnet_id                   = aws_subnet.attack.id
  vpc_security_group_ids      = [aws_security_group.attack.id]
  key_name                    = local.ssh_key_name
  iam_instance_profile        = aws_iam_instance_profile.ec2_profile.name
  associate_public_ip_address = false

  root_block_device {
    volume_size           = 20
    volume_type           = "gp3"
    encrypted             = true
    delete_on_termination = true
    tags = merge(
      local.compute_tags,
      {
        Name = "${local.name_prefix}-attack-root-disk"
      }
    )
  }

  tags = merge(
    local.compute_tags,
    {
      Name = "${local.name_prefix}-attack"
      Role = "attacker"
    }
  )
}
