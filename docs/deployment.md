# SOCForge — Deployment Architecture & Lifecycle Guide

> **Current Status**: Network, Subnets, Security Groups, IAM Roles, EC2 Compute Infrastructure, Dynamic Inventory Generation, Bootstrap Channels, Wazuh SIEM, Windows Endpoint Telemetry, and **Linux Web Target + DVWA (Phases 1–8)** are implemented. OWASP Juice Shop containerization follows in Phase 9.

---

## 1. Deployment Pipeline Overview

```text
                    Debian 13
                  Control Machine
                        |
                        | (1. Terraform Plan / Apply)
                        v
                 AWS VPC & 5 EC2s
         (Bastion Public + 4 Private Nodes)
                        |
                        | (2. python3 scripts/generate-inventory.py)
                        v
               ansible/inventory/hosts.ini
                        |
                        | (3. ansible-playbook playbooks/bootstrap.yml)
                        v
       +-----------------------------------------------+
       | Bastion Forward Proxy Configured (Port 3128)  |
       | ProxyJump & WinRM Connectivity Verified       |
       | APT & HTTPS Package Reachability Tested       |
       +-----------------------------------------------+
                        |
                        | (4. ansible-playbook playbooks/linux-base.yml)
                        | (5. ansible-playbook playbooks/windows-base.yml)
                        v
       +-----------------------------------------------+
       | Base Operating System Prerequisites Applied   |
       +-----------------------------------------------+
                        |
                        | (6. ansible-playbook playbooks/wazuh.yml)
                        v
       +-----------------------------------------------+
       | Wazuh SIEM Platform Initialized (4.14.7)      |
       | - Indexer (9200), Manager (1514/1515/55000)   |
       | - Filebeat Forwarder, Dashboard (443)         |
       +-----------------------------------------------+
                        |
                        | (7. ansible-playbook playbooks/windows-agent.yml)
                        v
       +-----------------------------------------------+
       | Windows Endpoint Telemetry Live               |
       | - Auditing + PowerShell ScriptBlock Logging   |
       | - Microsoft Sysmon (Sysmon64 Service)         |
       | - Wazuh Agent Registered & Streaming (1514)   |
       +-----------------------------------------------+
                        |
                        | (8. ansible-playbook playbooks/web-target.yml)
                        v
       +-----------------------------------------------+
       | Linux Web Target Live (DVWA on Port 8000)     |
       | - Nginx Reverse Proxy (:8000) + PHP-FPM       |
       | - MariaDB Database (127.0.0.1:3306)           |
       | - Linux auditd Telemetry (/var/log/audit)     |
       | - Wazuh Agent Registered & Streaming (1514)   |
       +-----------------------------------------------+
```

---

## 2. Windows Endpoint & Telemetry Deployment Workflow (Phase 7)

```bash
ansible-playbook -i ansible/inventory/hosts.ini ansible/playbooks/windows-agent.yml
# Or: make windows-agent-deploy
```

Verify status:
```bash
./scripts/windows-agent-health-check.sh
# Or: make windows-check
```

---

## 3. Linux Web Target & DVWA Deployment Workflow (Phase 8)

### Step 1: Deploy Web Target Stack
Execute the web target playbook:

```bash
ansible-playbook -i ansible/inventory/hosts.ini ansible/playbooks/web-target.yml
# Or: make web-target-deploy
```

This automates:
1. **Nginx Reverse Proxy**: Configured to listen on port `8000/TCP` with standard combined access logging.
2. **DVWA Application**: Cloned from official Git repo, configured with PHP-FPM runtime and database parameters.
3. **MariaDB Database**: Initialized and bound to `127.0.0.1:3306` with isolated database and user permissions.
4. **Linux Auditd**: Deploys focused audit rules for web file modifications, configuration tampering, and command execution.
5. **Wazuh Agent**: Installs and enrolls agent against `SOCForge-wazuh:1515`, streaming Nginx, auth, and audit logs.

### Step 2: Verify Web Target & DVWA Health
Run the automated web target health check:

```bash
./scripts/linux-web-health-check.sh
# Or: make web-check
```

---

## 4. Web Dashboard SSH Tunnel

Access the Wazuh Dashboard from your local browser:

```bash
./scripts/wazuh-tunnel.sh
# Or: make wazuh-tunnel
```

Navigate to: `https://localhost:8443` in your browser.
* Username: `admin`
* Password: Configured in `ansible/roles/wazuh/defaults/main.yml` (or via `WAZUH_ADMIN_PASSWORD`).
