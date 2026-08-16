# SOCForge — Ansible Automation & Provisioning Framework (Phase 5)

> **Current Scope**: This directory contains the Ansible automation framework for host bootstrapping, proxy configuration, and base system preparation across the SOCForge environment.

---

## 1. Directory Structure

```text
ansible/
├── ansible.cfg                    # Ansible core settings & SSH pipelining
├── inventory/
│   ├── hosts.ini                  # Dynamic generated inventory (ignored by Git)
│   └── hosts.ini.example          # Sample inventory template for reference
│
├── group_vars/
│   ├── all.yml                    # Global variables & Bastion proxy settings
│   ├── linux.yml                  # Linux base packages, user & sysctl parameters
│   └── windows.yml                # Windows WinRM connection parameters
│
├── playbooks/
│   ├── bootstrap.yml              # Connectivity & package channel verification
│   ├── linux-base.yml             # Linux base configuration playbook
│   └── windows-base.yml           # Windows base configuration playbook
│
└── roles/
    ├── common/                    # Shared baseline tasks (UTC timezone, dirs)
    ├── linux-base/                # APT proxy, foundational packages, NTP, sysctl
    └── windows-base/              # WinHTTP proxy, PowerShell policy, Event logs
```

---

## 2. Provisioning & Package Channel Architecture

Because SOCForge intentionally omits a NAT Gateway to eliminate recurring AWS charges (~$32/month), private instances cannot directly initiate outbound internet connections.

### Selected Solution: Bastion Forward Proxy (Tinyproxy on Port 3128)

```text
               +-----------------------------+
               |        Public Internet      |
               | (Ubuntu / Wazuh / Docker)   |
               +--------------+--------------+
                              ^
                              | (Outbound HTTPS / APT)
               +--------------+--------------+
               |      SOCForge Bastion       |
               |   (Tinyproxy Port 3128)     |
               |     (Management Subnet)     |
               +--------------+--------------+
                              ^
       +----------------------+----------------------+
       | (HTTP_PROXY          | (HTTP_PROXY          | (WinHTTP Proxy
       |  :3128)              |  :3128)              |  :3128)
+------+------+        +------+------+        +------+------+
|  Wazuh SIEM |        |  Web Target |        |   Windows   |
| (Private)   |        | (Private)   |        | (Private)   |
+-------------+        +-------------+        +-------------+
```

### What is Supported via Bastion Forward Proxy:
* **Ubuntu APT Repositories**: (`archive.ubuntu.com`, `security.ubuntu.com`)
* **Wazuh Package Repositories**: (`packages.wazuh.com` HTTPS repo)
* **Docker Container Registry**: (`download.docker.com` and Docker Hub image pulls via dockerd proxy)
* **Python Package Index**: (`pypi.org` over HTTPS)
* **Windows Package Downloads**: (PowerShell / WinHTTP downloads)

### Limitations:
* Non-HTTP/HTTPS protocols (e.g. raw ICMP ping to internet or non-proxied proprietary ports) cannot reach the external internet.

---

## 3. Playbooks & Usage

### Step 1: Generate Inventory
Ensure your inventory is generated from Terraform outputs:

```bash
python3 ../scripts/generate-inventory.py
```

### Step 2: Run Bootstrap & Connectivity Verification
Verify connectivity through the Bastion and test external package repository access:

```bash
ansible-playbook -i inventory/hosts.ini playbooks/bootstrap.yml
```

### Step 3: Apply Linux Base Configuration
Install foundational packages, synchronize time with Amazon Time Sync Service, and optimize kernel parameters (`vm.max_map_count=262144`):

```bash
ansible-playbook -i inventory/hosts.ini playbooks/linux-base.yml
```

### Step 4: Apply Windows Base Configuration
Configure WinHTTP proxy, PowerShell execution policies, and expand Windows Event Log buffer sizes:

```bash
ansible-playbook -i inventory/hosts.ini playbooks/windows-base.yml
```
