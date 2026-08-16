# SOCForge — Deployment Architecture & Lifecycle Guide

> **Current Status**: Network, Subnets, Security Groups, IAM Roles, EC2 Compute Instances, and Dynamic Inventory Generation (Phases 1–4) are implemented. Software provisioning will follow in Phase 5.

---

## 1. Deployment Pipeline Overview

```text
Debian 13 Control Machine
|
+--> 1. Terraform (Infrastructure as Code)
|       |
|       +--> AWS VPC & 4 Subnets (Phase 2)
|       +--> Route Tables & Internet Gateway (Phase 2)
|       +--> 5 Security Groups & Inter-Group Rules (Phase 3)
|       +--> EC2 IAM Instance Profile & Base Role (Phase 3)
|       +--> EC2 Key Pair Registration (Phase 3)
|       +--> 5 EC2 Compute Instances (Phase 4)
|
+--> 2. Dynamic Inventory Generation (Phase 4)
|       |
|       +--> `terraform output -json`
|       +--> `scripts/generate-inventory.py`
|       +--> `ansible/inventory/hosts.ini`
|
+--> 3. Ansible Automation (Phase 5)
|       |
|       +--> Bootstrap Package Channel
|       +--> Provision Wazuh SIEM & Agents
|       +--> Configure Windows Sysmon & Event Forwarding
|       +--> Deploy Nginx & OWASP Juice Shop
|       +--> Setup Atomic Red Team Simulation
|
+--> 4. Telemetry Verification & Detection Testing (Phase 5)
```

---

## 2. Dynamic Ansible Inventory Generation Workflow

After provisioning or updating Terraform infrastructure, generate the Ansible inventory with a single command:

```bash
# Generate inventory directly from Terraform outputs
python3 scripts/generate-inventory.py

# Or use the Make target
make inventory
```

This automatically extracts the dynamic public IP of the Bastion and the private IPs of the internal hosts, populating `ansible/inventory/hosts.ini`:

```ini
[bastion]
bastion ansible_host=203.0.113.10 ansible_user=ubuntu ansible_ssh_private_key_file=~/.ssh/socforge_key

[wazuh]
wazuh ansible_host=10.10.10.15 ansible_user=ubuntu ansible_ssh_private_key_file=~/.ssh/socforge_key

[web]
web ansible_host=10.10.30.50 ansible_user=ubuntu ansible_ssh_private_key_file=~/.ssh/socforge_key

[attack]
attack ansible_host=10.10.20.75 ansible_user=ubuntu ansible_ssh_private_key_file=~/.ssh/socforge_key

[windows]
windows ansible_host=10.10.10.20 ansible_user=Administrator ansible_connection=winrm ansible_winrm_server_cert_validation=ignore

[linux:children]
bastion
wazuh
web
attack

[soc_stack:children]
wazuh
web
windows
attack

[soc_stack:vars]
ansible_ssh_common_args='-o ProxyJump=ubuntu@203.0.113.10 -o StrictHostKeyChecking=no'
```

---

## 3. SSH ProxyJump Configuration & Access

Because internal instances reside in private subnets without public IPs, all connections route seamlessly through the Bastion:

```bash
# Manual SSH into internal Wazuh server via Bastion
ssh -J ubuntu@<BASTION_PUBLIC_IP> -i ~/.ssh/socforge_key ubuntu@10.10.10.15

# Manual SSH into internal Web server via Bastion
ssh -J ubuntu@<BASTION_PUBLIC_IP> -i ~/.ssh/socforge_key ubuntu@10.10.30.50
```

---

## 4. Teardown & Cost Management

When training or testing is complete, destroy all provisioned AWS assets to stop billing:

```bash
cd terraform/
terraform destroy
```
