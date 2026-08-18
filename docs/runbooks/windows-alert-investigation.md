# SOC Runbook: Windows Endpoint Alert Investigation

---

## 1. Overview & Trigger Conditions
This runbook guides the investigation of alerts originating from the Windows Server 2022 endpoint (`10.10.10.254`), including Windows Security EventLogs, administrative reconnaissance, privilege assignment, and system service alterations.

---

## 2. Initial Triage: What to Check First
1. **Agent ID & Target Host**: Confirm the alert originated from Agent `003` (`windows` / `10.10.10.254`).
2. **Event Source Channel**: Identify whether the event stems from `Security`, `System`, or `Application`.
3. **Event ID**:
   - `4624`: Successful Logon
   - `4625`: Failed Logon
   - `4688`: Process Creation (with Command-Line Auditing)
   - `4672`: Special Privileges Assigned to New Logon (Administrator rights)
   - `7045`: New Windows Service Installed

---

## 3. Investigation Querying & Dashboards

- **Primary OpenSearch Index**: `socforge-windows-security-*`
- **Secondary Indices**: `socforge-sysmon-*`, `socforge-powershell-*`
- **Recommended Dashboard**: **SOCForge — Windows Endpoint Investigation**

### Useful OpenSearch Queries
```text
# Filter for all security events on Windows host
agent.name: "windows" AND data.win.system.channel: "Security"

# Check for specific process execution via Event 4688
data.win.system.eventID: "4688" AND data.win.eventdata.newProcessName: *whoami.exe
```

---

## 4. Key Evidence Fields to Evaluate

| Field Name | Description | Key Indicators |
| :--- | :--- | :--- |
| `data.win.system.eventID` | Windows Event ID | 4688 (Process Creation), 4624/4625 (Logon) |
| `data.win.eventdata.targetUserName` | User context | `Administrator`, `SYSTEM`, or unusual account |
| `data.win.eventdata.newProcessName` | Executable invoked | Native admin tools (`whoami.exe`, `net.exe`, `nltest.exe`) |
| `data.win.eventdata.commandLine` | Full CLI command | Recon flags (`/all`, `user /domain`, `localgroup`) |
| `data.win.eventdata.parentProcessName`| Originating parent | `cmd.exe`, `powershell.exe`, `wmiprvse.exe` |

---

## 5. Distinguishing True Positives from False Positives

- **True Positive (TP)**:
  - Execution of discovery commands (`whoami.exe`, `systeminfo.exe`, `ipconfig.exe`, `net user`) occurring in rapid succession within seconds of each other.
  - Commands spawned by unexpected parent processes (e.g. `w3wp.exe` or `spoolsv.exe`).
- **False Positive (FP)**:
  - Scheduled inventory scripts or administrative monitoring agents running routine health checks at predictable, regular intervals.

---

## 6. What to Document in the Incident Report
- Target Hostname and IP (`windows` / `10.10.10.254`).
- Executing user account (`TargetUserName`).
- Complete command line and binary path.
- Parent process name and Parent PID.
- MITRE ATT&CK Technique ID (e.g. `T1082`, `T1087.001`, `T1016`).
- Final disposition: True Positive (Reconnaissance) vs. False Positive (Administrative).
