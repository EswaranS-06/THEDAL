# SOCForge — Telemetry, Logging & Index Architecture

> **Phase 9 Status**: The Wazuh SIEM core, Windows Employee Endpoint (Sysmon + Auditing), Linux Web Target (Nginx :8000 + DVWA), and **OWASP Juice Shop Container Telemetry (Docker :3000)** are operational and instrumented for security event collection.

---

## 1. Multi-Node Telemetry Architecture

```text
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
                       |   Wazuh Indexer (OpenSearch)    |
                       |         (10.10.10.x:9200)       |
                       +----------------+----------------+
                                        |
                                        v
                       +---------------------------------+
                       |   Wazuh Dashboard (HTTPS :443)  |
                       |     (SSH Tunnel -> :8443)       |
                       +---------------------------------+
```

---

## 2. Docker & Container Telemetry Matrix (Phase 9)

| Telemetry Source | Format | Monitored Location | SOC Detection & Investigation Value |
| :--- | :--- | :--- | :--- |
| **Juice Shop Container Log** | `json` | `/var/lib/docker/containers/*/*-json.log` | Captures Node.js HTTP transactions, search queries (`/rest/products/search`), admin configuration access, uncaught exceptions, and container stdout/stderr. |
| **Nginx Access Log** | `apache` (Combined) | `/var/log/nginx/access.log` | Records client IP, HTTP request method, URI query parameters, status codes, user-agent for DVWA (:8000). |
| **Nginx Error Log** | `apache` (Standard) | `/var/log/nginx/error.log` | Records 4xx/5xx web server errors, fastcgi exceptions, and backend timeouts. |
| **Linux Auditd** | `audit` (Kernel) | `/var/log/audit/audit.log` | Kernel syscall tracking for web shell uploads, config modifications, and binary executions. |
| **Linux Auth Log** | `syslog` | `/var/log/auth.log` | Captures SSH authentication attempts, sudo invocations, and PAM events. |
| **Wazuh FIM (Syscheck)**| Native Wazuh | `/var/www/dvwa`, `/etc/nginx/`, `/etc/php/`, `/etc/systemd/system/` | Real-time file integrity monitoring detecting unauthorized modifications and persistence. |

---

## 3. Windows Endpoint Telemetry Matrix (Phase 7)

| Telemetry Source | Event ID | Event Name | Detection & Investigation Purpose |
| :--- | :--- | :--- | :--- |
| **Windows Security** | `4688` | Process Creation | Logs process execution with full command line (`ProcessCreationIncludeCmdLine_Enabled`) |
| **Windows Security** | `4624` | Successful Logon | Tracks interactive, network, and service logons |
| **Windows Security** | `4625` | Failed Logon | Detects brute force, password spraying, and invalid credential attempts |
| **Windows Security** | `4720` | User Account Created | Detects unauthorized backdoor account creation |
| **Windows Security** | `4726` | User Account Deleted | Detects attacker cleanup or anti-forensic account deletion |
| **PowerShell** | `4104` | Script Block Logging | Full content of executed PowerShell blocks (de-obfuscated at runtime) |
| **PowerShell** | `4103` | Module Logging | Pipeline execution details and module invocations |
| **Microsoft Sysmon** | `1` | Process Create | Process launch with parent process lineage, user SID, and cryptographic hashes |
| **Microsoft Sysmon** | `3` | Network Connect | Outbound network connections from command shells, scripts, and binaries |
| **Microsoft Sysmon** | `7` | Image Loaded | Detection of sensitive DLL loading (e.g. `samlib.dll`, `vaultcli.dll`) |
| **Microsoft Sysmon** | `10` | Process Access | Detection of credential dumping attempts targeting `lsass.exe` |
| **Microsoft Sysmon** | `11` | File Create | Tracking dropped scripts in `\Temp`, `\Downloads`, `\Public` |
| **Microsoft Sysmon** | `12, 13, 14` | Registry Events | Tracking persistence in `CurrentVersion\Run`, Services, and Defender tampering |
| **Microsoft Sysmon** | `22` | DNS Query | Domain resolution events for C2 beaconing and data exfiltration detection |

---

## 4. Phased Index Separation Roadmap

* **Phase 6–9 (Current)**:
  * Ingests all telemetry into standard Wazuh indices (`wazuh-alerts-4.x-*`).
  * Full event metadata, container attributes, channel identifiers, and original fields are strictly preserved.
* **Phase 10**:
  * Formal index routing rules separating `soc-windows-*`, `soc-sysmon-*`, `soc-nginx-*`, `soc-juiceshop-*`, and `soc-atomic-*`.
