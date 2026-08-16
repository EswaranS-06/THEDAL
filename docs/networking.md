# SOCForge — Networking & Security Group Architecture

> **Phase 4 Status**: The AWS network foundation (VPC, subnets, routing), Security Access Layer (security groups, IAM, key pairs), and **EC2 Compute Infrastructure** (5 instances) are defined in Terraform.

---

## 1. Network & Compute Placement

The SOCForge compute topology enforces strict boundary isolation: only the Bastion host receives a public IPv4 address. All SOC workloads, targets, and attack simulation engines reside solely on private IPs.

```text
                    Internet
                       |
                       | (TCP 22 from admin_cidr only)
                       v
             +--------------------+
             |   Management SG    |
             | [SOCForge-bastion] |
             |   (10.10.1.0/24)   |
             |   PUBLIC + PRIVATE |
             +---------+----------+
                       | (SSH ProxyJump / WinRM)
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

## 3. Known Private Subnet Limitation (No NAT Gateway)

> ⚠️ **Outbound Internet Limitation**
>
> To eliminate recurring cloud costs (~$32/month per AWS Managed NAT Gateway), the private subnets (`SOC`, `Web`, `Attack`) have **no NAT Gateway** attached.
>
> * Private instances cannot directly download public internet resources on their own.
> * In Phase 5, package installation will be orchestrated using controlled bootstrap mechanisms (e.g. forward proxying via the Bastion, local caching, or ephemeral bootstrap access) rather than leaving an expensive permanent NAT Gateway running.
