# THEDAL — Telemetry, Logging, Index & Detection Architecture

### Threat Hunting, Exploration, Detection, Analysis and Learn

> **Phase 13 Status**: The Wazuh SIEM core, Windows Employee Endpoint (Sysmon + Auditing), Linux Web Target (Nginx :8000 + DVWA), OWASP Juice Shop Container (Docker :3000), Atomic Red Team Attack Simulation Host, Web Security Testing Suite, OpenSearch Telemetry Index Architecture, and **SOC Detection Engineering & Custom Wazuh Rules** are operational, reconciled, and instrumented.

---

## 1. Multi-Node Telemetry & Adversary Emulation Flow

```text
               +------------------------------------+
               |   Attack Simulation (10.10.20.x)   |
               |                                    |
               | - Invoke-AtomicRedTeam (pwsh)      |
               | - Atomic Simulation Log (atomic)   |
               | - Web Attack Suite (run-web-test)  |
               | - Web Simulation Log (web_attack)  |
               +-----------------+------------------+
                                 |
                                 | Controlled ATT&CK / Web Traffic
                                 | (SMB 445 / WinRM / HTTP 8000 / HTTP 3000)
                                 v
+------------------------------------+      +------------------------------------+
|  Windows Endpoint (10.10.10.x)     |      |   Linux Web Target (10.10.30.x)    |
|                                    |      |                                    |
| - Security Auditing (4688, 4624)   |      | - Nginx Access & Error (:8000)     |
| - PowerShell (4104 ScriptBlock)    |      | - Linux Auditd (/var/log/audit)    |
| - Microsoft Sysmon (1, 3, 7, 10)   |      | - Linux Auth Log (/var/log/auth)   |
| - Wazuh Agent Service (WazuhSvc)   |      | - Real-time FIM (/var/www/dvwa)    |
| - Encrypted Streaming (TCP 1514)   |      | - Docker JSON Logs (:3000 Juice)   |
| - Automated Enrollment (TCP 1515)  |      | - Wazuh Agent Daemon (wazuh-agent) |
+-----------------+------------------+      +-----------------+------------------+
                  |                                           |
                  +---------------------+---------------------+
                                        | (Encrypted TLS 1514)
                                        v
                       +---------------------------------+
                       |   SOCForge Wazuh SIEM Manager   |
                       |         (10.10.10.x:1514)       |
                       | - Decoders: socforge_decoders   |
                       | - Rules: socforge_rules (100k)  |
                       +----------------+----------------+
                                        |
                                        v
                       +---------------------------------+
                       |   Filebeat Ingestion & Router   |
                       | - Source Index Routing (11 src) |
                       | - Preserves wazuh-alerts-*      |
                       +----------------+----------------+
                                        |
                                        v
                       +---------------------------------+
                       |   Wazuh Indexer (OpenSearch)    |
                       | - socforge-template.json        |
                       | - socforge_retention_policy     |
                       +----------------+----------------+
                                        |
                                        v
                       +---------------------------------+
                       |   Wazuh Dashboard (HTTPS :443)  |
                       | - 4 Curated Dashboards          |
                       | - 12 Source Index Patterns      |
                       +---------------------------------+
```

---

## 2. Canonical Telemetry Source Taxonomy & Detection Mapping

| Taxonomy Source Key | Originating Host | Ingestion Format | Target Index Pattern | Primary Custom Wazuh Detection Rules |
| :--- | :--- | :--- | :--- | :--- |
| **`windows_security`** | `SOCForge-windows` | `eventchannel` | `socforge-windows-security-4.x-*` | Rule `100404` (Discovery commands, Event 4688). |
| **`sysmon`** | `SOCForge-windows` | `eventchannel` | `socforge-sysmon-4.x-*` | Rules `100401` (PS Cradle), `100403` (Parent-Child), `100405` (LSASS), `100406` (Schtasks). |
| **`powershell`** | `SOCForge-windows` | `eventchannel` | `socforge-powershell-4.x-*` | Rule `100402` (Encoded Command / ScriptBlock 4104). |
| **`nginx_access`** | `SOCForge-web` | `apache` (Combined) | `socforge-nginx-access-4.x-*` | Rules `100101` (SQLi), `100102` (Cmdi), `100103` (LFI), `100104` (Upload), `100301` (Scan). |
| **`nginx_error`** | `SOCForge-web` | `apache` (Standard) | `socforge-nginx-error-4.x-*` | Backend exceptions, FastCGI errors. |
| **`dvwa`** | `SOCForge-web` | `syslog` / file | `socforge-dvwa-4.x-*` | PHP runtime exceptions and SQL errors. |
| **`auditd`** | `SOCForge-web` | `audit` | `socforge-auditd-4.x-*` | Rule `100501` (Web service account binary execution) & `100601` (Correlation). |
| **`linux_auth`** | `SOCForge-web` / `attack` | `syslog` | `socforge-linux-auth-4.x-*` | Rule `100502` (Sudo privilege escalation failure). |
| **`juice_shop`** | `SOCForge-web` | `json` | `socforge-juice-shop-4.x-*` | Rules `100201` (API enum), `100202` (Auth abuse), `100203` (SQLi), `100204` (Admin), `100205` (DB error). |
| **`atomic`** | `SOCForge-attack` | `json` | `socforge-atomic-4.x-*` | Ground-truth simulation execution audit logs for ATT&CK testing. |
| **`web_attack`** | `SOCForge-attack` | `json` | `socforge-web-attack-4.x-*` | Ground-truth web attack simulation execution audit logs for DVWA & Juice Shop testing. |

---

## 3. Index Lifecycle & Storage Management

* **Default Wazuh Stream**: Preserves `wazuh-alerts-4.x-*` for core Wazuh Dashboard compatibility.
* **Source Routing Layer**: Additive Filebeat routing into source-specific `socforge-<source>-4.x-*` indices.
* **Index State Management (ISM)**: Policy `socforge_retention_policy` rollovers indices after 10 GiB / 7 days and purges expired telemetry indices after **7 days** (`socforge_telemetry_retention_days: 7`).
