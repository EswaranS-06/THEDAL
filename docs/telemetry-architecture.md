# SOCForge — Phase 12: Telemetry Classification, Source Routing & Index Architecture Guide

> **Status**: Telemetry classification, OpenSearch index templates, Index State Management (ISM) retention policies, Filebeat source-specific routing rules, OpenSearch Dashboards, and validation tooling are fully implemented and verified offline. Live ingestion into OpenSearch remains pending cloud deployment via `terraform apply`.

---

## 1. End-to-End Telemetry Routing Architecture

The SOCForge telemetry architecture classifies, normalizes, and routes incoming security telemetry into source-specific OpenSearch indices while maintaining the default `wazuh-alerts-*` index stream:

```text
+------------------------------------+      +------------------------------------+      +------------------------------------+
|  Windows Endpoint (10.10.10.x)     |      |   Linux Web Target (10.10.30.x)    |      |   Attack Simulation (10.10.20.x)   |
|                                    |      |                                    |      |                                    |
| - Security Channel (4688 with CLI) |      | - Nginx Access & Error (:8000)     |      | - Atomic Red Team (pwsh)           |
| - Sysmon Operational (1, 3, 7, 10) |      | - Linux Auditd (/var/log/audit)    |      | - Web Testing Suite (run-web-test) |
| - PowerShell (ScriptBlock 4104)    |      | - Docker JSON Container (:3000)    |      | - Audit Logs (/var/log/socforge/)  |
| [Label: socforge.source=*]         |      | [Label: socforge.source=*]         |      | [Label: socforge.source=*]         |
+-----------------+------------------+      +-----------------+------------------+      +-----------------+------------------+
                  |                                           |                                           |
                  +-------------------------------------------+-------------------------------------------+
                                                              | (Encrypted TLS 1514)
                                                              v
                                             +---------------------------------+
                                             |   SOCForge Wazuh SIEM Manager   |
                                             |         (10.10.10.x:1514)       |
                                             | - Decoders & Rule Evaluation    |
                                             | - Appends Metadata to alerts    |
                                             +----------------+----------------+
                                                              |
                                                              | (/var/ossec/logs/alerts/alerts.json)
                                                              v
                                             +---------------------------------+
                                             |   Filebeat Ingestion & Router   |
                                             |         (10.10.10.x)            |
                                             | - Inspects socforge.source label|
                                             | - Preserves wazuh-alerts-*      |
                                             +----------------+----------------+
                                                              |
                                                              | HTTPS :9200
                                                              v
                                             +---------------------------------+
                                             |   Wazuh Indexer (OpenSearch)    |
                                             |   - socforge-template.json      |
                                             |   - socforge-ism-policy.json    |
                                             +----------------+----------------+
                                                              |
                 +--------------------------------------------+--------------------------------------------+
                 |                     |                      |                      |                     |
                 v                     v                      v                      v                     v
   +---------------------------+ +--------------------+ +--------------------+ +--------------------+ +--------------------+
   | socforge-windows-sec-*    | | socforge-sysmon-*  | | socforge-powershell| | socforge-nginx-*   | | socforge-juice-*   |
   | (Windows Event Logs)      | | (Sysmon Lineage)   | | (ScriptBlock 4104) | | (Nginx Access/Err) | | (Docker JSON Logs) |
   +---------------------------+ +--------------------+ +--------------------+ +--------------------+ +--------------------+
                 |                     |                      |                      |                     |
                 +---------------------+----------------------+----------------------+---------------------+
                                                              |
                                                              v
                                             +---------------------------------+
                                             |   Wazuh Dashboard (HTTPS :443)  |
                                             |   - 4 Investigation Dashboards  |
                                             |   - 12 Source Index Patterns    |
                                             +---------------------------------+
```

---

## 2. Canonical Telemetry Source Taxonomy

The canonical taxonomy standardizes metadata across all agents and endpoints:

| Taxonomy Source Key | Index Name Pattern | Originating Host | Ingestion Format | Log Purpose & SOC Investigation Value |
| :--- | :--- | :--- | :--- | :--- |
| **`windows_security`** | `socforge-windows-security-4.x-*` | `SOCForge-windows` | `eventchannel` | Process creation (Event 4688 with CLI), authentication success/failure (4624/4625), account management (4720). |
| **`sysmon`** | `socforge-sysmon-4.x-*` | `SOCForge-windows` | `eventchannel` | High-fidelity process lineage (Event 1), network connections (3), DLL injection (7), LSASS access (10), DNS queries (22). |
| **`powershell`** | `socforge-powershell-4.x-*` | `SOCForge-windows` | `eventchannel` | ScriptBlock execution (Event 4104) and module execution (4103) with de-obfuscation at runtime. |
| **`nginx_access`** | `socforge-nginx-access-4.x-*` | `SOCForge-web` | `apache` (Combined) | HTTP methods, URI parameters, client IPs, response codes, User-Agents for DVWA on port 8000. |
| **`nginx_error`** | `socforge-nginx-error-4.x-*` | `SOCForge-web` | `apache` (Standard) | Reverse proxy errors, FastCGI backend exceptions, client timeouts. |
| **`dvwa`** | `socforge-dvwa-4.x-*` | `SOCForge-web` | `syslog` / file | PHP-FPM application exceptions, database error traces, authentication failures. |
| **`auditd`** | `socforge-auditd-4.x-*` | `SOCForge-web` | `audit` | Kernel syscall execution for command injection discovery binaries (`whoami`) and file modifications in web roots. |
| **`linux_auth`** | `socforge-linux-auth-4.x-*` | `SOCForge-web` / `attack` | `syslog` | SSH authentication, sudo privilege escalation, PAM session tracking. |
| **`juice_shop`** | `socforge-juice-shop-4.x-*` | `SOCForge-web` | `json` | Node.js REST API traffic, search queries, admin endpoints, uncaught database exceptions for Juice Shop (:3000). |
| **`atomic`** | `socforge-atomic-4.x-*` | `SOCForge-attack` | `json` | Ground-truth adversary simulation records for MITRE ATT&CK testing (`/var/log/socforge/atomic/simulation.log`). |
| **`web_attack`** | `socforge-web-attack-4.x-*` | `SOCForge-attack` | `json` | Ground-truth web attack records for DVWA & Juice Shop testing (`/var/log/socforge/web/simulation.log`). |

---

## 3. Metadata Schema & Normalized Fields

```json
{
  "socforge": {
    "source": "windows_security",
    "application": "windows-endpoint",
    "host_role": "endpoint",
    "telemetry_type": "eventchannel",
    "simulation_id": "SIM-1723901234-4589",
    "scenario_id": "T1082-1",
    "technique_id": "T1082"
  }
}
```

### Type Safety & Mapping Standards:
* **Timestamps**: `@timestamp` and `timestamp` mapped explicitly as `date`.
* **Identifiers & Categorical Fields**: `rule.id`, `agent.id`, `agent.name`, `decoder.name`, `socforge.*` mapped as `keyword`.
* **Metrics & Status Codes**: `rule.level`, `data.http_status`, `data.srcport`, `data.dstport` mapped as `integer`.
* **Network IP Addresses**: `data.srcip`, `data.dstip`, `agent.ip` mapped as `ip`.
* **Text Search Fields**: `full_log`, `data.win.eventdata.commandLine`, `rule.description` mapped as `text` with `keyword` multi-fields.

---

## 4. Preservation of Default Wazuh Indexes

The default Wazuh indexing architecture is fully preserved:
* **`wazuh-alerts-4.x-*`**: Receives all Wazuh security alerts regardless of classification.
* **Wazuh Dashboard App**: Continues to query `pattern: "wazuh-alerts-*"` without disruption.
* **Source-Specific Indexes (`socforge-*`)**: Provide dedicated, isolated search boundaries for deep SOC investigation and performance optimization.

---

## 5. Storage Protection & Index State Management (ISM)

The Wazuh single-node host uses a `t3.medium` (2 vCPU, 4 GiB RAM, 50 GiB gp3) profile. To prevent storage exhaustion:
1. **ISM Policy (`socforge_retention_policy`)**:
   * **Hot State**: Shards rollover when primary shard size reaches `10 GiB` or index age reaches `7 days`.
   * **Delete State**: Automatically purges telemetry indices older than `{{ socforge_telemetry_retention_days }}` (default: **7 days** in lab profile).
2. **Alert vs. Telemetry Retention**:
   * Telemetry Indices: **7 days** (`socforge_telemetry_retention_days: 7`)
   * Alert Indices: **14 days** (`socforge_alert_retention_days: 14`)
   * Archive Indices: **3 days** (`socforge_archive_retention_days: 3`)

---

## 6. Investigation Dashboards Overview

Four curated OpenSearch Dashboards are pre-configured:

### 1. `SOCForge — Windows Endpoint Investigation`
* **Focus**: Windows Security, Sysmon process creation, PowerShell ScriptBlock execution.
* **Visualizations**: Alerts by severity level, top monitored hosts, process execution timeline.

### 2. `SOCForge — Web Applications Investigation`
* **Focus**: Nginx reverse proxy access/error logs, DVWA PHP events, OWASP Juice Shop container JSON stream.
* **Visualizations**: HTTP response status codes breakdown, top requested URI endpoints, web attack source distribution.

### 3. `SOCForge — Adversary Attack Activity & Ground Truth`
* **Focus**: Correlation table mapping Atomic Red Team and Web Attack ground-truth logs to security alerts.
* **Visualizations**: Simulation ID, Scenario ID, Technique ID, Target IP, execution duration, cleanup status.

### 4. `SOCForge — Security Operations Overview`
* **Focus**: High-level SOC triage across all endpoints and web targets.
* **Visualizations**: Events by source taxonomy pie chart, alert severity distribution, top affected hosts.

---

## 7. Useful Investigation Queries (DQL / Lucene)

```text
# 1. Query all Juice Shop container events:
data.labels.socforge.source: "juice_shop"

# 2. Query all Sysmon high-fidelity events:
data.labels.socforge.source: "sysmon"

# 3. Query specific Atomic Red Team simulation:
data.labels.socforge.simulation_id: "SIM-*"

# 4. Query web attack scenario:
data.labels.socforge.scenario_id: "DVWA-03"

# 5. Query PowerShell scriptblock executions:
data.labels.socforge.source: "powershell" AND data.win.system.eventID: "4104"

# 6. Correlate adversary command execution with Sysmon Process Create:
data.labels.socforge.source: "sysmon" AND data.win.eventdata.image: "*whoami.exe"
```

---

## 8. Verification & Validation Summary

### 🟢 Configuration Validation (Passed)
* `terraform validate`: **Success**.
* `terraform plan`: **Success** (58 resources verified).
* `make ansible-syntax`: **Success** across all 9 playbooks.
* `scripts/wazuh-index-health-check.sh`: **Success** (All 11 source routing rules, templates, and NDJSON dashboards verified).
* Secret scan: **0 secrets detected**.

### 🟡 Live Deployment Validation (Pending)
* `terraform apply` has not been executed. Live index creation and dashboard ingestion will activate once live AWS infrastructure is provisioned.
