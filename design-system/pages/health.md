# Page Specification: Health & Service Diagnostics

> **Route**: `/health`  
> **Purpose**: Deep-dive probing of all infrastructure tiers, SIEM cluster services, agent endpoints, and web applications.

---

## 1. Information Hierarchy

The Health Center provides granular visibility into all subsystems:
1. **Summary Scoreboard**: Overall status, total passing checks, warnings, and failures.
2. **Category Filters**: Instant filtering by category (`ALL`, `SYSTEM`, `INFRASTRUCTURE`, `COMPUTE`, `SECURITY`).
3. **Diagnostic List**: Detailed check items with component name, status badge, output message, and optional remediation details.

---

## 2. Page Layout Structure

```text
+-----------------------------------------------------------------------------------+
| Page Header: System Health Diagnostics + [Run Health Probes] Action Button        |
+-----------------------------------------------------------------------------------+
| 4-Column Summary Cards:                                                           |
| [ Overall Status ] [ Passing Checks ] [ Warnings / Degraded ] [ Failures / Down ] |
+-----------------------------------------------------------------------------------+
| Filter Tabs: [ ALL ] [ SYSTEM ] [ INFRASTRUCTURE ] [ COMPUTE ]                    |
+-----------------------------------------------------------------------------------+
| Diagnostic Probes List:                                                           |
| [ Component Name + Category Tag + Status Badge ]                                  |
| [ Monospace Output / Diagnostic Message ]                                         |
| [ Remediation Guidance (when status != PASS) ]                                    |
+-----------------------------------------------------------------------------------+
```

---

## 3. Interaction & Execution
* Trigger on-demand diagnostic probe execution via `/api/health`.
* Display spinning indicator during probe execution with toast notification upon completion.
* Dynamic category calculation from backend checks list.
