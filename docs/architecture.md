# SOCForge — Architectural Blueprint

> **Notice**: This document details the **target conceptual architecture** of SOCForge. It serves as the engineering blueprint for subsequent development phases (Phases 2 through 5) and is **not yet provisioned** in Phase 1. The architecture may evolve based on resource and cost benchmarking.

---

## 1. High-Level System Architecture

SOCForge simulates an enterprise network inside an isolated Amazon Web Services (AWS) Virtual Private Cloud (VPC `10.10.0.0/16`). It encompasses a management control plane, a SOC telemetry and SIEM core, an enterprise Windows endpoint, a Linux web application server, and an adversary emulation harness.

```text
Internet
|
v
AWS VPC
10.10.0.0/16
|
+-----------------------------+
|                             |
v                             v
Management / access          SOC lab network
|
+---------------------+---------------------+
|                     |                     |
v                     v                     v
Wazuh SIEM          Windows Employee        Web Server
|                     |
|              +------+------+
|              |             |
|           Nginx :8000   Juice Shop
|              |           :3000
|              v
|         Vulnerable Web
|
^
|
Atomic Red Team
```

---

## 2. Core System Components

### 2.1 Control Station (Debian 13 VM)
* **Role**: Primary operator workstation and deployment orchestrator.
* **Responsibilities**: Executes Terraform infrastructure code, Ansible automation playbooks, and verification tests without hosting lab workloads directly.

### 2.2 Wazuh SIEM & XDR Platform
* **Role**: Centralized security analytics and log management engine.
* **Subcomponents**:
  * **Wazuh Manager**: Ingests events from agents, executes rule decoders, evaluates alerts, and manages agent status.
  * **Wazuh Indexer**: Scalable OpenSearch-based search and indexing engine for long-term telemetry retention.
  * **Wazuh Dashboard**: Web-based graphical user interface for visualizing alerts, building investigation dashboards, and monitoring system health.
* **Target Subnet**: `10.10.10.0/24` (SOC Subnet).

### 2.3 Windows Employee Endpoint
* **Role**: Corporate workstation simulation generating typical user, system, and adversary activity.
* **Telemetry Stack**:
  * **Microsoft Sysmon**: Configured with community-standard detection schemas (e.g. SwiftOnSecurity / Olaf Hartong modular configs) capturing process creation (Event ID 1), network connections (Event ID 3), image loads (Event ID 7), and remote threads (Event ID 8).
  * **Windows Event Logs**: Security, System, Application, and PowerShell event channels (Script Block Logging - Event ID 4104).
  * **Wazuh Agent**: Securely transports event logs and Sysmon telemetry to the Wazuh Manager over encrypted TCP (`1514/1515`).
* **Target Subnet**: `10.10.10.0/24` (SOC Subnet) or dedicated endpoint segment.

### 2.4 Linux Web Server & Applications
* **Role**: Internet-facing or DMZ corporate application server.
* **Stack**:
  * **OS**: Debian / Ubuntu Server.
  * **Nginx**: Reverse proxy routing incoming HTTP requests to internal application services, logging request paths, user agents, response codes, and error traces.
  * **Deliberately Vulnerable Web Application (DVWA / Custom)**: Listens internally on port `8000` to simulate legacy SQL injection, command execution, and file inclusion attacks.
  * **OWASP Juice Shop**: Contemporary Node.js containerized vulnerable application running in Docker on port `3000` to simulate API vulnerabilities, authentication bypasses, and XSS.
  * **Wazuh Agent**: Ingests Nginx access logs, Nginx error logs, Docker container logs, and Linux auditd/systemd logs.
* **Target Subnet**: `10.10.30.0/24` (Target / Web Subnet).

### 2.5 Atomic Red Team Attack Harness
* **Role**: Adversary emulation engine executing automated and scriptable attack tests mapped to the MITRE ATT&CK framework.
* **Functionality**:
  * Emulates adversary behaviors (discovery, credential access, lateral movement, persistence).
  * Generates predictable, repeatable attack telemetry for validation against detection rules.
* **Target Subnet**: `10.10.20.0/24` (Attack Subnet).

---

## 3. Communication & Telemetry Flow

```text
+-----------------------+           +-----------------------+
|  Attack Harness       |           |   External Analyst    |
|  (Atomic Red Team)    |           |   (Control Station)   |
+-----------+-----------+           +-----------+-----------+
            |                                   |
    Attack Execution                    Management (SSH/HTTPS)
            |                                   |
            v                                   v
+-----------------------+           +-----------------------+
|  Web Server & Apps    |           |   Wazuh Dashboard     |
|  (:8000 / :3000)      |           |   (:443 / :5601)      |
+-----------+-----------+           +-----------+-----------+
            |                                   ^
     Telemetry Agent                            | Search / Visualize
     (Log Shipping)                             |
            |                       +-----------+-----------+
            +---------------------> |   Wazuh Manager &     |
            |                       |   Indexer Core        |
            |                       +-----------+-----------+
+-----------+-----------+                       ^
|  Windows Endpoint     |                       |
|  (Sysmon + Logs)      +-----------------------+
+-----------------------+   Encrypted Telemetry (Port 1514/1515)
```

---

## 4. Architecture Evolution & Cost Safeguards

As the project progresses through subsequent implementation phases:
1. **EC2 Sizing**: Instance types (e.g. `t3.medium` for Wazuh, `t3.micro` for Web Server, `t3.medium` for Windows) will be evaluated to balance performance with AWS operational costs.
2. **Dynamic Scaling**: Architecture scripts will provide single-command startup and teardown to prevent running idle compute instances.
3. **Egress Optimization**: Telemetry collection is contained entirely within the VPC private network, minimizing external AWS data transfer charges.
