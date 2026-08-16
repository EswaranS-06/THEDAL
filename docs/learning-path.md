# SOCForge — Modular Cybersecurity Learning Path

> SOCForge provides a structured, multi-tier curriculum designed to guide learners from fundamental cloud infrastructure through advanced detection engineering and adversary threat hunting.

---

## Curriculum Progression Overview

```text
+-------------------------------------------------------------------------------+
|  Level 7: Detection Engineering (Custom Rules, Tuning, Coverage)              |
+-------------------------------------------------------------------------------+
                                       ^
+-------------------------------------------------------------------------------+
|  Level 6: SOC Investigation & Incident Triage (IOCs, Timelines, Root Cause)   |
+-------------------------------------------------------------------------------+
                                       ^
+-------------------------------------------------------------------------------+
|  Level 5: Attack Simulation (MITRE ATT&CK, Atomic Red Team Emulation)         |
+-------------------------------------------------------------------------------+
                                       ^
+-------------------------------------------------------------------------------+
|  Level 4: Web Application Security & Reverse Proxies (Nginx, OWASP Juice Shop)|
+-------------------------------------------------------------------------------+
                                       ^
+-------------------------------------------------------------------------------+
|  Level 3: SIEM & Log Aggregation (Wazuh Manager, Indexer, Dashboard, FIM)    |
+-------------------------------------------------------------------------------+
                                       ^
+-------------------------------------------------------------------------------+
|  Level 2: System & Endpoint Telemetry (Linux Auditd, Windows Event Logs, Sysmon)|
+-------------------------------------------------------------------------------+
                                       ^
+-------------------------------------------------------------------------------+
|  Level 1: Cloud Infrastructure & Networking (AWS, VPC, Terraform, IAM)        |
+-------------------------------------------------------------------------------+
```

---

## Level 1 — Cloud Infrastructure & Networking

* **Core Focus**: Provisioning scalable, secure infrastructure as code.
* **Topics & Skills**:
  * **AWS Fundamentals**: IAM policies, instance profiles, region/AZ selection.
  * **VPC Architecture**: Designing non-overlapping CIDR blocks (`10.10.0.0/16`), public vs. private subnets, and internet gateway attachments.
  * **Routing & Traffic Control**: Route tables, NAT gateways, network access control lists (NACLs).
  * **Security Groups**: Stateful ingress/egress firewall rules enforcing least privilege.
  * **Terraform**: Declarative resource configuration, state management, input variables, outputs, and modular structure.
* **Practical Outcome**: Understand how enterprise cloud environments are isolated and secured from the ground up.

---

## Level 2 — System and Endpoint Telemetry

* **Core Focus**: Capturing high-fidelity host-level activity from Linux and Windows machines.
* **Topics & Skills**:
  * **Linux Auditing**: `auditd`, systemd journal logs, `/var/log/auth.log`, process execution tracking.
  * **Windows Event Logs**: Security Event Log (Logon events 4624/4625, Process Creation 4688), PowerShell Script Block Logging (4104).
  * **Microsoft Sysmon**: Event ID 1 (Process Creation with CLI args and hashes), Event ID 3 (Network Connection), Event ID 7 (Image Load), Event ID 8 (CreateRemoteThread), Event ID 11 (FileCreate).
  * **Wazuh Agent Deployment**: Installing, registering, and configuring agents on Windows and Linux nodes.
* **Practical Outcome**: Ability to instrument operating systems to record adversary tradecraft.

---

## Level 3 — SIEM & Security Analytics

* **Core Focus**: Centralizing, parsing, and indexing telemetry for rapid searching and alerting.
* **Topics & Skills**:
  * **Wazuh Manager**: Agent management, cluster communication, internal message queues.
  * **Wazuh Indexer**: Document indexing, sharding, index patterns, OpenSearch queries.
  * **Wazuh Dashboard**: Building custom search queries, visual widgets, and monitoring alerts in real time.
  * **Rule Engine**: Rule hierarchy, parent-child rule evaluation, alert levels (1–15).
  * **Decoders & Regex**: Field extraction, XML decoders, dynamic attribute mapping.
  * **File Integrity Monitoring (FIM)**: Monitoring critical system binaries and configuration files for unauthorized tampering.
* **Practical Outcome**: Proficient administration and navigation of an enterprise SIEM.

---

## Level 4 — Web Security & Application Telemetry

* **Core Focus**: Understanding web attack vectors and securing HTTP reverse proxy infrastructure.
* **Topics & Skills**:
  * **HTTP Protocol Mechanics**: Methods (GET, POST), headers, response status codes, payload structures.
  * **Nginx Reverse Proxy**: Routing upstream traffic, SSL termination, and structured log formatting.
  * **Web Application Vulnerabilities**: SQL Injection (SQLi), Cross-Site Scripting (XSS), Command Injection, Broken Object Level Authorization (BOLA).
  * **OWASP Juice Shop & Vulnerable Web Apps**: Studying vulnerability manifestations in containerized applications.
  * **Web Attack Telemetry**: Distinguishing routine web traffic from malicious vulnerability scanners and payload probes.
* **Practical Outcome**: Ability to trace attacks targeting web applications and analyze reverse proxy logs.

---

## Level 5 — Attack Simulation & Adversary Emulation

* **Core Focus**: Executing controlled attacks using established security frameworks.
* **Topics & Skills**:
  * **MITRE ATT&CK Framework**: Tactics (Initial Access, Execution, Persistence, Privilege Escalation, Defense Evasion, Credential Access, Discovery, Lateral Movement, Collection, Exfiltration).
  * **Atomic Red Team**: Executing atomic tests mapped directly to MITRE Technique IDs (e.g. `T1059`, `T1003`, `T1053`).
  * **Telemetry Validation**: Verifying that each simulated adversary technique produces the expected host and network logs.
* **Practical Outcome**: Systematic emulation of real-world threats in a controlled lab.

---

## Level 6 — SOC Investigation & Incident Response

* **Core Focus**: Triaging incoming alerts and executing end-to-end forensic investigations.
* **Topics & Skills**:
  * **Alert Triage**: Prioritizing alerts by severity, validating indicators, and differentiating True Positives from False Positives.
  * **Indicator of Compromise (IOC) Extraction**: Extracting malicious IPs, domains, hashes, and command strings.
  * **Timeline Reconstruction**: Assembling minute-by-minute incident chronologies across disparate log streams.
  * **Process Tree Analysis**: Identifying parent-child process anomalies (e.g., `nginx` spawning `/bin/bash`, `winword.exe` spawning `powershell.exe`).
  * **Incident Scoping & Documentation**: Creating structured investigation notes and remediation recommendations.
* **Practical Outcome**: Hands-on proficiency acting as a Tier 1 / Tier 2 SOC Analyst.

---

## Level 7 — Detection Engineering & Rule Tuning

* **Core Focus**: Writing, tuning, and maintaining custom detection logic.
* **Topics & Skills**:
  * **Custom Wazuh Decoders**: Writing custom regular expressions to parse proprietary log formats.
  * **Custom Wazuh Detection Rules**: Creating granular detection logic utilizing event correlation, frequency counts, and composite rules.
  * **Alert Tuning**: Reducing alert fatigue through whitelist exceptions, baseline refinement, and threshold tuning.
  * **Detection Validation**: Continuous testing of rules against simulated adversary inputs (Detection-as-Code).
  * **Coverage Mapping**: Evaluating defensive coverage against the MITRE ATT&CK matrix.
* **Practical Outcome**: Designing resilient detection pipelines that catch real-world adversaries.
