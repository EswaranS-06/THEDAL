# THEDAL — Networking & Security Group Architecture

### Threat Hunting, Exploration, Detection, Analysis and Learn

---

## 1. Network & Compute Placement

The THEDAL compute topology enforces strict boundary isolation: only the Bastion host receives a public IPv4 address. All SOC workloads, targets, and attack simulation engines reside solely on private IPs.

```text
                    Internet
                       |
                       | (TCP 22 from admin_cidr only)
                       v
             +--------------------+
             |   Management SG    |
             | [SOCForge-bastion] |
             |  (Tinyproxy :3128) |
             |   (10.10.1.0/24)   |
             |   PUBLIC + PRIVATE |
             +---------+----------+
                       | (SSH ProxyJump / WinRM & Proxy :3128)
        +--------------+--------------+
        |                             |
        v                             v
+---------------+             +---------------+
|    SOC SG     |             |  Windows SG   |
| [SOCForge-    |             | [SOCForge-    |
|    wazuh]     |             |   windows]    |
| (10.10.10.0)  |             | (10.10.10.0)  |
| PRIVATE ONLY  |             | PRIVATE ONLY  |
+-------^-------+             +-------^-------+
        | (Telemetry                  | (Simulated
        |  1514/1515)                 |  Attack 445/135)
        |                             |
        |       +---------------+     |
        |       |    Web SG     |<----+
        |       | [SOCForge-    |
        |       |     web]      | (Simulated Attack
        |       | (10.10.30.0)  |  8000/3000)
        |       | PRIVATE ONLY  |
        |       +-------^-------+
        |               |
        +---------------+-------------+
                        | (Agent Telemetry 1514/1515)
              +---------+---------+
              |     Attack SG     |
              | [SOCForge-attack] |
              |  (10.10.20.0/24)  |
              |   PRIVATE ONLY    |
              +-------------------+
```

---

## 2. Public vs. Private IP Matrix

| Instance Name | Subnet | CIDR | Public IP | Private IP | Route Table |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `SOCForge-bastion` | `Management` | `10.10.1.0/24` | **YES** | `10.10.1.x` | `SOCForge-public-rt` (`0.0.0.0/0 -> IGW`) |
| `SOCForge-wazuh` | `SOC` | `10.10.10.0/24` | **NO** | `10.10.10.x` | `SOCForge-private-rt` (Local VPC only) |
| `SOCForge-windows` | `SOC` | `10.10.10.0/24` | **NO** | `10.10.10.x` | `SOCForge-private-rt` (Local VPC only) |
| `SOCForge-web` | `Web` | `10.10.30.0/24` | **NO** | `10.10.30.x` | `SOCForge-private-rt` (Local VPC only) |
| `SOCForge-attack` | `Attack` | `10.10.20.0/24` | **NO** | `10.10.20.x` | `SOCForge-private-rt` (Local VPC only) |

---

## 3. Provisioning Channel & Port Matrix

| Security Group | Port / Protocol | Source CIDR / SG | Purpose |
| :--- | :--- | :--- | :--- |
| `SOCForge-management-sg` | TCP 22 | `admin_cidr` | Operator SSH Jumpbox Access |
| `SOCForge-management-sg` | **TCP 3128** | `10.10.0.0/16` (VPC) | **Bastion Forward Proxy for Package Bootstrapping** |
| `SOCForge-soc-sg` | TCP 22 | `management-sg` | Management SSH access to Wazuh SIEM |
| `SOCForge-soc-sg` | TCP 1514, 1515 | `windows-sg`, `web-sg`, `attack-sg` | Wazuh Agent Event Telemetry & Registration |
| `SOCForge-soc-sg` | TCP 443, 9200 | `management-sg` | Wazuh Dashboard & Indexer API management |
| `SOCForge-windows-sg` | TCP 5985, 5986, 3389 | `management-sg` | WinRM / RDP Management from Bastion |
| `SOCForge-windows-sg` | TCP 445, 135, 3389 | `attack-sg` | Atomic Red Team Lateral Movement Simulation |
| `SOCForge-web-sg` | TCP 22 | `management-sg` | Management SSH access to Web target |
| `SOCForge-web-sg` | TCP 80, 443, 8000, 3000 | `attack-sg`, `management-sg` | Web Application Simulation (DVWA, Juice Shop) |
| `SOCForge-attack-sg` | TCP 22 | `management-sg` | Management SSH access to Attack node |
