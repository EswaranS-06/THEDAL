# SOCForge — Learner QA Matrix

> Comprehensive Quality Assurance (QA) and curriculum validation matrix auditing every guided lab, challenge, template, and operational workflow from a learner's perspective.

---

## QA Evaluation Standards

- **PASS**: Verified and fully consistent across documentation, commands, telemetry sources, decoders, rule IDs, and index patterns.
- **PARTIAL**: Documented workflow is usable but contained minor inconsistencies or terminology ambiguities (remediated during Phase 17 QA pass).
- **FAIL**: Documentation or simulation script is broken, references invalid resources, or fails to generate expected telemetry.
- **BLOCKED**: Prerequisite infrastructure or dependency prevents execution.
- **NOT TESTED**: Not evaluated during this testing cycle.

---

## 1. Curriculum & Lab QA Matrix

| Lab / Module | Title | Documentation | Prerequisites | Command | Telemetry | Index | Rule | Dashboard | Questions | Solution | Cleanup | Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **START-HERE** | Project Entry Point & Architecture | Validated | Clear | Validated | N/A | N/A | N/A | Validated | N/A | N/A | Safe | **PASS** | Clear instructions on SSH ProxyJump, Wazuh tunnel on port 8443, and billing warnings. |
| **Control Plane** | Local Operator Web UI | Validated | Python 3.11+ | `make control-plane` | Real-time status | N/A | N/A | `127.0.0.1:8080` | N/A | N/A | Safe | **PASS** | Fast, responsive dark UI; thread-safe locking; strict localhost binding; allowlist only. |
| **Lab 01** | First Wazuh Alert & Log Anatomy | Validated | Lab 01 Pre | `run-atomic-test --technique T1082` | Sysmon / Windows Sec | `socforge-sysmon-*` / `wazuh-alerts-*` | `100404` | Sec Ops Overview | Clear | Provided | No action needed | **PASS** | Successfully introduces alert vs event distinction, severity levels, and agent metadata. |
| **Lab 02** | Windows Process Investigation & Lineage | Validated | Lab 01 | `run-atomic-test --technique T1016` | Sysmon Event ID 1 | `socforge-sysmon-*` | `100404` | Windows Endpoint | Clear | Provided | No action needed | **PASS** | Reconstructs parent-child lineage (`cmd.exe` -> `ipconfig.exe /all`) with PID tracking. |
| **Lab 03** | PowerShell ScriptBlock Analysis | Validated | Labs 01–02 | `run-atomic-test --technique T1059.001` | PowerShell 4104 / Sysmon 1 | `socforge-powershell-*` / `sysmon` | `100401` | Windows Endpoint | Clear | Provided | No action needed | **PASS** | Clear demonstration of in-memory ScriptBlock text logging defeating CLI obfuscation. |
| **Lab 04** | Authentication Telemetry & Brute-Force | Validated | Labs 01–03 | `sudo -S` & `JS-02` | Linux Auth / Docker JSON | `socforge-linux-auth-*` / `juice-shop` | `100502` / `100202` | Sec Ops Overview | Clear | Provided | No action needed | **PASS** | Teaches distinction between isolated typos (FP/benign) and rapid brute-force bursts (TP). |
| **Lab 05** | DVWA SQL Injection Investigation | Validated | Level 1 | `run-web-test --scenario DVWA-03` | Nginx Access Log | `socforge-nginx-access-*` | `100101` | Web Applications | Clear | Provided | No action needed | **PASS** | URL decoding analysis (`%27` -> `'`), parameter inspection, and MITRE T1190 mapping. |
| **Lab 06** | DVWA Command Injection & Auditd | Validated | Lab 05 | `run-web-test --scenario DVWA-04` | Nginx + Linux Auditd | `socforge-nginx-access-*` / `auditd` | `100102` / `100501` / `100601` | Web Applications | Clear | Provided | No action needed | **PASS** | Critical RCE investigation tracing HTTP injection down to kernel `execve` syscalls. |
| **Lab 07** | DVWA Local File Inclusion (LFI) | Validated | Labs 05–06 | `run-web-test --scenario DVWA-05` | Nginx Access Log | `socforge-nginx-access-*` | `100103` | Web Applications | Clear | Provided | No action needed | **PASS** | Evaluates path traversal `../` sequences targeting `/etc/passwd` and file disclosure risks. |
| **Lab 08** | Juice Shop Container & REST API | Validated | Labs 05–07 | `run-web-test --scenario JS-03 / JS-04`| Docker JSON Streams | `socforge-juice-shop-*` / `wazuh-alerts-*`| `100201` / `100205` | Web Applications | Clear | Provided | No action needed | **PASS** | Analyzes containerized microservice REST API enumeration and database error stack traces. |
| **Lab 09** | Atomic Red Team Host Reconnaissance | Validated | Levels 1–2 | `run-atomic-test --technique T1087.001`| Sysmon / Windows Sec / Audit Log | `socforge-sysmon-*` / `wazuh-alerts-*` | `100404` | Attack Activity | Clear | Provided | No action needed | **PASS** | Correlates offensive ground-truth logs (`simulation.log`) directly with defensive SIEM alerts. |
| **Lab 10** | PowerShell Defense Evasion (Base64) | Validated | Labs 03, 09 | `powershell -enc ...` | Sysmon 1 / PowerShell 4104 | `socforge-sysmon-*` / `powershell` | `100402` | Windows Endpoint | Clear | Provided | No action needed | **PASS** | Base64 extraction and manual CLI decoding vs. automated in-memory ScriptBlock text. |
| **Lab 11** | Scheduled Task Persistence | Validated | Labs 01–10 | `run-atomic-test --technique T1053.005`| Sysmon Event ID 1 | `socforge-sysmon-*` | `100406` | Windows Endpoint | Clear | Provided | Auto `/delete` | **PASS** | Analyzes `schtasks.exe /create` parameters and validates reboot-survival persistence concepts. |
| **Lab 12** | Multi-Source Telemetry Correlation | Validated | Labs 01–11 | Web injection + Host execution | Nginx + Linux Auditd | `wazuh-alerts-*` | `100601` (Lvl 11) | Web Applications | Clear | Provided | No action needed | **PASS** | Verifies Level 11 composite alert firing within 30-second window across disparate streams. |
| **Lab 13** | True Positive vs. False Positive Triage| Validated | Labs 01–12 | Multi-source comparative | Process / Web / Auth | All Indices | Multiple | All Dashboards | Clear | Provided | No action needed | **PASS** | 4 comparative scenarios teaching contextual evaluation (parent image, user, time, velocity). |
| **Lab 14** | Incident Timeline & Formal Reporting | Validated | Labs 01–13 | Full multi-stage attack suite | All Streams | All Indices | Composite | All Dashboards | Clear | Template provided | No action needed | **PASS** | Millisecond chronology reconstruction across network, web, auditd, and Windows Sysmon. |

---

## 2. Mystery Challenge Tier QA

| Challenge ID | Scenario Title | Documentation | Mystery Preservation | Hint Quality | Solution Accuracy | ATT&CK Mapping | Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Challenge 01**| Unauthorized Web Application Tampering | Validated | Preserved | Tiered & Useful | 100% Match | T1190 | **PASS** | Unlabeled SQLi probe against DVWA. Teaches raw query decoding and audit correlation. |
| **Challenge 02**| Suspicious Admin Process & Obfuscation | Validated | Preserved | Tiered & Useful | 100% Match | T1059.001 / T1027.013 | **PASS** | Encoded PowerShell command targeting `lsass.exe`. Cross-checks Sysmon and Event 4104. |
| **Challenge 03**| Stealth Host Reconnaissance & Persistence| Validated | Preserved | Tiered & Useful | 100% Match | T1082 / T1087 / T1053.005 | **PASS** | Burst of 4 discovery utilities followed by scheduled task creation. Full timeline reconstruction. |

---

## 3. Reporting & Triage Templates QA

| Template Document | Purpose & Scope | Usability for Beginners | Completeness | Formatting Standards | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`investigation-report.md`** | Formal Incident Report | High | Comprehensive (Scope, Timeline, Evidence, Root Cause, Remediation) | Markdown Table & GFM | **PASS** |
| **`triage-checklist.md`** | 12-Point Analyst Quick Reference | High | Logical sequential triage progression | Markdown Checklist | **PASS** |
