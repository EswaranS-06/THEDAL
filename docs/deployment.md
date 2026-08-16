# SOCForge — Deployment Architecture & Lifecycle Guide

> **Current Status**: Network, Subnets, Security Groups, IAM Roles, EC2 Compute Infrastructure, Dynamic Inventory Generation, and **Bootstrap & Provisioning Channels (Phases 1–5)** are implemented. Individual SOC software components will follow in Phase 6.

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
```

---

## 2. Bootstrap & Provisioning Channel Design

### The Challenge: No NAT Gateway
To keep lab operational costs near zero and eliminate recurring AWS Managed NAT Gateway charges (~$32/month), the private subnets (`SOC`, `Web`, `Attack`) have no NAT Gateway.

### The Solution: Bastion Forward Proxy (Tinyproxy on Port 3128)
* **Bastion Role**: Runs a lightweight forward proxy daemon (`tinyproxy`) listening on internal port `3128`, restricted via Security Groups to the VPC CIDR `10.10.0.0/16`.
* **Client Configuration**: Private Linux and Windows instances configure their HTTP/HTTPS proxy environment variables and APT configs (`/etc/apt/apt.conf.d/01proxy`) to route package downloads through `http://10.10.1.x:3128`.

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

### What is Supported:
* Ubuntu APT package repositories (`archive.ubuntu.com`, `security.ubuntu.com`).
* Wazuh HTTPS repositories (`packages.wazuh.com`).
* Docker container registry pulls (`download.docker.com` and Docker Hub).
* Python PyPI packages (`pypi.org`).
* Windows WinHTTP package downloads.

### Known Limitation:
* Non-proxied protocols (e.g. raw ICMP ping to internet or arbitrary non-HTTP ports) are blocked from private subnets by design.

---

## 3. Host Connectivity & Management Paths

### Linux Hosts: SSH ProxyJump
Ansible connects from the control machine to internal Linux instances by bouncing through the Bastion host via native SSH `ProxyJump`:

```text
Debian Control VM ----(SSH:22)----> Bastion (10.10.1.x) ----(ProxyJump:22)----> Internal Linux Host (10.10.x.x)
```

Configuration in `ansible.cfg` / inventory:
```ini
[soc_stack:vars]
ansible_ssh_common_args='-o ProxyJump=ubuntu@<BASTION_PUBLIC_IP> -o StrictHostKeyChecking=no'
```

### Windows Host: WinRM over Bastion
* WinRM is configured on Windows Server (`5985/5986`) and accessible from the Bastion security group.
* Operators and Ansible tunnel WinRM connections through the Bastion via SSH port forwarding (`ssh -L 5985:10.10.10.x:5985 ubuntu@<BASTION_PUBLIC_IP>`) or native WinRM ProxyJump.

---

## 4. Execution Workflow

```bash
# 1. Generate inventory from Terraform outputs
python3 scripts/generate-inventory.py

# 2. Run bootstrap verification (starts Tinyproxy, tests connectivity)
ansible-playbook -i ansible/inventory/hosts.ini ansible/playbooks/bootstrap.yml

# 3. Apply base system configurations
ansible-playbook -i ansible/inventory/hosts.ini ansible/playbooks/linux-base.yml
ansible-playbook -i ansible/inventory/hosts.ini ansible/playbooks/windows-base.yml
```
