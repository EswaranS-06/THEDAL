# Lab 07: DVWA Local File Inclusion (LFI) & Path Traversal

---

## 1. Objective
Learn how to detect and investigate Path Traversal and Local File Inclusion (LFI) attempts in web server access logs, analyze URL-encoded directory escape sequences, assess web server responses, and evaluate unauthorized file access risks.

---

## 2. Prerequisites
- Completed **Labs 05 and 06**.
- Reviewed [Web Attack Investigation Runbook](file:///home/rex/Documents/Projects/docs/runbooks/web-attack-investigation.md).

---

## 3. Scenario
An external scanner attempts to read arbitrary files from the Linux Web Target by manipulating the `page` parameter on DVWA (`/vulnerabilities/fi/?page=...`). As a SOC analyst, you must evaluate the request to determine what file was targeted and whether sensitive system files were exposed.

---

## 4. Attack / Event Generation
From the Linux Attack Host, execute the controlled LFI scenario:

```bash
# Connect to Attack Host via Bastion
ssh -i ~/.ssh/socforge_key -o ProxyJump=ubuntu@<BASTION_PUBLIC_IP> ubuntu@10.10.20.114

# Execute DVWA LFI test scenario
/usr/local/bin/run-web-test --scenario DVWA-05 --confirm
```

---

## 5. Expected Telemetry
- **Generating Host**: `SOCForge-web` (`10.10.30.148:8000`).
- **Telemetry Source**: Nginx Access Log (`/var/log/nginx/access.log`).
- **Target Index**: `socforge-nginx-access-*`.
- **Wazuh Detection Rule**: `100103` (Level 7: *SOCForge (DET-WEB-003): Path traversal / LFI probe detected against DVWA*).

---

## 6. Investigation Steps

1. **Search Nginx Access Logs in Discover**:
   - In OpenSearch Dashboards Discover, select index pattern: `socforge-nginx-access-*`.
   - Search for:
     ```text
     rule.id: "100103"
     ```
2. **Examine the Traversal String**:
   - Look at `data.url`.
   - Identify the traversal sequence (e.g. `../../../../../../etc/passwd`).
3. **Assess the HTTP Status & Response Size**:
   - Check `data.id` (HTTP Status Code) and `data.protocol`.
   - Check whether Nginx returned a standard page response or redirected.

---

## 7. Investigative Questions
1. **What file was the attacker attempting to retrieve?**
2. **Why do attackers use `../` (dot-dot-slash) sequences in file inclusion vulnerabilities?**
3. **What sensitive information does `/etc/passwd` contain on a Linux system? Does it contain password hashes on modern Linux?**
4. **What evidence would distinguish an automated blind scan from successful data exfiltration?**
5. **How can web developers mitigate Local File Inclusion vulnerabilities in application code?**

---

## 8. Expected Findings & Solutions
- **Target File**: `/etc/passwd` (Linux system user account configuration file).
- **Directory Traversal Purpose**: `../` climbs up directory levels to break out of the intended web root (`/var/www/html/`) into root system directories.
- **Sensitive Data**: `/etc/passwd` lists all local user accounts, UIDs, GIDs, home directories, and login shells. It does **not** contain password hashes (which are stored in `/etc/shadow`), but provides invaluable user enumeration for lateral movement.
- **Remediation**: Use strict file whitelisting, avoid direct user input in `include()` or `require()` statements, and configure PHP `open_basedir` restrictions.

---

## 9. MITRE ATT&CK Mapping
- **Tactic**: Discovery (`TA0007`) / Initial Access (`TA0001`)
- **Technique**: File and Directory Discovery (`T1083`) / Exploit Public-Facing Application (`T1190`)

---

## 10. Conclusion & Cleanup
- **Conclusion**: You have successfully detected and analyzed a path traversal probe targeting DVWA, identifying the requested file and evaluating exposure risks.
- **Cleanup**: No cleanup required.
