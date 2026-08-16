# SOCForge — Deployment Architecture & Lifecycle Guide

> **Current Status**: Network, Subnets, Security Groups, IAM Roles, EC2 Compute Infrastructure, Dynamic Inventory Generation, Bootstrap Channels, Wazuh SIEM, Windows Endpoint Telemetry, Linux Web Target (DVWA), and **OWASP Juice Shop Docker Deployment (Phases 1–9)** are implemented. Atomic Red Team adversary simulation follows in Phase 10.

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
                        |
                        | (9. ansible-playbook playbooks/juice-shop.yml)
                        v
       +-----------------------------------------------+
       | OWASP Juice Shop Container Live (Port 3000)   |
       | - Docker Engine with Bastion Proxy Override   |
       | - Container JSON Log Rotation (max: 50m)      |
       | - Wazuh Agent Container Ingestion             |
       +-----------------------------------------------+
```

---

## 2. Playbooks & Deployment Workflows

### Windows Endpoint Telemetry (Phase 7)
```bash
ansible-playbook -i ansible/inventory/hosts.ini ansible/playbooks/windows-agent.yml
# Or: make windows-agent-deploy
./scripts/windows-agent-health-check.sh
```

### Linux Web Target & DVWA (Phase 8)
```bash
ansible-playbook -i ansible/inventory/hosts.ini ansible/playbooks/web-target.yml
# Or: make web-target-deploy
./scripts/linux-web-health-check.sh
```

### OWASP Juice Shop Docker Deployment (Phase 9)
```bash
ansible-playbook -i ansible/inventory/hosts.ini ansible/playbooks/juice-shop.yml
# Or: make juice-shop-deploy
./scripts/juice-shop-health-check.sh
```

---

## 3. Web Dashboard SSH Tunnel

Access the Wazuh Dashboard from your local browser:

```bash
./scripts/wazuh-tunnel.sh
# Or: make wazuh-tunnel
```

Navigate to: `https://localhost:8443` in your browser.
* Username: `admin`
* Password: Configured in `ansible/roles/wazuh/defaults/main.yml` (or via `WAZUH_ADMIN_PASSWORD`).
