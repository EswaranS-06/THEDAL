# SOCForge — Architectural Blueprint

> **Notice**: This document details the architectural blueprint for SOCForge. It clearly delineates components **implemented in Phase 2** versus components **planned for future phases**.

---

## 1. High-Level System Architecture

SOCForge simulates an enterprise network inside an isolated Amazon Web Services (AWS) Virtual Private Cloud (VPC `10.10.0.0/16`). It encompasses a management control plane, a SOC telemetry and SIEM core, an enterprise Windows endpoint, a Linux web application server, and an adversary emulation harness.

```text
Internet
|
v
Internet Gateway (SOCForge-igw)
|
v
AWS VPC: 10.10.0.0/16 (Single AZ)
|
+------------------------------------+
|                                    |
v [PUBLIC ROUTE]                     v [PRIVATE ROUTE]
Management Subnet                    SOC Lab Network
(10.10.1.0/24)                       |
|                                    +---------------------+---------------------+
v                                    |                     |                     |
Bastion / Operator Access            v                     v                     v
(Future Phase)                    Wazuh SIEM            Windows Endpoint      Web Server
                                  (10.10.10.0/24)       (10.10.10.0/24)       (10.10.30.0/24)
                                  [Future]              [Future]              |
                                                                       +------+------+
                                                                       |             |
                                                                    Nginx :8000   Juice Shop :3000
                                                                       | [Future]    | [Future]
                                                                       v             v
                                                                  Vulnerable Web Application
                                                                       ^
                                                                       |
                                                                Atomic Red Team
                                                                (10.10.20.0/24)
                                                                [Future]
```

---

## 2. Implementation Status by Phase

### ✅ IMPLEMENTED IN PHASE 2 (AWS Network Foundation)
The underlying network topology is defined in Terraform and ready for provisioning:
* **Dedicated AWS VPC**: `10.10.0.0/16` with DNS hostnames and resolution enabled.
* **Dynamic Single Availability Zone**: Discovered dynamically via `data.aws_availability_zones.available`.
* **Four Dedicated Subnets**:
  * `Management Subnet` (`10.10.1.0/24`) — Public tier (`map_public_ip_on_launch = true`).
  * `SOC Subnet` (`10.10.10.0/24`) — Private tier (`map_public_ip_on_launch = false`).
  * `Attack Subnet` (`10.10.20.0/24`) — Private tier (`map_public_ip_on_launch = false`).
  * `Target / Web Subnet` (`10.10.30.0/24`) — Private tier (`map_public_ip_on_launch = false`).
* **Internet Gateway**: `SOCForge-igw` attached to the VPC.
* **Public Route Table**: `SOCForge-public-rt` containing `0.0.0.0/0 -> SOCForge-igw` (associated with Management).
* **Private Route Table**: `SOCForge-private-rt` containing local VPC route only (associated with SOC, Attack, and Web).

### ⏳ PLANNED FOR FUTURE PHASES (Not Yet Deployed)
The following layers are defined conceptually but **not yet created** in AWS:
* **Phase 3**: Security Groups, IAM roles/instance profiles, SSH key pairs, and controlled bastion ingress.
* **Phase 4**: EC2 compute instances (Wazuh SIEM server, Windows employee endpoint, Linux web server, Atomic Red Team node) and Ansible host provisioning.
* **Phase 5**: Centralized log shipping, Wazuh agents, custom decoders, detection rules, and Atomic Red Team attack simulation scenarios.

---

## 3. Core Component Descriptions (Planned)

### 3.1 Control Station (Debian 13 VM / Local Machine)
* **Role**: Primary operator workstation and deployment orchestrator.
* **Responsibilities**: Executes Terraform IaC, Ansible automation playbooks, and verification tests.

### 3.2 Wazuh SIEM & XDR Platform (Planned - SOC Subnet: `10.10.10.0/24`)
* **Role**: Centralized security analytics and log management engine.
* **Subcomponents**:
  * **Wazuh Manager**: Ingests events from agents, executes rule decoders, evaluates alerts, and manages agent status.
  * **Wazuh Indexer**: Scalable OpenSearch-based search and indexing engine for long-term telemetry retention.
  * **Wazuh Dashboard**: Web-based graphical user interface for visualizing alerts, building investigation dashboards, and monitoring system health.

### 3.3 Windows Employee Endpoint (Planned - SOC/Endpoint Subnet: `10.10.10.0/24`)
* **Role**: Corporate workstation simulation generating typical user, system, and adversary activity.
* **Telemetry Stack**: Microsoft Sysmon (process creation, network connections, DLL loads) + Windows Event Logs + Wazuh Agent.

### 3.4 Linux Web Server & Applications (Planned - Web Subnet: `10.10.30.0/24`)
* **Role**: Internet-facing or DMZ corporate application server.
* **Stack**: Nginx reverse proxy + Deliberately Vulnerable Web App (port 8000) + OWASP Juice Shop in Docker (port 3000) + Wazuh Agent.

### 3.5 Atomic Red Team Attack Harness (Planned - Attack Subnet: `10.10.20.0/24`)
* **Role**: Adversary emulation engine executing automated tests mapped to the MITRE ATT&CK framework against target subnets.

---

## 4. Communication & Telemetry Flow (Planned)

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
