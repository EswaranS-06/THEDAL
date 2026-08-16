# SOCForge — Architectural Blueprint

> **Notice**: This document details the architectural blueprint for SOCForge. It clearly delineates components **implemented in Phases 1–4** versus components **planned for future phases**.

---

## 1. High-Level System Architecture

SOCForge simulates an enterprise network inside an isolated Amazon Web Services (AWS) Virtual Private Cloud (VPC `10.10.0.0/16`). It encompasses a management control plane, a SOC telemetry and SIEM core, an enterprise Windows endpoint, a Linux web application server, and an adversary emulation harness.

```text
                    Internet
                       |
                       | (Inbound Port 22 from admin_cidr only)
                       v
             +--------------------+
             |   Management SG    |
             |  (Bastion Jumpbox) |
             |  [SOCForge-bastion]|
             |   (10.10.1.0/24)   |
             +---------+----------+
                       | (SSH ProxyJump / WinRM)
        +--------------+--------------+
        |                             |
        v                             v
+---------------+             +---------------+
|    SOC SG     |             |  Windows SG   |
| [SOCForge-    |             | [SOCForge-    |
|    wazuh]     |             |   windows]    |
| (10.10.10.0)  |             | (10.10.10.0)  |
+-------^-------+             +-------^-------+
        | (Telemetry                  | (Simulated
        |  1514/1515)                 |  Attack 445/135)
        |                             |
        |       +---------------+     |
        |       |    Web SG     |<----+
        |       | [SOCForge-    |
        |       |     web]      | (Simulated Attack
        |       | (10.10.30.0)  |  8000/3000)
        |       +-------^-------+
        |               |
        +---------------+-------------+
                        | (Agent Telemetry 1514/1515)
              +---------+---------+
              |     Attack SG     |
              | [SOCForge-attack] |
              |  (10.10.20.0/24)  |
              +-------------------+
```

---

## 2. Implementation Status by Phase

### ✅ IMPLEMENTED IN PHASES 1–4
* **Phase 1: Project Foundation**: Directory structure, standards (`.editorconfig`, `.gitignore`, `LICENSE`), developer CLI (`Makefile`), preflight checker (`scripts/preflight.sh`), and health check (`scripts/health-check.sh`).
* **Phase 2: AWS Network Foundation**: Dedicated VPC (`10.10.0.0/16`), single-AZ dynamic discovery, four segregated subnets (Management, SOC, Attack, Web), Internet Gateway (`SOCForge-igw`), and public/private route tables.
* **Phase 3: Security Groups, IAM & Access Control**:
  * **5 Dedicated Security Groups**: `management-sg`, `soc-sg`, `windows-sg`, `web-sg`, and `attack-sg`.
  * **IAM Foundation**: `SOCForge-ec2-base-role` and `SOCForge-ec2-instance-profile` with `AmazonSSMManagedInstanceCore` and CloudWatch logging policies.
  * **EC2 Access & Key Management**: `aws_key_pair` registration from user-provided public key material (`ssh_public_key`).
* **Phase 4: EC2 Compute Infrastructure & Dynamic Inventory Handoff**:
  * **5 EC2 Compute Instances**:
    * `SOCForge-bastion` (`t3.micro` in Management subnet, public IP assigned).
    * `SOCForge-wazuh` (`t3.medium`/`t3.xlarge` in SOC subnet, private IP only, 50 GB gp3 root disk).
    * `SOCForge-windows` (`t3.medium`/`t3.large` in SOC subnet, private IP only, 50 GB gp3 root disk).
    * `SOCForge-web` (`t3.micro` in Web subnet, private IP only, 20 GB gp3 root disk).
    * `SOCForge-attack` (`t3.micro` in Attack subnet, private IP only, 20 GB gp3 root disk).
  * **Dynamic AMI Discovery**: Automated lookup of latest Canonical Ubuntu 22.04 LTS and Amazon Windows Server 2022 Full Base AMIs with x86_64 architecture.
  * **Automated Ansible Inventory Pipeline**: `scripts/generate-inventory.py` converts `terraform output -json` into `ansible/inventory/hosts.ini`.
  * **Ansible Configuration**: `ansible/ansible.cfg` configured for SSH ProxyJump through the Bastion.

### ⏳ PLANNED FOR FUTURE PHASES (Phase 5+)
* **Phase 5: Ansible Bootstrap, Software Provisioning & Detection Engineering**:
  * Private instance package bootstrap strategy.
  * Automated installation and configuration of Wazuh Manager, Indexer, Dashboard, and Agents.
  * Sysmon configuration on Windows employee workstation.
  * Nginx reverse proxy, DVWA, and containerized OWASP Juice Shop.
  * Atomic Red Team test suites, custom Wazuh detection rules, and MITRE ATT&CK validation scenarios.

---

## 3. Compute Specifications

| Instance Name | Role | Subnet | IP Assignment | Default Size | Recommended |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `SOCForge-bastion` | Management Jumpbox | Management (`10.10.1.0/24`) | **Public + Private** | `t3.micro` | 1 vCPU, 1 GB RAM |
| `SOCForge-wazuh` | Wazuh SIEM Server | SOC (`10.10.10.0/24`) | **Private Only** | `t3.medium` | 4 vCPU, 16 GB RAM (`t3.xlarge`) |
| `SOCForge-windows` | Windows Workstation | SOC (`10.10.10.0/24`) | **Private Only** | `t3.medium` | 2 vCPU, 8 GB RAM (`t3.large`) |
| `SOCForge-web` | Web Target Server | Web (`10.10.30.0/24`) | **Private Only** | `t3.micro` | 1 vCPU, 1 GB RAM |
| `SOCForge-attack` | Attack Node | Attack (`10.10.20.0/24`) | **Private Only** | `t3.micro` | 1 vCPU, 1 GB RAM |
