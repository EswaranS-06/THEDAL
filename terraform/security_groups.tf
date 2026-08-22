# ==============================================================================
# SOCForge — Security Groups & Access Control (Phase 3)
# ==============================================================================
# Implements least-privilege stateful firewall rules connecting management,
# SIEM, endpoints, web targets, and attack simulation hosts.
# ==============================================================================

# ------------------------------------------------------------------------------
# 1. Management Security Group (Bastion / Jumpbox Host)
# ------------------------------------------------------------------------------
resource "aws_security_group" "management" {
  name        = "${local.name_prefix}-management-sg"
  description = "Controlled operator management ingress and bastion jumpbox access"
  vpc_id      = aws_vpc.main.id

  tags = merge(
    local.security_tags,
    {
      Name = "${local.name_prefix}-management-sg"
    }
  )
}

# Ingress: SSH from authorized administrator IP only
resource "aws_security_group_rule" "mgmt_ingress_ssh" {
  type              = "ingress"
  from_port         = 22
  to_port           = 22
  protocol          = "tcp"
  cidr_blocks       = [var.admin_cidr]
  security_group_id = aws_security_group.management.id
  description       = "Allow SSH management ingress from authorized admin CIDR"
}

# Ingress: Forward Proxy (TCP 3128) from Internal VPC for package bootstrapping
resource "aws_security_group_rule" "mgmt_ingress_proxy_vpc" {
  type              = "ingress"
  from_port         = 3128
  to_port           = 3128
  protocol          = "tcp"
  cidr_blocks       = [var.vpc_cidr]
  security_group_id = aws_security_group.management.id
  description       = "Allow internal VPC instances to route HTTP/HTTPS package downloads via Bastion forward proxy"
}

# Egress: Allow all outbound from bastion to internal VPC subnets & external internet
resource "aws_security_group_rule" "mgmt_egress_all" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.management.id
  description       = "Allow all outbound traffic from management bastion"
}

# ------------------------------------------------------------------------------
# 2. SOC / SIEM Security Group (Wazuh Manager, Indexer, Dashboard)
# ------------------------------------------------------------------------------
resource "aws_security_group" "soc" {
  name        = "${local.name_prefix}-soc-sg"
  description = "Protects Wazuh SIEM components (Manager, Indexer, Dashboard)"
  vpc_id      = aws_vpc.main.id

  tags = merge(
    local.security_tags,
    {
      Name = "${local.name_prefix}-soc-sg"
    }
  )
}

# Ingress: SSH from Management Bastion
resource "aws_security_group_rule" "soc_ingress_ssh_mgmt" {
  type                     = "ingress"
  from_port                = 22
  to_port                  = 22
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.management.id
  security_group_id        = aws_security_group.soc.id
  description              = "Allow SSH administration from management bastion"
}

# Ingress: Wazuh Agent Registration (TCP 1515) from Windows Endpoint
resource "aws_security_group_rule" "soc_ingress_wazuh_reg_windows" {
  type                     = "ingress"
  from_port                = 1515
  to_port                  = 1515
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.windows.id
  security_group_id        = aws_security_group.soc.id
  description              = "Allow Wazuh agent registration from Windows endpoint"
}

# Ingress: Wazuh Agent Registration (TCP 1515) from Web Server
resource "aws_security_group_rule" "soc_ingress_wazuh_reg_web" {
  type                     = "ingress"
  from_port                = 1515
  to_port                  = 1515
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.web.id
  security_group_id        = aws_security_group.soc.id
  description              = "Allow Wazuh agent registration from Web server"
}

# Ingress: Wazuh Agent Registration (TCP 1515) from Attack Node
resource "aws_security_group_rule" "soc_ingress_wazuh_reg_attack" {
  type                     = "ingress"
  from_port                = 1515
  to_port                  = 1515
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.attack.id
  security_group_id        = aws_security_group.soc.id
  description              = "Allow Wazuh agent registration from Attack host"
}

# Ingress: Wazuh Agent Events / Telemetry (TCP 1514) from Windows Endpoint
resource "aws_security_group_rule" "soc_ingress_wazuh_events_windows" {
  type                     = "ingress"
  from_port                = 1514
  to_port                  = 1514
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.windows.id
  security_group_id        = aws_security_group.soc.id
  description              = "Allow Wazuh agent telemetry events from Windows endpoint"
}

# Ingress: Wazuh Agent Events / Telemetry (TCP 1514) from Web Server
resource "aws_security_group_rule" "soc_ingress_wazuh_events_web" {
  type                     = "ingress"
  from_port                = 1514
  to_port                  = 1514
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.web.id
  security_group_id        = aws_security_group.soc.id
  description              = "Allow Wazuh agent telemetry events from Web server"
}

# Ingress: Wazuh Agent Events / Telemetry (TCP 1514) from Attack Node
resource "aws_security_group_rule" "soc_ingress_wazuh_events_attack" {
  type                     = "ingress"
  from_port                = 1514
  to_port                  = 1514
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.attack.id
  security_group_id        = aws_security_group.soc.id
  description              = "Allow Wazuh agent telemetry events from Attack host"
}

# Ingress: Wazuh REST API (TCP 55000) from Management Bastion
resource "aws_security_group_rule" "soc_ingress_wazuh_api_mgmt" {
  type                     = "ingress"
  from_port                = 55000
  to_port                  = 55000
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.management.id
  security_group_id        = aws_security_group.soc.id
  description              = "Allow Wazuh API access from management bastion"
}

# Ingress: Wazuh REST API (TCP 55000) from Authorized Admin CIDR
resource "aws_security_group_rule" "soc_ingress_wazuh_api_admin" {
  type              = "ingress"
  from_port         = 55000
  to_port           = 55000
  protocol          = "tcp"
  cidr_blocks       = [var.admin_cidr]
  security_group_id = aws_security_group.soc.id
  description       = "Allow Wazuh API access from authorized admin CIDR"
}

# Ingress: Wazuh Dashboard Web UI (HTTPS 443) from Management Bastion
resource "aws_security_group_rule" "soc_ingress_wazuh_dashboard_mgmt" {
  type                     = "ingress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.management.id
  security_group_id        = aws_security_group.soc.id
  description              = "Allow Wazuh Dashboard web access from management bastion"
}

# Ingress: Wazuh Dashboard Web UI (HTTPS 443) from Authorized Admin CIDR
resource "aws_security_group_rule" "soc_ingress_wazuh_dashboard_admin" {
  type              = "ingress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = [var.admin_cidr]
  security_group_id = aws_security_group.soc.id
  description       = "Allow direct Wazuh Dashboard HTTPS access from authorized admin CIDR"
}

# Ingress: Wazuh Indexer / OpenSearch REST API (TCP 9200) from Authorized Admin CIDR
resource "aws_security_group_rule" "soc_ingress_wazuh_indexer_admin" {
  type              = "ingress"
  from_port         = 9200
  to_port           = 9200
  protocol          = "tcp"
  cidr_blocks       = [var.admin_cidr]
  security_group_id = aws_security_group.soc.id
  description       = "Allow direct Wazuh Indexer REST API access from authorized admin CIDR"
}

# Ingress: Wazuh Agent Events (TCP 1514) from Authorized Admin CIDR (External Agents)
resource "aws_security_group_rule" "soc_ingress_wazuh_events_admin" {
  type              = "ingress"
  from_port         = 1514
  to_port           = 1514
  protocol          = "tcp"
  cidr_blocks       = [var.admin_cidr]
  security_group_id = aws_security_group.soc.id
  description       = "Allow Wazuh agent telemetry events from authorized admin CIDR"
}

# Ingress: Wazuh Agent Registration (TCP 1515) from Authorized Admin CIDR (External Agents)
resource "aws_security_group_rule" "soc_ingress_wazuh_reg_admin" {
  type              = "ingress"
  from_port         = 1515
  to_port           = 1515
  protocol          = "tcp"
  cidr_blocks       = [var.admin_cidr]
  security_group_id = aws_security_group.soc.id
  description       = "Allow Wazuh agent registration from authorized admin CIDR"
}



# Egress: All outbound for updates, package repos, and internal telemetry
resource "aws_security_group_rule" "soc_egress_all" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.soc.id
  description       = "Allow outbound connections for package installation and DNS"
}

# ------------------------------------------------------------------------------
# 3. Windows Endpoint Security Group
# ------------------------------------------------------------------------------
resource "aws_security_group" "windows" {
  name        = "${local.name_prefix}-windows-sg"
  description = "Protects Windows employee workstation (Sysmon + Wazuh Agent)"
  vpc_id      = aws_vpc.main.id

  tags = merge(
    local.security_tags,
    {
      Name = "${local.name_prefix}-windows-sg"
    }
  )
}

# Ingress: RDP (TCP 3389) from Management Bastion
resource "aws_security_group_rule" "windows_ingress_rdp_mgmt" {
  type                     = "ingress"
  from_port                = 3389
  to_port                  = 3389
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.management.id
  security_group_id        = aws_security_group.windows.id
  description              = "Allow RDP management access from management bastion"
}

# Ingress: RDP (TCP 3389) from Admin CIDR
resource "aws_security_group_rule" "windows_ingress_rdp_admin" {
  type              = "ingress"
  from_port         = 3389
  to_port           = 3389
  protocol          = "tcp"
  cidr_blocks       = [var.admin_cidr]
  security_group_id = aws_security_group.windows.id
  description       = "Allow RDP management access from authorized admin CIDR"
}

# Ingress: WinRM HTTP/HTTPS (TCP 5985/5986) from Management Bastion for Ansible
resource "aws_security_group_rule" "windows_ingress_winrm_mgmt" {
  type                     = "ingress"
  from_port                = 5985
  to_port                  = 5986
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.management.id
  security_group_id        = aws_security_group.windows.id
  description              = "Allow WinRM management from management bastion for Ansible provisioning"
}

# Ingress: Attack Simulation Traffic (SMB 445) from Attack Host
resource "aws_security_group_rule" "windows_ingress_attack_smb" {
  type                     = "ingress"
  from_port                = 445
  to_port                  = 445
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.attack.id
  security_group_id        = aws_security_group.windows.id
  description              = "Allow SMB attack simulation from attack host"
}

# Ingress: Attack Simulation Traffic (RPC 135) from Attack Host
resource "aws_security_group_rule" "windows_ingress_attack_rpc" {
  type                     = "ingress"
  from_port                = 135
  to_port                  = 135
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.attack.id
  security_group_id        = aws_security_group.windows.id
  description              = "Allow RPC attack simulation from attack host"
}

# Ingress: Attack Simulation Traffic (WinRM 5985) from Attack Host
resource "aws_security_group_rule" "windows_ingress_attack_winrm" {
  type                     = "ingress"
  from_port                = 5985
  to_port                  = 5985
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.attack.id
  security_group_id        = aws_security_group.windows.id
  description              = "Allow WinRM attack simulation from attack host"
}

# Egress: All outbound for Wazuh agent shipping, DNS, and updates
resource "aws_security_group_rule" "windows_egress_all" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.windows.id
  description       = "Allow outbound telemetry to Wazuh and DNS resolution"
}

# ------------------------------------------------------------------------------
# 4. Target / Web Server Security Group (Nginx, DVWA :8000, Juice Shop :3000)
# ------------------------------------------------------------------------------
resource "aws_security_group" "web" {
  name        = "${local.name_prefix}-web-sg"
  description = "Protects Linux web server hosting Nginx, DVWA, and OWASP Juice Shop"
  vpc_id      = aws_vpc.main.id

  tags = merge(
    local.security_tags,
    {
      Name = "${local.name_prefix}-web-sg"
    }
  )
}

# Ingress: SSH (TCP 22) from Management Bastion
resource "aws_security_group_rule" "web_ingress_ssh_mgmt" {
  type                     = "ingress"
  from_port                = 22
  to_port                  = 22
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.management.id
  security_group_id        = aws_security_group.web.id
  description              = "Allow SSH management from management bastion"
}

# Ingress: HTTP (TCP 80) from Management Bastion
resource "aws_security_group_rule" "web_ingress_http_mgmt" {
  type                     = "ingress"
  from_port                = 80
  to_port                  = 80
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.management.id
  security_group_id        = aws_security_group.web.id
  description              = "Allow HTTP verification from management bastion"
}

# Ingress: HTTP (TCP 80) from Attack Host
resource "aws_security_group_rule" "web_ingress_http_attack" {
  type                     = "ingress"
  from_port                = 80
  to_port                  = 80
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.attack.id
  security_group_id        = aws_security_group.web.id
  description              = "Allow HTTP attack simulation from attack host"
}

# Ingress: Deliberately Vulnerable App (TCP 8000) from Attack Host (NEVER 0.0.0.0/0)
resource "aws_security_group_rule" "web_ingress_vulnapp_attack" {
  type                     = "ingress"
  from_port                = 8000
  to_port                  = 8000
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.attack.id
  security_group_id        = aws_security_group.web.id
  description              = "Allow vulnerable web app exploitation testing from attack host"
}

# Ingress: Deliberately Vulnerable App (TCP 8000) from Management Bastion
resource "aws_security_group_rule" "web_ingress_vulnapp_mgmt" {
  type                     = "ingress"
  from_port                = 8000
  to_port                  = 8000
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.management.id
  security_group_id        = aws_security_group.web.id
  description              = "Allow vulnerable web app validation from management bastion"
}

# Ingress: OWASP Juice Shop (TCP 3000) from Attack Host (NEVER 0.0.0.0/0)
resource "aws_security_group_rule" "web_ingress_juiceshop_attack" {
  type                     = "ingress"
  from_port                = 3000
  to_port                  = 3000
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.attack.id
  security_group_id        = aws_security_group.web.id
  description              = "Allow OWASP Juice Shop exploitation testing from attack host"
}

# Ingress: OWASP Juice Shop (TCP 3000) from Management Bastion
resource "aws_security_group_rule" "web_ingress_juiceshop_mgmt" {
  type                     = "ingress"
  from_port                = 3000
  to_port                  = 3000
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.management.id
  security_group_id        = aws_security_group.web.id
  description              = "Allow OWASP Juice Shop validation from management bastion"
}

# Ingress: HTTP (TCP 80) from Authorized Admin CIDR
resource "aws_security_group_rule" "web_ingress_http_admin" {
  type              = "ingress"
  from_port         = 80
  to_port           = 80
  protocol          = "tcp"
  cidr_blocks       = [var.admin_cidr]
  security_group_id = aws_security_group.web.id
  description       = "Allow HTTP web access from authorized admin CIDR"
}

# Ingress: Deliberately Vulnerable App / DVWA (TCP 8000) from Authorized Admin CIDR
resource "aws_security_group_rule" "web_ingress_vulnapp_admin" {
  type              = "ingress"
  from_port         = 8000
  to_port           = 8000
  protocol          = "tcp"
  cidr_blocks       = [var.admin_cidr]
  security_group_id = aws_security_group.web.id
  description       = "Allow DVWA web target access from authorized admin CIDR"
}

# Ingress: OWASP Juice Shop (TCP 3000) from Authorized Admin CIDR
resource "aws_security_group_rule" "web_ingress_juiceshop_admin" {
  type              = "ingress"
  from_port         = 3000
  to_port           = 3000
  protocol          = "tcp"
  cidr_blocks       = [var.admin_cidr]
  security_group_id = aws_security_group.web.id
  description       = "Allow OWASP Juice Shop web target access from authorized admin CIDR"
}

# Egress: All outbound for updates, Docker image pulls, and Wazuh telemetry
resource "aws_security_group_rule" "web_egress_all" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.web.id
  description       = "Allow outbound package installations, container pulls, and Wazuh telemetry"
}

# ------------------------------------------------------------------------------
# 5. Attack Simulation Security Group (Atomic Red Team Host)
# ------------------------------------------------------------------------------
resource "aws_security_group" "attack" {
  name        = "${local.name_prefix}-attack-sg"
  description = "Atomic Red Team attack simulation host security group"
  vpc_id      = aws_vpc.main.id

  tags = merge(
    local.security_tags,
    {
      Name = "${local.name_prefix}-attack-sg"
    }
  )
}

# Ingress: SSH (TCP 22) from Management Bastion
resource "aws_security_group_rule" "attack_ingress_ssh_mgmt" {
  type                     = "ingress"
  from_port                = 22
  to_port                  = 22
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.management.id
  security_group_id        = aws_security_group.attack.id
  description              = "Allow SSH management from management bastion"
}

# Egress: All outbound to reach targets (Web, Windows) and external tool repositories
resource "aws_security_group_rule" "attack_egress_all" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.attack.id
  description       = "Allow outbound simulation attacks against targets and tool downloads"
}
