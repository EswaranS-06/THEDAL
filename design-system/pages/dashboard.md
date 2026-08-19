# Page Specification: Overview (Dashboard)

> **Route**: `/`  
> **Purpose**: Immediate high-level situational awareness and quick operator control.

---

## 1. Information Hierarchy & Operator Answers

The Overview page must immediately answer:
1. **Is THEDAL healthy?** → Global Health Capsule & Top Status Cards.
2. **Is AWS connected?** → AWS Authentication Card (Account, Region, STS status).
3. **Is infrastructure running?** → Terraform state & active EC2 compute counts.
4. **Is Wazuh healthy?** → Wazuh SIEM status & direct Tunnel launch action.
5. **Are endpoints connected?** → Monitored compute fleet node cards.
6. **What needs attention?** → Diagnostics & component health table.

---

## 2. Page Layout Structure

```text
+-----------------------------------------------------------------------------------+
| Page Header: THEDAL Overview + Quick Actions (Open Wazuh UI, Refresh)              |
+-----------------------------------------------------------------------------------+
| 4-Column Status Grid:                                                             |
| [ AWS Auth & Region ] [ Terraform State ] [ EC2 Compute Fleet ] [ System Health ] |
+-----------------------------------------------------------------------------------+
| Monitored Compute Fleet Grid (5 Cards: Bastion, Wazuh, Windows, Web, Attack)      |
+-----------------------------------------------------------------------------------+
| 2-Column Split:                                                                   |
| [ Quick Operational Actions (Deploy, Start, Stop, Health) ] | [ Recent Audit Logs ] |
+-----------------------------------------------------------------------------------+
| Diagnostics & Component Health Table                                              |
+-----------------------------------------------------------------------------------+
```

---

## 3. Visual Components & Data Binding

* **Status Metric Cards**:
  - `AWS Connection`: Region (`ap-south-1`), Masked Account ID, Status Badge (`CONNECTED` / `OFFLINE`).
  - `Terraform State`: Resource count, Status Badge (`DEPLOYED` / `READY` / `DEGRADED`).
  - `EC2 Fleet`: Active / Total count (`5/5 ACTIVE`), Zero NAT status.
  - `System Health`: Overall health badge (`HEALTHY` / `DEGRADED`).
* **Node Cards**:
  - State badge (`running` = green, `stopped` = amber, `terminated` = red).
  - Role subtitle, Private IP (monospace), Instance Type (monospace).
* **Quick Actions Panel**:
  - Direct operator triggers for Start/Stop, Health Check, and Wazuh Tunnel.
* **Diagnostics Table**:
  - Component, Status, Message / Check details.

---

## 4. Interaction & Refresh Semantics
* Auto-polling status every 12 seconds via `/api/status`.
* Real-time DOM updates for status badges without full-page flash.
* Zero fake progress or decorative animations.
