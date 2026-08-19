# Page Specification: Infrastructure (Resources)

> **Route**: `/resources`  
> **Purpose**: Detailed inventory of AWS compute, VPC subnets, routing, and cloud cost advisory.

---

## 1. Information Hierarchy

1. **Compute Fleet Table**: Complete inventory of all EC2 instances (Name, State, ID, Type, Private IP, Public IP, AZ, Role, Health).
2. **Compute Controls**: Safe operator controls (Start Nodes, Stop Nodes).
3. **Network & VPC Topology**: VPC ID, CIDR block, and table of all 4 subnets (Management, SOC, Target, Attack).
4. **AWS Cost Management Advisory**: Practical cost guidance (Zero NAT policy, single IPv4, EBS vs Compute billing).

---

## 2. Page Layout Structure

```text
+-----------------------------------------------------------------------------------+
| Page Header: Infrastructure & Cloud Assets + [Start Compute] [Stop Compute]       |
+-----------------------------------------------------------------------------------+
| Full-Width EC2 Virtual Machine Fleet Table (Monospace IPs, IDs, Types)            |
+-----------------------------------------------------------------------------------+
| 2-Column Split:                                                                   |
| [ VPC & Subnet Topology Table ] | [ AWS Resource & Cost Advisory Panel ]          |
+-----------------------------------------------------------------------------------+
```

---

## 3. Data Tables & Components

* **Compute Table**:
  - Columns: Host Name, Status, Instance ID, Type, Private IP, Public IP, Availability Zone, Role.
  - State badges with color + text (`RUNNING`, `STOPPED`, `TERMINATED`).
  - Empty state with guidance to deploy via Operations Console.
* **VPC Topology Table**:
  - Subnet Name, CIDR block, Subnet Type (`PUBLIC` / `PRIVATE`).
* **Cost Advisory Card**:
  - Bulleted points detailing zero-NAT design and EBS volume retention.
