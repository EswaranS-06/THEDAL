# ==============================================================================
# SOCForge — AWS Networking Resources (Phase 2)
# ==============================================================================
# Creates the dedicated VPC, subnets, Internet Gateway, route tables, and
# associations.
# ==============================================================================

# ------------------------------------------------------------------------------
# 1. Virtual Private Cloud (VPC)
# ------------------------------------------------------------------------------
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = merge(
    local.networking_tags,
    {
      Name = "${local.name_prefix}-vpc"
    }
  )
}

# ------------------------------------------------------------------------------
# 2. Subnets (Single Availability Zone for simplicity & cost efficiency)
# ------------------------------------------------------------------------------

# Management Subnet (Public — Operator / Bastion access)
resource "aws_subnet" "management" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.management_subnet_cidr
  availability_zone       = local.selected_az
  map_public_ip_on_launch = true

  tags = merge(
    local.networking_tags,
    {
      Name = "${local.name_prefix}-management-subnet"
      Tier = "public"
    }
  )
}

# SOC / SIEM Subnet (Private — Wazuh Manager, Indexer, Dashboard)
resource "aws_subnet" "soc" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.soc_subnet_cidr
  availability_zone       = local.selected_az
  map_public_ip_on_launch = false

  tags = merge(
    local.networking_tags,
    {
      Name = "${local.name_prefix}-soc-subnet"
      Tier = "private"
    }
  )
}

# Attack Simulation Subnet (Private — Atomic Red Team test harness)
resource "aws_subnet" "attack" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.attack_subnet_cidr
  availability_zone       = local.selected_az
  map_public_ip_on_launch = false

  tags = merge(
    local.networking_tags,
    {
      Name = "${local.name_prefix}-attack-subnet"
      Tier = "private"
    }
  )
}

# Target / Web Subnet (Private — Nginx, DVWA, OWASP Juice Shop)
resource "aws_subnet" "web" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.web_subnet_cidr
  availability_zone       = local.selected_az
  map_public_ip_on_launch = false

  tags = merge(
    local.networking_tags,
    {
      Name = "${local.name_prefix}-web-subnet"
      Tier = "private"
    }
  )
}

# ------------------------------------------------------------------------------
# 3. Internet Gateway
# ------------------------------------------------------------------------------
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id

  tags = merge(
    local.networking_tags,
    {
      Name = "${local.name_prefix}-igw"
    }
  )
}

# ------------------------------------------------------------------------------
# 4. Route Tables
# ------------------------------------------------------------------------------

# Public Route Table (Management Subnet)
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  tags = merge(
    local.networking_tags,
    {
      Name = "${local.name_prefix}-public-rt"
    }
  )
}

# Public Route: Direct Internet Access via Internet Gateway
resource "aws_route" "public_internet_access" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.igw.id
}

# Private Route Table (SOC, Attack, Web Subnets)
# Contains only the default local VPC route (10.10.0.0/16 -> local).
# No NAT Gateway or direct 0.0.0.0/0 IGW route is attached to prevent exposure.
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  tags = merge(
    local.networking_tags,
    {
      Name = "${local.name_prefix}-private-rt"
    }
  )
}

# ------------------------------------------------------------------------------
# 5. Explicit Route Table Associations
# ------------------------------------------------------------------------------

# Management -> Public Route Table
resource "aws_route_table_association" "management" {
  subnet_id      = aws_subnet.management.id
  route_table_id = aws_route_table.public.id
}

# SOC -> Private Route Table
resource "aws_route_table_association" "soc" {
  subnet_id      = aws_subnet.soc.id
  route_table_id = aws_route_table.private.id
}

# Attack -> Private Route Table
resource "aws_route_table_association" "attack" {
  subnet_id      = aws_subnet.attack.id
  route_table_id = aws_route_table.private.id
}

# Web -> Private Route Table
resource "aws_route_table_association" "web" {
  subnet_id      = aws_subnet.web.id
  route_table_id = aws_route_table.private.id
}
