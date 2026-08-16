# SOCForge — Terraform AWS Foundation (Phases 2 & 3)

> **Current Scope**: This directory contains the Infrastructure-as-Code (IaC) configuration for the **AWS Network & Security Layers** of the SOCForge training lab.

---

## 1. Architecture & Provisioned Resources

### What is Implemented:
* **Dedicated AWS VPC**: `10.10.0.0/16` with DNS hostnames and DNS resolution enabled.
* **Single Availability Zone**: Discovered dynamically in target region.
* **4 Segregated Subnets**:
  * `SOCForge-management-subnet` (`10.10.1.0/24`) — Public tier (Bastion / Jumpbox).
  * `SOCForge-soc-subnet` (`10.10.10.0/24`) — Private tier (Wazuh SIEM server).
  * `SOCForge-attack-subnet` (`10.10.20.0/24`) — Private tier (Atomic Red Team).
  * `SOCForge-web-subnet` (`10.10.30.0/24`) — Private tier (Nginx, DVWA, Juice Shop).
* **Internet Gateway & Route Tables**: Public route table for Management; Private route table with local routing only for internal tiers.
* **5 Dedicated Least-Privilege Security Groups**:
  * `SOCForge-management-sg`: SSH (port 22) restricted strictly to `var.admin_cidr`.
  * `SOCForge-soc-sg`: Wazuh agent telemetry (ports 1514, 1515) from endpoints/web/attack; API (55000) and Dashboard (443) from management/admin; SSH (22) from bastion.
  * `SOCForge-windows-sg`: RDP (3389) and WinRM (5985/5986) from bastion; simulated attack vectors (SMB 445, RPC 135, WinRM 5985) from attack host; egress to Wazuh.
  * `SOCForge-web-sg`: HTTP (80), DVWA (8000), and Juice Shop (3000) from attack host and bastion; **never exposed to 0.0.0.0/0**.
  * `SOCForge-attack-sg`: SSH (22) from bastion; egress permitted to target subnets.
* **IAM Foundation**:
  * `SOCForge-ec2-base-role`: EC2 assume role with `AmazonSSMManagedInstanceCore` and custom CloudWatch metrics policy.
  * `SOCForge-ec2-instance-profile`: Instance profile ready for future EC2 attachments.
* **Access & SSH Key Management**:
  * `aws_key_pair.main`: Registers user's public key (`var.ssh_public_key`) without generating or exposing private keys in Terraform.

### What is NOT Implemented in Phase 3:
* **No EC2 Compute Instances** (Scheduled for Phase 4)
* **No Software Deployments** (Wazuh, Sysmon, Nginx, Juice Shop scheduled for Phase 4/5)
* **No Ansible Playbooks or Roles** (Scheduled for Phase 4)
* **No NAT Gateways or Elastic IPs** (Omitted to keep lab costs near zero)

---

## 2. Security Group Relationships

```text
                    Internet
                       |
                       | (Port 22 from admin_cidr only)
                       v
             +--------------------+
             |   Management SG    |
             |  (Bastion / Admin) |
             +---------+----------+
                       |
        +--------------+--------------+
        | (SSH 22,     | (WinRM /     | (SSH 22,
        |  API 55000,  |  RDP 3389)   |  HTTP 80)
        |  HTTPS 443)  |              |
        v              v              v
+---------------+ +---------------+ +---------------+
|    SOC SG     | |  Windows SG   | |    Web SG     |
| (Wazuh SIEM)  | |  (Endpoint)   | |  (Juice Shop  |
+-------^-------+ +-------^-------+ |   & DVWA)     |
        |                 |         +-------^-------+
        | (Telemetry      | (Attack         | (Attack
        |  1514/1515)     |  445/135)       |  8000/3000)
        |                 +--------+--------+
        |                          |
        +--------------------------+
                                   |
                         +---------+---------+
                         |     Attack SG     |
                         | (Atomic Red Team) |
                         +-------------------+
```

---

## 3. Management Architecture Decision

Because the SOC, Attack, and Web subnets are completely private (no public IPs, no NAT Gateway), direct SSH/RDP connections from the internet to internal hosts are blocked by design.

### Chosen Approach: Bastion Jumpbox with SSH ProxyJump
* An operator connects from their control workstation (e.g. Debian 13 VM) to a lightweight bastion host in the Management subnet (`10.10.1.0/24`).
* Inbound SSH to the bastion is strictly limited to the operator's IP (`admin_cidr`).
* **Ansible Configuration Workflow**: Ansible uses native `ProxyJump` in `ansible.cfg` / `ssh_config`:
  ```text
  Host 10.10.*.*
      ProxyJump bastion.socforge.internal
      IdentityFile ~/.ssh/socforge_key
      User debian
  ```
* **Benefits**: Zero NAT Gateway cost (~$32/month saved), zero exposed attack surface on vulnerable apps, and native compatibility with Ansible and Linux tooling.

---

## 4. SSH Key Management & Safety

1. **Generate Key Pair Locally**:
   ```bash
   ssh-keygen -t ed25519 -f ~/.ssh/socforge_key -C "socforge-operator"
   ```
2. **Supply Public Key to Terraform**:
   Set `ssh_public_key` in `terraform.tfvars`:
   ```hcl
   ssh_public_key = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA..."
   ```
3. **Private Key Safety**:
   * The private key (`~/.ssh/socforge_key`) stays on the operator's local machine and is never shared, output, or committed to Git.

---

## 5. Terraform Workflow

```bash
# 1. Prepare configuration
cp terraform.tfvars.example terraform.tfvars
# (Edit admin_cidr and ssh_public_key in terraform.tfvars)

# 2. Initialize
terraform init

# 3. Format & Validate
terraform fmt -check
terraform validate

# 4. Review Plan
terraform plan
```
