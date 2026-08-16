# SOCForge — Linux Web Target Ansible Role

> **Scope**: Deploys a deliberately vulnerable Linux web application target (Nginx on port 8000, DVWA, MariaDB, auditd, and Wazuh Agent 4.14.7) on `SOCForge-web` (`10.10.30.0/24`).

---

## 1. Deployed Components & Telemetry

| Component | Service | Port | Telemetry Generated |
| :--- | :--- | :--- | :--- |
| **Nginx Web Server** | `nginx` | `8000/TCP` | `/var/log/nginx/access.log`, `/var/log/nginx/error.log` |
| **DVWA Application** | `php-fpm` | FastCGI socket | PHP application exceptions, authentication requests |
| **MariaDB** | `mariadb` | `127.0.0.1:3306` | SQL database queries (isolated locally) |
| **auditd** | `auditd` | Kernel buffer | `/var/log/audit/audit.log` (File modifications, binary execution) |
| **Wazuh Agent** | `wazuh-agent` | `1514/TCP` client | Streams Nginx, auth, and auditd events to Wazuh Manager |

---

## 2. Usage & Playbook

Deploy the complete web target stack:

```bash
ansible-playbook -i ansible/inventory/hosts.ini ansible/playbooks/web-target.yml
```
