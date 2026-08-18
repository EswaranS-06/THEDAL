# Lab 02: Windows Process Investigation & Lineage Analysis

---

## 1. Objective
Learn how to investigate process execution events using Microsoft Sysmon (Event ID 1), reconstruct parent-child process relationships, analyze command-line arguments, and distinguish normal system executions from anomalous process spawning.

---

## 2. Prerequisites
- Completed **Lab 01**.
- Reviewed [Sysmon Investigation Runbook](file:///home/rex/Documents/Projects/docs/runbooks/sysmon-investigation.md).

---

## 3. Scenario
An alert triggers on the Windows Server endpoint indicating administrative discovery utilities were executed. As a SOC analyst, you need to investigate the process tree to determine:
- What process created the utility?
- Was it launched from an interactive command prompt, a script, or a remote management session?
- What was the full command-line syntax used?

---

## 4. Attack / Event Generation
From the Linux Attack Host, execute the system network discovery simulation:

```bash
# Connect to Attack Host via Bastion
ssh -i ~/.ssh/socforge_key -o ProxyJump=ubuntu@<BASTION_PUBLIC_IP> ubuntu@10.10.20.114

# Execute network configuration discovery test
/usr/local/bin/run-atomic-test --technique T1016 --confirm
```

---

## 5. Expected Telemetry
- **Generating Host**: `SOCForge-windows` (`10.10.10.254`).
- **Telemetry Source**: Sysmon Event ID 1 (Process Creation).
- **Target Index**: `socforge-sysmon-*`.
- **Wazuh Detection Rule**: `100404` (Level 6: *Discovery and reconnaissance binary execution*).

---

## 6. Investigation Steps

1. **Navigate to Discover in OpenSearch Dashboards**:
   - In the side menu, click **Discover**.
   - Select the index pattern: `socforge-sysmon-*`.
2. **Filter for Sysmon Process Creation**:
   - In the search bar, enter:
     ```text
     data.win.system.eventID: "1" AND data.win.eventdata.image: *ipconfig.exe
     ```
3. **Add Columns to the View**:
   - From the left field list, add:
     - `data.win.eventdata.image`
     - `data.win.eventdata.commandLine`
     - `data.win.eventdata.parentImage`
     - `data.win.eventdata.user`
     - `data.win.eventdata.processId`
     - `data.win.eventdata.parentProcessId`
4. **Trace the Parent Process**:
   - Note the `parentProcessId` value of `ipconfig.exe`.
   - Clear the search filter and search for:
     ```text
     data.win.system.eventID: "1" AND data.win.eventdata.processId: "<ENTER_PPID_HERE>"
     ```
   - Identify the parent executable that spawned `ipconfig.exe`.

---

## 7. Investigative Questions
1. **What executable was launched?** What was its exact file path on disk?
2. **What full command-line arguments were passed?**
3. **What was the parent executable (`parentImage`)?**
4. **Who was the executing user?**
5. **Is `ipconfig.exe` inherently malicious? Why or why not?**
6. **Under what circumstances would `ipconfig.exe` be considered high-confidence malicious?**

---

## 8. Expected Findings & Solutions
- **Executable**: `C:\Windows\System32\ipconfig.exe`
- **Command Line**: `ipconfig.exe /all`
- **Parent Process**: `C:\Windows\System32\cmd.exe` (or `powershell.exe` / `wsmprovhost.exe` via WinRM).
- **User Context**: `WORKGROUP\Administrator`.
- **Analysis**: `ipconfig.exe` is a built-in Windows utility (Living-off-the-Land Binary / LOLBin). It is not inherently malicious, but adversaries frequently execute `ipconfig /all` immediately after gaining initial access to map local subnet interfaces and DNS servers.

---

## 9. MITRE ATT&CK Mapping
- **Tactic**: Discovery (`TA0007`)
- **Technique**: System Network Configuration Discovery (`T1016`)

---

## 10. Conclusion & Cleanup
- **Conclusion**: You have successfully reconstructed a process execution tree using Sysmon Event ID 1 telemetry and extracted command-line arguments.
- **Cleanup**: No cleanup required.
