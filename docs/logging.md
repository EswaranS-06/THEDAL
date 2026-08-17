# SOCForge — Telemetry, Logging & Index Architecture

> **Phase 12 Status**: The Wazuh SIEM core, Windows Employee Endpoint (Sysmon + Auditing), Linux Web Target (Nginx :8000 + DVWA), OWASP Juice Shop Container (Docker :3000), Atomic Red Team Attack Simulation Host, Web Security Testing Suite, and **OpenSearch Telemetry Index Architecture & Investigation Dashboards** are operational, reconciled, and instrumented with standardized telemetry metadata.

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
                       | - Decoders & Rule Matching      |
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

## 2. Canonical Telemetry Source Taxonomy

The canonical taxonomy standardizes telemetry collection across all agents and endpoints:

| Taxonomy Source Key | Originating Host | Ingestion Format | Target Index Pattern | SOC Detection & Telemetry Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **`windows_security`** | `SOCForge-windows` | `eventchannel` | `socforge-windows-security-4.x-*` | Process creation (Event 4688 with CLI), authentication (4624/4625), account management (4720). |
| **`sysmon`** | `SOCForge-windows` | `eventchannel` | `socforge-sysmon-4.x-*` | High-fidelity process lineage (1), network connections (3), DLL injection (7), LSASS access (10), DNS (22). |
| **`powershell`** | `SOCForge-windows` | `eventchannel` | `socforge-powershell-4.x-*` | ScriptBlock execution (4104) and module execution (4103) with runtime de-obfuscation. |
| **`nginx_access`** | `SOCForge-web` | `apache` (Combined) | `socforge-nginx-access-4.x-*` | Client IP, HTTP method, URI parameters, status codes, User-Agent for DVWA (:8000). |
| **`nginx_error`** | `SOCForge-web` | `apache` (Standard) | `socforge-nginx-error-4.x-*` | Web server errors, backend FastCGI exceptions, client timeouts. |
| **`dvwa`** | `SOCForge-web` | `syslog` / file | `socforge-dvwa-4.x-*` | PHP-FPM application exceptions, SQL injection attempts, LFI/RFI probes. |
| **`auditd`** | `SOCForge-web` | `audit` | `socforge-auditd-4.x-*` | Kernel audit on command injection discovery binaries (`whoami`) and web root modifications. |
| **`linux_auth`** | `SOCForge-web` / `attack` | `syslog` | `socforge-linux-auth-4.x-*` | SSH authentication attempts, sudo privilege escalation, PAM session tracking. |
| **`juice_shop`** | `SOCForge-web` | `json` | `socforge-juice-shop-4.x-*` | Node.js REST API traffic, search queries, admin config access, container stdout/stderr. |
| **`atomic`** | `SOCForge-attack` | `json` | `socforge-atomic-4.x-*` | Ground-truth simulation execution telemetry for MITRE ATT&CK testing. |
| **`web_attack`** | `SOCForge-attack` | `json` | `socforge-web-attack-4.x-*` | Ground-truth web attack simulation execution telemetry for DVWA & Juice Shop testing. |

---

## 3. Index Lifecycle & Storage Management

* **Default Wazuh Stream**: Preserves `wazuh-alerts-4.x-*` for core Wazuh Dashboard compatibility.
* **Source Routing Layer**: Additive Filebeat routing into source-specific `socforge-<source>-4.x-*` indices.
* **Index State Management (ISM)**: Policy `socforge_retention_policy` rollovers indices after 10 GiB / 7 days and purges expired telemetry indices after **7 days** (`socforge_telemetry_retention_days: 7`).
