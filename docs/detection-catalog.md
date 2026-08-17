# SOCForge — Detection Catalog (Phase 13)

> **Status**: Comprehensive catalog of 18 curated detection rules across Web (DVWA, Juice Shop), Nginx, Windows Endpoint (Sysmon, PowerShell), Linux Auditd, and Multi-Source Correlation.

---

## 1. Web Target Detections (DVWA)

### `DET-WEB-001` — SQL Injection Attempt
* **Wazuh Rule ID**: `100101`
* **Data Source**: `nginx_access` (`socforge.source: "nginx_access"`)
* **Required Fields**: `url`, `action`, `srcip`
* **Detection Logic**: Evaluates HTTP request URI for SQL injection tokens (`UNION SELECT`, `' OR '1'='1`, `INFORMATION_SCHEMA`, `--`, `#`).
* **Severity**: `Level 8` (High)
* **MITRE ATT&CK**: `T1190` (Exploit Public-Facing Application)
* **Expected False Positives**: Security training workshops, authorized vulnerability assessments, developer unit testing.
* **Investigation Steps**:
  1. Identify client source IP and User-Agent.
  2. Inspect URL parameters and POST body for targeted database tables.
  3. Correlate with HTTP response status (200 vs 500) and response body size.
* **Related Simulation**: Scenario `DVWA-03`
* **Test Method**: `tests/detections/dvwa_sqli_positive.log` vs `dvwa_sqli_negative.log`

---

### `DET-WEB-002` — Command Injection Attempt
* **Wazuh Rule ID**: `100102`
* **Data Source**: `nginx_access` (`socforge.source: "nginx_access"`)
* **Required Fields**: `url`, `action`, `srcip`
* **Detection Logic**: Detects shell command separators (`;`, `|`, `&&`, `` ` ``) followed by shell utilities (`whoami`, `cat /etc/passwd`, `nc`, `bash -i`, `ping`).
* **Severity**: `Level 9` (High)
* **MITRE ATT&CK**: `T1059.004` (Command and Scripting Interpreter: Unix Shell)
* **Expected False Positives**: Network diagnostics web tools executing system pings.
* **Investigation Steps**:
  1. Extract injected command from query parameters or POST payload.
  2. Check `auditd` logs on `SOCForge-web` for process execution by `www-data` (UID 33).
  3. Verify whether outbound network connections were initiated.
* **Related Simulation**: Scenario `DVWA-04`
* **Test Method**: `tests/detections/dvwa_cmdi_positive.log` vs `dvwa_cmdi_negative.log`

---

### `DET-WEB-003` — Path Traversal / Local File Inclusion (LFI)
* **Wazuh Rule ID**: `100103`
* **Data Source**: `nginx_access` (`socforge.source: "nginx_access"`)
* **Required Fields**: `url`, `action`, `srcip`
* **Detection Logic**: Detects directory traversal sequences (`../`, `..%2f`) or sensitive system file paths (`/etc/passwd`, `win.ini`).
* **Severity**: `Level 7` (Medium)
* **MITRE ATT&CK**: `T1083` (File and Directory Discovery)
* **Expected False Positives**: Static documentation referencing relative directory links.
* **Investigation Steps**:
  1. Inspect requested file path and encoding method.
  2. Check response status code (200 with large payload indicates successful leak).
* **Related Simulation**: Scenario `DVWA-05`
* **Test Method**: `tests/detections/dvwa_lfi_positive.log` vs `dvwa_lfi_negative.log`

---

### `DET-WEB-004` — Suspicious Executable Upload / Web Shell
* **Wazuh Rule ID**: `100104`
* **Data Source**: `nginx_access` (`socforge.source: "nginx_access"`)
* **Required Fields**: `url`, `action`, `srcip`
* **Detection Logic**: Detects requests accessing `/hackable/uploads/` targeting executable scripts (`.php`, `.phtml`, `.php5`, `.phar`).
* **Severity**: `Level 8` (High)
* **MITRE ATT&CK**: `T1505.003` (Server Software Component: Web Shell)
* **Expected False Positives**: Administrative document management systems accepting `.php` templates.
* **Investigation Steps**:
  1. Check Wazuh FIM (Syscheck) alerts for newly created files in `/var/www/dvwa/hackable/uploads/`.
  2. Isolate and examine uploaded file content for web shell signatures (`eval()`, `system()`, `passthru()`).
* **Related Simulation**: Scenario `DVWA-06`
* **Test Method**: `tests/detections/dvwa_upload_positive.log` vs `dvwa_upload_negative.log`

---

## 2. OWASP Juice Shop Container Detections

### `DET-JS-001` — Suspicious API Enumeration
* **Wazuh Rule ID**: `100201`
* **Data Source**: `juice_shop` (`socforge.source: "juice_shop"`)
* **Required Fields**: `url`, `http_method`
* **Detection Logic**: Detects probing of internal user enumeration or admin API endpoints (`/rest/user/authentication-details`, `/api/Users`, `/rest/admin`).
* **Severity**: `Level 6` (Medium)
* **MITRE ATT&CK**: `T1087` (Account Discovery) / `T1595.002` (Vulnerability Scanning)
* **Expected False Positives**: Administrative frontend dashboard initialization requests.
* **Related Simulation**: Scenario `JS-03`
* **Test Method**: `tests/detections/js_apienum_positive.log` vs `js_apienum_negative.log`

---

### `DET-JS-002` — Authentication Abuse / Password Spray
* **Wazuh Rule ID**: `100202`
* **Data Source**: `juice_shop` (`socforge.source: "juice_shop"`)
* **Required Fields**: `url`, `http_status`
* **Detection Logic**: Threshold rule: 5 failed login attempts (HTTP 401) on `/rest/user/login` within 60 seconds.
* **Severity**: `Level 8` (High)
* **MITRE ATT&CK**: `T1110.001` (Brute Force: Password Spraying)
* **Expected False Positives**: User forgot password attempting multiple credentials.
* **Related Simulation**: Scenario `JS-02`
* **Test Method**: `tests/detections/js_auth_positive.log` vs `js_auth_negative.log`

---

### `DET-JS-003` — SQL/NoSQL Injection Probing
* **Wazuh Rule ID**: `100203`
* **Data Source**: `juice_shop` (`socforge.source: "juice_shop"`)
* **Required Fields**: `url`, `log`
* **Detection Logic**: Matches SQL/NoSQL injection tokens in search queries (`q=apple'))--`, `' OR 1=1--`, `$ne`, `$gt`).
* **Severity**: `Level 8` (High)
* **MITRE ATT&CK**: `T1190` (Exploit Public-Facing Application)
* **Expected False Positives**: Product search containing special punctuation or quotes.
* **Related Simulation**: Scenario `JS-05`
* **Test Method**: `tests/detections/js_sqli_positive.log` vs `js_sqli_negative.log`

---

### `DET-JS-004` — Sensitive Directory & Configuration Probing
* **Wazuh Rule ID**: `100204`
* **Data Source**: `juice_shop` (`socforge.source: "juice_shop"`)
* **Required Fields**: `url`
* **Detection Logic**: Matches access to `/ftp/`, `/ftp/package.json.bak`, `/ftp/legal.md`, `/rest/admin/application-configuration`.
* **Severity**: `Level 7` (Medium)
* **MITRE ATT&CK**: `T1083` (File and Directory Discovery)
* **Expected False Positives**: Public downloads intentionally served from `/ftp/`.
* **Related Simulation**: Scenario `JS-06`
* **Test Method**: `tests/detections/js_admin_positive.log` vs `js_admin_negative.log`

---

### `DET-JS-005` — Database Syntax Error / Stack Trace Exposure
* **Wazuh Rule ID**: `100205`
* **Data Source**: `juice_shop` (`socforge.source: "juice_shop"`)
* **Required Fields**: `log`, `stream`
* **Detection Logic**: Matches database error traces in container stderr (`SequelizeDatabaseError`, `SQLITE_ERROR`, `SyntaxError`).
* **Severity**: `Level 7` (Medium)
* **MITRE ATT&CK**: `T1592.002` (Gather Victim Host Information)
* **Expected False Positives**: Application startup schema migration warnings.
* **Related Simulation**: Scenario `JS-04`
* **Test Method**: `tests/detections/js_error_positive.log` vs `js_error_negative.log`

---

## 3. Nginx Web Server & Threat Detections

### `DET-NGX-001` — Web Scanning / Directory Fuzzing
* **Wazuh Rule ID**: `100301`
* **Data Source**: `nginx_access` (`socforge.source: "nginx_access"`)
* **Required Fields**: `id` (404), `srcip`
* **Detection Logic**: Threshold rule: 8 or more HTTP 404 responses from the same source IP within 30 seconds.
* **Severity**: `Level 7` (Medium)
* **MITRE ATT&CK**: `T1595.002` (Active Scanning: Vulnerability Scanning)
* **Expected False Positives**: Web crawlers following broken hyperlinks.
* **Test Method**: `tests/detections/ngx_scan_positive.log` vs `ngx_scan_negative.log`

---

### `DET-NGX-002` — Unusual HTTP Method Probe
* **Wazuh Rule ID**: `100302`
* **Data Source**: `nginx_access` (`socforge.source: "nginx_access"`)
* **Required Fields**: `action` (HTTP method)
* **Detection Logic**: Detects uncommon HTTP methods (`PUT`, `DELETE`, `DEBUG`, `TRACE`, `CONNECT`).
* **Severity**: `Level 6` (Medium)
* **MITRE ATT&CK**: `T1071.001` (Application Layer Protocol: Web Protocols)
* **Expected False Positives**: REST API endpoints utilizing PUT/DELETE methods with valid authentication.
* **Test Method**: `tests/detections/ngx_method_positive.log` vs `ngx_method_negative.log`

---

### `DET-NGX-003` — Automated Security Scanner User-Agent
* **Wazuh Rule ID**: `100303`
* **Data Source**: `nginx_access` (`socforge.source: "nginx_access"`)
* **Required Fields**: `match` in User-Agent header
* **Detection Logic**: Matches known scanning tool signatures (`sqlmap`, `nikto`, `gobuster`, `dirbuster`, `nmap`, `wpscan`, `hydra`).
* **Severity**: `Level 7` (Medium)
* **MITRE ATT&CK**: `T1595` (Active Scanning)
* **Expected False Positives**: Scheduled internal vulnerability scanners.
* **Test Method**: `tests/detections/ngx_scanner_ua_positive.log` vs `ngx_scanner_ua_negative.log`

---

## 4. Windows Endpoint & Sysmon Lineage Detections

### `DET-WIN-001` — Suspicious PowerShell Execution Flags & Download Cradle
* **Wazuh Rule ID**: `100401`
* **Data Source**: `sysmon` (`socforge.source: "sysmon"`) / `windows_security`
* **Required Fields**: `win.eventdata.image`, `win.eventdata.commandLine`
* **Detection Logic**: Matches `powershell.exe` execution containing `-ExecutionPolicy Bypass`, `-WindowStyle Hidden`, `DownloadString`, `Net.WebClient`, `IEX`.
* **Severity**: `Level 7` (Medium)
* **MITRE ATT&CK**: `T1059.001` (Command and Scripting Interpreter: PowerShell)
* **Expected False Positives**: Automated software deployment scripts (SCCM/Intune/Ansible).
* **Related Simulation**: Atomic Test `T1059.001-1`
* **Test Method**: `tests/detections/win_ps_cradle_positive.log` vs `win_ps_cradle_negative.log`

---

### `DET-WIN-002` — PowerShell Encoded / Obfuscated Command
* **Wazuh Rule ID**: `100402`
* **Data Source**: `sysmon` (`socforge.source: "sysmon"`) / `powershell`
* **Required Fields**: `win.eventdata.image`, `win.eventdata.commandLine`
* **Detection Logic**: Matches `powershell.exe` with `-enc`, `-EncodedCommand`, `-e ` flags.
* **Severity**: `Level 8` (High)
* **MITRE ATT&CK**: `T1027.013` (Obfuscated Files or Information: Encoded Script)
* **Expected False Positives**: Management utilities packaging encoded scripts to prevent escaping errors.
* **Related Simulation**: Atomic Test `T1059.001-1`
* **Test Method**: `tests/detections/win_ps_encoded_positive.log` vs `win_ps_encoded_negative.log`

---

### `DET-WIN-003` — Suspicious Parent-Child Process Lineage
* **Wazuh Rule ID**: `100403`
* **Data Source**: `sysmon` (`socforge.source: "sysmon"`)
* **Required Fields**: `win.system.eventID` (1), `win.eventdata.parentImage`, `win.eventdata.image`
* **Detection Logic**: Matches command interpreters (`cmd.exe`, `powershell.exe`) spawned from Office applications (`winword.exe`, `excel.exe`, `outlook.exe`) or Web servers (`w3wp.exe`, `nginx.exe`).
* **Severity**: `Level 9` (High)
* **MITRE ATT&CK**: `T1059.003` (Command and Scripting Interpreter: Windows Command Shell)
* **Expected False Positives**: Word macros explicitly designed to run command utilities.
* **Test Method**: `tests/detections/win_parent_child_positive.log` vs `win_parent_child_negative.log`

---

### `DET-WIN-004` — Host & Network Discovery Reconnaissance
* **Wazuh Rule ID**: `100404`
* **Data Source**: `sysmon` (`socforge.source: "sysmon"`) / `windows_security`
* **Required Fields**: `win.system.eventID` (1 or 4688), `win.eventdata.image`
* **Detection Logic**: Detects execution of discovery binaries: `whoami.exe`, `systeminfo.exe`, `ipconfig.exe`, `net.exe user`, `nltest.exe`.
* **Severity**: `Level 6` (Medium)
* **MITRE ATT&CK**: `T1082` (System Information Discovery), `T1016` (System Network Configuration Discovery), `T1087.001` (Local Accounts)
* **Expected False Positives**: Administrator performing manual troubleshooting.
* **Related Simulation**: Atomic Tests `T1082-1`, `T1016-1`, `T1087.001-1`
* **Test Method**: `tests/detections/win_recon_positive.log` vs `win_recon_negative.log`

---

### `DET-WIN-005` — Suspicious Process Access to LSASS Memory
* **Wazuh Rule ID**: `100405`
* **Data Source**: `sysmon` (`socforge.source: "sysmon"`)
* **Required Fields**: `win.system.eventID` (10), `win.eventdata.targetImage`, `win.eventdata.grantedAccess`
* **Detection Logic**: Detects process opening a handle to `lsass.exe` with suspicious memory access masks (`0x1010`, `0x1F0FFF`, `0x1410`).
* **Severity**: `Level 10` (Critical)
* **MITRE ATT&CK**: `T1003.001` (OS Credential Dumping: LSASS Memory)
* **Expected False Positives**: Antivirus or EDR agents inspecting system processes.
* **Test Method**: `tests/detections/win_lsass_positive.log` vs `win_lsass_negative.log`

---

### `DET-WIN-006` — Scheduled Task Creation via Command Line
* **Wazuh Rule ID**: `100406`
* **Data Source**: `sysmon` (`socforge.source: "sysmon"`)
* **Required Fields**: `win.eventdata.image`, `win.eventdata.commandLine`
* **Detection Logic**: Detects execution of `schtasks.exe` with `/create` parameter.
* **Severity**: `Level 7` (Medium)
* **MITRE ATT&CK**: `T1053.005` (Scheduled Task/Job: Scheduled Task)
* **Expected False Positives**: Scheduled system maintenance scripts.
* **Related Simulation**: Atomic Test `T1053.005-1`
* **Test Method**: `tests/detections/win_schtasks_positive.log` vs `win_schtasks_negative.log`

---

## 5. Linux System & Auditd Detections

### `DET-LNX-001` — Suspicious Command Execution by Web Service Account
* **Wazuh Rule ID**: `100501`
* **Data Source**: `auditd` (`socforge.source: "auditd"`)
* **Required Fields**: `audit.euid` (33/www-data), `audit.exe`
* **Detection Logic**: Detects web service account `www-data` executing discovery binaries (`/usr/bin/whoami`, `/bin/uname`, `/usr/bin/id`, `/bin/nc`).
* **Severity**: `Level 7` (Medium)
* **MITRE ATT&CK**: `T1082` (System Information Discovery) / `T1059.004` (Unix Shell)
* **Expected False Positives**: Legitimate PHP scripts spawning system tools for health checks.
* **Test Method**: `tests/detections/lnx_auditd_positive.log` vs `lnx_auditd_negative.log`

---

### `DET-LNX-002` — Sudo Privilege Escalation Failure
* **Wazuh Rule ID**: `100502`
* **Data Source**: `linux_auth` (`socforge.source: "linux_auth"`)
* **Required Fields**: `match` in `/var/log/auth.log`
* **Detection Logic**: Detects failed sudo attempts (`user NOT in sudoers`, `authentication failure`).
* **Severity**: `Level 8` (High)
* **MITRE ATT&CK**: `T1548.003` (Abuse Elevation Control Mechanism: Sudo and Sudo Caching)
* **Expected False Positives**: Typo in sudo password.
* **Test Method**: `tests/detections/lnx_sudo_positive.log` vs `lnx_sudo_negative.log`

---

## 6. Multi-Source Correlation Detections

### `DET-COR-001` — Web Command Injection Followed by System Shell Execution
* **Wazuh Rule ID**: `100601`
* **Data Source**: Correlation (`nginx_access` + `auditd`)
* **Detection Logic**: Web Command Injection alert (Rule `100102`) followed within 30 seconds by Linux Auditd execution (Rule `100501`) on `SOCForge-web`.
* **Severity**: `Level 11` (Critical)
* **MITRE ATT&CK**: `T1190` + `T1059.004`
* **Expected False Positives**: None expected during normal web server operation.

---

### `DET-COR-002` — Web Shell Upload Followed by Web Root File Creation
* **Wazuh Rule ID**: `100602`
* **Data Source**: Correlation (`nginx_access` + `syscheck`)
* **Detection Logic**: Web Upload request (Rule `100104`) followed within 30 seconds by Syscheck/FIM alert in `/var/www/dvwa/hackable/uploads`.
* **Severity**: `Level 10` (Critical)
* **MITRE ATT&CK**: `T1505.003` (Server Software Component: Web Shell)
* **Expected False Positives**: Authorized CMS media uploads.
