# Lab 08: OWASP Juice Shop Container & REST API Investigation

---

## 1. Objective
Learn how to investigate containerized application telemetry by analyzing Docker JSON container logs forwarded to Wazuh, detecting REST API enumeration, analyzing backend database errors/stack traces, and comparing container telemetry architectures with traditional web server logs.

---

## 2. Prerequisites
- Completed **Labs 05–07**.
- Reviewed [Juice Shop Investigation Runbook](file:///home/rex/Documents/Projects/docs/runbooks/juice-shop-investigation.md).

---

## 3. Scenario
An adversary performs reconnaissance against the containerized OWASP Juice Shop application running on port 3000, querying administrative endpoints and triggering backend database exceptions. You must investigate the container log stream to identify the probed endpoints and exposed data.

---

## 4. Attack / Event Generation
From the Linux Attack Host, execute the Juice Shop API enumeration and error probing scenarios:

```bash
# Connect to Attack Host via Bastion
ssh -i ~/.ssh/socforge_key -o ProxyJump=ubuntu@<BASTION_PUBLIC_IP> ubuntu@10.10.20.114

# Execute API enumeration probe
/usr/local/bin/run-web-test --scenario JS-03 --confirm

# Execute backend database syntax error probe
/usr/local/bin/run-web-test --scenario JS-04 --confirm
```

---

## 5. Expected Telemetry
- **Generating Host**: `SOCForge-web` (`10.10.30.148:3000`).
- **Telemetry Source**: Docker container stdout/stderr log stream (`/var/lib/docker/containers/*/*-json.log`).
- **Target Index**: `socforge-juice-shop-*` (or fallback `wazuh-alerts-*`).
- **Wazuh Detection Rules**:
  - `100201` (Level 6: *SOCForge (DET-JS-001): Suspicious API user/configuration enumeration against Juice Shop*).
  - `100205` (Level 7: *SOCForge (DET-JS-005): Application database error or unhandled exception exposed in Juice Shop*).

---

## 6. Investigation Steps

1. **Search Container Logs in Discover**:
   - In OpenSearch Dashboards Discover, select: `wazuh-alerts-*` (or `socforge-juice-shop-*`).
   - Search for:
     ```text
     rule.groups: "socforge_juice_shop"
     ```
2. **Inspect API Enumeration**:
   - Filter for `rule.id: "100201"`.
   - Review `full_log` to observe the requested REST endpoints (`/rest/user/authentication-details`, `/api/Users`).
3. **Inspect Database Error Stack Traces**:
   - Filter for `rule.id: "100205"`.
   - Examine the Sequelize database error or SQLite syntax exception captured from the Node.js application.

---

## 7. Investigative Questions
1. **How does Docker container logging reach the Wazuh SIEM on SOCForge?**
2. **What specific REST API endpoints were enumerated?**
3. **What error message was returned in the container log during the syntax probing test?**
4. **Why are unhandled database exceptions and stack traces valuable to an attacker?**
5. **How does investigating containerized application logs differ from analyzing standard Nginx access logs?**

---

## 8. Expected Findings & Solutions
- **Logging Pipeline**: Docker writes stdout/stderr JSON logs to `/var/lib/docker/containers/<ID>/<ID>-json.log`. The Wazuh Agent reads these files directly and forwards them to Wazuh Manager, where the custom `socforge-juice-shop` decoder parses the event.
- **Enumerated Endpoints**: `/rest/user/authentication-details`, `/api/Users`.
- **Database Error**: `SequelizeDatabaseError: SQLITE_ERROR: near "'": syntax error` (Exposing that the backend uses SQLite and Sequelize ORM).
- **Attacker Value**: Detailed stack traces reveal underlying technologies, database engines, table structures, and input handling flaws, facilitating targeted SQL/NoSQL injection.

---

## 9. MITRE ATT&CK Mapping
- **Tactic**: Discovery (`TA0007`) / Reconnaissance (`TA0043`)
- **Technique**: Account Discovery (`T1087`) / Software Discovery (`T1592.002`)

---

## 10. Conclusion & Cleanup
- **Conclusion**: You have successfully monitored, decoded, and analyzed containerized microservice REST API telemetry and database exception events in Wazuh.
- **Cleanup**: No cleanup required.
