# SOCForge — Attack-to-Telemetry Mapping Guide

> This guide illustrates how simulated adversary actions propagate across the network, generate operating system and application telemetry, trigger Wazuh SIEM detection rules, and land in dedicated OpenSearch index patterns.

---

## 1. End-to-End Telemetry Pipeline

```text
       [ 1. Attack Execution ]
 (Attack Host: Atomic / WebTester)
                 │
                 ▼
       [ 2. Target Generation ]
 (Nginx / Docker / Windows / Sysmon)
                 │
                 ▼
       [ 3. Local Collection ]
        (Wazuh Agent / Log)
                 │
                 ▼
       [ 4. SIEM Evaluation ]
(Wazuh Manager: Decoders & Rules)
                 │
                 ▼
       [ 5. Index Ingestion ]
(Filebeat -> Ingest Pipeline Router)
                 │
                 ▼
     [ 6. OpenSearch Indices ]
  (socforge-* / wazuh-alerts-*)
                 │
                 ▼
    [ 7. Analyst Investigation ]
    (OpenSearch Dashboards UI)
```

---

## 2. Attack-to-Telemetry Mappings

### A. Web Application Security Attacks

#### 1. SQL Injection Attack (DVWA)
- **Adversary Action**: `run-web-test --scenario DVWA-03` sends `' OR '1'='1` in HTTP GET parameter to port 8000.
- **Raw Telemetry**: Nginx access log entry in `/var/log/nginx/access.log`.
- **Wazuh Decoder**: `web-accesslog` (extracts `srcip`, `url`, `protocol`, `id`).
- **Detection Rule**: `100101` (Level 8, MITRE: `T1190`).
- **Target OpenSearch Index**: `socforge-nginx-access-4.x-*`.
- **Correlated Events**: Database queries in MariaDB error log.

#### 2. Web Command Injection & System Execution (DVWA)
- **Adversary Action**: `run-web-test --scenario DVWA-04` injects `127.0.0.1;whoami` into the ping form.
- **Raw Telemetry**: 
  1. Nginx access log (`/var/log/nginx/access.log`).
  2. Linux Auditd kernel syscall (`/var/log/audit/audit.log` for `/usr/bin/whoami` by EUID 33 `www-data`).
- **Wazuh Decoders**: `web-accesslog` and `auditd`.
- **Detection Rules**: `100102` (Level 9), `100501` (Level 7), and Multi-Source Correlation `100601` (Level 11).
- **Target OpenSearch Indices**: `socforge-nginx-access-*` and `socforge-auditd-*`.

#### 3. Path Traversal / Local File Inclusion (DVWA)
- **Adversary Action**: `run-web-test --scenario DVWA-05` requests `?page=../../../../../../etc/passwd`.
- **Raw Telemetry**: Nginx access log with directory traversal sequences.
- **Wazuh Decoder**: `web-accesslog`.
- **Detection Rule**: `100103` (Level 7, MITRE: `T1083`).
- **Target OpenSearch Index**: `socforge-nginx-access-4.x-*`.

#### 4. REST API User & Auth Probing (Juice Shop Container)
- **Adversary Action**: `run-web-test --scenario JS-03` probes `/rest/user/authentication-details` on port 3000.
- **Raw Telemetry**: Docker container stdout/stderr log in `/var/lib/docker/containers/*/*-json.log`.
- **Wazuh Decoder**: `socforge-juice-shop`.
- **Detection Rule**: `100201` (Level 6, MITRE: `T1087`, `T1595.002`).
- **Target OpenSearch Index**: `socforge-juice-shop-4.x-*` (or fallback `wazuh-alerts-4.x-*`).

---

### B. Windows Endpoint & PowerShell Attacks

#### 1. System Information Discovery (Atomic Red Team)
- **Adversary Action**: `run-atomic-test --technique T1082` executes `whoami.exe`, `systeminfo.exe`, and `ipconfig.exe`.
- **Raw Telemetry**:
  1. Windows Security EventLog (Event ID `4688` - Process Creation).
  2. Sysmon EventLog (Event ID `1` - Process Creation with Parent Image, PID, Hashes).
- **Wazuh Decoder**: `windows_eventchannel`.
- **Detection Rule**: `100404` (Level 6, MITRE: `T1082`, `T1016`, `T1087.001`).
- **Target OpenSearch Indices**: `socforge-sysmon-4.x-*` and `socforge-windows-security-4.x-*`.

#### 2. Suspicious PowerShell Download Cradle
- **Adversary Action**: `run-atomic-test --technique T1059.001` launches `powershell.exe -ExecutionPolicy Bypass -Command "Write-Output (New-Object Net.WebClient).DownloadString..."`.
- **Raw Telemetry**:
  1. PowerShell EventLog (Event ID `4104` - ScriptBlock Text).
  2. Sysmon EventLog (Event ID `1` - Process Creation with command line arguments).
- **Wazuh Decoder**: `windows_eventchannel`.
- **Detection Rule**: `100401` (Level 7, MITRE: `T1059.001`).
- **Target OpenSearch Indices**: `socforge-powershell-4.x-*` and `socforge-sysmon-4.x-*`.

#### 3. Scheduled Task Creation & Persistence
- **Adversary Action**: `run-atomic-test --technique T1053.005` executes `schtasks /create /tn AtomicTask /tr notepad.exe /sc daily`.
- **Raw Telemetry**: Sysmon Event ID 1 for `schtasks.exe` process creation with `/create` argument.
- **Wazuh Decoder**: `windows_eventchannel`.
- **Detection Rule**: `100406` (Level 7, MITRE: `T1053.005`).
- **Target OpenSearch Index**: `socforge-sysmon-4.x-*`.

---

## 3. Telemetry Matrix Summary

| Attack Category | Simulation Command | Generating Source | Wazuh Rule ID | Target Index |
| :--- | :--- | :--- | :--- | :--- |
| **SQLi (DVWA)** | `run-web-test --scenario DVWA-03` | Nginx Access | `100101` | `socforge-nginx-access-*` |
| **Command Injection (DVWA)** | `run-web-test --scenario DVWA-04` | Nginx + Auditd | `100102` / `100501` | `socforge-nginx-access-*` / `auditd` |
| **LFI / Traversal (DVWA)** | `run-web-test --scenario DVWA-05` | Nginx Access | `100103` | `socforge-nginx-access-*` |
| **Web Shell Upload** | `run-web-test --scenario DVWA-06` | Nginx Access + FIM | `100104` | `socforge-nginx-access-*` |
| **Juice Shop API Probe** | `run-web-test --scenario JS-03` | Docker Logs | `100201` | `socforge-juice-shop-*` |
| **Juice Shop Auth Failure** | `run-web-test --scenario JS-02` | Docker Logs | `100202` | `socforge-juice-shop-*` |
| **Juice Shop SQLi Probe** | `run-web-test --scenario JS-05` | Docker Logs | `100203` | `socforge-juice-shop-*` |
| **PowerShell Cradle** | `run-atomic-test --technique T1059.001`| PowerShell / Sysmon | `100401` | `socforge-powershell-*` / `sysmon` |
| **PowerShell Encoded CLI** | `powershell -enc ...` | Sysmon Event 1 | `100402` | `socforge-sysmon-*` |
| **Host Reconnaissance** | `run-atomic-test --technique T1082` | Sysmon / Security | `100404` | `socforge-sysmon-*` |
| **Scheduled Task Creation**| `run-atomic-test --technique T1053.005`| Sysmon Event 1 | `100406` | `socforge-sysmon-*` |
| **Multi-Source Correlation**| Web Cmd Injection + Auditd Exec | Nginx + Auditd | `100601` (Level 11) | `wazuh-alerts-*` |
