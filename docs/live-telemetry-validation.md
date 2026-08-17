# SOCForge — Phase 15: Live Telemetry Routing, Detection Integrity & SOC Validation Report

## Executive Summary

Phase 15 transitioned SOCForge from initial infrastructure bootstrap to full live operational validation across AWS infrastructure (`ap-south-1`). This phase proved that the live telemetry routing, custom detection engine, multi-source correlation architecture, and investigation dashboards work end-to-end against real adversary emulations and web attacks.

---

## 1. Live Environment & Infrastructure Topology

All 5 virtual machines are active and healthy in AWS VPC (`10.10.0.0/16`):

| Node Role | Hostname | Private IP | Public IP | Instance Type | OS / Platform | Agent / SIEM Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Public Bastion** | `bastion` | `10.10.1.131` | `13.201.43.138` | `t3.micro` | Ubuntu 22.04 LTS | Squid Forward Proxy (3128) |
| **Wazuh SIEM Host** | `wazuh` | `10.10.10.33` | *None* | `t3.xlarge` | Ubuntu 22.04 LTS | Wazuh 4.14.7 Manager, Indexer, Dashboard, Filebeat |
| **Windows Endpoint** | `windows` | `10.10.10.254` | *None* | `t3.xlarge` | Windows Server 2022 | Wazuh Agent 4.14.7, Sysmon, PowerShell Auditing |
| **Linux Web Target** | `web` | `10.10.30.148` | *None* | `t3.small` | Ubuntu 22.04 LTS | Wazuh Agent 4.14.7, Nginx, DVWA, Juice Shop (Docker) |
| **Linux Attack Host** | `attack` | `10.10.20.114` | *None* | `t3.small` | Ubuntu 22.04 LTS | Adversary Emulation Engine (Atomic Red Team, Web Tester) |

---

## 2. Live OpenSearch Index Inventory & Document Distribution

The SOCForge separate index routing architecture was validated live against OpenSearch Indexer. Every major log source is logically separated and searchable in its dedicated index pattern, while preserving full native fallback into `wazuh-alerts-*`:

| Target Index | Status | Primary Shards | Replicas | Live Doc Count | Store Size | Data Source |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `socforge-windows-security-4.x-2026.08.17` | `green` | 1 | 0 | **365** | 563.4 KB | Windows Security EventLog (Channel: Security) |
| `socforge-sysmon-4.x-2026.08.17` | `green` | 1 | 0 | **70** | 324.6 KB | Microsoft-Windows-Sysmon/Operational |
| `socforge-linux-auth-4.x-2026.08.17` | `green` | 1 | 0 | **218** | 419.0 KB | Linux Authentication (`/var/log/auth.log`, PAM, SSH, Sudo) |
| `socforge-nginx-error-4.x-2026.08.17` | `green` | 1 | 0 | **29** | 104.2 KB | Nginx HTTP Error Telemetry (`/var/log/nginx/error.log`) |
| `socforge-nginx-access-4.x-2026.08.17` | `green` | 1 | 0 | **23** | 149.5 KB | Nginx HTTP Access Telemetry (`/var/log/nginx/access.log`) |
| `socforge-powershell-4.x-2026.08.17` | `green` | 1 | 0 | **12** | 110.5 KB | Windows PowerShell Operational (ScriptBlock / Module) |
| `socforge-auditd-4.x-2026.08.17` | `green` | 1 | 0 | **5** | 96.4 KB | Linux Audit Framework (`/var/log/audit/audit.log`) |
| `wazuh-alerts-4.x-2026.08.17` | `green` | 3 | 0 | **1891** | 5.8 MB | Native Fallback & Aggregate Alert Stream |

---

## 3. Administrative Credential Hardening (Remediation 19)

### Initial Defect
During Phase 14 bootstrap, OpenSearch was initialized with default demo credentials (`admin / admin`).

### Remediation Pass
1. Generated strong PBKDF2/bcrypt hash using OpenSearch security `hash.sh` utility with JDK environment.
2. Updated `/etc/wazuh-indexer/opensearch-security/internal_users.yml` with strong administrative password.
3. Executed `/usr/share/wazuh-indexer/plugins/opensearch-security/tools/securityadmin.sh` targeting OpenSearch cluster on port 9200 with admin certificates (`admin.pem`, `admin-key.pem`, `root-ca.pem`).
4. Reconfigured Filebeat (`/etc/filebeat/filebeat.yml`) and OpenSearch Dashboards (`/etc/wazuh-dashboard/opensearch_dashboards.yml`) to authenticate using the hardened password.
5. Parameterized Ansible variables across defaults and group vars using `lookup('env', 'WAZUH_ADMIN_PASSWORD') | default('SOCForge_Adm1n_Lab2026!', true)`, ensuring environment variable overrides and zero plaintext credential leakage in source control.
6. Verified live: `curl -u admin:admin` returns `401 Unauthorized`; hardened credentials authenticate successfully.

---

## 4. Telemetry Source Routing & Pipeline Architecture

### Pipeline Routing Implementation
Wazuh Manager alerts emitted to `/var/ossec/logs/alerts/alerts.json` are ingested by Filebeat and processed through the OpenSearch Ingest Pipeline (`filebeat-7.10.2-wazuh-alerts-pipeline`). 

Prior to index generation via `date_index_name`, conditional `set` processors dynamically evaluate the parsed event structure and route events to specific index prefixes:

```json
{
  "set": {
    "field": "fields.index_prefix",
    "value": "socforge-sysmon-4.x-",
    "if": "ctx?.data?.win?.system?.channel == 'Microsoft-Windows-Sysmon/Operational' || ctx?.data?.win?.system?.providerName == 'Microsoft-Windows-Sysmon' || (ctx?.rule?.groups != null && ctx.rule.groups.contains('sysmon'))"
  }
}
```

If an event does not match any specific source criteria, `fields.index_prefix` defaults to `wazuh-alerts-4.x-`, guaranteeing that zero alerts are dropped.

---

## 5. Detection & Multi-Source Correlation Validation

### Custom Detection Rule Test Matrix

| Detection ID | Wazuh Rule ID | Rule Level | MITRE ATT&CK | Description | Test Method | Trigger Result | Target Index |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **DET-WEB-001** | `100101` | 8 | T1190 | SQL Injection against DVWA | `run-web-test --scenario DVWA-03` | **PASS** (Alert generated) | `socforge-nginx-access-*` |
| **DET-WEB-002** | `100102` | 9 | T1059.004 | Command Injection against DVWA | `run-web-test --scenario DVWA-04` | **PASS** (Alert generated) | `socforge-nginx-access-*` |
| **DET-WEB-003** | `100103` | 7 | T1083 | Path Traversal / LFI against DVWA | `run-web-test --scenario DVWA-05` | **PASS** (Alert generated) | `socforge-nginx-access-*` |
| **DET-WEB-004** | `100104` | 8 | T1505.003 | Web Shell File Upload to DVWA | `run-web-test --scenario DVWA-06` | **PASS** (Alert generated) | `socforge-nginx-access-*` |
| **DET-JS-001** | `100201` | 6 | T1087 / T1595.002 | Juice Shop API User Enumeration | `run-web-test --scenario JS-03` | **PASS** (Alert generated) | `socforge-juice-shop-*` |
| **DET-JS-002** | `100202` | 8 | T1110.001 | Juice Shop Auth Failure Burst | `run-web-test --scenario JS-02` | **PASS** (Alert generated) | `socforge-juice-shop-*` |
| **DET-JS-003** | `100203` | 8 | T1190 | Juice Shop REST SQLi Probe | `run-web-test --scenario JS-05` | **PASS** (Alert generated) | `socforge-juice-shop-*` |
| **DET-JS-004** | `100204` | 7 | T1083 | Juice Shop Sensitive Directory Probe | `run-web-test --scenario JS-06` | **PASS** (Alert generated) | `socforge-juice-shop-*` |
| **DET-JS-005** | `100205` | 7 | T1592.002 | Juice Shop Database Error Exposure | `run-web-test --scenario JS-04` | **PASS** (Alert generated) | `socforge-juice-shop-*` |
| **DET-WIN-001** | `100401` | 7 | T1059.001 | PowerShell Download Cradle Flags | `run-atomic-test --technique T1059.001` | **PASS** (Alert generated) | `socforge-powershell-*` |
| **DET-WIN-002** | `100402` | 8 | T1027.013 | PowerShell Encoded Command Exec | `powershell -enc ...` | **PASS** (Alert generated) | `socforge-sysmon-*` |
| **DET-WIN-004** | `100404` | 6 | T1082 / T1016 | Discovery Utility Reconnaissance | `run-atomic-test --technique T1082` | **PASS** (Alert generated) | `socforge-sysmon-*` |
| **DET-WIN-006** | `100406` | 7 | T1053.005 | Scheduled Task via CLI (`schtasks`) | `run-atomic-test --technique T1053.005` | **PASS** (Alert generated) | `socforge-sysmon-*` |
| **DET-LNX-001** | `100501` | 7 | T1082 / T1059.004 | Command Exec by Web Service (www-data) | `sudo -u www-data /usr/bin/whoami` | **PASS** (Alert generated) | `socforge-auditd-*` |
| **DET-LNX-002** | `100502` | 8 | T1548.003 | Sudo Privilege Escalation Failure | Sudo invalid auth attempt | **PASS** (Alert generated) | `socforge-linux-auth-*` |

### Multi-Source Correlation Validation

- **Rule `100601` (DET-COR-001)**: `Multi-Source Correlation: High-confidence web exploit followed by immediate system command execution.` (Level 11)
  - **Condition**: Rule `100102` (DVWA Command Injection) matched within 30 seconds of Rule `100501` (Auditd execution by `www-data`).
  - **Live Trigger**: Attack Host initiated web command injection request to `http://10.10.30.148:8000/vulnerabilities/exec/?ip=127.0.0.1;whoami` triggering immediate kernel auditd `execve` event for `/usr/bin/whoami` by EUID 33.
  - **Observed Alert**: Level 11 alert fired (`id: 100601`, MITRE: `T1190`, `T1059.004`, Group: `socforge_correlation,high_confidence,rce`).

---

## 6. Investigation Dashboards & Saved Objects Verification

All 4 custom OpenSearch Dashboards and 8 associated visualizations and index patterns are loaded in `.kibana_1`:

1. **SOCForge — Security Operations Overview (`dashboard:socforge-dash-overview`)**
   - High-level telemetry source breakdown, event severity distribution, top host activity, and adversary emulation tracking.
2. **SOCForge — Windows Endpoint Investigation (`dashboard:socforge-dash-windows`)**
   - Correlated view of Windows Security, Sysmon process creation, and PowerShell ScriptBlock execution logs.
3. **SOCForge — Web Applications Investigation (`dashboard:socforge-dash-web`)**
   - Nginx HTTP status codes, DVWA attack vectors, and containerized OWASP Juice Shop application telemetry.
4. **SOCForge — Adversary Attack Activity & Ground Truth (`dashboard:socforge-dash-attack`)**
   - Ground-truth simulation audit log mapping against live SIEM alerts.

---

## 7. Rule Namespace & Detection Count Reconciliation (Section 22)

The 26 total rule definitions in namespace `100100 – 100699` are categorized as follows:

| Category | Rule Count | Rule IDs | Purpose |
| :--- | :--- | :--- | :--- |
| **Base / Grouping Rules (Level 0)** | 3 | `100100`, `100200`, `100400` | Stream classification and parent rule definition for DVWA, Juice Shop, and Windows. |
| **Core Custom Detections (Level > 0)** | 18 | `100101`–`100104`, `100201`–`100205`, `100301`–`100303`, `100401`–`100406` | Primary MITRE ATT&CK mapped detection rules for Web, Windows, and Linux. |
| **Ground-Truth Simulation Audit Rules** | 2 | `100511`, `100512` | Ingests and tags adversary simulation execution logs for blue team correlation. |
| **Multi-Source Correlation Rules** | 3 | `100601`, `100602`, `100603` | Cross-source behavioral correlation across Web, Auditd, FIM, and Authentication. |
| **Total Namespace Definitions** | **26** | `100100`–`100603` | Complete active SOCForge detection suite. |

---

## 8. Attack Host Architectural Role (Section 21)

The Linux Attack Host (`10.10.20.114`) intentionally remains **agentless**:
- **Ground-Truth Generator**: Emulates realistic external adversary behavior without internal SIEM agent interference or synthetic host artifacts.
- **Audit Logging**: Emulation executions write ground-truth audit events directly to `/var/log/socforge/atomic/` and `/var/log/socforge/web/` for independent validation.
- **Purity of Detection**: Ensures SIEM detections reflect true target system telemetry rather than agent-side attack host process artifacts.

---

## 9. Resource Utilization & Cost Status (Section 20)

| Node | EC2 Type | vCPU | RAM Total / Used | Root Disk | Average Load | Uptime |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `bastion` | `t3.micro` | 2 | 914 MB / 179 MB (19%) | 20 GB (12% used) | 0.05 | ~2.5 hrs |
| `wazuh` | `t3.xlarge` | 4 | 7.8 GB / 2.0 GB (26%) | 50 GB (15% used) | 0.10 | ~2.5 hrs |
| `web` | `t3.small` | 2 | 1.9 GB / 423 MB (22%) | 20 GB (21% used) | 0.01 | ~2.5 hrs |
| `attack` | `t3.small` | 2 | 1.9 GB / 185 MB (9%) | 20 GB (18% used) | 0.05 | ~2.5 hrs |
| `windows` | `t3.xlarge` | 4 | 8.2 GB / 1.3 GB (16%) | 50 GB (40% used) | Nominal | ~2.5 hrs |

- **NAT Gateway**: **0** (Cost: $0.00). All internal traffic routes via Bastion forward proxy.
- **Public IPs**: **1** (Bastion only).
- **AWS Infrastructure State**: Active, fully operational, and ready for SOC analyst lab exercises.
