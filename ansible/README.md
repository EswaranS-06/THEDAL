# THEDAL — Ansible Automation & Provisioning Framework

> **Scope**: Complete infrastructure provisioning automation for baseline configuration, Bastion forward proxying, Wazuh SIEM deployment, containerized web targets, Atomic Red Team attack simulation engine, and Windows endpoint telemetry onboarding (Sysmon + Wazuh Agent).

---

## 1. Directory Structure

```text
ansible/
├── ansible.cfg                    # Ansible core settings, SSH pipelining & ProxyJump
├── inventory/
│   ├── hosts.ini                  # Dynamic generated inventory with static private IPs (ignored by Git)
│   └── hosts.ini.example          # Sample inventory template for reference
│
├── group_vars/
│   ├── all.yml                    # Global variables, static IPs, Wazuh version (4.14.7) & proxy settings
│   ├── linux.yml                  # Linux base packages, user & sysctl parameters
│   └── windows.yml                # Windows WinRM connection parameters
│
├── playbooks/
│   ├── bootstrap.yml              # Pre-flight WinRM tunnel & package channel verification
│   ├── linux-base.yml             # Linux baseline deployment playbook
│   ├── windows-base.yml           # Windows baseline deployment playbook
│   ├── wazuh.yml                  # Wazuh SIEM platform master deployment playbook
│   ├── windows-agent.yml          # Windows baseline + Sysmon + Wazuh Agent playbook
│   ├── web-target.yml             # Nginx reverse proxy + DVWA + Juice Shop playbook
│   ├── atomic-red-team.yml        # Atomic Red Team & web attack framework playbook
│   └── site.yml                   # Master sequential orchestration playbook
│
└── roles/
    ├── common/                    # Shared baseline tasks (UTC timezone, dirs)
    ├── linux-base/                # APT proxy, foundational packages, NTP, sysctl
    ├── windows-base/              # WinHTTP proxy, Security Auditing, PowerShell logs, Sysmon
    ├── wazuh/                     # Wazuh SIEM (Indexer, Manager, Filebeat, Dashboard)
    ├── wazuh-agent/               # Wazuh Agent installation, configuration & enrollment
    ├── docker/                    # Docker CE engine deployment
    ├── web-target/                # Nginx proxy and DVWA web application
    ├── juice-shop/                # OWASP Juice Shop container orchestration
    ├── atomic-red-team/           # Atomic Red Team execution framework & wrapper
    └── web-attack/                # Automated web vulnerability testing suite
```

---

## 2. Static Private IP Scheme

All AWS EC2 instances are bound to deterministic static internal IPs:

| Host Group | Static IP | Purpose & Roles |
| :--- | :--- | :--- |
| `bastion` | `10.10.1.10` | SSH ProxyJump entry point & Tinyproxy/Squid forward proxy (`:3128`) |
| `wazuh` | `10.10.10.10` | Wazuh Manager, Indexer (OpenSearch), Dashboard (`/app/wz-home`) |
| `windows` | `10.10.10.20` | Windows Server 2022 + Sysmon v15 + Wazuh Agent |
| `attack` | `10.10.20.10` | Linux Attack Host + Atomic Red Team CLI |
| `web` | `10.10.30.10` | Linux Web Target + Nginx (:8000 DVWA / :3000 Juice Shop) |

---

## 3. Playbooks & Deployment Lifecycle

| Playbook | Target Hosts | Purpose |
| :--- | :--- | :--- |
| `playbooks/bootstrap.yml` | `localhost`, `bastion`, `linux`, `windows` | Automatically establishes local WinRM port-forward tunnel (:5985), configures Bastion proxy (:3128), and verifies host readiness |
| `playbooks/linux-base.yml` | `linux` | Configures APT proxy, foundational packages, NTP, and `vm.max_map_count` |
| `playbooks/windows-base.yml`| `windows` | Configures WinHTTP proxy, Security Auditing, PowerShell logging, and Sysmon |
| `playbooks/wazuh.yml` | `wazuh` | Deploys Wazuh SIEM All-in-One stack (Indexer, Manager, Filebeat, Dashboard) |
| `playbooks/windows-agent.yml`| `windows` | Deploys Windows baseline, Sysmon, and registers Wazuh Agent against Manager |
| `playbooks/web-target.yml` | `web` | Deploys Docker, DVWA on port 8000, and Juice Shop on port 3000 |
| `playbooks/atomic-red-team.yml`| `attack` | Deploys Atomic Red Team CLI and web attack test suites |
| `playbooks/site.yml` | `all` | Full end-to-end multi-tier cluster deployment orchestrator |
