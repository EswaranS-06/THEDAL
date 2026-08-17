# SOCForge — Architectural Blueprint

> **Notice**: This document details the architectural blueprint for SOCForge across Phases 1–9.5.

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

## 2. Deterministic Compute Sizing Matrix

All EC2 instances are deterministically defined in `terraform/variables.tf`:

| Instance Name | Variable | Type | vCPU | RAM | Storage | Primary Role & Services |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `SOCForge-bastion` | `bastion_instance_type` | `t3.micro` | 1 | 1 GiB | 20 GiB gp3 | SSH jumpbox, Forward Proxy (`tinyproxy :3128`), Operator gateway. |
| `SOCForge-wazuh` | `wazuh_instance_type` | `t3.medium` | 2 | 4 GiB | 50 GiB gp3 | All-in-one Wazuh SIEM: Indexer (9200), Manager (1514/1515), Dashboard (443). |
| `SOCForge-windows` | `windows_instance_type` | `t3.medium` | 2 | 4 GiB | 50 GiB gp3 | Windows Server 2022 endpoint: Sysmon, ScriptBlock logging, Wazuh Agent. |
| `SOCForge-web` | `web_instance_type` | `t3.small` | 2 | 2 GiB | 20 GiB gp3 | Linux target: Nginx (:8000), DVWA (PHP/MariaDB), Docker Juice Shop (:3000), auditd, Wazuh Agent. |
| `SOCForge-attack` | `attack_instance_type` | `t3.micro` | 1 | 1 GiB | 20 GiB gp3 | Adversary simulation host: Atomic Red Team harness (Phase 10). |

### Wazuh SIEM Sizing: Lab Profile vs. Vendor Production Guidelines

* **SOCForge Lab Profile (`t3.medium` - 2 vCPU, 4 GiB RAM, 50 GiB gp3)**:
  * Tailored for cost-effective single-operator security training labs (1–5 monitored agents).
  * OpenSearch JVM heap is explicitly configured for `-Xms1g -Xmx1g` to prevent memory contention on 4 GiB instances.
  * Single-node all-in-one architecture running Manager, Indexer, Filebeat, and Dashboard concurrently.
* **Official Wazuh Production Guidelines (`t3.xlarge` / `m5.xlarge` - 4–8 vCPU, 8–16 GiB RAM, 100+ GiB storage)**:
  * Recommended by the vendor for enterprise multi-node deployments monitoring 25+ agents with high EPS (events per second) throughput and multi-gigabyte daily index ingestion.
  * `t3.xlarge` is a production scaling option, not a hard prerequisite for lab environments.

---

## 3. Implementation Status by Phase

### ✅ IMPLEMENTED IN PHASES 1–10
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
* **Phase 8: Linux Web Target Server + Deliberately Vulnerable Web Application (DVWA)**:
  * **Nginx Reverse Proxy on Port 8000**: Controlled HTTP entry point with standard combined access and error logging.
  * **DVWA Deployment**: Official PHP-FPM application with isolated MariaDB backend on `127.0.0.1:3306`.
  * **Kernel Auditd Telemetry**: Focused audit rules tracking web directory modifications, Nginx/PHP config tampering, and execution of reconnaissance/staging binaries.
  * **Wazuh Web Agent & FIM**: Automated agent enrollment (`1515/TCP`), real-time FIM on `/var/www/dvwa`, `/etc/nginx`, `/etc/php`, and streaming of Nginx, auth, and audit logs.
* **Phase 9: Containerized OWASP Juice Shop & Container Telemetry**:
  * **Docker Engine with Bastion Proxy**: Official Docker CE and Compose plugin configured with systemd HTTP proxy drop-in for internal image pulls.
  * **OWASP Juice Shop on Port 3000**: Pinned image `bkimminich/juice-shop:v17.1.1` running as an isolated unprivileged container with `unless-stopped` restart policy.
  * **Container Log Streaming & Rotation**: Capped JSON-file log rotation (`max-size: 50m`, `max-file: 3`) streamed into Wazuh Agent (`/var/lib/docker/containers/*/*-json.log`).
* **Phase 9.5: Architecture Consistency & Telemetry Reconciliation**:
  * Comprehensive repository audit, version synchronization (`v4.14.7`), canonical telemetry taxonomy tagging (`socforge.source`), deterministic compute sizing, security group tightening, and documentation reconciliation.
* **Phase 10: Atomic Red Team Adversary Simulation Host**:
  * **PowerShell Core & Execution Harness**: Deployed `pwsh` and official `Invoke-AtomicRedTeam` on `SOCForge-attack` (`10.10.20.x`).
  * **Curated Test Catalog**: 5 low-risk Windows ATT&CK techniques (`T1059.001`, `T1082`, `T1087.001`, `T1016`, `T1053.005`).
  * **Safety Controls & Wrapper**: Simulation execution disabled by default (`atomic_execute: false`), strict target allowlist (`SOCForge-windows`), execution wrapper (`run-atomic-test`), and audit logging (`/var/log/socforge/atomic/`).
* **Phase 11: Controlled Web Security Testing & Web Attack Telemetry**:
  * **Controlled Web Attack Suite**: Deployed curated web scenario catalogs for DVWA (:8000) and OWASP Juice Shop (:3000) on `SOCForge-attack`.
  * **Strict Target Allowlisting & Safety Boundaries**: Dynamic target discovery, port restrictions (8000/3000), execution safety interlocks (`--confirm`), and structured audit logging (`/var/log/socforge/web/simulation.log`).
  * **Web Telemetry Validation**: Ingestion validation across Nginx access/error logs, PHP-FPM, Linux auditd command execution / FIM, and Docker container JSON logs.
* **Phase 12: Telemetry Classification, Source Routing & Index Architecture**:
  * **OpenSearch Index Templates**: Strict schema mapping and type safety for `socforge-*` and all 11 canonical sources.
  * **Filebeat Conditional Routing**: Ingestion routing across source indices while preserving default `wazuh-alerts-4.x-*` pipeline.
  * **Index State Management (ISM)**: Lab disk protection policy with configurable retention (`socforge_telemetry_retention_days: 7`).
  * **Investigation Dashboards**: 4 dedicated OpenSearch Dashboards (Windows, Web, Adversary Attack Ground Truth, and Security Operations Overview).

### ⏳ PLANNED FOR FUTURE PHASES (Phase 13+)
* **Phase 13: SOCForge Detection Engineering & Custom Wazuh Rules**:
  * Custom Wazuh rules and decoders for web attack scenarios (SQLi, command injection, LFI), Docker container attacks, Sysmon parent-child lineage, and Atomic Red Team correlation.
  * Severity tuning, alert thresholding, and false-positive suppression.
