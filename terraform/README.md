# SOCForge — Terraform AWS Network Foundation (Phase 2)

> **Phase 2 Scope**: This directory contains the Infrastructure-as-Code (IaC) configuration for the **AWS Network Layer** of the SOCForge training lab.

---

## 1. Overview & Provisioned Resources

The Phase 2 Terraform configuration provisions a dedicated, isolated Amazon Virtual Private Cloud (VPC) with segregated subnets, routing controls, and internet egress boundaries.

### What is Implemented in Phase 2:
* **Dedicated AWS VPC**: `10.10.0.0/16` with DNS hostnames and DNS resolution enabled.
* **Dynamic Single-AZ Selection**: Automatically selects one active Availability Zone in the target region for all subnets to eliminate cross-AZ transfer costs.
* **4 Subnets**:
  * `SOCForge-management-subnet` (`10.10.1.0/24`) — Public tier for operator/bastion access.
  * `SOCForge-soc-subnet` (`10.10.10.0/24`) — Private tier for Wazuh SIEM components.
  * `SOCForge-attack-subnet` (`10.10.20.0/24`) — Private tier for Atomic Red Team attack simulation.
  * `SOCForge-web-subnet` (`10.10.30.0/24`) — Private tier for Nginx, DVWA, and OWASP Juice Shop.
* **Internet Gateway (IGW)**: `SOCForge-igw` attached to the VPC.
* **Route Tables & Explicit Associations**:
  * `SOCForge-public-rt`: Contains default route `0.0.0.0/0` pointing to `SOCForge-igw`. Associated exclusively with `Management`.
  * `SOCForge-private-rt`: Contains only the local VPC route (`10.10.0.0/16 -> local`). Associated with `SOC`, `Attack`, and `Web`.

### What is Intentionally NOT Implemented in Phase 2:
* **No EC2 compute instances**
* **No Security Groups or firewall rules** (Scheduled for Phase 3)
* **No IAM roles, instance profiles, or policies** (Scheduled for Phase 3)
* **No NAT Gateways or Elastic IPs** (Omitted to prevent unnecessary AWS hourly billing)
* **No SSH key pairs**
* **No Wazuh / OS / application software deployments**

---

## 2. Network Layout & Subnet Specifications

| Subnet Name | CIDR Block | Tier | Auto-Assign Public IP | Route Table | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `SOCForge-management-subnet` | `10.10.1.0/24` | Public | **Yes** | `SOCForge-public-rt` | Operator entry point, jumpbox / bastion |
| `SOCForge-soc-subnet` | `10.10.10.0/24` | Private | **No** | `SOCForge-private-rt` | Wazuh Manager, Indexer, and Dashboard |
| `SOCForge-attack-subnet` | `10.10.20.0/24` | Private | **No** | `SOCForge-private-rt` | Atomic Red Team simulation node |
| `SOCForge-web-subnet` | `10.10.30.0/24` | Private | **No** | `SOCForge-private-rt` | Vulnerable web targets (DVWA, Juice Shop) |

---

## 3. Design Decisions & Cost Controls

### Why Only the Management Subnet is Public
The Management subnet acts as the controlled bastion host tier. In future phases, operator ingress (SSH / HTTPS) will be strictly allowed from authorized IP addresses into this subnet. All target workloads (vulnerable web applications and SOC servers) remain private to prevent automated internet crawlers and malicious external actors from discovering or attacking the lab.

### Why No NAT Gateway Yet
An AWS Managed NAT Gateway incurs a fixed hourly charge (~$0.045/hour or ~$32/month plus data transfer fees). In Phase 2, internal subnets only require private inter-communication. Subsequent phases will evaluate whether external package installation is handled via temporary elastic assignment, dual-homed bastion proxying, or ephemeral NAT.

### Dynamic Single Availability Zone
All four subnets are allocated in a single Availability Zone retrieved dynamically via `data.aws_availability_zones.available.names[0]`. This ensures compatibility with any AWS account without hardcoding AZ identifiers while avoiding AWS cross-AZ inter-subnet data transfer fees.

---

## 4. Terraform Workflow

### Step 1: Prepare Variables
Copy the example variable definitions file:

```bash
cp terraform.tfvars.example terraform.tfvars
```

*(Edit `terraform.tfvars` if you wish to change the target AWS region or CIDR allocations).*

### Step 2: Initialize Terraform
Download provider plugins and initialize local backend:

```bash
terraform init
```

### Step 3: Format & Validate
Check code syntax and configuration validity:

```bash
terraform fmt -check
terraform validate
```

### Step 4: Review Execution Plan
Generate and inspect the speculative execution plan:

```bash
terraform plan
```

### Step 5: Provision Infrastructure (Future)
When ready to create the AWS VPC:

```bash
terraform apply
```

### Step 6: Destroy Infrastructure (Teardown)
To tear down all network assets and stop AWS billing:

```bash
terraform destroy
```
