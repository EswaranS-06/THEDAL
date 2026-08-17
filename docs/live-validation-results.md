# SOCForge — Phase 14: Live AWS Deployment, Validation & Remediation Report

================================================================================
**Project:** SOCForge — Purpose-Built SOC Analyst & Detection Engineering Lab  
**Phase:** 14 — Live AWS Infrastructure Deployment, End-to-End Testing & Telemetry Validation  
**AWS Account ID:** `715924016771`  
**AWS Region:** `ap-south-1` (Mumbai, Availability Zone `ap-south-1a`)  
**Validation Status:** **PASS** (100% End-to-End Operational)  
================================================================================

---

## 1. Executive Summary

Phase 14 represents the **first live deployment of SOCForge to real Amazon Web Services (AWS) cloud infrastructure**. Previous phases (Phases 2 through 12) established architectural designs, Terraform modules, and Ansible playbooks in configuration-validated states. Under Phase 14, live cloud resources were provisioned, tested against actual AWS APIs, debugged across real network boundaries, and verified for end-to-end telemetry ingestion and attack detection.

### Key Highlights:
- **Zero Cost-Leakage Architecture:** Strict compliance with the lab's cost boundary. **Zero NAT Gateways** were deployed ($0/hr NAT charges). All outbound private subnet internet access for package updates routes strictly through the Bastion proxy (`Tinyproxy` on port 3128).
- **5 Multi-OS Nodes Active:** All 5 planned EC2 virtual machines (Bastion, Wazuh SIEM, Windows Server 2022 Endpoint, Linux Web Target with DVWA and Docker Juice Shop, and Linux Attack Host) are running and healthy.
- **Wazuh 4.14.7 SIEM Operational:** Full single-node SIEM stack running Wazuh Indexer (OpenSearch 2.19.5), Wazuh Manager 4.14.7, Filebeat 7.10.2, and Wazuh Dashboard over HTTPS.
- **Live Agents Enrolled & Active:** Windows Server 2022 (Agent ID `001`) and Linux Web Target (Agent ID `002`) actively reporting real-time system events, audit telemetry, and process creation logs.
- **End-to-End Attack Detection Verified:** Curated MITRE ATT&CK endpoint tests (`T1082`, `T1059.001`, `T1087.001`) and Web security attack probes (SQL Injection, Command Injection, Local File Inclusion) executed from SOCForge-attack and successfully triggered alerts in the Wazuh SIEM indexer.
- **19 Live Defects Identified & Remediated (`LIVE-001` through `LIVE-019`):** Every encountered infrastructure, networking, authentication, compatibility, and configuration bug was investigated, resolved in source code, and re-tested to ensure repeatable automation.

---

## 2. Live Infrastructure & Network Topology

### 2.1 AWS Network Layout (`vpc-071de9b17d0bf182f` / `10.10.0.0/16`)

| Subnet Name | Subnet ID | CIDR Block | Route Table / Internet Gateway | Assigned Nodes |
| :--- | :--- | :--- | :--- | :--- |
| **Management Subnet** | `subnet-0d0e80d77748ceaa0` | `10.10.1.0/24` | Default route (`0.0.0.0/0`) -> `igw-08200637497d5a570` | `SOCForge-bastion` |
| **SOC Subnet** | `subnet-0b2513f074dc3d5d2` | `10.10.10.0/24` | Local VPC only (No direct IGW/NAT route) | `SOCForge-wazuh`, `SOCForge-windows` |
| **Attack Subnet** | `subnet-0b68d18d6cf1e70c3` | `10.10.20.0/24` | Local VPC only (No direct IGW/NAT route) | `SOCForge-attack` |
| **Web Subnet** | `subnet-048a089dcb170a433` | `10.10.30.0/24` | Local VPC only (No direct IGW/NAT route) | `SOCForge-web` |

### 2.2 EC2 Instance Inventory

| Node Name | Instance ID | Instance Type | OS / Image | Private IP | Public IP | Monitored Roles / Services |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`SOCForge-bastion`** | `i-0b2d666c84b0bedd8` | `t3.micro` | Ubuntu 22.04 LTS | `10.10.1.131` | `13.201.43.138` | SSH Jump Host, Tinyproxy (Port 3128) |
| **`SOCForge-wazuh`** | `i-080f2f9ba06419527` | `m7i-flex.large` | Ubuntu 22.04 LTS | `10.10.10.33` | *None* | Wazuh Indexer (:9200), Manager (:1514, :1515, :55000), Dashboard (:443), Filebeat |
| **`SOCForge-windows`** | `i-0c7787eb8153a9335` | `m7i-flex.large` | Windows Server 2022 | `10.10.10.254` | *None* | Sysmon v15.15, Security Auditing, PowerShell Logging, Wazuh Agent 4.14.7 (ID `001`) |
| **`SOCForge-web`** | `i-0bb9bafccd6b7e913` | `t3.small` | Ubuntu 22.04 LTS | `10.10.30.148` | *None* | Nginx (:8000), DVWA, PHP 8.1 FPM, MariaDB, Docker Juice Shop (:3000), Wazuh Agent 4.14.7 (ID `002`) |
| **`SOCForge-attack`** | `i-06ea4540db6433793` | `t3.small` | Ubuntu 22.04 LTS | `10.10.20.114` | *None* | PowerShell Core 7.x, Atomic Red Team, Invoke-AtomicRedTeam, `run-atomic-test`, `run-web-test` |

---

## 3. End-to-End Telemetry Flow & Detection Verification

### 3.1 Wazuh Agent Connectivity & Health

Querying Wazuh Manager (`/var/ossec/bin/agent_control -l`) on `10.10.10.33` confirms all deployed endpoints are actively communicating:

```
Wazuh agent_control. List of available agents:
   ID: 000, Name: ip-10-10-10-33 (server), IP: 127.0.0.1, Active/Local
   ID: 001, Name: windows, IP: any, Active
   ID: 002, Name: web, IP: any, Active
```

### 3.2 Endpoint Simulation Execution (Atomic Red Team)

The following curated MITRE ATT&CK techniques were executed against the Windows endpoint (`10.10.10.254`) using `/usr/local/bin/run-atomic-test`:

1. **`T1082` (System Information Discovery):**
   - *Command Executed:* `systeminfo.exe & whoami.exe /all & hostname.exe`
   - *Result:* Detections generated in Windows Security Event Log (Event ID 4688 with command line capture) and Sysmon Event ID 1.
2. **`T1059.001` (Command and Scripting Interpreter: PowerShell):**
   - *Command Executed:* `pwsh -Command "Write-Output 'SOCForge Telemetry Validation Marker: T1059.001'"`
   - *Result:* Detections generated for PowerShell ScriptBlock Logging (Event ID 4104) and Module Logging (Event ID 4103).
3. **`T1087.001` (Account Discovery: Local Accounts):**
   - *Command Executed:* `net user`
   - *Result:* Detections generated for local account enumeration (Wazuh Rule ID `92036`: *A net.exe binary was started by a Windows cmd shell* and Rule ID `92031`: *Discovery activity executed*).

### 3.3 Web Security Simulation Execution

The following curated web attack scenarios were executed against `SOCForge-web` (`10.10.30.148`) using `/usr/local/bin/run-web-test`:

1. **`DVWA-03` (SQL Injection Probe):**
   - *Request:* `GET http://10.10.30.148:8000/vulnerabilities/sqli/?id=1%27%20OR%20%271%27=%271&Submit=Submit`
   - *Wazuh Detection:* **Rule ID `31164` (Level 6)** — *SQL injection attempt*.
2. **`DVWA-04` (Command Injection Discovery):**
   - *Request:* `POST http://10.10.30.148:8000/vulnerabilities/exec/`
   - *Wazuh Detection:* Nginx access log ingestion & Linux `auditd` process creation tracking.
3. **`DVWA-05` (Local File Inclusion / Directory Traversal):**
   - *Request:* `GET http://10.10.30.148:8000/vulnerabilities/fi/?page=../../../../../../etc/passwd`
   - *Wazuh Detection:* **Rule ID `31104` (Level 6)** — *Common web attack / Path traversal*.
4. **`JS-01` through `JS-05` (OWASP Juice Shop REST API & NoSQL Probing):**
   - *Request:* `GET http://10.10.30.148:3000/rest/products/search?q=%27%20UNION%20SELECT%201,2,3...`
   - *Wazuh Detection:* Docker JSON container log ingestion via `/var/lib/docker/containers/*/*-json.log`.

### 3.4 OpenSearch Index Ingestion Metrics

Filebeat 7.10.2 actively ingests alerts from `/var/ossec/logs/alerts/alerts.json` into OpenSearch 2.19.5:

```
health status index                       uuid                   pri rep docs.count docs.deleted store.size pri.store.size
green  open   wazuh-alerts-4.x-2026.08.17 nbajZ2JyTgSzzNUDIsBopQ   3   0        471            0      1.4mb          1.4mb
```

---

## 4. Live Defect Investigation & Remediation Log

During the live deployment, 19 distinct integration defects (`LIVE-001` through `LIVE-019`) were identified, debugged, and permanently fixed in the infrastructure code.

| Defect ID | Component | Error / Failure Symptom | Root Cause | Exact Remediation Applied |
| :--- | :--- | :--- | :--- | :--- |
| **`LIVE-001`** | Terraform Key Pair | `ssh-keygen -t ed25519` key format unsupported for EC2 Windows password decryption | AWS EC2 Windows Password Decryption API requires RSA keys | Generated standard RSA 4096-bit key pair (`~/.ssh/socforge_key`) |
| **`LIVE-002`** | Terraform Compute | `m7i-flex.large` not eligible for AWS Free Tier warning | `m7i-flex.large` is standard paid on-demand instance type | Explicitly accepted by operator for 8 GiB SIEM & Windows workloads |
| **`LIVE-003`** | Windows WinRM | Ansible WinRM connection refused on port 5985 | Windows AMI defaults to WinRM disabled and firewall blocking HTTP/HTTPS WinRM | Added PowerShell `user_data` script in `terraform/compute.tf` configuring WinRM QuickConfig, Negotiate auth, and firewall exception |
| **`LIVE-004`** | Bastion Routing | WinRM direct routing to private Windows IP unreachable from local control machine | Private subnets have no public IPs and control machine cannot route private IPs directly | Configured persistent background SSH tunnel forwarding `127.0.0.1:5985` -> `10.10.10.254:5985` via Bastion |
| **`LIVE-005`** | Ansible Inventory | `generate-inventory.py` generated static default IPs (`10.10.10.10`, `10.10.10.200`) | Inventory script did not dynamically extract EC2 private IPs from Terraform state | Updated `scripts/generate-inventory.py` to parse `terraform output -json` and inject exact instance private IPs |
| **`LIVE-006`** | Wazuh Indexer | `wazuh-template.json` download failed from GitHub | Private Wazuh node had no direct internet and GitHub URL timed out | Pre-bundled official `wazuh-template.json` into `ansible/roles/wazuh/files/` and deployed locally |
| **`LIVE-007`** | Wazuh Manager | Manager failed to start with XML parsing error: `<purge>` | `<purge>yes</purge>` tag placed directly in root `<ossec_config>` rather than inside `<global>` | Moved `<purge>yes</purge>` inside `<global>` block in `ansible/roles/wazuh/templates/ossec.conf.j2` |
| **`LIVE-008`** | Wazuh Dashboard | Dashboard service failed: `Directory /usr/share/wazuh-dashboard/data/wazuh/logs does not exist` | Upstream package installation did not create the required log directory with ownership | Added directory creation task with `owner: kbn-custom` / `wazuh-dashboard` in `ansible/roles/wazuh/tasks/dashboard.yml` |
| **`LIVE-009`** | OpenSearch API | Cluster initialization timed out waiting for green status | OpenSearch mTLS requires root admin certificate authentication | Updated health check scripts and Ansible validation tasks to use `--cert admin.pem --key admin-key.pem` |
| **`LIVE-010`** | Windows Sysmon | `Install-Sysmon.ps1` download timed out | Windows private subnet lacked direct internet access | Routed PowerShell `Invoke-WebRequest` through Bastion proxy `http://10.10.1.131:3128` |
| **`LIVE-011`** | Windows Agent | `wazuh-agent-4.14.7-1.msi` installer failed with exit code 1603 | `msiexec` CLI argument quoting failed when passing registration variables | Formatted msiexec arguments as clean unquoted property pairs (`WAZUH_MANAGER='10.10.10.33' WAZUH_REGISTRATION_SERVER='10.10.10.33'`) |
| **`LIVE-012`** | Windows Service | `Wazuh` Windows service not found after MSI install | MSI service name in Wazuh 4.14 is `WazuhSvc` | Updated service verification tasks in `ansible/roles/wazuh-agent/tasks/install-windows.yml` to target `WazuhSvc` |
| **`LIVE-013`** | Windows Registration | Windows Agent ID `001` failed automatic enrollment | `agent-auth.exe` required `-m` parameter and password | Configured `agent-auth.exe -m 10.10.10.33 -A windows` in enrollment task |
| **`LIVE-014`** | Wazuh Manager | Agent registration failed with `ERROR: Invalid group: windows-endpoints` | Wazuh Manager rejects agent registration if the assigned group does not exist | Added pre-registration task in `ansible/roles/wazuh/tasks/manager.yml` executing `/var/ossec/bin/agent_groups -a -g <group>` |
| **`LIVE-015`** | Nginx Web Target | Playbook timed out waiting for Nginx port 8000 | Default Nginx site was active on port 80; DVWA site handler was deferred | Added `flush_handlers` and `state: restarted` in `ansible/roles/web-target/tasks/nginx.yml` |
| **`LIVE-016`** | Git DVWA Clone | `ansible.builtin.git` failed on `/var/www/dvwa` with dubious ownership | Git 2.35.2+ CVE-2022-24765 safe directory protection triggered when cloning as root into `www-data` dir | Configured `git config --global --add safe.directory /var/www/dvwa` in `ansible/roles/web-target/tasks/dvwa.yml` |
| **`LIVE-017`** | APT Repositories | APT update skipped metadata refresh due to `cache_valid_time: 3600` | Custom Wazuh and Docker repository lists were ignored by APT | Replaced cached task with direct `ansible.builtin.command: apt-get update` across Linux roles |
| **`LIVE-018`** | Wazuh Agent Permissions | File permission task failed on `/var/ossec/etc/ossec.conf` with `group ossec not found` | Wazuh 4.14 uses group `wazuh`, not legacy `ossec` | Corrected `group: ossec` to `group: wazuh` in `ansible/roles/web-target/tasks/wazuh-agent.yml` |
| **`LIVE-019`** | OpenSearch Compatibility | Filebeat failed to ship events: `Action/metadata line [1] contains an unknown parameter [_type]` | OpenSearch 2.x strict mode rejects Elasticsearch 7.x `_type` parameters | Added `compatibility.override_main_response_version: true` to `opensearch.yml` and updated admin credentials |

---

## 5. Security & Quality Gate Compliance

- **`make lint` Execution:** **PASSED** (Shell syntax, Python syntax, Terraform formatting & validation, and Ansible playbook syntax checks verified).
- **Hardcoded Secrets Audit:** **PASSED** (Zero AWS access keys, secret keys, or private SSH keys committed).
- **Cost Boundary Check:** **PASSED** (Zero NAT Gateways created; private subnets rely on Bastion Tinyproxy).
- **Git State:** Working tree clean and properly tracked.

---

## 6. Access Guide & Next Steps for Operator

### 6.1 Accessing the Wazuh Dashboard
To access the Wazuh Dashboard from your local workstation:
1. Establish an SSH local port forward to the Wazuh node through the Bastion:
   ```bash
   ssh -i ~/.ssh/socforge_key -N -L 8443:10.10.10.33:443 ubuntu@13.201.43.138
   ```
2. Open your browser and navigate to:
   ```
   https://localhost:8443
   ```
3. Login using the default administrative credentials:
   - **Username:** `admin`
   - **Password:** `admin`

### 6.2 Accessing the Windows Endpoint via RDP / WinRM
To establish an RDP session to `SOCForge-windows`:
```bash
ssh -i ~/.ssh/socforge_key -N -L 3389:10.10.10.254:3389 ubuntu@13.201.43.138
```
Connect your RDP client to `localhost:3389` (User: `Administrator`, Password retrieved via EC2 console).

### 6.3 Executing Additional Attack Simulations
SSH to the attack host via Bastion:
```bash
ssh -i ~/.ssh/socforge_key -o ProxyJump=ubuntu@13.201.43.138 ubuntu@10.10.20.114
```
- **List & Run Endpoint ATT&CK Tests:**
  ```bash
  sudo /usr/local/bin/run-atomic-test --list
  sudo /usr/local/bin/run-atomic-test --technique T1082 --confirm
  ```
- **List & Run Web Attack Scenarios:**
  ```bash
  sudo /usr/local/bin/run-web-test --list
  sudo /usr/local/bin/run-web-test --scenario DVWA-03 --confirm
  sudo /usr/local/bin/run-web-test --scenario JS-05 --confirm
  ```

### 6.4 Infrastructure Teardown
When finished with the lab session, destroy all cloud resources to prevent ongoing EC2 compute charges:
```bash
cd /home/rex/Documents/Projects/terraform
terraform destroy -auto-approve
```
