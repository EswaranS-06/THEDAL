# SOCForge — Logging & Telemetry Architecture

> **Notice**: This document defines the **logging architecture and data pipeline** for SOCForge. Logging is a first-class citizen in SOCForge. The index patterns and forwarding pipelines described here will be implemented in subsequent phases without breaking Wazuh's native indexing and alerting mechanisms.

---

## 1. Architectural Philosophy

A realistic SOC training environment requires **high-fidelity, segmented, and searchable telemetry**. Rather than aggregating all events indiscriminately into a single monolithic store, SOCForge logically isolates telemetry into dedicated index streams while simultaneously feeding Wazuh's real-time detection engine.

### Preserving Wazuh Native Capabilities
* Wazuh's built-in indices (e.g. `wazuh-alerts-*`, `wazuh-archives-*`, `wazuh-monitoring-*`) remain intact and operate according to standard Wazuh Indexer / OpenSearch schemas.
* Custom log streams and agent forwarding channels extend the core Wazuh architecture without interfering with built-in rule evaluation or agent communication.

---

## 2. Logical Log Groups & Index Patterns

The target logging pipeline organizes telemetry into dedicated logical index patterns:

| Logical Log Stream | Target Index Pattern | Telemetry Source | Description |
| :--- | :--- | :--- | :--- |
| **Windows System Logs** | `soc-windows-*` | Windows Server / Client | Windows Security (Event ID 4624, 4625, 4688), System, Application, and PowerShell (4104) event channels. |
| **Sysmon Telemetry** | `soc-sysmon-*` | Microsoft Sysmon | Detailed process creation, network connections, file creation time changes, driver loads, and named pipes. |
| **Nginx Access Logs** | `soc-nginx-access-*` | Nginx Reverse Proxy | HTTP request paths, client IP addresses, user agents, response codes, referrers, and upstream latency. |
| **Nginx Error Logs** | `soc-nginx-error-*` | Nginx Reverse Proxy | Upstream connection failures, 4xx/5xx application errors, and potential exploit payload artifacts. |
| **Juice Shop Logs** | `soc-juiceshop-*` | OWASP Juice Shop Container | Docker container stdout/stderr, API request handling, authentication attempts, and shopping cart transactions. |
| **Attack Simulation** | `soc-atomic-*` | Atomic Red Team Runner | Execution metadata, test invocation timestamps, executed command strings, and MITRE ATT&CK technique IDs. |
| **SIEM Alerts** | `wazuh-alerts-*` | Wazuh Manager Engine | Triggered detection rules, decoded alert fields, rule levels (1–15), and MITRE ATT&CK tactical tags. |

---

## 3. The End-to-End Investigation Lifecycle

SOCForge enables analysts to trace a complete attack thread from initial external web interaction through endpoint execution, SIEM alert generation, and root-cause analysis:

```text
       +-------------------------------------------------------------+
       |                        Web Request                          |
       |  Attacker sends malicious HTTP payload (e.g. SQLi / RCE)    |
       +------------------------------+------------------------------+
                                      |
                                      v
       +-------------------------------------------------------------+
       |                     Application Event                       |
       |  Nginx logs request; container records execution anomaly    |
       +------------------------------+------------------------------+
                                      |
                                      v
       +-------------------------------------------------------------+
       |                    Endpoint Telemetry                       |
       |  Sysmon / Auditd captures spawned subprocess & file write   |
       +------------------------------+------------------------------+
                                      |
                                      v
       +-------------------------------------------------------------+
       |                        Wazuh Event                          |
       |  Wazuh Agent forwards event to Wazuh Manager (Port 1514)    |
       +------------------------------+------------------------------+
                                      |
                                      v
       +-------------------------------------------------------------+
       |                         Detection                           |
       |  Decoders parse fields; Rule engine matches threat pattern  |
       +------------------------------+------------------------------+
                                      |
                                      v
       +-------------------------------------------------------------+
       |                           Alert                             |
       |  Alert generated in `wazuh-alerts-*` with MITRE ATT&CK ID   |
       +------------------------------+------------------------------+
                                      |
                                      v
       +-------------------------------------------------------------+
       |                        Investigation                        |
       |  Analyst triages alert, pivots across `soc-*` indices,      |
       |  reconstructs process tree, and confirms incident scope     |
       +-------------------------------------------------------------+
```

---

## 4. Key Event Attributes for Correlation

When developing detection rules and conducting forensic triage, analysts cross-reference these common schema fields across log streams:

* `@timestamp` (ISO 8601 UTC timestamp for chronological alignment)
* `agent.id` / `agent.name` (Unique host identifier)
* `src_ip` / `dst_ip` (Network source and destination addresses)
* `src_port` / `dst_port` (Network communication ports)
* `user.name` / `user.domain` (Subject executing the activity)
* `process.pid` / `process.ppid` (Process ID and Parent Process ID for tree building)
* `process.name` / `process.command_line` (Full executable name and arguments)
* `file.path` / `file.hash.sha256` (Target file path and cryptographic hash)
* `rule.mitre.id` / `rule.mitre.tactic` (ATT&CK technique e.g. `T1059.001` - PowerShell)

---

## 5. Implementation Roadmap (Subsequent Phases)

1. **Phase 3**: Configure Wazuh Agents on Linux and Windows instances with targeted `<localfile>` and Sysmon event channel subscriptions.
2. **Phase 4**: Setup log pipelines and ingestion configurations for custom Nginx, Juice Shop, and Atomic Red Team log paths.
3. **Phase 5**: Create custom Wazuh decoders (`/var/ossec/etc/decoders/local_decoder.xml`) and rules (`/var/ossec/etc/rules/local_rules.xml`) correlating multi-stage attack scenarios.
