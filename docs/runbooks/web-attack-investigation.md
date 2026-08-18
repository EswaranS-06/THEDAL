# SOC Runbook: Web Application Attack Investigation (Nginx & DVWA)

---

## 1. Overview & Trigger Conditions
This runbook guides analysts through investigating web attacks targeting Nginx and Damn Vulnerable Web Application (DVWA) on the Linux Web Target (`10.10.30.148:8000`), including:
- SQL Injection (`DET-WEB-001` / Rule `100101`)
- Web Command Injection (`DET-WEB-002` / Rule `100102`)
- Path Traversal / Local File Inclusion (`DET-WEB-003` / Rule `100103`)
- Web Shell / Executable File Upload (`DET-WEB-004` / Rule `100104`)
- Automated Security Scanners & Fuzzing (`DET-NGX-001..003` / Rules `100301..100303`)

---

## 2. Initial Triage: What to Check First
1. **Source IP Address**: Is the request coming from the Attack Host (`10.10.20.114`) or an unknown IP?
2. **Target URI & Parameters**: What endpoint was targeted (`/vulnerabilities/sqli/`, `/vulnerabilities/exec/`, `/vulnerabilities/fi/`)?
3. **HTTP Response Status Code**:
   - `200 OK` / `302 Found`: The application processed the request.
   - `403 Forbidden` / `404 Not Found`: The resource or request was blocked / not present.
   - `500 Internal Server Error`: Application crashed or threw an unhandled SQL exception.
4. **Did the web exploit trigger backend host execution?** (Cross-reference `socforge-auditd-*`).

---

## 3. Investigation Querying & Dashboards

- **Primary OpenSearch Index**: `socforge-nginx-access-*`
- **Secondary OpenSearch Indices**: `socforge-nginx-error-*`, `socforge-auditd-*`, `socforge-linux-auth-*`
- **Recommended Dashboard**: **SOCForge — Web Applications Investigation**

### Useful OpenSearch Queries
```text
# Search for all web attack detection rules
rule.groups: "socforge_web" OR rule.id: (100101 OR 100102 OR 100103 OR 100104)

# Search for SQL injection patterns in Nginx logs
data.url: (*UNION* OR *SELECT* OR *%27* OR *OR%201=1*)

# Search for command injection sequences
data.url: (*%3B* OR *%7C* OR *whoami* OR *cat%20/etc/passwd*)
```

---

## 4. Key Evidence Fields to Evaluate

| Field Name | Description | Key Indicators |
| :--- | :--- | :--- |
| `data.srcip` | Client IP address | Attack Subnet (`10.10.20.114`) or external IP |
| `data.protocol` | HTTP Method | `GET`, `POST`, `OPTIONS`, `PUT` |
| `data.url` | Full Request URI | Attack payloads (`' OR 1=1`, `../etc/passwd`, `;id`) |
| `data.id` | HTTP Status Code | `200`, `302`, `404`, `500` |
| `data.agent` | User-Agent Header | `sqlmap`, `nikto`, `curl`, standard browser |

---

## 5. Correlating Web Exploits to Linux System Telemetry
When investigating Command Injection (`DET-WEB-002`), always check `socforge-auditd-*` on `10.10.30.148`:
1. Search for `data.audit.euid: "33"` (the `www-data` web server account).
2. Check `data.audit.exe` for utility execution (`/usr/bin/whoami`, `/bin/uname`, `/bin/cat`, `/bin/bash`).
3. If an audit log matches the timestamp of the Nginx web request, confirm a **True Positive Remote Code Execution (RCE)** compromise.

---

## 6. What to Document in the Incident Report
- Source IP and User-Agent string.
- Target URL and full unencoded payload.
- HTTP response code returned by Nginx.
- Impact assessment: Was backend command execution achieved?
- MITRE ATT&CK Mapping (`T1190` - Exploit Public-Facing App, `T1059.004` - Unix Shell, `T1083` - File Discovery).
- Remediation guidance (input validation, parameterization, WAF rules).
