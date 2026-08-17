# Ansible Role: `web-attack`

> **Scope**: Deploys controlled web security testing tools, curated scenario catalogs for DVWA (port 8000) and OWASP Juice Shop (port 3000), safety boundaries, target allowlists, and execution wrappers on `SOCForge-attack` (`10.10.20.0/24`).

---

## 1. Overview

The `web-attack` role enables controlled web application attack simulations targeting the private Linux Web Target (`SOCForge-web` on `10.10.30.0/24`).
* **Target Allowlist**: Invocations are strictly constrained to `SOCForge-web` on ports `8000` (DVWA) and `3000` (Juice Shop).
* **Execution Safety**: Execution is disabled by default (`web_attack_execute: false`). Every execution requires an explicit confirmation flag (`--confirm`).
* **Audit Logging**: All simulation runs, HTTP methods, request URLs, response codes, durations, and cleanup outcomes are logged to `/var/log/socforge/web/simulation.log`.

---

## 2. Directory Layout & Key Files

| File / Path | Purpose |
| :--- | :--- |
| `defaults/main.yml` | Target host definitions, allowed ports, proxy settings, and logging paths. |
| `tasks/prerequisites.yml` | Installs `curl`, `jq`, `python3-requests`, and `python3-yaml`. |
| `tasks/scenarios.yml` | Deploys scenario catalog (`web-scenarios.yml`) and execution wrapper (`run-web-test`). |
| `tasks/validation.yml` | Validates binaries, catalog syntax, wrapper permissions, and logging paths. |

---

## 3. Curated Scenarios Catalog (Phase 11)

### DVWA Scenarios (`DVWA-*` on Port 8000)
1. **`DVWA-01`**: Normal Web Traffic Baseline (`GET /login.php`)
2. **`DVWA-02`**: Authentication Failure / Login Probe (`POST /login.php`)
3. **`DVWA-03`**: SQL Injection (SQLi) Probe (`GET /vulnerabilities/sqli/`)
4. **`DVWA-04`**: Command Injection Discovery Probe (`POST /vulnerabilities/exec/`)
5. **`DVWA-05`**: Local File Inclusion (LFI) Probe (`GET /vulnerabilities/fi/`)
6. **`DVWA-06`**: Controlled File Upload & FIM Detection (`POST /vulnerabilities/upload/`)

### OWASP Juice Shop Scenarios (`JS-*` on Port 3000)
1. **`JS-01`**: Normal Juice Shop Application Baseline (`GET /rest/products/search?q=`)
2. **`JS-02`**: Authentication Failure / Invalid User Login (`POST /rest/user/login`)
3. **`JS-03`**: REST API Administrative Endpoint Enumeration (`GET /rest/admin/application-version`)
4. **`JS-04`**: Product Search Syntax Error Probing (`GET /rest/products/search?q=...`)
5. **`JS-05`**: Controlled SQL / NoSQL Injection Probe (`GET /rest/products/search?q=UNION...`)
6. **`JS-06`**: Sensitive Documentation & Static Asset Discovery (`GET /ftp/`)

---

## 4. Usage & Execution Controls

```bash
# List available curated scenarios
run-web-test --list

# Generate normal baseline traffic
run-web-test --baseline --confirm

# Perform dry-run request inspection
run-web-test --target dvwa --scenario DVWA-03 --dry-run

# Authorize execution against target
run-web-test --target dvwa --scenario DVWA-03 --confirm
```
