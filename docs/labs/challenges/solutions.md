# SOCForge — Challenge Solutions & Analysis Keys

> This document contains hints and full solution keys for the SOCForge Challenge Tier investigations.

---

## Challenge 01: Unauthorized Web Application Tampering

### Challenge 01 Hints
- **Hint 1.1**: Open OpenSearch Dashboards Discover and select the index pattern `socforge-nginx-access-*`.
- **Hint 1.2**: Search for `rule.id: "100101"` or filter by `data.url: *sqli*`.
- **Hint 1.3**: Look at the `data.url` field and decode URL-encoded hex characters (`%27` = `'`, `%20` = space).

### Challenge 01 Solution
1. **HTTP Method & URI**: `GET /vulnerabilities/sqli/?id=1%27%20OR%20%271%27=%271&Submit=Submit HTTP/1.0`
2. **Source IP & User-Agent**: `10.10.20.114` (or `10.10.1.131`), `User-Agent: SOCForge-WebTester/1.0` (or `curl/7.81.0`).
3. **Vulnerability Targeted**: SQL Injection (Tautology payload `' OR '1'='1`).
4. **HTTP Status Code**: `302 Found` (redirecting with session or results).
5. **System Executions**: No events in `socforge-auditd-*` (indicating this was a data querying exploit, not Remote Code Execution).
6. **Classification**: **True Positive (Exploit Probe)**, Confidence: **High (95%+)**.
7. **MITRE ATT&CK**: `T1190` (Exploit Public-Facing Application).

---

## Challenge 02: Suspicious Administrative Process & Obfuscation

### Challenge 02 Hints
- **Hint 2.1**: Search `socforge-sysmon-*` for `rule.id: "100402"` or `data.win.eventdata.commandLine: *-enc*`.
- **Hint 2.2**: Search `socforge-powershell-*` for `data.win.system.eventID: "4104"` to see the raw in-memory ScriptBlock text without manual Base64 decoding.
- **Hint 2.3**: If decoding manually in Linux: `echo "<BASE64>" | base64 -d | iconv -f UTF-16LE -t UTF-8`.

### Challenge 02 Solution
1. **Executable**: `C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe`
2. **Command-Line Arguments**: `powershell.exe -NoProfile -enc ZwBlAHQALQBwAHIAbwBjAGUAcwBzACAALQBOAGEAbQBlACAAbABzAGEAcwBzAA==`
3. **Decoded Payload**: `get-process -Name lsass`
4. **Parent Process**: `cmd.exe` or `wsmprovhost.exe` (WinRM remote execution).
5. **User Context**: `WORKGROUP\Administrator`.
6. **Query Target**: `lsass.exe` (Local Security Authority Subsystem Service), indicating pre-attack reconnaissance for credential dumping.
7. **Classification**: **True Positive (Defense Evasion / Credential Reconnaissance)**, Confidence: **High (95%+)**. MITRE ATT&CK: `T1059.001` / `T1027.013`.

---

## Challenge 03: Stealth Host & Network Reconnaissance

### Challenge 03 Hints
- **Hint 3.1**: Open Discover and select `socforge-sysmon-*`.
- **Hint 3.2**: Filter for `agent.name: "windows"` and sort events in ascending chronological order.
- **Hint 3.3**: Search for `data.win.eventdata.image: (*whoami.exe* OR *systeminfo.exe* OR *net.exe* OR *schtasks.exe*)`.

### Challenge 03 Solution
1. **Discovery Count**: 4 distinct discovery commands (`whoami.exe`, `systeminfo.exe`, `net.exe`, `ipconfig.exe`) followed by 1 persistence command (`schtasks.exe`).
2. **Executed Binaries & CLI**:
   - `whoami.exe`
   - `systeminfo.exe`
   - `ipconfig.exe /all`
   - `net.exe user`
   - `schtasks.exe /create /tn ... /tr ... /sc daily`
3. **Persistence Target**: `schtasks.exe` registered a daily task executing command scripts.
4. **User Account**: `Administrator` (via remote WinRM session).
5. **Parent Process**: `powershell.exe` (or `wsmprovhost.exe`).
6. **Classification**: **True Positive (Adversary Host Reconnaissance & Persistence)**. The rapid velocity and combination of discovery followed immediately by task persistence confirms an active hands-on-keyboard intrusion. MITRE ATT&CK: `T1082`, `T1087.001`, `T1016`, `T1053.005`.
