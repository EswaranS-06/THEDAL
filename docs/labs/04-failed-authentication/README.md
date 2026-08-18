# Lab 04: Authentication Telemetry & Brute-Force Triage

---

## 1. Objective
Learn how to investigate authentication events, differentiate between isolated user login errors and high-volume brute-force attacks, analyze Linux PAM/sudo logs and Windows Event 4625 records, and establish alerting thresholds.

---

## 2. Prerequisites
- Completed **Labs 01–03**.
- Reviewed [Authentication Investigation Runbook](file:///home/rex/Documents/Projects/docs/runbooks/authentication-investigation.md).

---

## 3. Scenario
The SOC monitoring team receives an alert regarding authentication failures. You need to determine whether the failure represents an innocent user typing an incorrect password or an adversary attempting credential stuffing/brute-force exploitation.

---

## 4. Attack / Event Generation
Generate controlled authentication failures on the Linux Web Target and OWASP Juice Shop API:

```bash
# 1. Generate Sudo authentication failure on Web Target
ssh -i ~/.ssh/socforge_key -o ProxyJump=ubuntu@<BASTION_PUBLIC_IP> ubuntu@10.10.30.148 '
echo "wrong_pass_attempt" | sudo -S whoami 2>/dev/null || true
'

# 2. Generate burst of failed REST API logins on Juice Shop (Port 3000) from Attack Host
ssh -i ~/.ssh/socforge_key -o ProxyJump=ubuntu@<BASTION_PUBLIC_IP> ubuntu@10.10.20.114 '
/usr/local/bin/run-web-test --scenario JS-02 --confirm
'
```

---

## 5. Expected Telemetry
- **Generating Hosts**: `SOCForge-web` (`10.10.30.148`).
- **Telemetry Sources**: Linux `/var/log/auth.log` (Sudo) and Docker JSON logs (Juice Shop API).
- **Target Indices**: `socforge-linux-auth-*` and `socforge-juice-shop-*`.
- **Wazuh Detection Rules**:
  - `100502` (Level 8: *Sudo privilege escalation failure or unauthorized sudo attempt*).
  - `100202` (Level 8: *Multiple failed login attempts detected on Juice Shop API*).

---

## 6. Investigation Steps

1. **Investigate Linux Sudo Failures**:
   - In OpenSearch Dashboards Discover, select: `socforge-linux-auth-*`.
   - Search for:
     ```text
     data.program_name: "sudo"
     ```
   - Identify `data.srcuser`, `data.dstuser`, and failure message.
2. **Investigate REST API Brute-Force Burst**:
   - In Discover, select: `socforge-juice-shop-*` (or `wazuh-alerts-*`).
   - Search for:
     ```text
     rule.id: "100202" OR full_log: *rest/user/login*
     ```
   - Look at the count of failed login events occurring within a 60-second window.

---

## 7. Investigative Questions
1. **What username was targeted during the sudo failure?**
2. **How many failed login attempts occurred on the Juice Shop REST API within the 60-second window?**
3. **What is the difference between a single authentication failure and an automated brute-force burst?**
4. **What threshold (e.g. 5 failures in 60s) would you configure to minimize false positives while detecting brute-force attacks?**
5. **If a successful login (HTTP 200 / Token Issued) occurs immediately after 10 failed attempts from the same IP, what does that indicate?**

---

## 8. Expected Findings & Solutions
- **Sudo Target**: User `ubuntu` (or `root`).
- **Juice Shop Burst**: Multiple rapid POST requests to `/rest/user/login` returning HTTP 401 Unauthorized.
- **Analysis**: A single failure is typically a human typo (Benign / Low Severity). A high-velocity burst (5+ failures in < 60s) represents credential stuffing or dictionary attacks (True Positive / High Severity).
- **Multi-Source Threat**: Multiple failures followed immediately by success indicates **credential compromise** (Triggering Correlation Rule `100603`).

---

## 9. MITRE ATT&CK Mapping
- **Tactic**: Credential Access (`TA0006`) / Privilege Escalation (`TA0004`)
- **Technique**: Brute Force: Password Guessing (`T1110.001`) / Sudo and Sudoers (`T1548.003`)

---

## 10. Conclusion & Cleanup
- **Conclusion**: You have successfully differentiated isolated authentication failures from automated brute-force attacks and verified detection rules across host and container logs.
- **Cleanup**: No cleanup required.
