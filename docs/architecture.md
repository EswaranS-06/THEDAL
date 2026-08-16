# SOCForge — Architectural Blueprint

> **Notice**: This document details the architectural blueprint for SOCForge. It clearly delineates components **implemented in Phases 1–3** versus components **planned for future phases**.

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
             |   (10.10.1.0/24)   |
             +---------+----------+
                       | (Internal SSH / WinRM / HTTPS)
        +--------------+--------------+
        |                             |
        v                             v
+---------------+             +---------------+
|    SOC SG     |             |  Windows SG   |
| (Wazuh SIEM)  |             |  (Endpoint)   |
| (10.10.10.0)  |             | (10.10.10.0)  |
+-------^-------+             +-------^-------+
        | (Telemetry                  | (Simulated
        |  1514/1515)                 |  Attack 445/135)
        |                             |
        |       +---------------+     |
        |       |    Web SG     |<----+
        |       | (Juice Shop   |
        |       |   & DVWA)     | (Simulated Attack
        |       | (10.10.30.0)  |  8000/3000)
        |       +-------^-------+
        |               |
        +---------------+-------------+
                        | (Agent Telemetry 1514/1515)
              +---------+---------+
              |     Attack SG     |
              | (Atomic Red Team) |
              |  (10.10.20.0/24)  |
              +-------------------+
```

---

## 2. Implementation Status by Phase

### ✅ IMPLEMENTED IN PHASES 1–3
* **Phase 1: Project Foundation**: Directory structure, standards (`.editorconfig`, `.gitignore`, `LICENSE`), developer CLI (`Makefile`), preflight checker (`scripts/preflight.sh`), and health check (`scripts/health-check.sh`).
* **Phase 2: AWS Network Foundation**: Dedicated VPC (`10.10.0.0/16`), single-AZ dynamic discovery, four segregated subnets (Management, SOC, Attack, Web), Internet Gateway (`SOCForge-igw`), and public/private route tables.
* **Phase 3: Security Groups, IAM & Access Control**:
  * **5 Dedicated Security Groups**: `management-sg`, `soc-sg`, `windows-sg`, `web-sg`, and `attack-sg` with strict inter-group referencing.
  * **Zero Direct Public Exposure**: Vulnerable web apps (port 8000, 3000) and Windows RDP are isolated in private subnets with no public ingress.
  * **IAM Foundation**: `SOCForge-ec2-base-role` and `SOCForge-ec2-instance-profile` with `AmazonSSMManagedInstanceCore` and least-privilege CloudWatch logging policies.
  * **EC2 Access & Key Management**: `aws_key_pair` registration from user-provided public key material (`ssh_public_key`).
  * **Management Control Plane**: Bastion jumpbox pattern with SSH `ProxyJump` for operator and Ansible automation.

### ⏳ PLANNED FOR FUTURE PHASES (Not Yet Deployed)
* **Phase 4: EC2 Compute Infrastructure & Dynamic Inventory**:
  * Compute instances: Wazuh Server (`t3.medium`), Windows Endpoint (`t3.medium`), Linux Web Server (`t3.micro`), Attack Node (`t3.micro`), and Bastion (`t3.micro`).
  * Terraform-to-Ansible inventory generation (`hosts.ini` / `aws_ec2.yml`).
* **Phase 5: Ansible Configuration, Telemetry & Detection Engineering**:
  * Automated software provisioning (Wazuh Manager/Indexer/Dashboard, Sysmon, Nginx, Docker, OWASP Juice Shop, Atomic Red Team).
  * Custom Wazuh decoders, detection rules, and MITRE ATT&CK attack scenarios.

---

## 3. Security & Access Model

### Operator & Ansible Connectivity
* All private instances (`10.10.10.x`, `10.10.20.x`, `10.10.30.x`) are accessed via SSH `ProxyJump` through the public Management Bastion (`10.10.1.x`).
* Direct public SSH ingress is restricted to the operator's trusted IP range (`admin_cidr`).
* Windows endpoints are managed over WinRM / RDP tunneled through the bastion or via secure SSH local forwarding.

### Credential Separation
* **AWS API Credentials**: Reside strictly on the control workstation and are used only by Terraform.
* **EC2 SSH Private Keys**: Generated locally on the operator machine and never written to Terraform state, outputs, or Git.
