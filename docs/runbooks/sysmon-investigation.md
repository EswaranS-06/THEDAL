# SOC Runbook: Sysmon Process Lineage & Endpoint Telemetry Investigation

---

## 1. Overview & Trigger Conditions
This runbook guides deep host-level investigations using Microsoft Sysmon telemetry collected from the Windows Server 2022 endpoint (`10.10.10.254`), focusing on:
- Host & Network Discovery Utilities (`DET-WIN-004` / Rule `100404`)
- Scheduled Task Creation (`DET-WIN-006` / Rule `100406`)
- Suspicious Office / Web Process Spawning Command Interpreters (`DET-WIN-003` / Rule `100403`)
- Unauthorized LSASS Memory Access (`DET-WIN-005` / Rule `100405`)

---

## 2. Sysmon Event ID Reference

| Sysmon Event ID | Name | Description & Investigative Value |
| :--- | :--- | :--- |
| **Event ID 1** | **Process Creation** | Full CLI, parent process, current directory, user, SHA256 hashes |
| **Event ID 3** | **Network Connection** | Process initiating outbound/inbound TCP/UDP connection |
| **Event ID 7** | **Image Loaded** | DLLs loaded into process memory (detects DLL side-loading) |
| **Event ID 8** | **CreateRemoteThread**| Process injecting threads into foreign processes (process injection) |
| **Event ID 10** | **ProcessAccess** | Process opening memory handles (detects LSASS credential dumping) |
| **Event ID 11** | **FileCreate** | Files created or overwritten on disk (tracks dropped malware) |
| **Event ID 12/13/14**| **Registry Events** | Run keys, service additions, persistence registry modifications |

---

## 3. Investigation Querying & Dashboards

- **Primary OpenSearch Index**: `socforge-sysmon-*`
- **Secondary OpenSearch Index**: `socforge-windows-security-*`
- **Recommended Dashboard**: **SOCForge — Windows Endpoint Investigation**

### Useful OpenSearch Queries
```text
# Find process creation events with suspicious parent-child lineage
data.win.system.eventID: "1" AND data.win.eventdata.parentImage: (*winword.exe* OR *excel.exe* OR *w3wp.exe* OR *nginx.exe*)

# Find execution of discovery binaries
data.win.system.eventID: "1" AND data.win.eventdata.image: (*whoami.exe* OR *systeminfo.exe* OR *ipconfig.exe* OR *net.exe* OR *nltest.exe*)

# Find process access to LSASS memory
data.win.system.eventID: "10" AND data.win.eventdata.targetImage: *lsass.exe
```

---

## 4. How to Reconstruct Process Trees (Lineage)
To understand who spawned an anomalous binary:
1. Locate the suspicious process creation event (`Event ID 1`).
2. Note the `processId` (PID) and `parentProcessId` (PPID).
3. Search `socforge-sysmon-*` for the event where `data.win.eventdata.processId` equals the observed PPID.
4. Repeat upward until reaching the root ancestor (e.g. `explorer.exe`, `services.exe`, or `winlogon.exe`).

---

## 5. What to Document in the Incident Report
- Target Binary Path and SHA256 Hash.
- Full Command Line string including all parameters.
- Parent Process Path and PPID.
- User security context (`user`).
- Associated MITRE ATT&CK Techniques (`T1082`, `T1016`, `T1053.005`, `T1003.001`).
- Determination of True Positive vs. Authorized System Administration.
