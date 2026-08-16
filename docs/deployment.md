# SOCForge — Deployment Architecture & Lifecycle Guide

> **Current Status**: Network, Subnets, Security Groups, IAM Roles, EC2 Compute Infrastructure, Dynamic Inventory Generation, Bootstrap Channels, Wazuh SIEM, and **Windows Endpoint Telemetry (Phases 1–7)** are implemented. Web target provisioning follows in Phase 8.

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
```

---

## 2. Windows Endpoint & Telemetry Deployment Workflow (Phase 7)

### Step 1: Deploy Windows Baseline, Sysmon & Wazuh Agent
Execute the Windows agent playbook:

```bash
ansible-playbook -i ansible/inventory/hosts.ini ansible/playbooks/windows-agent.yml
# Or: make windows-agent-deploy
```

This automates:
1. **Security Audit Policies**: Configures `auditpol.exe` for Process Creation (Event 4688 with CLI), Logon/Logoff, and Account Management.
2. **PowerShell Logging**: Enables ScriptBlock Logging (Event 4104) and Module Logging (Event 4103).
3. **Microsoft Sysmon**: Installs official Sysinternals Sysmon `Sysmon64.exe` with curated SOCForge configuration.
4. **Wazuh Agent**: Downloads and installs MSI package via Bastion proxy, registers the agent with Wazuh Manager on port `1515`, and starts `WazuhSvc`.

### Step 2: Verify Windows Telemetry Pipeline
Run the automated Windows health check:

```bash
./scripts/windows-agent-health-check.sh
# Or: make windows-check
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
