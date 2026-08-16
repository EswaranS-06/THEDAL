# SOCForge — Telemetry, Logging & Index Architecture

> **Phase 7 Status**: The Wazuh SIEM core is operational, and the **Windows Employee Endpoint** is fully instrumented with Windows Security Auditing, PowerShell ScriptBlock Logging, Microsoft Sysmon, and the Wazuh Agent.

---

## 1. Windows Endpoint Telemetry Flow

```text
+-------------------------------------------------------------+
|               SOCForge Windows Endpoint (10.10.10.x)        |
|                                                             |
|  [Security Auditing]       [PowerShell]        [Sysmon]     |
|   - 4688 (Process+CLI)      - 4104 ScriptBlock  - 1 Process |
|   - 4624/4625 Logon         - 4103 Module       - 3 Network |
|   - 4720/4726 Accounts                          - 7 DLLs    |
|                                                 - 10 LSASS  |
|                                                 - 11 Files  |
|                                                 - 12-14 Reg |
|                                                 - 22 DNS    |
+------------------------------+------------------------------+
                               |
                               v
               Windows Event Log Channels
                               |
                               v
            Wazuh Agent Service (WazuhSvc)
                               |
                               | (Encrypted TCP 1514 / TLS)
                               v
               Wazuh Manager (SOCForge-wazuh :1514)
                               |
                               | (Rules, Decoders & Threat Matching)
                               v
               Wazuh Indexer (OpenSearch Engine :9200)
                               |
                               v
               Wazuh Dashboard (HTTPS :443 -> localhost:8443)
```

---

## 2. Windows Event & Sysmon Telemetry Matrix

| Telemetry Source | Event ID | Event Name | Detection & Investigation Purpose |
| :--- | :--- | :--- | :--- |
| **Windows Security** | `4688` | Process Creation | Logs every process spawn with full command line (`ProcessCreationIncludeCmdLine_Enabled`) |
| **Windows Security** | `4624` | Successful Logon | Tracks interactive, network, and service logons |
| **Windows Security** | `4625` | Failed Logon | Detects brute force, password spraying, and invalid credential attempts |
| **Windows Security** | `4720` | User Account Created | Detects unauthorized backdoor account creation |
| **Windows Security** | `4726` | User Account Deleted | Detects attacker cleanup or anti-forensic account deletion |
| **PowerShell** | `4104` | Script Block Logging | Full content of executed PowerShell blocks (de-obfuscated at runtime) |
| **PowerShell** | `4103` | Module Logging | Pipeline execution details and module invocations |
| **Microsoft Sysmon** | `1` | Process Create | Process launch with parent process lineage, user SID, and cryptographic hashes (SHA256, MD5, IMPHASH) |
| **Microsoft Sysmon** | `3` | Network Connect | Outbound network connections from command shells, scripts, and binaries |
| **Microsoft Sysmon** | `7` | Image Loaded | Detection of sensitive DLL loading (e.g. `samlib.dll`, `vaultcli.dll`, `wdigest.dll`) |
| **Microsoft Sysmon** | `10` | Process Access | Detection of credential dumping attempts targeting `lsass.exe` |
| **Microsoft Sysmon** | `11` | File Create | Tracking dropped scripts (`.ps1`, `.bat`, `.vbs`, `.hta`) in `\Temp`, `\Downloads`, `\Public` |
| **Microsoft Sysmon** | `12, 13, 14` | Registry Events | Tracking persistence in `CurrentVersion\Run`, Services, and Defender tampering |
| **Microsoft Sysmon** | `22` | DNS Query | Domain resolution events for C2 beaconing and data exfiltration detection |

---

## 3. Phased Index Separation Roadmap

* **Phase 6 & 7 (Current)**:
  * Ingests all telemetry into standard Wazuh indices (`wazuh-alerts-4.x-*`).
  * Full event metadata, channel identifiers, and original fields are strictly preserved.
* **Phase 8 & 9**:
  * Ingestion of Linux Web access/error logs and Docker containerized application logs.
* **Phase 10**:
  * Formal index routing rules separating `soc-windows-*`, `soc-sysmon-*`, `soc-nginx-*`, and `soc-atomic-*`.
