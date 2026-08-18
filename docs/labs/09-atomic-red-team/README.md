# Lab 09: Atomic Red Team Adversary Emulation & Host Discovery

---

## 1. Objective
Learn how adversary emulation frameworks (Atomic Red Team) operate, correlate offensive ground-truth execution logs with defensive Windows Security and Sysmon telemetry, and construct an end-to-end timeline of host reconnaissance.

---

## 2. Prerequisites
- Completed **Levels 1 and 2 (Labs 01–08)**.
- Reviewed [Atomic Red Team Runbook](file:///home/rex/Documents/Projects/docs/runbooks/atomic-investigation.md).

---

## 3. Scenario
An adversary executes post-exploitation discovery tradecraft on the Windows endpoint to identify local user accounts and domain memberships. You must compare the simulation execution record with the resulting SIEM alerts.

---

## 4. Attack / Event Generation
From the Linux Attack Host, execute the Local Account Discovery technique (`T1087.001`):

```bash
# Connect to Attack Host via Bastion
ssh -i ~/.ssh/socforge_key -o ProxyJump=ubuntu@<BASTION_PUBLIC_IP> ubuntu@10.10.20.114

# Execute Local Account Discovery atomic test
/usr/local/bin/run-atomic-test --technique T1087.001 --confirm
```

---

## 5. Expected Telemetry
- **Generating Host**: `SOCForge-windows` (`10.10.10.254`).
- **Telemetry Sources**:
  1. Windows Security EventLog (Event `4688`).
  2. Sysmon (Event ID `1` - Process Creation).
  3. Attack Host Ground-Truth Audit Log (`/var/log/socforge/atomic/simulation.log`).
- **Target Indices**: `socforge-sysmon-*` and `wazuh-alerts-*`.
- **Wazuh Detection Rule**: `100404` (Level 6: *Discovery and reconnaissance binary execution on Windows endpoint*).

---

## 6. Investigation Steps

1. **Check the Simulation Ground-Truth Log on Attack Host**:
   ```bash
   ssh -i ~/.ssh/socforge_key -o ProxyJump=ubuntu@<BASTION_PUBLIC_IP> ubuntu@10.10.20.114 'tail -n 15 /var/log/socforge/atomic/simulation.log'
   ```
   - Note the **Simulation ID**, **Technique**, and **Timestamp**.
2. **Search OpenSearch for Correlated Detections**:
   - In OpenSearch Dashboards Discover, select: `socforge-sysmon-*`.
   - Search for:
     ```text
     data.win.system.eventID: "1" AND data.win.eventdata.image: *net.exe
     ```
3. **Verify the Adversary Attack Activity Dashboard**:
   - Open **Dashboard** -> **SOCForge — Adversary Attack Activity & Ground Truth**.
   - Confirm that the simulation event maps directly to the Sysmon detection.

---

## 7. Investigative Questions
1. **What specific command line did the atomic test execute to enumerate local accounts?**
2. **What was the parent process ID and executable name?**
3. **Why is ground-truth auditing useful for SOC detection validation?**
4. **How would an attacker use local account enumeration data for privilege escalation?**

---

## 8. Expected Findings & Solutions
- **Executed Command**: `net.exe user` (or `net localgroup administrators`).
- **Parent Process**: `powershell.exe` (invoked via WinRM `wsmprovhost.exe`).
- **Ground-Truth Value**: Ground-truth logs provide unambiguous proof of what commands were run, when, and by whom, allowing defensive teams to measure Mean Time to Detect (MTTD) and test for detection blind spots.

---

## 9. MITRE ATT&CK Mapping
- **Tactic**: Discovery (`TA0007`)
- **Technique**: Account Discovery: Local Accounts (`T1087.001`)

---

## 10. Conclusion & Cleanup
- **Conclusion**: You have successfully correlated an automated Atomic Red Team attack simulation with defensive Sysmon and Windows Security logs.
- **Cleanup**: No cleanup required.
