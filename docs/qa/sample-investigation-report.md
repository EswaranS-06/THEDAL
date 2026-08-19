# SOC Incident Investigation Report — Sample Deliverable

> **Case ID**: `INC-20260819-001` &bull; **Classification**: `True Positive (TP)` &bull; **Severity**: `Critical (Level 11)`

---

## 1. Incident Overview

| Field | Details |
| :--- | :--- |
| **Incident ID** | `INC-20260819-001` |
| **Analyst Name** | `SOC Analyst QA Team` |
| **Investigation Date** | `2026-08-19` |
| **Initial Alert ID** | `100601` (DET-COR-001) |
| **Detection Name** | `SOCForge (DET-COR-001): Multi-Source Correlation: High-confidence web exploit followed by immediate system command execution` |
| **Alert Severity** | `Critical (Level 11)` |
| **Incident Classification** | `True Positive (TP)` |
| **Confidence Level** | `High (99%+)` |

---

## 2. Asset & Entity Scope

| Entity Type | Identified Artifact |
| :--- | :--- |
| **Affected Target Host** | `SOCForge-web` (`10.10.30.148`) |
| **Source IP Address** | `10.10.20.114` (SOCForge Attack Host) |
| **Target Port / Protocol** | `TCP 8000` (HTTP) |
| **User Account(s)** | `www-data` (UID 33 / GID 33) |
| **Target Application** | `Damn Vulnerable Web Application (DVWA)` running on Nginx & PHP-FPM |

---

## 3. Incident Timeline

| Timestamp (UTC) | Event Source / Index | Activity Description | Key Evidence / Command Line |
| :--- | :--- | :--- | :--- |
| `14:20:15.120` | `socforge-nginx-access-*` | Inbound HTTP GET request containing command injection payload | `GET /vulnerabilities/exec/?ip=127.0.0.1%3Bwhoami&Submit=Submit HTTP/1.1` |
| `14:20:15.122` | `wazuh-alerts-*` | Precursor web attack alert triggered (Level 9) | Rule ID `100102`: *Command Injection attempt detected against DVWA* |
| `14:20:15.148` | `socforge-auditd-*` | Linux kernel `execve` system call executed by web service account | Binary: `/usr/bin/whoami`, EUID: `33` (`www-data`), AUID: `unset` |
| `14:20:15.150` | `wazuh-alerts-*` | Precursor host execution alert triggered (Level 7) | Rule ID `100501`: *Discovery or shell utility executed by web service account* |
| `14:20:15.152` | `wazuh-alerts-*` | Multi-Source Correlation rule evaluated and triggered | Rule ID `100601`: *Multi-Source Correlation: High-confidence web exploit* |

---

## 4. Evidence & Technical Findings

### A. Network & Application Telemetry (`socforge-nginx-access-*`)
- **HTTP Request Method / URI**: `GET /vulnerabilities/exec/?ip=127.0.0.1%3Bwhoami&Submit=Submit HTTP/1.1`
- **HTTP Response Status**: `200 OK`
- **User-Agent String**: `SOCForge-WebTester/1.0`
- **Source IP**: `10.10.20.114`

### B. Host & Process Telemetry (`socforge-auditd-*`)
- **Executing Binary**: `/usr/bin/whoami`
- **Parent Process**: `php-fpm8.1` (PID `1422`, PPID `1` or `nginx`)
- **Command Line Arguments**: `whoami`
- **Effective User ID**: `33` (`www-data`)
- **Kernel Syscall**: `59` (`execve`)

---

## 5. MITRE ATT&CK Mapping

| Tactic | Technique ID | Technique Name | Observed Adversary Action |
| :--- | :--- | :--- | :--- |
| **Initial Access** | `T1190` | Exploit Public-Facing Application | Submitted command injection payload to DVWA ping utility. |
| **Execution** | `T1059.004` | Command and Scripting Interpreter: Unix Shell | PHP application spawned `/bin/sh` to execute the system command. |
| **Discovery** | `T1033` | System Owner/User Discovery | Executed `/usr/bin/whoami` to verify privilege context. |

---

## 6. Root Cause & Impact Assessment

### Root Cause Analysis
The DVWA application endpoint `/vulnerabilities/exec/` unsafely concatenates user-supplied input from the `ip` HTTP parameter into a system shell command (`shell_exec("ping -c 4 " . $ip)`). The adversary appended a semicolon delimiter (`;`) followed by `whoami`, causing the operating system to execute the injected binary under the web daemon's service account.

### Impact Scope
- [x] **Confidentiality Impact**: `Moderate` (Attacker verified user execution context and system architecture).
- [x] **Integrity Impact**: `High` (Attacker achieved arbitrary Remote Code Execution on the host).
- [ ] **Availability Impact**: `None` (Application remained responsive).

---

## 7. Recommended Remediation & Containment

1. **Immediate Containment**:
   - Terminate any spawned interactive shells or unauthorized child processes under user `www-data`.
   - Apply an immediate iptables / AWS Security Group ingress drop rule for the adversary source IP `10.10.20.114` if untrusted.
2. **Eradication & Code Remediation**:
   - Refactor PHP application code to utilize parameterized execution APIs (e.g. `escapeshellcmd()` / `escapeshellarg()`) or eliminate direct shell invocation entirely.
   - Configure PHP `disable_functions` in `php.ini` to restrict `shell_exec`, `exec`, `system`, and `passthru`.
3. **Detection & Hardening**:
   - Retain Wazuh Rule `100601` active with automated active-response IP blocking for confirmed multi-source RCE events.

---

## 8. Final Conclusion

The alert represents a **True Positive (TP)** high-severity incident involving successful Remote Code Execution via web command injection against DVWA on `SOCForge-web`. The composite correlation rule `100601` correctly identified both the HTTP exploit string and the resulting kernel `execve` process invocation within 32 milliseconds, establishing a 99%+ confidence intrusion.
