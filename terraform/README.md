# SOCForge — Terraform AWS Infrastructure (Phases 2, 3 & 4)

> **Current Scope**: This directory contains the complete Infrastructure-as-Code (IaC) configuration for the **AWS Network, Security, and EC2 Compute Layers** of the SOCForge training lab.

---

## 1. Provisioned Infrastructure Summary

### What is Implemented:
* **Dedicated AWS VPC**: `10.10.0.0/16` with DNS hostnames and DNS resolution enabled.
* **Single Availability Zone**: Discovered dynamically in the target region.
* **4 Segregated Subnets**:
  * `SOCForge-management-subnet` (`10.10.1.0/24`) — Public tier (Bastion / Jumpbox).
  * `SOCForge-soc-subnet` (`10.10.10.0/24`) — Private tier (Wazuh SIEM server & Windows endpoint).
  * `SOCForge-attack-subnet` (`10.10.20.0/24`) — Private tier (Atomic Red Team).
  * `SOCForge-web-subnet` (`10.10.30.0/24`) — Private tier (Nginx, DVWA, Juice Shop).
* **Internet Gateway & Route Tables**: Public route table for Management; Private route table with local routing only for internal tiers.
* **5 Dedicated Least-Privilege Security Groups**: `management-sg`, `soc-sg`, `windows-sg`, `web-sg`, `attack-sg`.
* **IAM Foundation**: `SOCForge-ec2-base-role` and `SOCForge-ec2-instance-profile` with `AmazonSSMManagedInstanceCore` and CloudWatch logging policies.
* **EC2 Compute Instances (Phase 4)**:
  * **Bastion Host** (`aws_instance.bastion`): Public IP assigned, SSH Jumpbox, `t3.micro`.
  * **Wazuh SIEM Server** (`aws_instance.wazuh`): Private IP only, `t3.medium` (or `t3.xlarge`), 50 GB root volume.
  * **Windows Employee Endpoint** (`aws_instance.windows`): Private IP only, `t3.medium`, 50 GB root volume.
  * **Linux Web Target** (`aws_instance.web`): Private IP only, `t3.micro`, 20 GB root volume.
  * **Attack Simulation Node** (`aws_instance.attack`): Private IP only, `t3.micro`, 20 GB root volume.
* **Automated Ansible Inventory Handoff**: `scripts/generate-inventory.py` converts `terraform output -json` into `ansible/inventory/hosts.ini`.

### What is Intentionally NOT Implemented in Phase 4:
* **No Software Provisioning**: Wazuh, Sysmon, Nginx, Juice Shop, and Atomic Red Team are installed via Ansible in Phase 5.
* **No NAT Gateway or Load Balancer**: Omitted to keep lab operational costs near zero.
* **No Public IPs on Private Hosts**: All internal instances are strictly private.

---

## 2. Compute Sizing & Profile Guidelines

| Instance Name | Role | Subnet | Default Type | Recommended Sizing | Disk (GB) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `SOCForge-bastion` | SSH Jumpbox | Management (`10.10.1.0/24`) | `t3.micro` | 2 vCPU, 1 GB RAM | 20 (gp3) |
| `SOCForge-wazuh` | Wazuh SIEM | SOC (`10.10.10.0/24`) | `t3.medium` | 4 vCPU, 16 GB RAM (`t3.xlarge`) | 50 (gp3) |
| `SOCForge-windows` | Windows Workstation | SOC (`10.10.10.0/24`) | `t3.medium` | 2 vCPU, 8 GB RAM (`t3.large`) | 50 (gp3) |
| `SOCForge-web` | Web Server | Web (`10.10.30.0/24`) | `t3.micro` | 2 vCPU, 1 GB RAM | 20 (gp3) |
| `SOCForge-attack` | Attack Node | Attack (`10.10.20.0/24`) | `t3.micro` | 2 vCPU, 1 GB RAM | 20 (gp3) |

> ⚠️ **Resource Note**: Wazuh's all-in-one indexer/manager deployment requires substantial memory under active log ingestion. The default `t3.medium` is suitable for minimal bootstrap testing, but `t3.xlarge` is recommended for standard multi-agent workloads.

---

## 3. Important Private Subnet Limitation (No NAT Gateway)

Because there is **no NAT Gateway** in the VPC:
* Private instances (`Wazuh`, `Windows`, `Web`, `Attack`) cannot directly initiate outbound internet connections to download OS packages or container images.
* **Phase 5 Design**: Phase 5 will implement the controlled bootstrap strategy (e.g. package caching / bastion forward proxying / ephemeral bootstrap attachment) without running an expensive permanent NAT Gateway (~$32/month).

---

## 4. Terraform to Ansible Handoff Workflow

```bash
# 1. Apply Terraform infrastructure (when authorized)
terraform apply

# 2. Generate Ansible inventory directly from Terraform outputs
python3 ../scripts/generate-inventory.py

# 3. Verify generated inventory
cat ../ansible/inventory/hosts.ini
```
