# THEDAL — Beginner's Guide & Project Entry Point

### Threat Hunting, Exploration, Detection, Analysis and Learn

> Welcome to **THEDAL**! This guide is your starting point for deploying, operating, and learning real-world Security Operations Center (SOC) investigation workflows on live cloud infrastructure.

---

## 1. What is THEDAL?

**THEDAL** (Threat Hunting, Exploration, Detection, Analysis and Learn) is a cloud-native cybersecurity detection, simulation, and investigation platform. It provides a complete, production-grade SOC lab deployed into Amazon Web Services (AWS) using Infrastructure as Code (Terraform & Ansible).

Unlike static capture-the-flag (CTF) challenges or passive log dumps, THEDAL provides a **living, breathing enterprise environment** featuring:
- A dedicated **SIEM & Analytics Cluster** (Wazuh 4.14.7 Manager, Indexer, OpenSearch Dashboards, Filebeat).
- An instrumented **Windows Server 2022 Endpoint** (Sysmon v15, PowerShell ScriptBlock Logging, Enhanced Auditing).
- An instrumented **Linux Web Target** (Nginx Reverse Proxy, DVWA, Dockerized OWASP Juice Shop, Linux `auditd`, FIM).
- An isolated **Adversary Emulation Host** (Atomic Red Team framework, automated web attack engines).
- A hardened **Public Bastion Jumpbox** with Squid forward proxy and SSH tunnels.

---

## 2. What Will You Learn?

By working through the guided THEDAL labs, you will develop practical, job-ready SOC Tier 1 / Tier 2 skills:
1. **Log & Telemetry Analysis**: Decipher Windows Event Logs, Sysmon telemetry, Linux systemd journals, `auditd` kernel syscalls, Nginx HTTP access logs, and container logs.
2. **SIEM Investigation**: Search and filter OpenSearch indices, construct compound Boolean queries, and interpret alert metadata.
3. **MITRE ATT&CK Mapping**: Correlate adversary behaviors (Initial Access, Execution, Persistence, Discovery) to standard MITRE techniques.
4. **Multi-Source Correlation**: Link seemingly unrelated events (e.g., an HTTP web exploit followed by an operating system process execution) into high-confidence incidents.
5. **Triage & Classification**: Differentiate benign administrative activity (False Positives) from genuine attacks (True Positives).
6. **Incident Reporting**: Document clear timelines, root causes, evidence artifacts, and remediation guidance using professional templates.

---

## 3. High-Level Architecture

The THEDAL environment is partitioned into three security tiers inside a dedicated AWS VPC (`10.10.0.0/16`):

```text
                               AWS CLOUD (VPC 10.10.0.0/16)
               +-------------------------------------------------------------+
               |                  PUBLIC SUBNET (10.10.1.0/24)               |
               |  [ Public Bastion Jumpbox (Static Internal IP: 10.10.1.10) ]|
               |  - SSH ProxyJump Entry Point                                |
               |  - Forward Proxy (Squid:3128) - No NAT Gateway needed       |
               +------------------------------+------------------------------+
                                              |
               +------------------------------+------------------------------+
               |                  PRIVATE SOC SUBNET (10.10.10.0/24)         |
               |  [ Wazuh SIEM Host (10.10.10.10) ]                          |
               |  - Manager, Indexer, OpenSearch Dashboards, Filebeat        |
               |                                                             |
               |  [ Windows Server 2022 Endpoint (10.10.10.20) ]             |
               |  - Wazuh Agent, Sysmon, PowerShell ScriptBlock Logging      |
               +------------------------------+------------------------------+
                                              |
               +------------------------------+------------------------------+
               |                 PRIVATE TARGET SUBNET (10.10.30.0/24)       |
               |  [ Linux Web Target (10.10.30.10) ]                         |
               |  - Wazuh Agent, Nginx, DVWA (:8000), Juice Shop (:3000)     |
               +------------------------------+------------------------------+
                                              |
               +------------------------------+------------------------------+
               |                 PRIVATE ATTACK SUBNET (10.10.20.0/24)       |
               |  [ Linux Attack Host (10.10.20.10) ]                        |
               |  - Atomic Red Team Engine, Web Test Suites                  |
               +-------------------------------------------------------------+
```

---

## 4. AWS Cost Warning & Resource Management

> [!WARNING]
> **Cloud Usage & Billing Notice**:
> - Running EC2 instances in AWS can incur real monetary charges.
> - While AWS offers a Free Tier for eligible accounts, running multiple instances (`t3.xlarge`, `t3.small`, `t3.micro`) and associated EBS storage may exceed monthly free tier allowances.
> - **Zero NAT Gateway Cost**: THEDAL eliminates AWS NAT Gateway costs (~$32+/month) by routing outbound package updates through the Bastion forward proxy.
> - **Always Destroy When Finished**: When you complete your learning sessions, execute `terraform destroy` to terminate all AWS resources and prevent ongoing billing.

---

## 5. Safety & Ethical Conduct

> [!CAUTION]
> **Restricted Scope of Simulation Tools**:
> - The attack scripts (`run-atomic-test`, `run-web-test`) included in THEDAL are designed **strictly** for testing the isolated THEDAL private subnets.
> - Never target external hosts, production systems, or unauthorized third-party infrastructure.
> - Simulations on THEDAL execute with safety boundaries and automatic cleanup routines.

---

## 6. Accessing the Environment

> [!TIP]
> **Obtaining the Bastion Public IP**:
> You can retrieve the current public IP of the Bastion jumpbox by running:
> ```bash
> terraform -chdir=terraform output bastion_public_ip
> ```
> or by viewing the **Dashboard** in the local Control Plane (`make control-plane` -> `http://127.0.0.1:8080`).

### A. SSH Access via Bastion Jumpbox
All internal Linux nodes are accessible from your local machine using the Bastion ProxyJump configuration:
```bash
# Connect to Bastion (using thedal_key)
ssh -i ~/.ssh/thedal_key ubuntu@<BASTION_PUBLIC_IP>

# Connect directly to Wazuh SIEM Host
ssh -i ~/.ssh/thedal_key -o ProxyJump=ubuntu@<BASTION_PUBLIC_IP> ubuntu@10.10.10.10

# Connect directly to Web Target Host
ssh -i ~/.ssh/thedal_key -o ProxyJump=ubuntu@<BASTION_PUBLIC_IP> ubuntu@10.10.30.10

# Connect directly to Attack Host
ssh -i ~/.ssh/thedal_key -o ProxyJump=ubuntu@<BASTION_PUBLIC_IP> ubuntu@10.10.20.10
```

### B. Accessing OpenSearch Dashboards (Web UI)
To access the Wazuh / OpenSearch Dashboards UI in your local web browser:
1. Establish an SSH tunnel through the Bastion:
   ```bash
   ssh -i ~/.ssh/thedal_key -N -L 8443:10.10.10.10:443 ubuntu@<BASTION_PUBLIC_IP>
   ```
2. Open your browser and navigate to: `https://localhost:8443` (redirects automatically to `/app/wz-home`)
3. Accept the self-signed TLS certificate.
4. Log in using your configured administrative credentials (or default lab credentials `admin / SOCForge_Adm1n_Lab2026!`).

---

## 7. Navigating Dashboards & Investigation Views

Once logged into OpenSearch Dashboards, open **Dashboard** from the side menu to access 4 purpose-built investigation views:
- **THEDAL — Security Operations Overview**: Executive overview of all monitored endpoints, severity distributions, top hosts, and emulation activities.
- **THEDAL — Windows Endpoint Investigation**: Correlated view of Windows Security logs, Sysmon process creations, and PowerShell ScriptBlocks.
- **THEDAL — Web Applications Investigation**: Analysis of Nginx HTTP response codes, DVWA exploitation queries, and containerized Juice Shop REST API events.
- **THEDAL — Adversary Attack Activity & Ground Truth**: Correlation dashboard mapping emulation engine logs directly against triggered SIEM alerts.

---

## 8. Learning Workflow: How to Complete a Lab

Each lab follows an intuitive, structured 5-step loop:

```text
+-----------------------+
| 1. Read Lab Scenario  | -> Understand the threat hypothesis and learning objectives.
+-----------+-----------+
            |
            v
+-----------------------+
| 2. Trigger Simulation | -> Execute the controlled attack from the Attack Host.
+-----------+-----------+
            |
            v
+-----------------------+
| 3. Query the SIEM     | -> Search the target index pattern in OpenSearch Dashboards.
+-----------+-----------+
            |
            v
+-----------------------+
| 4. Analyze Evidence   | -> Answer investigative questions (Who, What, When, Where, Why).
+-----------+-----------+
            |
            v
+-----------------------+
| 5. Document & Report  | -> Fill out the investigation report template.
+-----------------------+
```

---

## 9. Next Steps

Ready to begin? 
1. Review the [SOC Glossary](file:///home/rex/Documents/Projects/docs/learning/glossary.md) to familiarize yourself with core SOC concepts.
2. Review the [Attack-to-Telemetry Mapping](file:///home/rex/Documents/Projects/docs/learning/attack-to-telemetry.md).
3. Open the [Learning Path](file:///home/rex/Documents/Projects/docs/learning-path.md) and start with **[Lab 01: First Wazuh Alert](file:///home/rex/Documents/Projects/docs/labs/01-first-alert/README.md)**!
