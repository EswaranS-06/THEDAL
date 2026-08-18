# Lab 11: Scheduled Task Creation & Endpoint Persistence Analysis

---

## 1. Objective
Learn how to investigate adversary persistence mechanisms created via Windows command-line utilities (`schtasks.exe`), detect unauthorized task scheduling, evaluate execution triggers, and map persistence tradecraft to MITRE ATT&CK.

---

## 2. Prerequisites
- Completed **Labs 01–10**.
- Reviewed [Sysmon Investigation Runbook](file:///home/rex/Documents/Projects/docs/runbooks/sysmon-investigation.md).

---

## 3. Scenario
An adversary establishes persistent access on the Windows Server endpoint by creating a daily scheduled task using the command-line utility `schtasks.exe`. As a SOC analyst, you must determine what executable was scheduled, who created it, and what schedule parameters were configured.

---

## 4. Attack / Event Generation
From the Linux Attack Host, execute the Scheduled Task technique (`T1053.005`):

```bash
# Connect to Attack Host via Bastion
ssh -i ~/.ssh/socforge_key -o ProxyJump=ubuntu@<BASTION_PUBLIC_IP> ubuntu@10.10.20.114

# Execute Scheduled Task atomic simulation
/usr/local/bin/run-atomic-test --technique T1053.005 --confirm
```

---

## 5. Expected Telemetry
- **Generating Host**: `SOCForge-windows` (`10.10.10.254`).
- **Telemetry Sources**: Sysmon Event ID 1 (Process Creation).
- **Target Index**: `socforge-sysmon-*`.
- **Wazuh Detection Rule**: `100406` (Level 7: *SOCForge (DET-WIN-006): Scheduled task created via command-line interface*).

---

## 6. Investigation Steps

1. **Search for Scheduled Task Execution in Discover**:
   - In OpenSearch Dashboards Discover, select index pattern: `socforge-sysmon-*`.
   - Search for:
     ```text
     rule.id: "100406" OR data.win.eventdata.image: *schtasks.exe
     ```
2. **Analyze Command-Line Parameters**:
   - Review `data.win.eventdata.commandLine`.
   - Note the `/create` flag, task name (`/tn`), target binary (`/tr`), and schedule frequency (`/sc`).
3. **Verify Task Cleanup / Deletion**:
   - Search for subsequent invocations of `schtasks.exe` with `/delete` to confirm that the simulation safely cleaned up the artifact.

---

## 7. Investigative Questions
1. **What command-line arguments were used to create the task?**
2. **What task name was registered on the system?**
3. **What binary or program was configured to execute?**
4. **Why do adversaries favor scheduled tasks for persistence?**
5. **How can administrators audit and detect unauthorized scheduled tasks in an enterprise environment?**

---

## 8. Expected Findings & Solutions
- **CLI Syntax**: `schtasks.exe /create /tn "T1053_005_Task" /tr "cmd.exe /c echo AtomicTest" /sc daily /st 00:00 /f`
- **Task Name**: `T1053_005_Task` (or `SOCForgeLabTask`).
- **Target Program**: `cmd.exe` or `notepad.exe`.
- **Persistence Mechanism**: Scheduled tasks allow malware to survive system reboots and execute under elevated privileges (`SYSTEM` or `Administrator`) without requiring active user interaction.
- **Enterprise Defense**: Enable TaskScheduler operational logging (Event IDs 106, 140, 200) and monitor command-line auditing for `schtasks.exe` and PowerShell `Register-ScheduledTask`.

---

## 9. MITRE ATT&CK Mapping
- **Tactic**: Persistence (`TA0003`) / Privilege Escalation (`TA0004`)
- **Technique**: Scheduled Task/Job: Scheduled Task (`T1053.005`)

---

## 10. Conclusion & Cleanup
- **Conclusion**: You have successfully detected and analyzed command-line scheduled task persistence in Sysmon logs.
- **Cleanup**: The atomic simulation automatically issues `schtasks /delete /f` upon completion.
