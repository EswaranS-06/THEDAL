# Lab 10: PowerShell Defense Evasion & Base64 Obfuscation

---

## 1. Objective
Learn how adversaries use Base64-encoded command lines and download cradles to evade basic string detection, how to extract and decode obfuscated PowerShell payloads from Sysmon logs, and how in-memory ScriptBlock logging defeats command-line obfuscation.

---

## 2. Prerequisites
- Completed **Lab 03** and **Lab 09**.
- Reviewed [PowerShell Investigation Runbook](file:///home/rex/Documents/Projects/docs/runbooks/powershell-investigation.md).

---

## 3. Scenario
An alert flags a PowerShell process running with an encoded command parameter (`-enc`). You must investigate the Sysmon process creation event, decode the Base64 payload, and cross-reference with ScriptBlock logging to understand the attacker's intent.

---

## 4. Attack / Event Generation
From the Linux Attack Host, execute the encoded PowerShell test using either the automated harness or direct WinRM execution:

```bash
# Option A: Execute via Atomic Red Team harness on Attack Host
ssh -i ~/.ssh/socforge_key -o ProxyJump=ubuntu@<BASTION_PUBLIC_IP> ubuntu@10.10.20.114 '
/usr/local/bin/run-atomic-test --technique T1059.001 --confirm
'

# Option B: Execute encoded payload directly against Windows endpoint via Python WinRM
python3 -c '
import winrm
s = winrm.Session("10.10.10.254:5985", auth=("Administrator", "SOCForge@2026!Sec"), transport="basic", server_cert_validation="ignore")
s.run_cmd("powershell.exe", ["-NoProfile", "-enc", "ZwBlAHQALQBwAHIAbwBjAGUAcwBzACAALQBOAGEAbQBlACAAbABzAGEAcwBzAA=="])
'
```

---

## 5. Expected Telemetry
- **Generating Host**: `SOCForge-windows` (`10.10.10.254`).
- **Telemetry Sources**:
  1. Sysmon Event ID 1 (Process Creation with `-enc` parameter).
  2. PowerShell Event ID 4104 (ScriptBlock Logging with de-obfuscated script).
- **Target Indices**: `socforge-sysmon-*` and `socforge-powershell-*`.
- **Wazuh Detection Rule**: `100402` (Level 8: *SOCForge (DET-WIN-002): PowerShell encoded/obfuscated command execution detected*).

---

## 6. Investigation Steps

1. **Locate the Encoded Command Alert**:
   - In OpenSearch Dashboards Discover, select: `socforge-sysmon-*`.
   - Search for:
     ```text
     rule.id: "100402" OR data.win.eventdata.commandLine: *-enc*
     ```
2. **Extract and Decode the Base64 Payload**:
   - Copy the Base64 string from `data.win.eventdata.commandLine` (`ZwBlAHQALQBwAHIAbwBjAGUAcwBzACAALQBOAGEAbQBlACAAbABzAGEAcwBzAA==`).
   - Decode it in bash:
     ```bash
     echo "ZwBlAHQALQBwAHIAbwBjAGUAcwBzACAALQBOAGEAbQBlACAAbABzAGEAcwBzAA==" | base64 -d | iconv -f UTF-16LE -t UTF-8
     ```
3. **Verify ScriptBlock Logging (Event 4104)**:
   - Switch index pattern to: `socforge-powershell-*`.
   - Search for:
     ```text
     data.win.system.eventID: "4104"
     ```
   - Notice that PowerShell ScriptBlock logging captured the decoded, plain-text command directly in memory without requiring manual decoding!

---

## 7. Investigative Questions
1. **What command was hidden inside the Base64 encoded payload?**
2. **Why does PowerShell use UTF-16LE encoding for Base64 parameters rather than standard ASCII?**
3. **Why do adversaries encode command-line arguments?**
4. **How does PowerShell ScriptBlock Logging (Event 4104) overcome command-line obfuscation techniques?**

---

## 8. Expected Findings & Solutions
- **Decoded Command**: `get-process -Name lsass` (Querying the Local Security Authority Subsystem Service process).
- **Encoding Reason**: Attackers use Base64 to bypass simple keyword filters (such as perimeter firewalls or basic SIEM regexes searching for `lsass` or `DownloadString`).
- **ScriptBlock Logging Advantage**: ScriptBlock logging captures code immediately prior to execution by the PowerShell runtime engine after all decryption, de-obfuscation, and variable expansion has occurred.

---

## 9. MITRE ATT&CK Mapping
- **Tactic**: Defense Evasion (`TA0005`) / Execution (`TA0002`)
- **Technique**: Deobfuscate/Decode Files or Information (`T1027.013`) / Command and Scripting Interpreter: PowerShell (`T1059.001`)

---

## 10. Conclusion & Cleanup
- **Conclusion**: You have successfully identified, decoded, and analyzed an obfuscated PowerShell execution using both process-level Sysmon telemetry and in-memory ScriptBlock logging.
- **Cleanup**: No cleanup required.
