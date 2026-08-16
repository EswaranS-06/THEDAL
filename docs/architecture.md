# SOCForge — Architectural Blueprint

> **Notice**: This document details the architectural blueprint for SOCForge. It clearly delineates components **implemented in Phases 1–7** versus components **planned for future phases**.

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
             |  (Tinyproxy :3128) |
             |   (10.10.1.0/24)   |
             +---------+----------+
                       | (SSH ProxyJump / WinRM & Proxy :3128)
        +--------------+--------------+
        |                             |
        v                             v
+---------------+             +---------------+
|    SOC SG     |             |  Windows SG   |
| [SOCForge-    |             | [SOCForge-    |
|    wazuh]     |             |   windows]    |
| (10.10.10.0)  |             | (10.10.10.0)  |
| - Indexer:9200|             | - Sysmon      |
| - Manager:1514|             | - Auditing    |
| - Dashbrd:443 |             | - Wazuh Agent |
+-------^-------+             +-------+-------+
        |                             |
        | (Wazuh Agent Telemetry      | (Telemetry
        |  1514/1515)                 |  1514/1515)
        +-----------------------------+
        |                             |
        |       +---------------+     | (Simulated
        |       |    Web SG     |<----+  Attack 445/135)
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

### ✅ IMPLEMENTED IN PHASES 1–7
* **Phase 1: Project Foundation**: Directory structure, standards (`.editorconfig`, `.gitignore`, `LICENSE`), developer CLI (`Makefile`), preflight checker (`scripts/preflight.sh`), and health check (`scripts/health-check.sh`).
* **Phase 2: AWS Network Foundation**: Dedicated VPC (`10.10.0.0/16`), single-AZ dynamic discovery, four segregated subnets (Management, SOC, Attack, Web), Internet Gateway (`SOCForge-igw`), and public/private route tables.
* **Phase 3: Security Groups, IAM & Access Control**:
  * **5 Dedicated Security Groups**: `management-sg`, `soc-sg`, `windows-sg`, `web-sg`, and `attack-sg`.
  * **IAM Foundation**: `SOCForge-ec2-base-role` and `SOCForge-ec2-instance-profile` with `AmazonSSMManagedInstanceCore` and CloudWatch logging policies.
  * **EC2 Access & Key Management**: `aws_key_pair` registration from user-provided public key material (`ssh_public_key`).
* **Phase 4: EC2 Compute Infrastructure & Dynamic Inventory Handoff**:
  * **5 EC2 Compute Instances**: `SOCForge-bastion`, `SOCForge-wazuh`, `SOCForge-windows`, `SOCForge-web`, and `SOCForge-attack`.
  * **Dynamic AMI Discovery**: Ubuntu 22.04 LTS and Windows Server 2022 Full Base (x86_64).
  * **Automated Ansible Inventory Pipeline**: `scripts/generate-inventory.py` converts `terraform output -json` into `ansible/inventory/hosts.ini`.
* **Phase 5: Bootstrap & Provisioning Channel**:
  * **Bastion Forward Proxy Architecture**: `tinyproxy` configured on Bastion port `3128` allowing internal private instances to download packages over HTTP/HTTPS without an expensive NAT Gateway.
  * **Ansible Roles**: `roles/common`, `roles/linux-base`, `roles/windows-base`.
* **Phase 6: Wazuh SIEM Platform Deployment**:
  * **Wazuh SIEM All-In-One Stack**: Wazuh Indexer (OpenSearch), Wazuh Manager, Filebeat alert shipper, and Wazuh Dashboard on `SOCForge-wazuh` (pinned `v4.14.7`).
  * **Automated TLS PKI & Dashboard Access**: Encrypted SSH port forward tunnel via Bastion (`scripts/wazuh-tunnel.sh` -> `https://localhost:8443`).
* **Phase 7: Windows Employee Endpoint + Sysmon + Wazuh Agent**:
  * **Advanced Windows Auditing**: Process creation auditing with command line (Event 4688), Logon/Logoff (4624/4625), Account Management (4720/4726).
  * **PowerShell Telemetry**: ScriptBlock Logging (Event 4104) and Module Logging (Event 4103).
  * **Microsoft Sysmon**: Deployed official Sysmon with curated SOCForge XML capturing Process Create (1), Network Connect (3), DLL Load (7), ProcessAccess/LSASS (10), FileCreate (11), Registry (12-14), DNS (22).
  * **Wazuh Agent Deployment & Enrollment**: Automated installation of Wazuh Agent `v4.14.7`, registration against Wazuh Manager (`1515/TCP`), and telemetry streaming (`1514/TCP`).

### ⏳ PLANNED FOR FUTURE PHASES (Phase 8+)
* **Phase 8: Linux Web Target Server + Deliberately Vulnerable Web Application (DVWA)**:
  * Nginx reverse proxy configuration on port `8000`.
  * Deployment and instrumentation of DVWA (PHP/MySQL) with Wazuh Agent log analysis.
* **Phase 9: Containerized OWASP Juice Shop**:
  * Docker-based Juice Shop deployment on port `3000` with container logging.
* **Phase 10: Adversary Emulation & MITRE ATT&CK Detection Engineering**:
  * Atomic Red Team simulation harness on `SOCForge-attack` targeting Windows and Web nodes.
  * Custom Wazuh rules and detection alert mapping.

---

## 3. Windows Endpoint Specifications

| Property | Value | Notes |
| :--- | :--- | :--- |
| **Instance Tag** | `SOCForge-windows` | Dedicated Windows workstation target |
| **Operating System** | Windows Server 2022 Full Base (`x86_64`) | Latest Amazon official AMI |
| **Subnet & IP** | SOC Subnet (`10.10.10.0/24`), Private IP only | No public IP assigned |
| **Instance Type** | `t3.medium` (2 vCPU, 4 GiB RAM) | Expandable to `t3.large` (8 GiB) if required |
| **Root Volume** | 50 GiB gp3 | Sufficient for OS, Event Logs, and lab tooling |
| **Security Group** | `SOCForge-windows-sg` | Management via WinRM/RDP; attack ingress restricted |
| **Key Services** | `W32Time`, `Sysmon64`, `WazuhSvc` | Auto-start on boot |
