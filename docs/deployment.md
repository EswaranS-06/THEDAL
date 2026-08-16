# SOCForge — Deployment Architecture & Lifecycle Guide

> **Current Status**: Network, Subnets, Routing (Phase 2), and Security Groups, IAM, and Access Management (Phase 3) are defined in Terraform. Compute instances and Ansible provisioning will follow in subsequent phases.

---

## 1. Deployment Pipeline Overview

SOCForge follows an automated, code-driven orchestration pipeline operated from a **Debian 13 Control VM** (or equivalent Linux workstation):

```text
Debian 13 Control Machine
|
+--> Terraform (Infrastructure as Code)
|       |
|       +--> AWS VPC & 4 Subnets (Phase 2)
|       +--> Route Tables & Internet Gateway (Phase 2)
|       +--> 5 Security Groups & Inter-Group Rules (Phase 3)
|       +--> EC2 IAM Instance Profile & Base Role (Phase 3)
|       +--> EC2 SSH Key Pair Registration (Phase 3)
|       +--> EC2 Compute Instances (Phase 4)
|
+--> Terraform Outputs -> Dynamic Inventory Handoff (Phase 4)
|
+--> Ansible (Configuration Automation via Bastion ProxyJump)
|       |
|       +--> Deploy & Configure Wazuh Manager & Indexer
|       +--> Provision Windows Endpoint (Sysmon + Wazuh Agent)
|       +--> Configure Web Server (Nginx + DVWA + Docker Juice Shop)
|       +--> Setup Atomic Red Team Simulation Environment
|
+--> Post-Deployment Verification
        |
        +--> Health Checks & Telemetry Verification
```

---

## 2. Access Management & SSH Key Lifecycle

### 1. Generating Operator SSH Key Pair
Before running Terraform, generate an ED25519 key pair locally on your control machine:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/socforge_key -C "socforge-operator"
```

### 2. Registering the Key with Terraform
Add your public key to `terraform/terraform.tfvars`:

```hcl
ssh_public_key = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA... socforge-operator"
ssh_key_name   = "SOCForge-key"
```

> **Security Rule**: The private key (`~/.ssh/socforge_key`) never leaves your control workstation and is **never** committed to version control or stored in Terraform state.

---

## 3. Connecting to Private EC2 Instances via Bastion

Because SOC, Attack, and Web instances are located in private subnets without public IPs, all management connections traverse the Bastion host in the Management subnet:

### Manual SSH Connection via ProxyJump
```bash
# Connect to internal Linux Web Server through Bastion
ssh -J debian@<BASTION_PUBLIC_IP> -i ~/.ssh/socforge_key debian@10.10.30.x

# Connect to internal Wazuh SIEM Server through Bastion
ssh -J debian@<BASTION_PUBLIC_IP> -i ~/.ssh/socforge_key debian@10.10.10.x
```

### Ansible Inventory Configuration
When Ansible is deployed, it uses SSH `ProxyJump` seamlessly:

```ini
[all:vars]
ansible_user = debian
ansible_ssh_private_key_file = ~/.ssh/socforge_key
ansible_ssh_common_args = '-o ProxyJump=debian@<BASTION_PUBLIC_IP> -o StrictHostKeyChecking=no'
```

---

## 4. Credentials & Secret Management

* **AWS API Credentials**: Managed via AWS CLI configuration (`~/.aws/credentials`) or environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`). Never commit credentials to version control.
* **EC2 IAM Role**: Uses `AmazonSSMManagedInstanceCore` and least-privilege CloudWatch logging policies.
* **Terraform State**: Ignored via `.gitignore`.
* **Ansible Vault**: Used in future phases to encrypt sensitive passwords.
