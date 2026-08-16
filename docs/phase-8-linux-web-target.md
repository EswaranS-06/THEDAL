# SOCForge — Phase 8: Linux Web Target + DVWA + Wazuh Web Telemetry

> **Status**: Configuration and automation complete. Live cloud deployment pending execution of `terraform apply`.

---

## 1. Architectural Overview

The Linux Web Target (`SOCForge-web`) provides an isolated, deliberately vulnerable web application environment designed to generate rich SOC detection telemetry. Attacks simulated against this endpoint produce correlated event streams across Nginx web logs, MariaDB database logs, Linux authentication logs, kernel `auditd` events, and Wazuh File Integrity Monitoring (FIM).

```text
                 SOCForge Attack Host (10.10.20.x)
                                 |
                                 | HTTP / TCP 8000
                                 v
+-------------------------------------------------------------------+
|               SOCForge Linux Web Target (10.10.30.x)               |
|                                                                   |
|   +-----------------------------------------------------------+   |
|   |                  Nginx Reverse Proxy (:8000)              |   |
|   |         - /var/log/nginx/access.log (Apache format)       |   |
|   |         - /var/log/nginx/error.log  (Warn / Error)        |   |
|   +-----------------------------+-----------------------------+   |
|                                 | FastCGI Socket                  |
|                                 v                                 |
|   +-----------------------------------------------------------+   |
|   |             DVWA (Damn Vulnerable Web Application)        |   |
|   |         - /var/www/dvwa (PHP-FPM Runtime)                 |   |
|   +-----------------------------+-----------------------------+   |
|                                 | Localhost TCP 3306              |
|                                 v                                 |
|   +-----------------------------------------------------------+   |
|   |             MariaDB Database (127.0.0.1:3306)             |   |
|   |         - dvwa database & isolated dvwa_user              |   |
|   +-----------------------------------------------------------+   |
|                                                                   |
|   +-------------------------+     +---------------------------+   |
|   |      Linux auditd       |     |        Wazuh FIM          |   |
|   |  - /var/log/audit/      |     |  - /var/www/dvwa/         |   |
|   |    audit.log            |     |  - /etc/nginx/, /etc/php/ |   |
|   +------------+------------+     +-------------+-------------+   |
|                |                                |                 |
|                +----------------+---------------+                 |
|                                 |                                 |
|                                 v                                 |
|   +-----------------------------------------------------------+   |
|   |              Wazuh Agent Daemon (v4.14.7)                 |   |
|   +-----------------------------+-----------------------------+   |
+---------------------------------|---------------------------------+
                                  |
                                  | Encrypted TCP 1514 / TLS
                                  v
+-------------------------------------------------------------------+
|               SOCForge Wazuh SIEM (10.10.10.x)                    |
|   - Manager (:1514/:1515) -> Indexer (:9200) -> Dashboard (:443)  |
+-------------------------------------------------------------------+
```

---

## 2. Network & Subnet Placement

* **Subnet**: Private Web Subnet (`10.10.30.0/24`).
* **IP Allocation**: Private IP only (`10.10.30.x`). **No public IP is assigned.**
* **Outbound Routing**: Package installations and repository synchronizations route through the Bastion proxy (`10.10.1.10:3128`).
* **Inbound Access**:
  * Management: Port `22/TCP` strictly from `SOCForge-management-sg`.
  * Web Traffic: Port `8000/TCP` strictly from `SOCForge-attack-sg` (and `management-sg` for validation).
  * Port `80/TCP`: Restricted to internal management and attack testing.
  * Port `3306/TCP` (MariaDB): Bound to `127.0.0.1` only; **never exposed to any network**.

---

## 3. EC2 Compute Specification

| Parameter | Configuration | Justification |
| :--- | :--- | :--- |
| **Instance Tag** | `SOCForge-web` | Isolated Linux web target node |
| **Operating System** | Ubuntu 22.04 LTS (`x86_64`) | Enterprise LTS Linux distribution |
| **Instance Sizing** | `t3.micro` (2 vCPU, 1 GiB RAM) / `t3.small` (2 GiB) | Lean lab footprint adequate for Nginx, PHP-FPM, MariaDB, and Wazuh Agent |
| **Root Volume** | 20 GiB gp3 | Adequate for web files, database records, and log telemetry |
| **IAM Profile** | `SOCForge-ec2-instance-profile` | SSM connectivity and CloudWatch logging |

---

## 4. Nginx Reverse Proxy Architecture

Nginx serves as the single controlled front-end entry point:
* **Listening Port**: `8000/TCP` (Non-standard port as required by specification).
* **Document Root**: `/var/www/dvwa`.
* **FastCGI Handler**: Proxies `.php` requests to local Unix domain socket `/run/php/php-fpm.sock`.
* **Logging Format**: Standard Combined Log Format with preserved client IP, timestamp, method, URI, status, response size, referrer, and user-agent.
  * Access Log: `/var/log/nginx/access.log`
  * Error Log: `/var/log/nginx/error.log`

---

## 5. DVWA (Damn Vulnerable Web Application)

* **Source**: Official GitHub repository (`https://github.com/digininja/DVWA.git`).
* **Installation Directory**: `/var/www/dvwa`.
* **Configuration**: `config/config.inc.php` generated dynamically from Ansible template.
* **Security Level**: Default `low` (configurable via `dvwa_default_security_level`).
* **PHP-FPM Runtime Adjustments**:
  * `allow_url_fopen = On`
  * `allow_url_include = On`
  * `display_errors = Off`

---

## 6. MariaDB Database Architecture

* **Service**: `mariadb.service`.
* **Binding**: `bind-address = 127.0.0.1` (Configured in `/etc/mysql/mariadb.conf.d/50-server.cnf`).
* **Database Name**: `dvwa`.
* **Database User**: `dvwa_user` with grants scoped strictly to `localhost` and `127.0.0.1`.
* **External Access**: Completely blocked; port 3306 is not open on any external interface.

---

## 7. Linux Auditd Telemetry Configuration

Configured via `/etc/audit/rules.d/99-socforge-web.rules`:

| Audit Rule Key | Monitored Path / Syscall | Purpose |
| :--- | :--- | :--- |
| `socforge_web_file_mod` | `-w /var/www/dvwa/ -p wa` | Detects web shell uploads and web application file tampering |
| `socforge_nginx_config_mod` | `-w /etc/nginx/ -p wa` | Detects web server configuration changes |
| `socforge_php_config_mod` | `-w /etc/php/ -p wa` | Detects PHP runtime configuration alterations |
| `socforge_systemd_mod` | `-w /etc/systemd/system/ -p wa` | Detects persistence mechanisms via new service units |
| `socforge_user_mod` | `-w /etc/passwd -p wa` | Detects local account creation |
| `socforge_shadow_mod` | `-w /etc/shadow -p wa` | Detects unauthorized credential manipulation |
| `socforge_sudoers_mod` | `-w /etc/sudoers -p wa` | Detects privilege escalation rule tampering |
| `socforge_recon_cmd` | `execve` on `whoami`, `id`, `uname` | Detects post-exploitation system discovery commands |
| `socforge_download_cmd` | `execve` on `curl`, `wget` | Detects ingress tool transfer and stage dropping |
| `socforge_shell_cmd` | `execve` on `nc`, `ncat`, `netcat` | Detects reverse interactive shell spawns |
| `socforge_priv_esc` | `execve` on `sudo` | Detects privilege elevation attempts |

---

## 8. Wazuh Agent Telemetry & Log Ingestion

* **Wazuh Agent Version**: `v4.14.7` (Pinned and synchronized with Wazuh Manager).
* **Automated Enrollment**: Enrolls with `SOCForge-wazuh` on port `1515/TCP` using `agent-auth`.
* **Telemetry Streaming**: Mutual TLS on port `1514/TCP`.
* **Collected Log Sources**:
  1. `/var/log/nginx/access.log` (`<log_format>apache</log_format>`)
  2. `/var/log/nginx/error.log` (`<log_format>apache</log_format>`)
  3. `/var/log/auth.log` (`<log_format>syslog</log_format>`)
  4. `/var/log/syslog` (`<log_format>syslog</log_format>`)
  5. `/var/log/audit/audit.log` (`<log_format>audit</log_format>`)
* **Real-time File Integrity Monitoring (FIM)**:
  * `/var/www/dvwa` (excluding temporary uploads)
  * `/etc/nginx`
  * `/etc/php`
  * `/etc/systemd/system`

---

## 9. Telemetry & Attack Simulation Test Matrix

| Test Scenario | Executed Action | Expected Telemetry Source | Wazuh Event / Alert |
| :--- | :--- | :--- | :--- |
| **Test 1: Base Web Request** | `GET /` | `/var/log/nginx/access.log` | Nginx HTTP 200/302 access event |
| **Test 2: Authentication Page** | `GET /login.php` | `/var/log/nginx/access.log` | Nginx HTTP 200 access event |
| **Test 3: Web Scanning / 404** | `GET /nonexistent_endpoint` | `/var/log/nginx/access.log` | Nginx HTTP 404 client error event |
| **Test 4: Brute Force Simulation** | Multiple failed POST `/login.php` | `/var/log/nginx/access.log` | Wazuh Rule 31101 (HTTP 401 / repeated auth failure) |
| **Test 5: SSH Auth Failure** | Failed SSH login attempt | `/var/log/auth.log` | Wazuh Rule 5710 (sshd authentication failure) |
| **Test 6: Web Shell Drop** | Create test file in `/var/www/dvwa/` | `auditd` + Wazuh FIM | Syscall `openat`/`creat` + FIM file added alert |
| **Test 7: Config Tampering** | Modify `/etc/nginx/sites-available/` | `auditd` + Wazuh FIM | `socforge_nginx_config_mod` + FIM modified alert |
| **Test 8: Discovery Command** | Execute `/usr/bin/whoami` | `auditd` (`execve`) | `socforge_recon_cmd` audit event |
| **Test 9: Web Injection Probe** | `GET /vulnerabilities/sqli/?id=1'` | `/var/log/nginx/access.log` | Wazuh Rule 31103 / SQLi pattern detection |

---

## 10. Verification Status & Distinction

### 🟢 CONFIGURATION & AUTOMATION VALIDATION (PASSED)
* `terraform -chdir=terraform validate`: **Success**. All EC2, VPC, and Security Group declarations are syntactically valid.
* `ansible-playbook ansible/playbooks/web-target.yml --syntax-check`: **Success**.
* `make lint`: **Success**. All shell scripts, Python generator, Terraform files, and Ansible playbooks pass syntax verification.
* `scripts/linux-web-health-check.sh`: **Success**. Validates role tasks, default variables, Nginx templates, and audit rules offline.

### 🟡 LIVE DEPLOYMENT VALIDATION (PENDING)
* `terraform apply` has **NOT** been run.
* Actual cloud instance provisioning, IP binding, live Nginx HTTP responses, and live Wazuh dashboard event verification will execute once live deployment is authorized.

---

## 11. Known Limitations & Sizing Notes

* **Resource Footprint**: `SOCForge-web` is declared as `t3.micro` (1 GiB RAM). If memory pressure occurs under simultaneous Nginx, PHP-FPM, MariaDB, and Wazuh Agent operation, upgrading to `web_instance_type = "t3.small"` (2 GiB RAM) in `terraform.tfvars` is recommended.
* **Security Isolation**: DVWA is deliberately vulnerable and must never be exposed to public CIDRs (`0.0.0.0/0`). Ingress is strictly confined to `SOCForge-attack-sg` and `SOCForge-management-sg`.
