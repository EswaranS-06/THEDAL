# SOCForge — Networking & Security Group Architecture

> **Phase 3 Status**: The AWS network foundation (VPC, subnets, routing) and **Security Access Layer** (5 security groups, IAM instance profile, EC2 key pair, and Bastion access model) are fully defined in Terraform.

---

## 1. Network & Security Topology Overview

SOCForge implements a defense-in-depth architecture where network routing and stateful security groups jointly enforce strict perimeter controls.

```text
                    Internet
                       |
                       | (TCP 22 from admin_cidr only)
                       v
             +--------------------+
             |   Management SG    |
             | (Bastion / Jumpbox)|
             |   (10.10.1.0/24)   |
             +---------+----------+
                       |
        +--------------+--------------+
        | (SSH 22,     | (WinRM /     | (SSH 22,
        |  API 55000,  |  RDP 3389)   |  HTTP 80)
        |  HTTPS 443)  |              |
        v              v              v
+---------------+ +---------------+ +---------------+
|    SOC SG     | |  Windows SG   | |    Web SG     |
| (Wazuh SIEM)  | |  (Endpoint)   | |  (Juice Shop  |
+-------^-------+ +-------^-------+ |   & DVWA)     |
        |                 |         +-------^-------+
        | (Telemetry      | (Attack         | (Attack
        |  1514/1515)     |  445/135)       |  8000/3000)
        |                 +--------+--------+
        |                          |
        +--------------------------+
                                   |
                         +---------+---------+
                         |     Attack SG     |
                         | (Atomic Red Team) |
                         +-------------------+
```

---

## 2. Security Group Reference Matrix

| Security Group | Inbound Rules | Outbound Rules | Security Purpose |
| :--- | :--- | :--- | :--- |
| **`SOCForge-management-sg`** | TCP 22 (SSH) from `var.admin_cidr` | All traffic (`0.0.0.0/0`) | Strictly controlled entry point for operator and Ansible automation. |
| **`SOCForge-soc-sg`** | TCP 22, 55000, 443 from `management-sg`<br>TCP 443 from `admin_cidr`<br>TCP 1514, 1515 from `windows-sg`, `web-sg`, `attack-sg` | All traffic (`0.0.0.0/0`) | Ingests agent telemetry, protects Wazuh API and Web Dashboard. |
| **`SOCForge-windows-sg`** | TCP 3389 (RDP) from `management-sg` & `admin_cidr`<br>TCP 5985/5986 (WinRM) from `management-sg`<br>TCP 445, 135, 5985 from `attack-sg` | All traffic (`0.0.0.0/0`) | Protects Windows workstation while enabling Ansible provisioning, RDP triage, and simulated attack ingress. |
| **`SOCForge-web-sg`** | TCP 22, 80, 8000, 3000 from `management-sg`<br>TCP 80, 8000, 3000 from `attack-sg` | All traffic (`0.0.0.0/0`) | Hosts Nginx and vulnerable targets (**NEVER exposed to 0.0.0.0/0**). Only reachable by attack host and management. |
| **`SOCForge-attack-sg`** | TCP 22 from `management-sg` | All traffic (`0.0.0.0/0`) | Allows operator to drive Atomic Red Team attack simulations against target subnets. |

---

## 3. Core Security Justifications

### Why Vulnerable Web Applications Are NOT Public
DVWA (port 8000) and OWASP Juice Shop (port 3000) contain real, exploitable security flaws (SQL injection, remote command execution, insecure deserialization). Exposing these services to `0.0.0.0/0` would allow external bots and automated scanners to compromise the instances. By restricting ingress to `SOCForge-attack-sg` and `SOCForge-management-sg`, all exploit traffic originates strictly from inside the controlled training lab.

### Why SSH and RDP Ingress is Strictly Scoped
* Direct Internet-wide exposure of SSH (port 22) or RDP (port 3389) leads to perpetual brute-force attacks and credential stuffing.
* Management ingress is restricted to the operator's specific public IP (`admin_cidr`).
* Internal instances do not have public IPs; they are reachable only through the Bastion jumpbox.

### Why No NAT Gateway in Phase 3
An AWS Managed NAT Gateway incurs a continuous hourly fee (~$32/month) regardless of usage. Since all simulation traffic, telemetry collection, and management connectivity occur internally over private IPs (`10.10.x.x`), a NAT Gateway is avoided to ensure the project remains accessible to learners on a budget.

---

## 4. Controlled Management & Ansible Connection Flow

To manage private Linux and Windows instances without public exposure, operators and Ansible utilize **SSH ProxyJump**:

```text
Operator / Ansible Workstation
              |
              | (SSH with IdentityFile ~/.ssh/socforge_key)
              v
     Management Bastion Host (10.10.1.x)
              |
              | (ProxyJump over internal VPC routing)
              +-------------------+-------------------+
              |                   |                   |
              v                   v                   v
     Wazuh Server        Web Server          Windows Endpoint
     (10.10.10.x)        (10.10.30.x)        (10.10.10.x - WinRM)
```

### Ansible SSH Configuration Snippet:
```ini
[ssh_connection]
ssh_args = -o ProxyJump=ubuntu@<BASTION_PUBLIC_IP> -o StrictHostKeyChecking=no
```
