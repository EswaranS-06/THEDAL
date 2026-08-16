# SOCForge — Architectural Blueprint

> **Notice**: This document details the architectural blueprint for SOCForge. It clearly delineates components **implemented in Phases 1–5** versus components **planned for future phases**.

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

### ✅ IMPLEMENTED IN PHASES 1–5
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
  * **Playbooks**: `playbooks/bootstrap.yml` (connectivity & repo reachability tests), `playbooks/linux-base.yml`, `playbooks/windows-base.yml`.
  * **Baseline Configurations**: Kernel sysctl tuning (`vm.max_map_count=262144`), Amazon Time Sync NTP, foundational packages, and Windows event log buffer expansion.

### ⏳ PLANNED FOR FUTURE PHASES (Phase 6+)
* **Phase 6: Wazuh SIEM Platform Deployment**:
  * Deployment and configuration of Wazuh Manager, Wazuh Indexer, and Wazuh Dashboard on the SOC server.
* **Phase 7: Endpoint Telemetry & Application Targets**:
  * Wazuh Agent deployment on Windows, Web, and Attack instances.
  * Microsoft Sysmon configuration on Windows.
  * Nginx reverse proxy, DVWA, and Docker containerized OWASP Juice Shop.
* **Phase 8: Attack Simulation & Detection Engineering**:
  * Atomic Red Team simulation playbooks and custom Wazuh detection rules mapped to MITRE ATT&CK.

---

## 3. Provisioning Channel Comparison

| Strategy | Cost | Security | Protocol Support | Selected? |
| :--- | :--- | :--- | :--- | :--- |
| **AWS NAT Gateway** | ~$32.40/month + data fees | High | All TCP/UDP outbound | ❌ Rejected (Violates low-cost educational goal) |
| **Public IPs on Private Nodes** | Free | ⚠️ Unsafe (Exposes vulnerable targets) | All outbound | ❌ Rejected (Breaches least-privilege isolation) |
| **Bastion Forward Proxy (Tinyproxy)** | **$0 additional** | **High (Internal VPC only)** | **HTTP/HTTPS (APT, Wazuh, Docker)** | **✅ SELECTED** |
