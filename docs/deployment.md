# SOCForge — Deployment Architecture & Lifecycle Guide

> **Current Status**: Network, Subnets, Security Groups, IAM Roles, EC2 Compute Infrastructure, Dynamic Inventory Generation, Bootstrap Channels, and **Wazuh SIEM Platform (Phases 1–6)** are implemented. Endpoint and target provisioning follow in Phase 7.

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
       | (Time Sync, Packages, Sysctl, Event Logs)     |
       +-----------------------------------------------+
                        |
                        | (6. ansible-playbook playbooks/wazuh.yml)
                        v
       +-----------------------------------------------+
       | Wazuh SIEM Platform Fully Initialized         |
       | - Indexer (9200), Manager (1514/1515/55000)   |
       | - Filebeat Forwarder, Dashboard (443)         |
       +-----------------------------------------------+
```

---

## 2. Wazuh SIEM Deployment Workflow (Phase 6)

### Step 1: Deploy Wazuh SIEM Stack
Run the dedicated Wazuh playbook against the private SIEM host:

```bash
# Execute Wazuh SIEM playbook via Bastion SSH ProxyJump
ansible-playbook -i ansible/inventory/hosts.ini ansible/playbooks/wazuh.yml

# Or via Makefile target
make wazuh-deploy
```

### Step 2: Open Encrypted SSH Tunnel for Web Dashboard
Because the Wazuh instance is isolated in the private SOC subnet, access the HTTPS dashboard via the SSH tunnel helper:

```bash
./scripts/wazuh-tunnel.sh
# Or: make wazuh-tunnel
```

Navigate to: `https://localhost:8443` in your browser.

* Default Username: `admin`
* Default Password: Configured in `ansible/roles/wazuh/defaults/main.yml` (or overridden via `WAZUH_ADMIN_PASSWORD` environment variable).

### Step 3: Run Wazuh Health Verification
Verify that all SIEM daemons and API ports are active:

```bash
./scripts/wazuh-health-check.sh
# Or: make wazuh-check
```

---

## 3. Host Connectivity & Management Paths

### Linux Hosts: SSH ProxyJump
Ansible connects from the control machine to internal Linux instances by bouncing through the Bastion host via native SSH `ProxyJump`:

```text
Debian Control VM ----(SSH:22)----> Bastion (10.10.1.x) ----(ProxyJump:22)----> Internal Linux Host (10.10.x.x)
```

### Windows Host: WinRM over Bastion
WinRM is configured on Windows Server (`5985/5986`) and accessible only from the Bastion security group.
