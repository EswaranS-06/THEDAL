# SOC Runbook: OWASP Juice Shop & Container API Investigation

---

## 1. Overview & Trigger Conditions
This runbook guides investigations of containerized REST API probing, database exceptions, and authentication abuse targeting OWASP Juice Shop on the Web Target (`10.10.30.148:3000`), including:
- API User & Config Enumeration (`DET-JS-001` / Rule `100201`)
- Multiple API Failed Logins (`DET-JS-002` / Rule `100202`)
- REST API SQL/NoSQL Injection (`DET-JS-003` / Rule `100203`)
- Sensitive Directory & Asset Probing (`DET-JS-004` / Rule `100204`)
- Application Database Error & Stack Trace Exposure (`DET-JS-005` / Rule `100205`)

---

## 2. Container Architecture vs. Traditional Web Servers
Unlike DVWA (which runs directly on Nginx + PHP-FPM on the host OS), OWASP Juice Shop runs inside a **Docker container** (`bkimminich/juice-shop`).
- **Telemetry Origin**: Container stdout/stderr JSON log files (`/var/lib/docker/containers/*/*-json.log`).
- **Log Collection**: Wazuh Agent on `10.10.30.148` monitors Docker container log paths directly.
- **SIEM Processing**: Wazuh decodes JSON messages using the custom `socforge-juice-shop` decoder.

---

## 3. Investigation Querying & Dashboards

- **Primary OpenSearch Index**: `socforge-juice-shop-*` (or fallback `wazuh-alerts-*`)
- **Recommended Dashboard**: **SOCForge — Web Applications Investigation**

### Useful OpenSearch Queries
```text
# Search for all Juice Shop container alerts
rule.groups: "socforge_juice_shop"

# Search for API enumeration attempts
rule.id: "100201" OR full_log: (*authentication-details* OR *Users* OR *rest/admin*)

# Search for backend database stack traces
rule.id: "100205" OR full_log: (*SequelizeDatabaseError* OR *SQLITE_ERROR* OR *SyntaxError*)
```

---

## 4. Key Evidence Fields to Evaluate

| Field Name | Description | Key Indicators |
| :--- | :--- | :--- |
| `location` | Monitored log file | `/var/lib/docker/containers/...-json.log` |
| `full_log` | Complete container log string | HTTP request URL, response status, Sequelize exception |
| `rule.id` | Wazuh Rule ID | `100201`..`100205` |
| `rule.description` | Human-readable alert summary | Detection description and category |

---

## 5. Investigating Application Errors & Stack Traces
When investigating Rule `100205` (Database Error Exposure):
1. Review the `full_log` field for the exact SQL/NoSQL query that triggered the exception.
2. Note whether the backend exposed internal database schema details (`SQLITE_ERROR: near "'": syntax error`).
3. Differentiate benign user typos from deliberate SQL injection payloads (`' UNION SELECT 1,2,3--`).

---

## 6. What to Document in the Incident Report
- Targeted API endpoint (e.g. `/rest/user/authentication-details`, `/rest/products/search`).
- Observed payload or HTTP parameters.
- Backend error messages or exposed sensitive data.
- Associated MITRE ATT&CK Techniques (`T1087` - Account Discovery, `T1190` - Exploit Public-Facing App, `T1592.002` - Software Discovery).
- Recommendation (Implement strict input validation on REST endpoints, disable verbose error messages in production).
