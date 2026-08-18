# Lab 03: PowerShell ScriptBlock Telemetry & Obfuscation Analysis

---

## 1. Objective
Learn how to analyze PowerShell telemetry using Windows Event ID 4104 (ScriptBlock Logging) and Sysmon Event ID 1, inspect in-memory script executions, detect execution policy bypass flags, and evaluate potentially suspicious command lines.

---

## 2. Prerequisites
- Completed **Lab 01** and **Lab 02**.
- Reviewed [PowerShell Investigation Runbook](file:///home/rex/Documents/Projects/docs/runbooks/powershell-investigation.md).

---

## 3. Scenario
An alert flags a PowerShell process executed with non-standard command-line flags. As an analyst, you must determine whether the script was executed interactively or via an automated script cradle, and inspect the raw script content executed inside the PowerShell engine.

---

## 4. Attack / Event Generation
From the Linux Attack Host, execute the PowerShell script execution simulation:

```bash
# Connect to Attack Host via Bastion
ssh -i ~/.ssh/socforge_key -o ProxyJump=ubuntu@<BASTION_PUBLIC_IP> ubuntu@10.10.20.114

# Execute PowerShell ScriptBlock test
/usr/local/bin/run-atomic-test --technique T1059.001 --confirm
```

---

## 5. Expected Telemetry
- **Generating Host**: `SOCForge-windows` (`10.10.10.254`).
- **Telemetry Sources**: 
  1. `Microsoft-Windows-PowerShell/Operational` (Event ID `4104` - ScriptBlock Logging).
  2. `Microsoft-Windows-Sysmon/Operational` (Event ID `1` - Process Creation).
- **Target Indices**: `socforge-powershell-*` and `socforge-sysmon-*`.
- **Wazuh Detection Rule**: `100401` (Level 7: *Suspicious PowerShell execution flags or download cradle detected*).

---

## 6. Investigation Steps

1. **Open OpenSearch Dashboards Discover**:
   - Select index pattern: `socforge-powershell-*`.
2. **Search for PowerShell ScriptBlock Events**:
   - Enter the query:
     ```text
     data.win.system.eventID: "4104"
     ```
3. **Inspect the ScriptBlock Payload**:
   - Expand the latest document.
   - Locate the field: `data.win.eventdata.scriptBlockText`.
   - Read the exact commands executed in PowerShell memory.
4. **Cross-Reference in Sysmon**:
   - Switch index pattern to: `socforge-sysmon-*`.
   - Search for:
     ```text
     data.win.eventdata.image: *powershell.exe
     ```
   - Review `data.win.eventdata.commandLine` to identify all flags (e.g. `-ExecutionPolicy Bypass`, `-Command`).

---

## 7. Investigative Questions
1. **Was PowerShell executed interactively or via CLI arguments?**
2. **What execution policy was specified? Why do attackers use `-ExecutionPolicy Bypass`?**
3. **What specific code was captured in the `scriptBlockText` field?**
4. **Is PowerShell itself inherently malicious?**
5. **What additional evidence (network connections, file drops) would you look for to confirm a malicious intrusion?**

---

## 8. Expected Findings & Solutions
- **CLI Flags**: `-ExecutionPolicy Bypass -Command ...` (or `-NoProfile -NonInteractive`).
- **Execution Policy Reason**: By default, Windows restricts running unsigned scripts. Attackers use `-ExecutionPolicy Bypass` to circumvent local client execution restrictions without requiring administrative privileges.
- **ScriptBlock Content**: Captured test commands and environment variable queries.
- **Assessment**: PowerShell is a dual-use administration tool. The presence of download cradles (`Net.WebClient`, `IEX`, `DownloadString`) or network connections to external unverified IPs distinguishes malicious execution from normal sysadmin tasks.

---

## 9. MITRE ATT&CK Mapping
- **Tactic**: Execution (`TA0002`)
- **Technique**: Command and Scripting Interpreter: PowerShell (`T1059.001`)

---

## 10. Conclusion & Cleanup
- **Conclusion**: You have successfully investigated PowerShell ScriptBlock execution logs and identified command-line bypass parameters.
- **Cleanup**: No cleanup required.
