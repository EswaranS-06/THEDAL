# SOC Incident Investigation Report

---

## 1. Incident Overview

| Field | Details |
| :--- | :--- |
| **Incident ID** | `INC-YYYYMMDD-XXXX` |
| **Analyst Name** | `[Your Name / Analyst ID]` |
| **Investigation Date** | `YYYY-MM-DD` |
| **Initial Alert ID** | `[e.g. 100101 / 100401 / 100601]` |
| **Detection Name** | `[e.g. DET-WEB-001: SQL Injection Attempt]` |
| **Alert Severity** | `[Low / Medium / High / Critical (Level 1-15)]` |
| **Incident Classification** | `[True Positive (TP) / False Positive (FP) / Benign Positive]` |
| **Confidence Level** | `[Low / Medium / High (95%+)]` |

---

## 2. Asset & Entity Scope

| Entity Type | Identified Artifact |
| :--- | :--- |
| **Affected Target Host** | `[e.g. THEDAL-web (10.10.30.148) / THEDAL-windows (10.10.10.254)]` |
| **Source IP Address** | `[e.g. 10.10.20.114 (Attack Host) / External IP]` |
| **Target Port / Protocol** | `[e.g. TCP 8000 (HTTP) / TCP 5985 (WinRM)]` |
| **User Account(s)** | `[e.g. www-data / Administrator / SYSTEM]` |
| **Target Application** | `[e.g. DVWA / OWASP Juice Shop / Windows PowerShell]` |

---

## 3. Incident Timeline

| Timestamp (UTC) | Event Source / Index | Activity Description | Key Evidence / Command Line |
| :--- | :--- | :--- | :--- |
| `HH:MM:SS.mmm` | `[Index Pattern]` | `[Initial Request / Trigger]` | `[URI / CLI / Syscall details]` |
| `HH:MM:SS.mmm` | `[Index Pattern]` | `[Subsequent Execution]` | `[Parent-Child Process / Audit entry]` |
| `HH:MM:SS.mmm` | `wazuh-alerts-*` | `[SIEM Alert Fired]` | `[Rule ID, Description, Severity]` |

---

## 4. Evidence & Technical Findings

### A. Network & Application Telemetry
- **HTTP Request Method / URI**: `[e.g. GET /vulnerabilities/exec/?ip=127.0.0.1;whoami]`
- **HTTP Response Status**: `[e.g. 200 OK / 302 Redirect / 500 Internal Error]`
- **User-Agent String**: `[e.g. Mozilla/5.0 / sqlmap/1.7 / curl/7.81.0]`

### B. Host & Process Telemetry
- **Executing Binary**: `[e.g. C:\Windows\System32\whoami.exe / /usr/bin/whoami]`
- **Parent Process**: `[e.g. C:\Windows\System32\cmd.exe / nginx / php-fpm]`
- **Command Line Arguments**: `[Full CLI string]`
- **Process ID (PID) / PPID**: `[PID / PPID]`
- **Kernel Syscall / Audit Key**: `[Syscall 59 / key: socforge_recon_cmd]`

---

## 5. MITRE ATT&CK Mapping

| Tactic | Technique ID | Technique Name | Observed Adversary Action |
| :--- | :--- | :--- | :--- |
| `[e.g. Initial Access]` | `T1190` | Exploit Public-Facing Application | Inputting SQLi payload into web form |
| `[e.g. Execution]` | `T1059.004` | Unix Shell | Executing `whoami` via command injection |
| `[e.g. Discovery]` | `T1082` | System Information Discovery | Gathering host architecture and user details |

---

## 6. Root Cause & Impact Assessment

### Root Cause Analysis
Explain how the event occurred, what vulnerability or misconfiguration was exploited, and why the detection fired:
> `[Detailed technical explanation of root cause]`

### Impact Scope
- [ ] Confidentiality Impact: `[None / Low / Moderate / High]`
- [ ] Integrity Impact: `[None / Low / Moderate / High]`
- [ ] Availability Impact: `[None / Low / Moderate / High]`

---

## 7. Recommended Remediation & Containment

1. **Immediate Containment**:
   - `[e.g. Block source IP at Security Group / Terminate malicious process / Revoke session token]`
2. **Eradication & Recovery**:
   - `[e.g. Patch vulnerable PHP input handling / Remove unauthorized scheduled task]`
3. **Long-Term Detection Tuning**:
   - `[e.g. Tune correlation rule timeframe / Implement Web Application Firewall (WAF) rule]`

---

## 8. Final Conclusion

> `[Concise 2-3 sentence executive summary of the investigation findings and final disposition.]`
