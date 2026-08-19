# Page Specification: Infrastructure & Host Inventory

> **Route**: `/infrastructure` & `/infrastructure/[host]` & `/infrastructure/commands`  
> **Purpose**: Detailed inventory of AWS compute fleet, VPC subnets, individual host detail telemetry, and dynamic connection command center.

---

## 1. Information Hierarchy

1. **VPC & Subnet Topology**: VPC ID, CIDR block, region, availability zone, and 4 subnet segments (Management, SOC, Target, Attack).
2. **Compute Fleet Table**: Full EC2 instance inventory (Host Name, Role, State, Instance Type, Private IP, Public IP, Health).
3. **Host Detail Drawer / View (`/infrastructure/[host]`)**:
   - Host Identity & Metadata
   - Network configuration (Private/Public IPs, Subnet)
   - Running services (e.g., Wazuh Indexer/Manager/Dashboard, Nginx/DVWA/JuiceShop, Sysmon/WinRM, Atomic Red Team)
   - Recent operations & quick connection actions
4. **Dynamic Command Center (`/infrastructure/commands`)**:
   - Bastion SSH, Wazuh SSH, Web SSH, Attack SSH, Windows WinRM/RDP, Wazuh Dashboard Tunnel, Ansible ProxyJump.
   - All IPs dynamically derived from live Terraform/AWS state with one-click copy.

---

## 2. Page Layout Structure

```text
+-----------------------------------------------------------------------------------+
| Page Header: Infrastructure & Fleet Inventory + Search/Filter + [Commands]        |
+-----------------------------------------------------------------------------------+
| VPC & Network Overview Bar (VPC ID, CIDR, Region, AZ, Subnet Counts)             |
+-----------------------------------------------------------------------------------+
| Full-Width Compute Fleet Data Table (Host, Role, State, Type, IPs, Health)        |
+-----------------------------------------------------------------------------------+
| 2-Column Split:                                                                   |
| [ Subnet Routing Table ] | [ Cloud Architecture & Cost Advisory Panel ]           |
+-----------------------------------------------------------------------------------+
```

---

## 3. Data Tables & Components

* **Compute Table**:
  - Filterable by status (`Running`, `Stopped`, `All`) and search by host name/role.
  - Monospace font for IPs, IDs, and instance types.
  - Interactive row click navigates to `/infrastructure/[host]`.
* **Host Detail View**:
  - Structured cards for Identity, Network, Service Matrix, and Direct Commands.
* **Command Center**:
  - High-contrast code blocks with copy confirmation toast.
