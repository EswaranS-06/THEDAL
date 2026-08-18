# Lab 14: End-to-End Incident Timeline Reconstruction & Formal Reporting

---

## 1. Objective
Synthesize all skills developed across Labs 01–13 by investigating a complete, multi-stage adversary attack sequence, reconstructing a millisecond-accurate incident timeline across multiple disparate log sources, and authoring a professional SOC Incident Investigation Report.

---

## 2. Prerequisites
- Completed **Labs 01–13**.
- Downloaded [Investigation Report Template](file:///home/rex/Documents/Projects/docs/templates/investigation-report.md).

---

## 3. Scenario: The Multi-Stage Intrusion
An adversary executes a complex, sequential attack involving:
1. **Stage 1 (Reconnaissance)**: Probing web server directories for sensitive assets.
2. **Stage 2 (Exploitation)**: Exploiting a command injection flaw in DVWA.
3. **Stage 3 (Host Discovery)**: Executing system reconnaissance on the Linux Web Target.
4. **Stage 4 (Lateral Reconnaissance)**: Executing Atomic Red Team discovery tests against the Windows Endpoint.
5. **Stage 5 (Persistence)**: Scheduling a persistent task on the Windows Endpoint.

---

## 4. Attack / Event Generation
From the Linux Attack Host, execute the full composite adversary emulation suite:

```bash
# Connect to Attack Host via Bastion
ssh -i ~/.ssh/socforge_key -o ProxyJump=ubuntu@<BASTION_PUBLIC_IP> ubuntu@10.10.20.114

# Execute full attack sequence
/usr/local/bin/run-web-test --scenario DVWA-01 --confirm
/usr/local/bin/run-web-test --scenario DVWA-04 --confirm
/usr/local/bin/run-atomic-test --technique T1082 --confirm
/usr/local/bin/run-atomic-test --technique T1053.005 --confirm
```

---

## 5. Investigation & Timeline Construction

1. **Set OpenSearch Dashboards Time Filter**:
   - Set time filter to **Last 15 minutes**.
2. **Query All SOCForge Indices**:
   - In Discover, select index pattern: `wazuh-alerts-*` (or search across `socforge-*`).
   - Sort documents in **Ascending order (Oldest to Newest)**.
3. **Reconstruct the Chronology Table**:

| Step | UTC Timestamp | Log Source / Index | Target Host | Observed Activity | MITRE Technique |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | `HH:MM:SS.100` | `socforge-nginx-access-*` | `10.10.30.148` | Web probing (`DVWA-01`) | `T1595.002` |
| **2** | `HH:MM:SS.250` | `socforge-nginx-access-*` | `10.10.30.148` | Command Injection (`?ip=127.0.0.1;whoami`) | `T1190` |
| **3** | `HH:MM:SS.290` | `socforge-auditd-*` | `10.10.30.148` | Kernel `execve` for `/usr/bin/whoami` | `T1059.004` |
| **4** | `HH:MM:SS.300` | `wazuh-alerts-*` | `10.10.30.148` | Composite Alert `100601` (Level 11) | `T1190` / `T1059` |
| **5** | `HH:MM:SS.500` | `socforge-sysmon-*` | `10.10.10.254` | `systeminfo.exe` & `whoami.exe` | `T1082` |
| **6** | `HH:MM:SS.750` | `socforge-sysmon-*` | `10.10.10.254` | `schtasks.exe /create` persistence | `T1053.005` |

---

## 6. Final Deliverable: Authoring the Incident Report
Open a copy of `docs/templates/investigation-report.md` and complete all sections:
- **Incident Summary & Scope**: Document all affected hosts (`10.10.30.148` and `10.10.10.254`).
- **Complete Timeline**: Populate the chronological table with exact timestamps from OpenSearch.
- **Evidence Snippets**: Include URI query strings, Sysmon CLI strings, and Auditd syscall details.
- **Root Cause & Impact**: Document initial entry vector and confirmed host compromise.
- **Remediation Steps**: Provide actionable containment steps (firewall rules, code patches, scheduled task removal).

---

## 7. Conclusion
- **Congratulations!** You have completed the entire SOCForge Guided Investigation curriculum and demonstrated proficiency as a capable SOC Analyst.
