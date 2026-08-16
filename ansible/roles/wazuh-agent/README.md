# SOCForge — Wazuh Agent Ansible Role

> **Scope**: Installs, configures, registers, and validates the Wazuh Agent on Windows (and Linux) endpoints within the SOCForge training lab.

---

## 1. Monitored Windows Event Channels

| Event Channel | Format | Purpose | Key Events Captured |
| :--- | :--- | :--- | :--- |
| **`Security`** | `eventchannel` | Windows Security Audit Policy | Event 4688 (Process Creation with Command Line), 4624/4625 (Logon Success/Failure), 4720/4726 (Account Management) |
| **`Microsoft-Windows-Sysmon/Operational`** | `eventchannel` | Microsoft Sysmon Telemetry | Event 1 (Process Create), 3 (Network Connect), 7 (Image Load), 10 (ProcessAccess), 11 (FileCreate), 12/13/14 (Registry), 22 (DNS) |
| **`Microsoft-Windows-PowerShell/Operational`** | `eventchannel` | PowerShell Script Execution | Event 4104 (ScriptBlock Logging), Event 4103 (Module Logging) |
| **`System`** | `eventchannel` | System & Service Operations | Event 7045 (New Service Installed) |
| **`Application`** | `eventchannel` | Application Layer Events | Application crashes and execution errors |

---

## 2. Usage & Playbook

Deploy the complete Windows endpoint baseline and Wazuh Agent:

```bash
ansible-playbook -i ansible/inventory/hosts.ini ansible/playbooks/windows-agent.yml
```
