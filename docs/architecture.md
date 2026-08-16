# SOCForge — Architectural Blueprint

> **Notice**: This document details the architectural blueprint for SOCForge. It clearly delineates components **implemented in Phases 1–6** versus components **planned for future phases**.

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
| - Indexer:9200|             |               |
| - Manager:1514|             |               |
| - Dashbrd:443 |             |               |
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

### ✅ IMPLEMENTED IN PHASES 1–6
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
  * **Wazuh SIEM All-In-One Stack**: Wazuh Indexer (OpenSearch), Wazuh Manager, Filebeat alert shipper, and Wazuh Dashboard on `SOCForge-wazuh`.
  * **Automated TLS PKI**: Deterministic generation of Root CA and node certificates for Indexer, Filebeat, and Dashboard.
  * **Secure Dashboard Access**: Encrypted SSH port forward tunnel via Bastion (`scripts/wazuh-tunnel.sh` -> `https://localhost:8443`).
  * **Health & Validation Automation**: `scripts/wazuh-health-check.sh` and `ansible/playbooks/wazuh.yml`.

### ⏳ PLANNED FOR FUTURE PHASES (Phase 7+)
* **Phase 7: Endpoint Telemetry & Application Targets**:
  * Windows workstation onboarding with Microsoft Sysmon and Wazuh Agent.
  * Web application server onboarding with Nginx, DVWA, and Docker containerized OWASP Juice Shop.
  * Attack node onboarding with Atomic Red Team test harness and Wazuh Agent.
* **Phase 8: Detection Engineering & MITRE ATT&CK Mapping**:
  * Custom Wazuh detection rules, alert decoders, and multi-stage adversary emulation scenarios.

---

## 3. Wazuh SIEM Component Sizing & Specifications

| Component | Service | Port | JVM / Heap Allocation | Minimum RAM | Recommended RAM |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Wazuh Indexer** | `wazuh-indexer` | 9200 (HTTPS) | 1 GB (`-Xms1g -Xmx1g`) | 2 GB | 8 GB (`t3.xlarge`) |
| **Wazuh Manager** | `wazuh-manager` | 1514 (TCP/UDP), 1515 (TCP), 55000 (HTTPS) | Native C / Python daemon | 1 GB | 4 GB |
| **Filebeat** | `filebeat` | Internal socket | Native Go daemon | 256 MB | 512 MB |
| **Wazuh Dashboard** | `wazuh-dashboard`| 443 (HTTPS) | Node.js runtime | 512 MB | 2 GB |
| **Combined Stack** | All-In-One | — | — | **4 GB (`t3.medium`)** | **16 GB (`t3.xlarge`)** |
