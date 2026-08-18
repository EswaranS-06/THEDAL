# SOC Runbook: PowerShell Telemetry & Obfuscation Investigation

---

## 1. Overview & Trigger Conditions
This runbook provides triage procedures for suspicious PowerShell execution on the Windows endpoint (`10.10.10.254`), including:
- Download cradles (`Net.WebClient`, `DownloadString`, `Invoke-WebRequest`)
- Execution policy bypass flags (`-ExecutionPolicy Bypass`, `-WindowStyle Hidden`, `-NonInteractive`)
- Base64 encoded and obfuscated command lines (`-enc`, `-encodedcommand`)
- In-memory ScriptBlock logging (Event ID `4104`)

---

## 2. Initial Triage: What to Check First
1. **Was PowerShell executed interactively or via background process?**
2. **What flags were passed on the command line?**
3. **Was an encoded payload supplied?** If so, decode the Base64 UTF-16LE string.
4. **What did the in-memory ScriptBlock execute?** (Inspect `ScriptBlockText` in Event 4104).

---

## 3. Investigation Querying & Dashboards

- **Primary OpenSearch Index**: `socforge-powershell-*`
- **Secondary OpenSearch Index**: `socforge-sysmon-*`
- **Recommended Dashboard**: **SOCForge — Windows Endpoint Investigation**

### Useful OpenSearch Queries
```text
# Search for ScriptBlock logging events
data.win.system.eventID: "4104" AND data.win.system.channel: *PowerShell*

# Search for PowerShell download cradles or bypass flags
data.win.eventdata.scriptBlockText: (*DownloadString* OR *Net.WebClient* OR *Bypass* OR *IEX*)

# Search for encoded PowerShell in Sysmon process creations
data.win.eventdata.commandLine: (*-enc* OR *-encodedcommand*)
```

---

## 4. Key Evidence Fields to Evaluate

| Field Name | Description | Key Indicators |
| :--- | :--- | :--- |
| `data.win.eventdata.scriptBlockText` | In-memory PowerShell code | Cradles, memory reflection, API invocations |
| `data.win.eventdata.commandLine` | CLI arguments | `-enc`, `-w hidden`, `-ep bypass`, `-nop` |
| `data.win.eventdata.parentImage` | Parent process | `cmd.exe`, `explorer.exe`, `wscript.exe`, `mshta.exe` |
| `data.win.eventdata.user` | Security context | `Administrator`, `SYSTEM` |

---

## 5. Distinguishing True Positives from False Positives

- **True Positive (TP)**:
  - PowerShell launched with multiple stealth flags (`-nop -w hidden -ep bypass -enc`).
  - ScriptBlock containing web download cradles downloading `.ps1` or `.exe` files from external or unrecognized IPs.
  - PowerShell spawned by non-administrative processes (e.g. Office applications, web servers, script interpreters).
- **False Positive (FP)**:
  - Standard Windows PowerShell scheduled maintenance scripts (e.g., Azure VM agent, Windows Update diagnostics, PowerShell Desired State Configuration).

---

## 6. Decoding Obfuscated Commands
To decode standard PowerShell `-encodedcommand` strings:
```bash
# In Linux bash:
echo "<BASE64_STRING>" | base64 -d | iconv -f UTF-16LE -t UTF-8
```

---

## 7. What to Document in the Incident Report
- Originating Process and Parent PID.
- Exact CLI flags and decoded PowerShell script content.
- External URLs, IP addresses, or dropped file paths discovered in the ScriptBlock.
- Associated MITRE ATT&CK Techniques (`T1059.001` - PowerShell, `T1027.013` - Encoded Command).
- Determination of True Positive vs. Benign Script.
