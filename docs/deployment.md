# SOCForge — Deployment Architecture & Lifecycle Guide

> **Notice**: This document outlines the **target deployment workflow and orchestration lifecycle** for SOCForge. Infrastructure provisioning and automation playbooks will be implemented in Phases 2 through 4.

---

## 1. Deployment Pipeline Overview

SOCForge follows an automated, code-driven orchestration pipeline operated from a **Debian 13 Control VM** (or equivalent Linux workstation):

```text
Debian 13 Control Machine
|
+--> Terraform (Infrastructure as Code)
|       |
|       +--> AWS VPC & Subnets
|       +--> Security Groups & IAM Roles
|       +--> EC2 Instances (SIEM, Web, Windows, Attack)
|
+--> Dynamic Inventory Generation
|
+--> Ansible (Configuration Automation)
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

## 2. Target Deployment Lifecycle & Commands

### Stage 0: Control Machine Preflight
Verify that all required toolchains and dependencies are installed on the control machine before attempting any cloud operations:

```bash
# Verify local environment readiness
./scripts/preflight.sh
```

### Stage 1: Infrastructure Provisioning (Terraform)
Terraform provisions the isolated AWS VPC, subnets, route tables, network interfaces, and compute instances:

```bash
cd terraform/
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

### Stage 2: Machine Configuration & Provisioning (Ansible)
Ansible connects to the provisioned instances (via dynamic inventory or generated host definitions) to configure OS settings, install security software, and bootstrap services:

```bash
cd ../ansible/
# Example conceptual playbook execution
ansible-playbook -i inventory/aws_ec2.yml playbooks/site.yml
```

* **Role: Wazuh Core**: Installs Wazuh Manager, Indexer, and Dashboard.
* **Role: Web Target**: Installs Nginx, Docker, pulls OWASP Juice Shop, and configures reverse proxy rules.
* **Role: Windows Endpoint**: Provisions Sysmon with detection configuration and registers Wazuh Agent.
* **Role: Attack Host**: Clones and configures Atomic Red Team frameworks.

### Stage 3: Lab Health & Telemetry Verification
Run automated health checks to verify that services are healthy, agents are registered, and telemetry is reaching the SIEM:

```bash
./scripts/health-check.sh
```

### Stage 4: Clean Teardown & Cost Elimination
When training or testing is complete, destroy all provisioned AWS assets immediately to avoid ongoing cloud expenses:

```bash
cd terraform/
terraform destroy -auto-approve
```

---

## 3. Configuration Management & Secrets Handling

To maintain security and prevent accidental leakage of sensitive credentials:
* **AWS Credentials**: Managed via AWS CLI configuration (`~/.aws/credentials`) or environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`). Never commit credentials to version control.
* **SSH Keys**: Key pairs generated locally and referenced dynamically by Terraform.
* **Terraform State**: Stored locally (or in S3 with state locking) and strictly ignored via `.gitignore`.
* **Ansible Vault**: Any sensitive passwords (e.g. Wazuh admin password, database credentials) are encrypted using Ansible Vault.
