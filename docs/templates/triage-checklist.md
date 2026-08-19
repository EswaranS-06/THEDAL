# SOC Alert Triage Checklist

> A quick-reference 12-point procedure for Tier 1 and Tier 2 analysts triaging incoming alerts in the THEDAL SIEM.

---

## 12-Point Alert Triage Procedure

```text
[ 1. Alert Identification ]
    │
    ▼
[ 2. Temporal Validation ]
    │
    ▼
[ 3. Asset Identification ]
    │
    ▼
[ 4. User Context ]
    │
    ▼
[ 5. Network Entity (Src/Dst) ]
    │
    ▼
[ 6. Process / App Lineage ]
    │
    ▼
[ 7. Correlated Events ]
    │
    ▼
[ 8. Timeline Construction ]
    │
    ▼
[ 9. MITRE ATT&CK Mapping ]
    │
    ▼
[ 10. True / False Positive ]
    │
    ▼
[ 11. Severity & Impact ]
    │
    ▼
[ 12. Reporting & Action ]
```

---

## Checklist Steps

- [ ] **1. Identify Alert Details**
  - Record the Wazuh Rule ID (e.g. `100101`, `100401`), Rule Description, and Rule Level (Severity 1–15).
  - Note the detection rule groups (e.g. `socforge_web`, `powershell`, `socforge_correlation`).

- [ ] **2. Validate Timestamp & Time Window**
  - Check the precise event timestamp in UTC.
  - Set the OpenSearch Dashboards time filter to **±15 minutes** around the alert to capture preceding and succeeding events.

- [ ] **3. Identify Affected Asset (Target)**
  - Note the Agent ID, Agent Name (`windows`, `web`, `wazuh`), and Target Private IP.
  - Determine the asset criticality (e.g., Domain Controller, Production Web Server, Database).

- [ ] **4. Identify User / Execution Context**
  - Identify the user account executing the action (`Administrator`, `SYSTEM`, `www-data`, `ubuntu`).
  - Determine if the user context is expected for this process or anomalous (e.g., `www-data` executing `/bin/bash`).

- [ ] **5. Identify Network Entities (Source vs. Destination)**
  - Extract the Source IP address (`data.srcip` or `src_ip`).
  - Determine if the source is internal lab traffic (`10.10.20.114`), legitimate user subnet, or unknown external IP.

- [ ] **6. Inspect Process & Command-Line Lineage**
  - In `socforge-sysmon-*` or `socforge-auditd-*`, review the executing binary (`image` / `exe`).
  - Examine the parent binary (`parentImage`) and process command-line arguments (`commandLine` / `execve`).
  - Check for obfuscation (e.g. Base64 encoding `-enc`, nested quotes, URL encoding `%27`).

- [ ] **7. Search Correlated Events Across Secondary Indices**
  - If a web alert fired (`socforge-nginx-access-*`), search `socforge-auditd-*` and `socforge-linux-auth-*` on that host.
  - If a PowerShell alert fired (`socforge-powershell-*`), search `socforge-sysmon-*` for parent process and child network connections.

- [ ] **8. Construct Incident Chronology (Timeline)**
  - Order all related events chronologically down to the millisecond.
  - Establish the exact sequence of adversary actions from initial probe to final artifact.

- [ ] **9. Map to MITRE ATT&CK Framework**
  - Identify the primary ATT&CK Tactic (e.g. Initial Access, Execution, Persistence, Discovery).
  - Record the specific Technique ID (e.g. `T1190`, `T1059.001`, `T1082`, `T1053.005`).

- [ ] **10. Determine True Positive (TP) vs. False Positive (FP)**
  - **True Positive**: Malicious payload, unauthorized tool execution, genuine exploit attempt.
  - **False Positive**: Legitimate IT administrator script, automated backup job, benign syntax typo.

- [ ] **11. Assess Severity, Scope & Blast Radius**
  - Did the attack succeed (e.g. HTTP 200 with data vs. HTTP 403 Forbidden)?
  - Was remote command execution achieved? Are additional endpoints affected?

- [ ] **12. Document Incident & Execute Containment**
  - Populate the [Investigation Report Template](file:///home/rex/Documents/Projects/docs/templates/investigation-report.md).
  - Recommend or trigger appropriate containment actions (e.g., process termination, IP block, credential rotation).
