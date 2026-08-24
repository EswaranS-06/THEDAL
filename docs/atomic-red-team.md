# THEDAL — Atomic Red Team Simulation Host & Telemetry

### Threat Hunting, Exploration, Detection, Analysis and Learn

> **Status**: Configuration and automation complete. Live cloud deployment and live simulation execution pending execution of `terraform apply`.

---

## 1. Architectural Overview & Placement

The adversary simulation host (`SOCForge-attack`) operates on the isolated Private Attack Subnet (`10.10.20.0/24`). It hosts the official **Atomic Red Team** framework and serves as the controlled launchpad for adversary technique emulation targeting the Windows Employee Endpoint (`SOCForge-windows` on `10.10.10.0/24`).

```text
                  Debian 13 Control Machine
                             |
                             | (SSH / Bastion ProxyJump)
                             v
+-------------------------------------------------------------------+
|               Management Bastion (10.10.1.10:3128)                |
|                    - Tinyproxy Forward Proxy                      |
+------------------------------------+------------------------------+
                                     |
                                     | Private Routing (10.10.0.0/16)
                                     v
+-------------------------------------------------------------------+
|               THEDAL Attack Host (10.10.20.10)                    |
|                                                                   |
|   - Operating System: Ubuntu 22.04 LTS (x86_64)                   |
|   - PowerShell Core: pwsh (Microsoft Linux Release)               |
|   - Execution Framework: Invoke-AtomicRedTeam                     |
|   - Test Library: /opt/atomic-red-team/atomics                    |
|   - Execution Wrapper: /usr/local/bin/run-atomic-test             |
|   - Simulation Audit Log: /var/log/socforge/atomic/               |
|   - Outbound Access: via Bastion Proxy (10.10.1.10:3128)          |
+------------------------------------+------------------------------+
                                     |
                                     | Controlled MITRE ATT&CK Traffic
                                     | (SMB 445 / RPC 135 / WinRM 5985)
                                     v
+-------------------------------------------------------------------+
|               THEDAL Windows Endpoint (10.10.10.20)               |
|                                                                   |
|   +--> Windows Security Event Log (Process Creation 4688 with CLI)|
|   +--> PowerShell Operational (ScriptBlock 4104 / Module 4103)    |
|   +--> Microsoft Sysmon Operational (Event 1 Process Create)      |
|   +--> Task Scheduler (Event 4698 Create / 4699 Delete)           |
|                                                                   |
|   [ Wazuh Agent Daemon v4.14.7 (Monitors eventchannel sources) ]  |
+------------------------------------+------------------------------+
                                     |
                                     | Encrypted TCP 1514 / TLS
                                     v
+-------------------------------------------------------------------+
|               THEDAL Wazuh SIEM Core (10.10.10.10)                |
|                                                                   |
|   - Wazuh Manager (:1514/:1515) -> Decoders & Rule Matching       |
|   - OpenSearch Indexer (:9200) -> Alert Indexing                  |
|   - Wazuh Dashboard (:443) -> Visual Investigation & Triage       |
+-------------------------------------------------------------------+
```

---

## 2. Software Requirements & Source Provenance

| Component | Pinned Version / Commit | Source Repository / Provenance | Purpose |
| :--- | :--- | :--- | :--- |
| **PowerShell Core** | Current Stable (`pwsh 7.4.x`) | `packages.microsoft.com/ubuntu/22.04` | Cross-platform execution runtime for Invoke-AtomicRedTeam |
| **Invoke-AtomicRedTeam** | Commit `7c0be6c87e411b7dfb1ddf35921867160ba7dae1` | `github.com/redcanaryco/invoke-atomicredteam.git` | Official PowerShell execution harness |
| **Atomic Red Team Tests**| Commit `6ba681b9b1e9e8f1b6c68ad93b4974f07a2c6769` | `github.com/redcanaryco/atomic-red-team.git` | MITRE ATT&CK atomic test definitions |
| **Python Utilities** | Python 3.10+ with `PyYAML` | Ubuntu Base Repositories | Test catalog parsing and wrapper validation |

---

## 3. Strict Safety Boundaries & Interlocks

To ensure simulations remain strictly non-destructive and auditable:
1. **Default Disabled**: Automated attack execution is disabled by default (`atomic_execute: false`). Provisioning playbooks never execute techniques automatically.
2. **Explicit Target Allowlist**: The execution wrapper strictly enforces target allowlisting. Simulations can **only** target `SOCForge-windows` (`10.10.10.200` / `10.10.10.x`). All other IP addresses and external networks are rejected.
3. **Execution Confirmation**: Interactive and automated test invocations require an explicit confirmation flag (`--confirm`).
4. **Isolated Web Boundary**: Web targets (DVWA on port 8000 and OWASP Juice Shop on port 3000) are **strictly excluded** from Atomic Red Team simulations in Phase 10. Web security testing is isolated to Phase 11.
5. **No Destructive Actions**: Phase 10 excludes credential dumping, LSASS memory reading, registry hijacking, or permanent persistence mechanisms.

---

## 4. Curated Low-Risk Initial ATT&CK Test Catalog

The following 5 foundational techniques generate rich telemetry across Windows Security Auditing, Sysmon, and PowerShell:

### 1. `T1059.001` — Command and Scripting Interpreter: PowerShell
* **Atomic Test ID**: `T1059.001-1`
* **Risk Level**: Low
* **Purpose**: Validates PowerShell ScriptBlock logging (Event 4104), Module logging (4103), and process command-line auditing (4688).
* **Command**:
  ```powershell
  pwsh -Command "Write-Output 'SOCForge Telemetry Validation Marker: T1059.001'"
  ```
* **Expected Telemetry**:
  * Windows Security: Event `4688` (`powershell.exe` / `pwsh.exe` with command line).
  * Sysmon: Event `1` (Process Create with parent lineage and cryptographic hashes).
  * PowerShell Operational: Event `4104` (ScriptBlock logging containing de-obfuscated code block) and Event `4103`.
  * Wazuh Alert: Rule `91801` (Windows PowerShell script block execution).
* **Cleanup**: None required (read-only execution).

### 2. `T1082` — System Information Discovery
* **Atomic Test ID**: `T1082-1`
* **Risk Level**: Low
* **Purpose**: Validates process creation auditing for built-in administrative discovery utilities.
* **Command**:
  ```cmd
  systeminfo.exe
  whoami.exe /all
  hostname.exe
  ```
* **Expected Telemetry**:
  * Windows Security: Event `4688` (`systeminfo.exe`, `whoami.exe`, `hostname.exe`).
  * Sysmon: Event `1` (Process Create for discovery binaries).
  * Wazuh Alert: Rule `60100` (Windows host information discovery).
* **Cleanup**: None required (read-only command execution).

### 3. `T1087.001` — Account Discovery: Local Accounts
* **Atomic Test ID**: `T1087.001-1`
* **Risk Level**: Low
* **Purpose**: Validates detection of local user and administrative group enumeration.
* **Command**:
  ```cmd
  net.exe user
  net.exe localgroup administrators
  ```
* **Expected Telemetry**:
  * Windows Security: Event `4688` (`net.exe`, `net1.exe` with argument `user` and `localgroup`).
  * Sysmon: Event `1` (Process Create for `net.exe`).
  * Wazuh Alert: Rule `60101` (Windows local account enumeration).
* **Cleanup**: None required (read-only enumeration).

### 4. `T1016` — System Network Configuration Discovery
* **Atomic Test ID**: `T1016-1`
* **Risk Level**: Low
* **Purpose**: Validates detection of network reconnaissance commands.
* **Command**:
  ```cmd
  ipconfig.exe /all
  route.exe print
  arp.exe -a
  ```
* **Expected Telemetry**:
  * Windows Security: Event `4688` (`ipconfig.exe`, `route.exe`, `arp.exe`).
  * Sysmon: Event `1` (Process Create for network discovery utilities).
  * Wazuh Alert: Rule `60102` (Windows network configuration discovery).
* **Cleanup**: None required (read-only discovery).

### 5. `T1053.005` — Scheduled Task / Job: Scheduled Task
* **Atomic Test ID**: `T1053.005-1`
* **Risk Level**: Low
* **Purpose**: Validates scheduled task creation and deletion auditing without leaving persistent artifacts.
* **Command**:
  ```cmd
  schtasks.exe /create /tn "SOCForgeTestTask" /tr "cmd.exe /c echo SOCForge" /sc once /st 00:00 /f
  schtasks.exe /query /tn "SOCForgeTestTask"
  ```
* **Expected Telemetry**:
  * Windows Security: Event `4688` (`schtasks.exe` with `/create` and `/query`), Event `4698` (Scheduled task created).
  * Windows Security: Event `4699` (Scheduled task deleted during cleanup).
  * Sysmon: Event `1` (Process Create for `schtasks.exe`).
  * Wazuh Alert: Rule `60103` (Windows scheduled task created).
* **Cleanup**:
  ```cmd
  schtasks.exe /delete /tn "SOCForgeTestTask" /f
  ```

---

## 5. Controlled Execution Wrapper & Simulation Logging

The execution wrapper (`/usr/local/bin/run-atomic-test` and `scripts/run-atomic-test.sh`) enforces safety interlocks, records execution timestamps, and invokes cleanup:

```bash
# 1. Inspect curated catalog
./scripts/run-atomic-test.sh --list

# 2. Perform safe dry-run inspection
./scripts/run-atomic-test.sh --technique T1082 --dry-run

# 3. Authorize live execution (Requires live infrastructure)
./scripts/run-atomic-test.sh --technique T1082 --confirm
```

### Simulation Audit Log Format (`/var/log/socforge/atomic/simulation.log`):
```json
{"simulation_id":"SIM-1723901234-4589","timestamp":"2026-08-17T14:15:00Z","technique":"T1082","name":"System Information Discovery","test_id":"T1082-1","target":"10.10.10.200","status":"STARTING","operator":"ubuntu"}
{"simulation_id":"SIM-1723901234-4589","timestamp":"2026-08-17T14:15:03Z","technique":"T1082","target":"10.10.10.200","status":"SUCCESS","duration":"3s","cleanup":"NOT_REQUIRED"}
```

---

## 6. Ground-Truth Telemetry Correlation Matrix

By correlating the Attack host simulation logs with Wazuh SIEM alerts, SOC analysts can trace exact adversary actions from intent to alert generation:

```text
+-----------------------+     +-----------------------+     +-----------------------+
|  Attack Host (Ground) |     |   Windows Endpoint    |     |  Wazuh SIEM Manager   |
|                       |     |                       |     |                       |
| [ Simulation Log ]    |     | [ Event Generation ]  |     | [ Alert Detection ]   |
| - Sim ID: SIM-101     | --> | - Event 4688 (whoami) | --> | - Rule 60100 (Host    |
| - Tech: T1082         |     | - Sysmon 1 (whoami)   |     |   Discovery)          |
| - Time: 14:15:00 UTC  |     | - Time: 14:15:01 UTC  |     | - Time: 14:15:02 UTC  |
+-----------------------+     +-----------------------+     +-----------------------+
```

---

## 7. Verification Status

### 🟢 Configuration & Automation Validation (Passed)
* `terraform validate`: **Success**.
* `terraform plan`: **Success** (58 resources categorized and verified).
* `ansible-playbook ansible/playbooks/atomic-red-team.yml --syntax-check`: **Success**.
* `scripts/atomic-health-check.sh`: **Success**. All role files, test catalog syntax, safety assertions, and permissions verified.

### 🟡 Live Deployment Validation (Pending)
* Live cloud provisioning (`terraform apply`) has not been executed. Live simulation invocations and live Wazuh dashboard verification remain pending.
