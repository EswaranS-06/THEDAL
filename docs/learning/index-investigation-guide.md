# SOCForge — OpenSearch Index-to-Investigation Guide

> A quick-reference guide detailing which OpenSearch index pattern to search during specific SOC investigation scenarios, along with key fields and query syntax.

---

## 1. Index Pattern Quick Reference

| OpenSearch Index Pattern | Target Telemetry Stream | When to Investigate | Primary Investigation Dashboard |
| :--- | :--- | :--- | :--- |
| `socforge-sysmon-*` | Microsoft Sysmon EventLog | Process creations, CLI arguments, parent-child lineage, network connections | Windows Endpoint Investigation |
| `socforge-powershell-*` | PowerShell Operational Log | ScriptBlock executions (4104), script modules (4103), download cradles | Windows Endpoint Investigation |
| `socforge-windows-security-*` | Windows Security EventLog | User logons (4624), failed logins (4625), privilege use (4672), process creation (4688) | Windows Endpoint Investigation |
| `socforge-nginx-access-*` | Nginx HTTP Access Logs | Web attack queries, URI paths, HTTP response codes, User-Agent strings | Web Applications Investigation |
| `socforge-nginx-error-*` | Nginx HTTP Error Logs | Web server errors, fastcgi exceptions, 403 Forbidden blocks | Web Applications Investigation |
| `socforge-auditd-*` | Linux Kernel Audit Framework | System command execution, web account privilege abuse (`www-data`), shell spawning | Web Applications Investigation |
| `socforge-linux-auth-*` | Linux `/var/log/auth.log` | SSH logins, sudo privilege escalation failures, PAM auth events | Security Operations Overview |
| `socforge-juice-shop-*` | OWASP Juice Shop Docker Logs | Containerized Node.js REST API traffic, Sequelize database stack traces | Web Applications Investigation |
| `wazuh-alerts-*` | All Aggregated Wazuh Alerts | Full SIEM alert stream, native rules, multi-source correlation alerts | Security Operations Overview |

---

## 2. Key Investigation Fields by Index

### A. `socforge-sysmon-*`
- `data.win.eventdata.image`: Path of the executing binary (e.g. `C:\Windows\System32\whoami.exe`).
- `data.win.eventdata.parentImage`: Path of the parent binary (e.g. `C:\Windows\System32\cmd.exe`, `powershell.exe`).
- `data.win.eventdata.commandLine`: Full command line including flags and arguments.
- `data.win.eventdata.user`: User account context (e.g. `WORKGROUP\Administrator`).
- `data.win.eventdata.processId`: Operating system process ID (PID).
- `data.win.eventdata.parentProcessId`: Parent process ID (PPID).
- `data.win.eventdata.hashes`: Cryptographic hashes of the binary (MD5, SHA256, IMPHASH).

### B. `socforge-powershell-*`
- `data.win.eventdata.scriptBlockText`: Complete raw PowerShell script code executed in memory.
- `data.win.system.eventID`: `4104` (ScriptBlock logging) or `4103` (Module logging).
- `data.win.eventdata.path`: Script file path if executed from disk.

### C. `socforge-nginx-access-*`
- `data.srcip`: Client IP address sending the HTTP request.
- `data.url`: Full request URI and query parameters (e.g. `/vulnerabilities/sqli/?id=1%27%20OR%20%271%27=%271`).
- `data.protocol`: HTTP method (`GET`, `POST`, `PUT`, `DELETE`).
- `data.id`: HTTP response status code (`200`, `302`, `403`, `404`, `500`).
- `data.agent`: User-Agent string from the client browser or scanning tool.

### D. `socforge-auditd-*`
- `data.audit.exe`: Full binary path executed on Linux (e.g. `/usr/bin/whoami`).
- `data.audit.euid`: Effective User ID (`0` = root, `33` = www-data, `1000` = ubuntu).
- `data.audit.execve.a0`, `a1`, `a2`: Command-line arguments passed to the binary.
- `data.audit.syscall`: System call ID (`59` = execve).
- `data.audit.key`: Audit rule tag (e.g. `socforge_recon_cmd`).

### E. `socforge-linux-auth-*`
- `data.srcuser`: Initiating username.
- `data.dstuser`: Target username.
- `data.program_name`: Subsystem generating the event (`sudo`, `sshd`, `pam`).
- `data.status`: Authentication result (`SUCCESS`, `FAILURE`).

---

## 3. Sample Investigation Queries

### Find all process executions spawned by PowerShell:
```text
data.win.system.channel: "Microsoft-Windows-Sysmon/Operational" AND data.win.eventdata.parentImage: *powershell.exe
```

### Find all SQL injection attempts against Nginx:
```text
rule.groups: "sqli" OR data.url: (*UNION* OR *SELECT* OR *%27*)
```

### Find all commands executed under the web service account (`www-data`):
```text
data.audit.euid: "33" OR data.audit.euid: "www-data"
```

### Find critical multi-source correlation alerts:
```text
rule.groups: "socforge_correlation" OR rule.level: >= 10
```
