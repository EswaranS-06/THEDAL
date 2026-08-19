# THEDAL — Controlled Web Security Testing & Telemetry Guide

### Threat Hunting, Exploration, Detection, Analysis and Learn

> **Status**: Automation, scenario catalogs, safety controls, execution wrappers, and health checks are fully implemented and verified offline. Live cloud deployment and live simulation execution remain pending execution of `terraform apply`.

---

## 1. Architectural Overview & Placement

The adversary simulation host (`SOCForge-attack` on `10.10.20.0/24`) executes controlled web application security testing against the two deliberately vulnerable applications hosted on the private Linux Web Target (`SOCForge-web` on `10.10.30.0/24`):

```text
                  Debian 13 Control Machine
                             |
                             | (SSH via Bastion ProxyJump)
                             v
+-------------------------------------------------------------------+
|               Management Bastion (10.10.1.10:3128)                |
|                    - Tinyproxy Forward Proxy                      |
+------------------------------------+------------------------------+
                                     |
                                     | Private Routing (10.10.0.0/16)
                                     v
+-------------------------------------------------------------------+
|               SOCForge Attack Host (10.10.20.x)                    |
|                                                                   |
|   - Test Suite Directory: /opt/socforge-web-tests                 |
|   - Scenario Catalog: web-scenarios.yml                           |
|   - Execution Wrapper: /usr/local/bin/run-web-test                |
|   - Audit Log: /var/log/socforge/web/simulation.log               |
+------------------------------------+------------------------------+
                                     |
                                     | Controlled HTTP Probing
                                     | (TCP 8000 / TCP 3000)
                                     v
+-------------------------------------------------------------------+
|               SOCForge Web Target (10.10.30.x)                    |
|                                                                   |
|   [Port 8000: DVWA Stack]                                         |
|   - Nginx Reverse Proxy (:8000) -> /var/log/nginx/access.log      |
|   - PHP-FPM + MariaDB (127.0.0.1:3306)                            |
|   - Linux Auditd -> /var/log/audit/audit.log (whoami, uploads)    |
|                                                                   |
|   [Port 3000: OWASP Juice Shop Container]                         |
|   - Docker Engine -> /var/lib/docker/containers/*/*-json.log      |
|                                                                   |
|   [Wazuh Agent Daemon v4.14.7]                                    |
|   - Collects nginx_access, nginx_error, auditd, juice_shop        |
|   - Real-time FIM on /var/www/dvwa/hackable/uploads/              |
+------------------------------------+------------------------------+
                                     |
                                     | Encrypted TCP 1514 / TLS
                                     v
+-------------------------------------------------------------------+
|               SOCForge Wazuh SIEM Core (10.10.10.x)               |
|                                                                   |
|   - Wazuh Manager (:1514/:1515) -> Decoders & Rule Matching       |
|   - OpenSearch Indexer (:9200) -> Alert Indexing                  |
|   - Wazuh Dashboard (:443) -> Visual Investigation & Triage       |
+-------------------------------------------------------------------+
```

---

## 2. Target Discovery & Strict Allowlist

To prevent hard-coded addressing and unintentional network scanning:
1. **Dynamic Target Discovery**: The target IP is dynamically resolved from Terraform outputs (`web_private_ip`) or the generated Ansible inventory (`ansible/inventory/hosts.ini`).
2. **Allowlist Enforcement**: Invocations are strictly limited to:
   * **Host**: `SOCForge-web` (`10.10.30.50` / `10.10.30.x`)
   * **Ports**: `8000` (DVWA) and `3000` (OWASP Juice Shop)
   * **Applications**: `dvwa` and `juice-shop`
3. **Safety Interlock**: All web testing is disabled by default (`web_attack_execute: false`). Every execution requires an explicit confirmation flag (`--confirm`).

---

## 3. Web Testing Tooling & Dependencies

| Tool | Version / Runtime | Purpose |
| :--- | :--- | :--- |
| **`curl`** | Standard Ubuntu 22.04 package | Deterministic HTTP GET/POST client with custom headers, JSON payloads, and response metrics. |
| **`jq`** | Lightweight JSON processor | Structured simulation audit log generation and JSON payload parsing. |
| **`python3-requests`** | Python 3.10+ package | Optional programmatic HTTP scenario execution and session handling. |
| **`python3-yaml`** | PyYAML 5.4+ | YAML test catalog parsing and validation. |

---

## 4. Curated Scenario Catalog Overview

### DVWA Scenarios (`DVWA-*` on Port 8000)
* **`DVWA-01`**: Normal Web Traffic Baseline (`GET /login.php` -> HTTP 200)
* **`DVWA-02`**: Authentication Failure / Login Probe (`POST /login.php` with invalid credentials)
* **`DVWA-03`**: SQL Injection (SQLi) Probe (`GET /vulnerabilities/sqli/?id=1' OR '1'='1`)
* **`DVWA-04`**: Command Injection Discovery Probe (`POST /vulnerabilities/exec/` with `127.0.0.1; whoami`)
* **`DVWA-05`**: Local File Inclusion (LFI) Probe (`GET /vulnerabilities/fi/?page=../../etc/passwd`)
* **`DVWA-06`**: Controlled File Upload & FIM Detection (`POST /vulnerabilities/upload/` with benign `.txt`)

### OWASP Juice Shop Scenarios (`JS-*` on Port 3000)
* **`JS-01`**: Normal Juice Shop Application Baseline (`GET /rest/products/search?q=` -> HTTP 200)
* **`JS-02`**: Authentication Failure / Invalid User Login (`POST /rest/user/login` -> HTTP 401)
* **`JS-03`**: REST API Administrative Endpoint Enumeration (`GET /rest/admin/application-version`)
* **`JS-04`**: Product Search Syntax Error Probing (`GET /rest/products/search?q='))` -> HTTP 500)
* **`JS-05`**: Controlled SQL / NoSQL Injection Probe (`GET /rest/products/search?q=UNION...`)
* **`JS-06`**: Sensitive Documentation & Static Asset Discovery (`GET /ftp/`)

---

## 5. Controlled Execution Workflow & Usage

### 1. Scenario Inspection & Baseline Traffic
```bash
# List all curated scenarios
./scripts/run-web-test.sh --list

# Generate normal baseline traffic across both applications
./scripts/run-web-test.sh --baseline --confirm
```

### 2. Dry-Run Planning
```bash
# Preview planned HTTP request without sending traffic
./scripts/run-web-test.sh --target dvwa --scenario DVWA-03 --dry-run
./scripts/run-web-test.sh --target juice-shop --scenario JS-03 --dry-run
```

### 3. Authorized Execution (Live Infrastructure)
```bash
# Authorize execution against DVWA
./scripts/run-web-test.sh --target dvwa --scenario DVWA-03 --confirm

# Authorize execution against OWASP Juice Shop
./scripts/run-web-test.sh --target juice-shop --scenario JS-05 --confirm
```

---

## 6. Ground-Truth Audit Logging & Telemetry Correlation

Every execution writes structured JSON records to `/var/log/socforge/web/simulation.log`:

```json
{"simulation_id":"WEB-1723901234-5821","timestamp":"2026-08-17T14:25:00Z","scenario":"DVWA-03","name":"SQL Injection (SQLi) Probe","application":"dvwa","target":"10.10.30.50","port":8000,"method":"GET","url":"http://10.10.30.50:8000/vulnerabilities/sqli/?id=1%27%20OR%20%271%27=%271&Submit=Submit","status":"STARTING","operator":"ubuntu"}
{"simulation_id":"WEB-1723901234-5821","timestamp":"2026-08-17T14:25:01Z","scenario":"DVWA-03","application":"dvwa","target":"10.10.30.50","port":8000,"http_status":200,"status":"SUCCESS","duration":"1s","cleanup":"NOT_REQUIRED"}
```

### End-to-End Telemetry Correlation Flow
```text
+-------------------------+     +-------------------------+     +-------------------------+
|   Attack Simulation     |     |    Target Telemetry     |     |   Wazuh SIEM Manager    |
|                         |     |                         |     |                         |
| [ Web Simulation Log ]  |     | [ Application Logs ]    |     | [ Alert Generation ]    |
| - Sim ID: WEB-5821      | --> | - Nginx access.log      | --> | - Rule 31103 (SQLi)     |
| - Scenario: DVWA-03     |     | - Auditd /var/log/audit |     | - Level: 6              |
| - Time: 14:25:00 UTC    |     | - Docker JSON Stream    |     | - Time: 14:25:02 UTC    |
+-------------------------+     +-------------------------+     +-------------------------+
```

---

## 7. Telemetry Analysis & Observations by Source

| Telemetry Source | Originating Layer | Observed Format | SOC Investigation Value |
| :--- | :--- | :--- | :--- |
| **`nginx_access`** | Reverse Proxy (:8000) | Standard Combined | Full URI path, query parameters, HTTP method, client IP, status codes for DVWA attacks. |
| **`nginx_error`** | Reverse Proxy (:8000) | Standard Error | FastCGI connection drops, upstream PHP errors, request timeout events. |
| **`auditd`** | Linux Kernel Audit | Syscall Audit Log | Execution of binaries triggered via command injection (`whoami`) and file creations in web roots. |
| **`juice_shop`** | Docker Engine (:3000) | JSON Container Stream | Node.js application REST queries, unhandled Sequelize SQL exceptions, authentication 401 events. |
| **`Wazuh FIM`** | Syscheck Daemon | Event Notification | Real-time tracking of file creations, modifications, and deletions in `/var/www/dvwa/`. |

---

## 8. Verification & Deployment Status

### 🟢 Configuration & Automation Validation (Passed)
* `terraform validate`: **Success**.
* `terraform plan`: **Success** (58 resources categorized and verified).
* `ansible-playbook ansible/playbooks/web-attack.yml --syntax-check`: **Success**.
* `scripts/web-target-health-check.sh`: **Success** (All 12 scenarios, templates, permissions, and assertions verified).

### 🟡 Live Deployment Validation (Pending)
* `terraform apply` has not been executed. Live network traffic and live alert validation remain pending until cloud infrastructure deployment is authorized.
