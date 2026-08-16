# SOCForge — Networking Specification & Design Goals

> **Notice**: This document outlines the **conceptual network design** for SOCForge on AWS. These subnets, route tables, and security groups will be implemented via Terraform in Phase 2.

---

## 1. Network Topology Overview

SOCForge utilizes an isolated AWS Virtual Private Cloud (VPC) with the CIDR block `10.10.0.0/16`. The address space is partitioned into dedicated subnets to enforce strict boundary controls, separate administrative traffic from simulated attacks, and protect vulnerable workloads from external discovery.

```text
+-----------------------------------------------------------------------------------+
| AWS VPC: 10.10.0.0/16                                                             |
|                                                                                   |
|  +-------------------------------------+  +------------------------------------+  |
|  | Subnet: Management (10.10.1.0/24)   |  | Subnet: SOC & SIEM (10.10.10.0/24)  |  |
|  | - Bastion / Control Access Point    |  | - Wazuh SIEM Manager & Indexer     |  |
|  | - Strict Ingress: Operator IP only  |  | - Wazuh Dashboard                  |  |
|  +-------------------------------------+  +------------------------------------+  |
|                                                                                   |
|  +-------------------------------------+  +------------------------------------+  |
|  | Subnet: Attack (10.10.20.0/24)      |  | Subnet: Target / Web (10.10.30.0/24)|  |
|  | - Atomic Red Team Emulation Node    |  | - Nginx Reverse Proxy              |  |
|  | - Isolated Execution Plane          |  | - Vulnerable Web App (:8000)       |  |
|  |                                     |  | - OWASP Juice Shop (:3000)         |  |
|  +-------------------------------------+  +------------------------------------+  |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  | Subnet: Endpoint (10.10.40.0/24 / 10.10.10.x)                               |  |
|  | - Windows Workstation (Sysmon + Event Forwarding)                           |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 2. Target Subnet Allocation

| Subnet Identifier | CIDR Block | Purpose | External Exposure |
| :--- | :--- | :--- | :--- |
| **Management** | `10.10.1.0/24` | Operator control plane, SSH jumpbox / bastion | Restricted to Operator Public IP (`/32`) |
| **SOC / SIEM** | `10.10.10.0/24` | Wazuh Manager, Indexer, and Dashboard | Internal only (Dashboard accessed via Management or VPN/SSH tunnel) |
| **Attack** | `10.10.20.0/24` | Atomic Red Team simulation harness | Strictly Internal |
| **Target / Web** | `10.10.30.0/24` | Linux Server hosting Nginx, DVWA, and Juice Shop | Restricted / Lab Internal |
| **Endpoint** | `10.10.40.0/24` | Windows simulated employee client workstation | Strictly Internal |

---

## 3. Core Security & Isolation Principles

1. **Zero Unnecessary Public Exposure**:
   * No lab node should possess an unrestricted public IP address unless required for external package updates or specific egress via an AWS Internet Gateway / NAT.
2. **Private IP Inter-Communication**:
   * All log forwarding, agent registration, and attack emulation traffic must traverse internal private IP addresses (`10.10.x.x`).
3. **Least Privilege Security Groups**:
   * Security groups must strictly specify port, protocol, and source CIDR blocks. Default security groups will deny all inbound traffic.
4. **No Management Access to `0.0.0.0/0`**:
   * SSH (port 22), RDP (port 3389), and Wazuh Dashboard (port 443/5601) must **never** be open to `0.0.0.0/0`. Ingress is dynamically or explicitly scoped to the administrator's authorized IP address (`x.x.x.x/32`).
5. **Vulnerable Application Protection**:
   * Deliberately vulnerable applications (DVWA on port 8000, Juice Shop on port 3000) contain exploitable vulnerabilities. They must **never** be exposed directly to the public Internet to prevent third-party compromise or bot exploitation.
6. **Attack Environment Isolation**:
   * The attack emulation host (Atomic Red Team) may only initiate traffic toward designated target subnets (`Target/Web` and `Endpoint`). It must not communicate with administrative control planes or external networks unmonitored.

---

## 4. Traffic Flow Classification

SOCForge categorizes network packets into four distinct traffic classes to simplify detection and log filtering:

```text
+-----------------------+-----------------------+-----------------------+-----------------------+
|  Management Traffic   |   Telemetry Traffic   |  Application Traffic  |    Attack Traffic     |
+-----------------------+-----------------------+-----------------------+-----------------------+
| SSH (22), RDP (3389), | Wazuh Agent (1514),   | HTTP (80/443),        | Target probing,       |
| HTTPS Admin (443)     | Syslog (514),         | Reverse proxy to      | brute-force, web      |
| between Operator and  | Beats / Fluentbit     | :8000 and :3000       | exploitation, C2      |
| Control plane         | to Wazuh Core         |                       | simulation            |
+-----------------------+-----------------------+-----------------------+-----------------------+
```

---

## 5. Security Group Reference Model (Target)

| Security Group | Inbound Rules | Outbound Rules |
| :--- | :--- | :--- |
| **`sg_management`** | TCP 22 / 443 from `ADMIN_IP/32` | TCP 22, 3389, 443 to `10.10.0.0/16` |
| **`sg_wazuh_siem`** | TCP 1514, 1515, 514 from `10.10.0.0/16`<br>TCP 443 from `sg_management` | HTTPS 443 out (updates), DNS |
| **`sg_web_target`** | TCP 80, 8000, 3000 from `10.10.20.0/24` and `sg_management`<br>TCP 22 from `sg_management` | TCP 1514 to `sg_wazuh_siem`, HTTPS out |
| **`sg_windows_endpoint`** | TCP 3389 / WinRM from `sg_management`<br>Inbound attack vectors from `10.10.20.0/24` | TCP 1514 to `sg_wazuh_siem`, HTTPS out |
| **`sg_attack_node`** | TCP 22 from `sg_management` | Specific target ports to `10.10.30.0/24` & `10.10.40.0/24` |
