# SOCForge — Networking Specification & Design Goals

> **Phase 2 Status**: The AWS network foundation (VPC, subnets, Internet Gateway, route tables, and associations) is **fully implemented in Terraform** under `terraform/`.

---

## 1. Phase 2 Routing & Subnet Model

The SOCForge network topology enforces strict perimeter isolation: only the Management subnet communicates directly with the Internet Gateway. The internal SOC, Attack, and Web subnets reside on a private route table isolated from unsolicited internet traffic.

```text
Internet
|
v
Internet Gateway (SOCForge-igw)
|
v
Management subnet
10.10.1.0/24
PUBLIC (SOCForge-public-rt: 0.0.0.0/0 -> IGW)
|
X (No direct public ingress to private tier)
|
+--------------------------------+
|                                |
v                                v
SOC subnet                      Attack subnet
10.10.10.0/24                  10.10.20.0/24
PRIVATE (Local route only)      PRIVATE (Local route only)
|
|
v
Web/Target subnet
10.10.30.0/24
PRIVATE (Local route only)
```

---

## 2. Subnet Allocation & AZ Scoping

In AWS, **subnets are Availability Zone-scoped**. All four SOCForge subnets are provisioned within a single Availability Zone selected dynamically at runtime via `data.aws_availability_zones.available.names[0]`.

### Why a Single Availability Zone?
* **Simplicity**: Eliminates cross-AZ routing complexities for training exercises.
* **Cost Efficiency**: Avoids AWS inter-AZ data transfer fees between the attack node, web server, endpoints, and SIEM indexer.
* **Compatibility**: Works transparently across all AWS accounts without assuming fixed AZ letter designations (e.g. `a`, `b`, `c`).

| Subnet Identifier | CIDR Block | Route Table | Tier | Auto-Assign Public IP |
| :--- | :--- | :--- | :--- | :--- |
| **`SOCForge-management`** | `10.10.1.0/24` | `SOCForge-public-rt` | Public | **Yes** |
| **`SOCForge-soc`** | `10.10.10.0/24` | `SOCForge-private-rt` | Private | **No** |
| **`SOCForge-attack`** | `10.10.20.0/24` | `SOCForge-private-rt` | Private | **No** |
| **`SOCForge-web`** | `10.10.30.0/24` | `SOCForge-private-rt` | Private | **No** |

---

## 3. Route Table Architecture

### Public Route Table (`SOCForge-public-rt`)
* **Associated Subnet**: `Management` (`10.10.1.0/24`)
* **Routes**:
  * `10.10.0.0/16` -> `local` (Default VPC route for inter-subnet communication)
  * `0.0.0.0/0` -> `SOCForge-igw` (Internet Gateway)
* **Behavior**: Allows future bastion hosts in the Management subnet to receive operator connections and access the external internet.

### Private Route Table (`SOCForge-private-rt`)
* **Associated Subnets**: `SOC` (`10.10.10.0/24`), `Attack` (`10.10.20.0/24`), `Web` (`10.10.30.0/24`)
* **Routes**:
  * `10.10.0.0/16` -> `local`
* **Behavior**: Subnets communicate freely with each other via private IPs (`10.10.x.x`) but cannot be reached directly from the Internet.

---

## 4. Security Principles

1. **Zero Unsolicited Public Exposure**:
   * Vulnerable applications (DVWA, Juice Shop) and the Wazuh SIEM core reside in private subnets and never receive public IPs.
2. **Private IP Inter-Communication**:
   * All log forwarding, agent registration, and attack emulation traffic traverse internal private IP addresses (`10.10.x.x`).
3. **No NAT Gateway in Phase 2**:
   * Omitted to minimize AWS running costs during initial lab setup.
4. **Least Privilege Security Groups**:
   * Granular stateful firewall rules will be implemented in Phase 3.

---

## 5. Traffic Flow Classification

```text
+-----------------------+-----------------------+-----------------------+-----------------------+
|  Management Traffic   |   Telemetry Traffic   |  Application Traffic  |    Attack Traffic     |
+-----------------------+-----------------------+-----------------------+-----------------------+
| Operator Ingress      | Agent (Port 1514)     | HTTP (80/8000/3000)   | Controlled probes     |
| to Bastion via        | from Web & Windows to | from Attack node to   | from Attack subnet to |
| Management subnet     | Wazuh Manager         | Web applications      | targets               |
+-----------------------+-----------------------+-----------------------+-----------------------+
```
