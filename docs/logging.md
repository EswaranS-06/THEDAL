# SOCForge — Telemetry, Logging & Index Architecture

> **Phase 6 Status**: The Wazuh SIEM core (Indexer, Manager, Filebeat, Dashboard) is deployed. Alert ingestion uses standard Wazuh index streams. Application-specific index separation will be established in Phase 7 alongside endpoint agent rollouts.

---

## 1. Core SIEM Telemetry Flow

```text
Endpoints (Windows / Web / Attack) [Future Phase 7]
    |
    | (Wazuh Agent Protocol - TCP 1514 / TLS)
    v
Wazuh Manager (SOCForge-wazuh :1514)
    |
    | (Decoders, Rules & Threat Intelligence Evaluation)
    v
Alerts Buffer (/var/ossec/logs/alerts/alerts.json)
    |
    | (Filebeat Wazuh Module)
    v
Wazuh Indexer (OpenSearch Engine :9200)
    |
    | (Encrypted REST API)
    v
Wazuh Dashboard (HTTPS Web Interface :443)
```

---

## 2. Telemetry Ingestion Ports & Services

| Service | Port | Protocol | Purpose | Access Source |
| :--- | :--- | :--- | :--- | :--- |
| **Agent Event Telemetry** | `1514` | TCP / UDP | Wazuh agent event streaming | `windows-sg`, `web-sg`, `attack-sg` |
| **Agent Registration** | `1515` | TCP | Automated agent enrollment daemon | `windows-sg`, `web-sg`, `attack-sg` |
| **Wazuh REST API** | `55000` | HTTPS | SIEM management & dashboard integration | `management-sg` (Localhost/Bastion) |
| **Indexer REST API** | `9200` | HTTPS | OpenSearch distributed query engine | Localhost / Internal Filebeat |
| **Wazuh Dashboard** | `443` | HTTPS | Web visualization & SIEM investigation | SSH Port Forward (`localhost:8443`) |

---

## 3. Index Strategy: Phased Roadmap

* **Phase 6 (Current)**: Wazuh core platform indices:
  * `wazuh-alerts-4.x-*`: Evaluated security alerts and rule triggers.
  * `wazuh-monitoring-*`: Node and agent connectivity status events.
* **Phase 7 & 8 (Upcoming)**: Dedicated workload log indices:
  * `soc-windows-*`: Native Windows Event logs (Security, System, PowerShell).
  * `soc-sysmon-*`: Advanced endpoint telemetry (Process creation, Network connect, DLL loads).
  * `soc-nginx-access-*` / `soc-nginx-error-*`: Linux web target access and error logs.
  * `soc-juiceshop-*`: Application layer security and SQLi/XSS interaction logs.
  * `soc-atomic-*`: Adversary emulation execution telemetry.
