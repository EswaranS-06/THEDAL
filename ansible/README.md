# SOCForge — Ansible Automation & Provisioning Framework (Phases 5–7)

> **Current Scope**: Contains the complete automation suite for baseline configuration, Bastion proxying, Wazuh SIEM deployment, and Windows endpoint telemetry onboarding (Sysmon + Wazuh Agent).

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
│   ├── all.yml                    # Global variables, Wazuh version (4.14.7) & proxy settings
│   ├── linux.yml                  # Linux base packages, user & sysctl parameters
│   └── windows.yml                # Windows WinRM connection parameters
│
├── playbooks/
│   ├── bootstrap.yml              # Connectivity & package channel verification
│   ├── linux-base.yml             # Linux baseline deployment playbook
│   ├── windows-base.yml           # Windows baseline deployment playbook
│   ├── windows-agent.yml          # Windows baseline + Sysmon + Wazuh Agent playbook
│   └── wazuh.yml                  # Wazuh SIEM platform master deployment playbook
│
└── roles/
    ├── common/                    # Shared baseline tasks (UTC timezone, dirs)
    ├── linux-base/                # APT proxy, foundational packages, NTP, sysctl
    ├── windows-base/              # WinHTTP proxy, Security Auditing, PowerShell logs, Sysmon
    ├── wazuh/                     # Wazuh SIEM (Indexer, Manager, Filebeat, Dashboard)
    └── wazuh-agent/               # Wazuh Agent installation, configuration & enrollment
```

---

## 2. Windows Endpoint Telemetry & Sysmon

### Windows Telemetry Pipeline
```text
Windows Security Audit Policy (auditpol / Event ID 4688 with CLI)
Windows PowerShell Logging (ScriptBlock 4104 / Module 4103)
Microsoft Sysmon (Process, Network, DLL, LSASS, File, Registry, DNS)
                     |
                     v
             Windows Event Channels
                     |
                     v
         Wazuh Agent (WazuhSvc Service)
                     |
                     | (Encrypted TCP 1514)
                     v
       Wazuh Manager (SOCForge-wazuh :1514)
                     |
                     v
       Wazuh Indexer (OpenSearch Engine :9200)
                     |
                     v
       Wazuh Dashboard (HTTPS :443 -> localhost:8443)
```

---

## 3. Playbooks & Deployment Lifecycle

| Playbook | Target Hosts | Purpose |
| :--- | :--- | :--- |
| `playbooks/bootstrap.yml` | `bastion`, `linux`, `windows` | Sets up Bastion Tinyproxy (:3128) and verifies connectivity & repo access |
| `playbooks/linux-base.yml` | `linux` | Configures APT proxy, foundational packages, NTP, and `vm.max_map_count` |
| `playbooks/windows-base.yml`| `windows` | Configures WinHTTP proxy, Security Auditing, PowerShell logging, and Sysmon |
| `playbooks/wazuh.yml` | `wazuh` | Deploys Wazuh SIEM All-in-One stack (Indexer, Manager, Filebeat, Dashboard) |
| `playbooks/windows-agent.yml`| `windows` | Deploys Windows baseline, Sysmon, and registers Wazuh Agent against Manager |
