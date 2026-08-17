# SOCForge — Telemetry, Logging & Index Architecture

> **Phase 10 Status**: The Wazuh SIEM core, Windows Employee Endpoint (Sysmon + Auditing), Linux Web Target (Nginx :8000 + DVWA), OWASP Juice Shop Container (Docker :3000), and **Atomic Red Team Attack Simulation Host (SOCForge-attack)** are operational, reconciled, and instrumented with standardized telemetry metadata.

---

## 1. Multi-Node Telemetry & Adversary Emulation Flow

```text
               +------------------------------------+
               |   Attack Simulation (10.10.20.x)   |
               |                                    |
               | - Invoke-AtomicRedTeam (pwsh)      |
               | - Ground-truth Audit Logs (atomic) |
               +-----------------+------------------+
                                 |
                                 | Controlled ATT&CK Simulation
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

## 2. Canonical Telemetry Source Taxonomy

The following canonical taxonomy keys standardize telemetry collection across all agents and prepare the architecture for downstream logical index routing:

| Taxonomy Source Key | Originating Host | Collection Mechanism | Wazuh Agent Source / Path | Log Format | SOC Detection & Telemetry Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`windows_security`** | `SOCForge-windows` | Windows Event Log | `Security` channel | `eventchannel` | Process creation (Event 4688 with command line), authentication success/failure (4624/4625), user account management (4720/4726). |
| **`sysmon`** | `SOCForge-windows` | Sysmon Service | `Microsoft-Windows-Sysmon/Operational` | `eventchannel` | High-fidelity process lineage (1), network connections (3), DLL injection (7), LSASS access (10), file creation (11), registry (12-14), DNS (22). |
| **`powershell`** | `SOCForge-windows` | PowerShell Engine | `Microsoft-Windows-PowerShell/Operational` | `eventchannel` | Script block execution (4104) and module execution (4103) with de-obfuscation at runtime. |
| **`nginx_access`** | `SOCForge-web` | Nginx HTTP Server | `/var/log/nginx/access.log` | `apache` (Combined) | Client IP, HTTP method, URI parameters, status codes, user-agent for DVWA web application. |
| **`nginx_error`** | `SOCForge-web` | Nginx HTTP Server | `/var/log/nginx/error.log` | `apache` (Standard) | Web server errors, backend FastCGI exceptions, client timeouts. |
| **`dvwa`** | `SOCForge-web` | PHP-FPM / App | `/var/www/dvwa` & FastCGI | `syslog` / file | PHP application runtime exceptions, SQL injection attempts, LFI/RFI probes. |
| **`auditd`** | `SOCForge-web` | Linux Kernel Audit | `/var/log/audit/audit.log` | `audit` | File integrity modifications on web roots, server configuration tampering, and execution of reconnaissance/staging binaries (`whoami`, `curl`, `nc`, `sudo`). |
| **`linux_auth`** | `SOCForge-web` | Linux PAM / sshd | `/var/log/auth.log` | `syslog` | SSH authentication attempts, sudo privilege escalation, PAM session tracking. |
| **`juice_shop`** | `SOCForge-web` | Docker Container | `/var/lib/docker/containers/*/*-json.log` | `json` | Node.js REST API traffic, search queries (`/rest/products/search`), admin config access, container stdout/stderr. |
| **`atomic`** | `SOCForge-attack` | Atomic Red Team | `/var/log/socforge/atomic/simulation.log` | `json` | Ground-truth simulation execution telemetry for automated alert correlation and detection engineering (Phase 10). |

---

## 3. Phased Index Separation Roadmap

* **Phase 6–10 (Current Baseline)**:
  * Ingests all telemetry into standard Wazuh indices (`wazuh-alerts-4.x-*`).
  * All events are tagged with canonical `<label key="socforge.source">` and metadata attributes, ensuring zero data loss and single-stream non-duplication.
* **Phase 11+ (Adversary Emulation & Index Routing)**:
  * Formal index routing rules separating `soc-windows-*`, `soc-sysmon-*`, `soc-nginx-*`, `soc-juiceshop-*`, and `soc-atomic-*`.
