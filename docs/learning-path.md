# THEDAL — Guided SOC Analyst Learning Path

### Threat Hunting, Exploration, Detection, Analysis and Learn

> A structured, step-by-step curriculum designed to take you from foundational SIEM log analysis through complex multi-source adversary investigation.

---

## Curriculum Overview

The THEDAL learning experience is organized into three progressive levels plus an optional challenge tier:

```text
+-----------------------------------------------------------------------------------------+
|                                    CHALLENGE MODE                                       |
|                  Blind Mystery Incidents • Unlabeled Telemetry • Root Cause             |
+-----------------------------------------------------------------------------------------+
                                             ^
+-----------------------------------------------------------------------------------------+
|                              LEVEL 3: ATTACK INVESTIGATION                              |
|           Atomic Red Team • Lineage • Obfuscation • Scheduled Tasks • Correlation       |
|                 [Lab 09] [Lab 10] [Lab 11] [Lab 12] [Lab 13] [Lab 14]                  |
+-----------------------------------------------------------------------------------------+
                                             ^
+-----------------------------------------------------------------------------------------+
|                            LEVEL 2: SOC INVESTIGATION WORKFLOW                          |
|             Web Exploits • REST APIs • Linux Kernel Audit • Process Lineage             |
|                          [Lab 05] [Lab 06] [Lab 07] [Lab 08]                            |
+-----------------------------------------------------------------------------------------+
                                             ^
+-----------------------------------------------------------------------------------------+
|                                LEVEL 1: SOC FOUNDATIONS                                 |
|               Log Anatomy • SIEM Navigation • Sysmon • PowerShell • Auth                |
|                          [Lab 01] [Lab 02] [Lab 03] [Lab 04]                            |
+-----------------------------------------------------------------------------------------+
```

---

## Level 1: SOC Foundations (Beginner)

*Focus: Understanding basic log telemetry, SIEM query syntax, alert triage, and fundamental host events.*

| Lab ID | Lab Title | Telemetry Source | Primary Concept | Target Index |
| :--- | :--- | :--- | :--- | :--- |
| **[Lab 01](file:///home/rex/Documents/Projects/docs/labs/01-first-alert/README.md)** | **Your First Wazuh Alert** | Windows EventLog | Alert vs. Log, Severity, Timestamps, Agent ID | `wazuh-alerts-*` |
| **[Lab 02](file:///home/rex/Documents/Projects/docs/labs/02-windows-process/README.md)** | **Windows Process Investigation** | Sysmon Event ID 1 | Process Trees, Parent PIDs, Command-Line Args | `socforge-sysmon-*` |
| **[Lab 03](file:///home/rex/Documents/Projects/docs/labs/03-powershell-investigation/README.md)** | **PowerShell Telemetry Analysis** | ScriptBlock Logging (4104) | ScriptBlocks, Module Logging, Command Strings | `socforge-powershell-*` |
| **[Lab 04](file:///home/rex/Documents/Projects/docs/labs/04-failed-authentication/README.md)** | **Failed Authentication Analysis** | Linux `/var/log/auth.log` & Windows 4625 | Single Failure vs. Brute-Force Bursts, Usernames | `socforge-linux-auth-*` |

---

## Level 2: SOC Investigation Workflows (Intermediate)

*Focus: Investigating web application attacks, container log streams, reverse proxy telemetry, and kernel-level process execution.*

| Lab ID | Lab Title | Telemetry Source | MITRE ATT&CK | Target Index |
| :--- | :--- | :--- | :--- | :--- |
| **[Lab 05](file:///home/rex/Documents/Projects/docs/labs/05-dvwa-sqli/README.md)** | **DVWA SQL Injection Investigation** | Nginx HTTP Access Logs | T1190 (Exploit Public-Facing App) | `socforge-nginx-access-*` |
| **[Lab 06](file:///home/rex/Documents/Projects/docs/labs/06-dvwa-command-injection/README.md)** | **DVWA Command Injection & Auditd** | Nginx + Linux Auditd | T1059.004 (Unix Shell) | `socforge-nginx-access-*` / `auditd` |
| **[Lab 07](file:///home/rex/Documents/Projects/docs/labs/07-dvwa-lfi/README.md)** | **DVWA Local File Inclusion (LFI)** | Nginx HTTP Access Logs | T1083 (File/Directory Discovery) | `socforge-nginx-access-*` |
| **[Lab 08](file:///home/rex/Documents/Projects/docs/labs/08-juice-shop-api/README.md)** | **Juice Shop Container API Probing** | Docker JSON Container Logs | T1087 / T1595 (Reconnaissance) | `socforge-juice-shop-*` |

---

## Level 3: Advanced Attack Investigation & Correlation (Advanced)

*Focus: Multi-source correlation, adversary emulation frameworks, persistence mechanisms, obfuscation, and true/false positive determination.*

| Lab ID | Lab Title | Telemetry Source | MITRE ATT&CK | Target Index |
| :--- | :--- | :--- | :--- | :--- |
| **[Lab 09](file:///home/rex/Documents/Projects/docs/labs/09-atomic-red-team/README.md)** | **Atomic Red Team Reconnaissance** | Windows Security + Sysmon | T1082 (System Info Discovery) | `socforge-sysmon-*` |
| **[Lab 10](file:///home/rex/Documents/Projects/docs/labs/10-powershell-attack/README.md)** | **PowerShell Attack & Obfuscation** | Sysmon + ScriptBlock | T1059.001 / T1027.013 | `socforge-powershell-*` |
| **[Lab 11](file:///home/rex/Documents/Projects/docs/labs/11-scheduled-task/README.md)** | **Scheduled Task Persistence** | Sysmon Event ID 1 / CLI | T1053.005 (Scheduled Task) | `socforge-sysmon-*` |
| **[Lab 12](file:///home/rex/Documents/Projects/docs/labs/12-multi-source-correlation/README.md)** | **Multi-Source Incident Correlation** | Web Access + Kernel Syscalls | T1190 + T1059.004 (DET-COR-001) | `wazuh-alerts-*` |
| **[Lab 13](file:///home/rex/Documents/Projects/docs/labs/13-tp-vs-fp/README.md)** | **True Positive vs. False Positive** | Multi-Source Comparative | Triage Methodology | All Indices |
| **[Lab 14](file:///home/rex/Documents/Projects/docs/labs/14-incident-timeline/README.md)** | **End-to-End Incident Timeline** | Complete Multi-Host Stream | Full Attack Lifecycle | All Indices |

---

## Challenge Tier: Mystery Investigations

*Test your investigative abilities without upfront instructions or hints. Unravel raw SIEM telemetry, identify attacker behaviors, and write a formal incident report.*

- **[Challenge 01: Unauthorized Web Tampering](file:///home/rex/Documents/Projects/docs/labs/challenges/challenge-01-web-tampering.md)**
- **[Challenge 02: Suspicious Administrative Activity](file:///home/rex/Documents/Projects/docs/labs/challenges/challenge-02-suspicious-admin.md)**
- **[Challenge 03: Stealth Host & Network Reconnaissance](file:///home/rex/Documents/Projects/docs/labs/challenges/challenge-03-stealth-enumeration.md)**
- **[Solutions & Analysis Keys](file:///home/rex/Documents/Projects/docs/labs/challenges/solutions.md)** *(Contains hints and full answers)*

---

## Additional Analyst Resources

- **[SOC Terminology Glossary](file:///home/rex/Documents/Projects/docs/learning/glossary.md)**: Clear definitions of core SOC concepts.
- **[Attack-to-Telemetry Guide](file:///home/rex/Documents/Projects/docs/learning/attack-to-telemetry.md)**: Visual mapping from offensive techniques to defensive logs.
- **[Index-to-Investigation Guide](file:///home/rex/Documents/Projects/docs/learning/index-investigation-guide.md)**: Query cheat-sheet for all OpenSearch index patterns.
- **[Incident Investigation Report Template](file:///home/rex/Documents/Projects/docs/templates/investigation-report.md)**: Markdown report template for documentation.
- **[SOC Alert Triage Checklist](file:///home/rex/Documents/Projects/docs/templates/triage-checklist.md)**: Quick-reference 12-point analyst checklist.
- **[Analyst Runbooks](file:///home/rex/Documents/Projects/docs/runbooks/)**: Step-by-step triage procedures for each major telemetry stream.
