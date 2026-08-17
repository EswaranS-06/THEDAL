# SOCForge — Web Security Testing Scenario Catalog

> **Scope**: Curated web attack and baseline simulation scenarios targeting the private Linux Web Target (`SOCForge-web` on `10.10.30.0/24`).
>
> Applications:
> * **DVWA**: `http://SOCForge-web:8000/` (Nginx + PHP-FPM + MariaDB)
> * **OWASP Juice Shop**: `http://SOCForge-web:3000/` (Node.js / Docker)

---

## 1. DVWA Scenarios (`DVWA-*` on Port 8000)

### `DVWA-01` — Normal Web Traffic Baseline
* **Scenario ID**: `DVWA-01`
* **Application**: DVWA (Damn Vulnerable Web Application)
* **Target Port**: `8000/TCP`
* **Technique / Category**: Normal User Activity / Baseline Telemetry
* **Action**: `GET /login.php` (Standard HTTP GET request with normal browser User-Agent)
* **Expected HTTP Response**: `200 OK` (or `302 Found` if already authenticated)
* **Expected Telemetry**:
  * Source: `nginx_access` (`/var/log/nginx/access.log`)
  * HTTP Method: `GET`
  * Status Code: `200`
* **Expected Wazuh Visibility**: Raw Nginx access log event (Rule `31100` / no alert triggered; represents normal baseline)
* **Risk Level**: Low (Read-only request)
* **Cleanup**: None required.

---

### `DVWA-02` — Authentication Failure / Login Probe
* **Scenario ID**: `DVWA-02`
* **Application**: DVWA
* **Target Port**: `8000/TCP`
* **Technique / Category**: Brute Force / Credential Guessing (MITRE ATT&CK `T1110`)
* **Action**: `POST /login.php` with invalid credentials (`username=admin&password=wrongpassword123&Login=Login`)
* **Expected HTTP Response**: `200 OK` (renders "Login failed" page)
* **Expected Telemetry**:
  * Source: `nginx_access` (`/var/log/nginx/access.log`)
  * HTTP Method: `POST`
  * URI: `/login.php`
* **Expected Wazuh Visibility**: Nginx access event; Wazuh Rule `31101` (HTTP authentication failure) if repeated
* **Risk Level**: Low (Non-destructive failed login)
* **Cleanup**: None required.

---

### `DVWA-03` — SQL Injection (SQLi) Probe
* **Scenario ID**: `DVWA-03`
* **Application**: DVWA
* **Target Port**: `8000/TCP`
* **Technique / Category**: SQL Injection (MITRE ATT&CK `T1190` / OWASP Top 10 A03)
* **Action**: `GET /vulnerabilities/sqli/?id=1%27%20OR%20%271%27=%271&Submit=Submit`
* **Expected HTTP Response**: `200 OK` (renders SQL query results)
* **Expected Telemetry**:
  * Source: `nginx_access` (`/var/log/nginx/access.log`)
  * URI Query String: `id=1' OR '1'='1`
* **Expected Wazuh Visibility**: Wazuh Rule `31103` (SQL injection pattern in query string)
* **Risk Level**: Low (Read-only injection test against local MariaDB)
* **Cleanup**: None required.

---

### `DVWA-04` — Command Injection Discovery Probe
* **Scenario ID**: `DVWA-04`
* **Application**: DVWA
* **Target Port**: `8000/TCP`
* **Technique / Category**: OS Command Injection (MITRE ATT&CK `T1059.004`)
* **Action**: `POST /vulnerabilities/exec/` with payload `ip=127.0.0.1; whoami&Submit=Submit`
* **Expected HTTP Response**: `200 OK` (renders output of `whoami`)
* **Expected Telemetry**:
  * Source 1: `nginx_access` (POST `/vulnerabilities/exec/`)
  * Source 2: `auditd` (`/var/log/audit/audit.log`) capturing `execve` syscall on `/usr/bin/whoami` (Key: `socforge_recon_cmd`)
* **Expected Wazuh Visibility**: Wazuh Auditd Alert (`socforge_recon_cmd` rule) + Nginx POST access event
* **Risk Level**: Low (Read-only non-destructive system discovery command)
* **Cleanup**: None required.

---

### `DVWA-05` — Local File Inclusion (LFI) / Path Traversal
* **Scenario ID**: `DVWA-05`
* **Application**: DVWA
* **Target Port**: `8000/TCP`
* **Technique / Category**: Path Traversal / File Inclusion (MITRE ATT&CK `T1083` / `T1005`)
* **Action**: `GET /vulnerabilities/fi/?page=../../../../../../etc/passwd`
* **Expected HTTP Response**: `200 OK` (renders `/etc/passwd` content)
* **Expected Telemetry**:
  * Source: `nginx_access` (`/var/log/nginx/access.log`)
  * URI Query String: `page=../../../../../../etc/passwd`
* **Expected Wazuh Visibility**: Wazuh Rule `31106` (Directory traversal pattern detected)
* **Risk Level**: Low (Read-only traversal probe)
* **Cleanup**: None required.

---

### `DVWA-06` — Controlled File Upload & FIM Detection
* **Scenario ID**: `DVWA-06`
* **Application**: DVWA
* **Target Port**: `8000/TCP`
* **Technique / Category**: Web Shell / Malicious File Upload (MITRE ATT&CK `T1505.003`)
* **Action**: `POST /vulnerabilities/upload/` uploading benign text marker `socforge-test.txt`
* **Expected HTTP Response**: `200 OK` (upload confirmed)
* **Expected Telemetry**:
  * Source 1: `nginx_access` (POST `/vulnerabilities/upload/`)
  * Source 2: `auditd` (`/var/log/audit/audit.log`) tracking `creat`/`openat` syscalls in web root (Key: `socforge_web_file_mod`)
  * Source 3: `Wazuh FIM (Syscheck)` tracking file creation in `/var/www/dvwa/`
* **Expected Wazuh Visibility**: Auditd rule alert (`socforge_web_file_mod`) and Wazuh FIM file added event
* **Risk Level**: Low (Harmless non-executable `.txt` file)
* **Cleanup**: Automatic immediate deletion of `/var/www/dvwa/hackable/uploads/socforge-test.txt`.

---

## 2. OWASP Juice Shop Scenarios (`JS-*` on Port 3000)

### `JS-01` — Normal Juice Shop Application Baseline
* **Scenario ID**: `JS-01`
* **Application**: OWASP Juice Shop
* **Target Port**: `3000/TCP`
* **Technique / Category**: Normal REST API Baseline Activity
* **Action**: `GET /rest/products/search?q=`
* **Expected HTTP Response**: `200 OK` (returns JSON product catalog)
* **Expected Telemetry**:
  * Source: `juice_shop` (`/var/lib/docker/containers/*/*-json.log`)
  * Container Stream: `stdout`
  * Metadata Tag: `socforge.source=juice_shop`, `socforge.app=owasp-juice-shop`
* **Expected Wazuh Visibility**: Ingested JSON container access event (baseline)
* **Risk Level**: Low (Normal API access)
* **Cleanup**: None required.

---

### `JS-02` — Authentication Failure / Invalid User Login
* **Scenario ID**: `JS-02`
* **Application**: OWASP Juice Shop
* **Target Port**: `3000/TCP`
* **Technique / Category**: REST API Credential Guessing (MITRE ATT&CK `T1110`)
* **Action**: `POST /rest/user/login` with JSON `{"email":"admin@juice-sh.op","password":"wrongpassword123"}`
* **Expected HTTP Response**: `401 Unauthorized`
* **Expected Telemetry**:
  * Source: `juice_shop` (`/var/lib/docker/containers/*/*-json.log`)
  * Container Stream: `stdout`
  * Log Entry: `POST /rest/user/login 401`
* **Expected Wazuh Visibility**: Container JSON event with HTTP 401 status
* **Risk Level**: Low (Invalid login attempt)
* **Cleanup**: None required.

---

### `JS-03` — REST API Administrative Endpoint Enumeration
* **Scenario ID**: `JS-03`
* **Application**: OWASP Juice Shop
* **Target Port**: `3000/TCP`
* **Technique / Category**: API Reconnaissance / Endpoint Discovery (MITRE ATT&CK `T1595.002`)
* **Action**: `GET /rest/admin/application-version`
* **Expected HTTP Response**: `200 OK` (returns application version string)
* **Expected Telemetry**:
  * Source: `juice_shop` (`/var/lib/docker/containers/*/*-json.log`)
  * Container Stream: `stdout`
  * Log Entry: `GET /rest/admin/application-version 200`
* **Expected Wazuh Visibility**: Ingested JSON container log with administrative API path
* **Risk Level**: Low (Reconnaissance query)
* **Cleanup**: None required.

---

### `JS-04` — Product Search Syntax Error Probing
* **Scenario ID**: `JS-04`
* **Application**: OWASP Juice Shop
* **Target Port**: `3000/TCP`
* **Technique / Category**: Application Error / Exception Inducement
* **Action**: `GET /rest/products/search?q=%27%29%29`
* **Expected HTTP Response**: `200 OK` or `500 Internal Server Error` (with database exception details)
* **Expected Telemetry**:
  * Source: `juice_shop` (`/var/lib/docker/containers/*/*-json.log`)
  * Container Stream: `stderr` / `stdout`
  * Log Entry: SQL syntax exception / Sequelize database error trace
* **Expected Wazuh Visibility**: Ingested container log capturing database error stream
* **Risk Level**: Low (Error inducement probe)
* **Cleanup**: None required.

---

### `JS-05` — Controlled SQL / NoSQL Injection Probe
* **Scenario ID**: `JS-05`
* **Application**: OWASP Juice Shop
* **Target Port**: `3000/TCP`
* **Technique / Category**: SQL Injection in Modern REST APIs (MITRE ATT&CK `T1190`)
* **Action**: `GET /rest/products/search?q=%27%20UNION%20SELECT%201,2,3,4,5,6,7,8,9--`
* **Expected HTTP Response**: `200 OK` or `500 Internal Server Error`
* **Expected Telemetry**:
  * Source: `juice_shop` (`/var/lib/docker/containers/*/*-json.log`)
  * Log Entry: REST search query containing `UNION SELECT` syntax
* **Expected Wazuh Visibility**: Ingested container JSON log with SQL injection syntax
* **Risk Level**: Low (Non-destructive UNION query against SQLite database)
* **Cleanup**: None required.

---

### `JS-06` — Sensitive Documentation & Static Asset Discovery
* **Scenario ID**: `JS-06`
* **Application**: OWASP Juice Shop
* **Target Port**: `3000/TCP`
* **Technique / Category**: Information Disclosure / Sensitive File Probing (MITRE ATT&CK `T1083`)
* **Action**: `GET /ftp/`
* **Expected HTTP Response**: `200 OK` (directory listing) or `403 Forbidden`
* **Expected Telemetry**:
  * Source: `juice_shop` (`/var/lib/docker/containers/*/*-json.log`)
  * Log Entry: `GET /ftp/` access request
* **Expected Wazuh Visibility**: Ingested container JSON log recording `/ftp/` probing
* **Risk Level**: Low (Read-only directory access)
* **Cleanup**: None required.
