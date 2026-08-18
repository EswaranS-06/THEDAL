# Lab 05: DVWA SQL Injection Investigation

---

## 1. Objective
Learn how to investigate a web application SQL injection attack using Nginx reverse proxy access logs, decode URL-encoded HTTP payloads, identify targeted backend query parameters, assess HTTP response status codes, and map the incident to MITRE ATT&CK.

---

## 2. Prerequisites
- Completed **Level 1 (Labs 01–04)**.
- Reviewed [Web Attack Investigation Runbook](file:///home/rex/Documents/Projects/docs/runbooks/web-attack-investigation.md).

---

## 3. Scenario
The SOC receives an alert indicating a potential SQL Injection attempt targeting the internal DVWA web application on port 8000. You must analyze the HTTP request to extract the attacker's IP, payload, target parameter, and determine if the database was compromised.

---

## 4. Attack / Event Generation
From the Linux Attack Host, execute the controlled DVWA SQL Injection test:

```bash
# Connect to Attack Host via Bastion
ssh -i ~/.ssh/socforge_key -o ProxyJump=ubuntu@<BASTION_PUBLIC_IP> ubuntu@10.10.20.114

# Execute DVWA SQLi test scenario
/usr/local/bin/run-web-test --scenario DVWA-03 --confirm
```

---

## 5. Expected Telemetry
- **Generating Host**: `SOCForge-web` (`10.10.30.148:8000`).
- **Telemetry Source**: Nginx Access Log (`/var/log/nginx/access.log`).
- **Target Index**: `socforge-nginx-access-*`.
- **Wazuh Detection Rule**: `100101` (Level 8: *SOCForge (DET-WEB-001): SQL Injection attempt detected against DVWA*).

---

## 6. Investigation Steps

1. **Open OpenSearch Dashboards**:
   - Navigate to **Dashboard** -> **SOCForge — Web Applications Investigation**.
2. **Review the Web Detections Panel**:
   - Verify that Alert `100101` appears in the alert stream.
3. **Drill Down in Discover**:
   - Switch to **Discover** and select index pattern: `socforge-nginx-access-*`.
   - Search for:
     ```text
     rule.id: "100101"
     ```
4. **Analyze the Request Fields**:
   - `data.srcip`: Identify the originating IP address.
   - `data.protocol`: Note the HTTP Method (`GET`).
   - `data.url`: Review the requested URI and payload parameters.
   - `data.id`: Check the HTTP status code returned by Nginx (`302 Found` or `200 OK`).

---

## 7. Investigative Questions
1. **What specific SQL injection string was sent in the query parameter?** (Decode `%27` and `%20`).
2. **What was the targeted URI path?**
3. **What was the source IP of the attacker?**
4. **What HTTP response code was returned by the web server?**
5. **What MITRE ATT&CK technique is associated with exploiting public web applications?**
6. **How would you differentiate an automated SQL scanner (like `sqlmap`) from a manual injection probe?**

---

## 8. Expected Findings & Solutions
- **Source IP**: `10.10.20.114` (Attack Host) or `10.10.1.131` (Bastion).
- **Target URI**: `/vulnerabilities/sqli/?id=1%27%20OR%20%271%27=%271&Submit=Submit`
- **Decoded Payload**: `id=1' OR '1'='1` (Classic tautology payload designed to return all records).
- **HTTP Response**: `302 Found` (Application redirected authenticated session or returned query results).
- **Tool Differentiation**: Automated tools like `sqlmap` typically send dozens of requests per second with recognizable User-Agent strings (`User-Agent: sqlmap/1.7`) and boolean/time-delay payloads (`BENCHMARK()`, `SLEEP()`).

---

## 9. MITRE ATT&CK Mapping
- **Tactic**: Initial Access (`TA0001`)
- **Technique**: Exploit Public-Facing Application (`T1190`)

---

## 10. Conclusion & Cleanup
- **Conclusion**: The SIEM successfully identified and classified the SQL injection attack against Nginx access logs, correctly mapping the payload to Rule `100101`.
- **Cleanup**: No cleanup required.
