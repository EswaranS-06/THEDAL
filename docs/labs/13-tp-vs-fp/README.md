# Lab 13: True Positive (TP) vs. False Positive (FP) Analysis

---

## 1. Objective
Learn how professional SOC analysts distinguish between True Positives (genuine attacks requiring containment) and False Positives (benign administrative actions or benign user errors), evaluate contextual indicators, and tune detection logic to minimize alert fatigue.

---

## 2. Prerequisites
- Completed **Labs 01–12**.
- Reviewed [SOC Triage Checklist](file:///home/rex/Documents/Projects/docs/templates/triage-checklist.md).

---

## 3. Scenario & Comparative Pairs
You will analyze three distinct paired scenarios where similar surface-level activity occurs, but one case is benign and the other is an active attack.

---

## 4. Paired Investigation Scenarios

### Pair 1: PowerShell Administrative Maintenance vs. Download Cradle
- **Case A (Benign / FP)**:
  - Command: `powershell.exe -ExecutionPolicy RemoteSigned -File C:\Scripts\BackupLogs.ps1`
  - Parent: `taskeng.exe` (Windows Task Scheduler).
  - User: `NT AUTHORITY\SYSTEM`.
  - Classification: **False Positive / Benign System Task**.
- **Case B (Malicious / TP)**:
  - Command: `powershell.exe -nop -w hidden -ep bypass -enc IABFAFgAIAA...`
  - Parent: `WINWORD.EXE` (Microsoft Word).
  - User: `WORKGROUP\Administrator`.
  - Classification: **True Positive / Malicious Macro Execution**.

---

### Pair 2: Web 404 User Typo vs. Directory Fuzzing Scanner
- **Case A (Benign / FP)**:
  - Single HTTP request to `http://10.10.30.148:8000/favicon.ico` returning `404 Not Found`.
  - User-Agent: Standard Chrome web browser.
  - Classification: **Benign / Normal Web Traffic**.
- **Case B (Malicious / TP)**:
  - 150 HTTP requests in 5 seconds targeting `/admin/`, `/config.bak/`, `/.git/`, `/test.php` returning `404 Not Found`.
  - User-Agent: `gobuster/3.1` or `nikto/2.1.6`.
  - Classification: **True Positive / Automated Directory Reconnaissance**.

---

### Pair 3: REST API Valid Query vs. Blind SQL Injection
- **Case A (Benign / FP)**:
  - Request: `GET /rest/products/search?q=apple` returning `200 OK`.
  - Classification: **Benign / Legitimate Customer Search**.
- **Case B (Malicious / TP)**:
  - Request: `GET /rest/products/search?q='))%20UNION%20SELECT%201,2,3--` returning `500 Internal Error` with Sequelize stack trace.
  - Classification: **True Positive / Active API Injection Attempt**.

---

## 5. Decision Matrix: How to Classify Alerts

```text
                                  [ Incoming Alert ]
                                          │
                                          ▼
                      [ Is the parent process anomalous? ]
                           ├── YES ──> HIGH PROBABILITY TP
                           └── NO
                                 │
                                 ▼
                     [ Are stealth / evasion flags used? ]
                           ├── YES ──> HIGH PROBABILITY TP
                           └── NO
                                 │
                                 ▼
                  [ Is the velocity abnormally high? (>10 req/s) ]
                           ├── YES ──> PROBABLE TP (Scanner / Brute-force)
                           └── NO
                                 │
                                 ▼
                      [ Does payload contain syntax exploits? ]
                           ├── YES ──> CONFIRMED TP
                           └── NO  ──> FALSE POSITIVE / BENIGN
```

---

## 6. Investigative Exercises
For each of the following scenarios, classify as **TRUE POSITIVE** or **FALSE POSITIVE** and justify your reasoning:

1. **Scenario 1**: `whoami.exe` executed on Windows endpoint at 03:00 AM by `SYSTEM` with parent `svchost.exe`.
2. **Scenario 2**: `whoami.exe` executed on Windows endpoint at 02:15 PM by `Administrator` with parent `WINWORD.EXE`.
3. **Scenario 3**: 1 failed login attempt for user `jdoe` on Linux SSH followed immediately by successful login with SSH key.
4. **Scenario 4**: 45 failed login attempts for `admin`, `root`, `test`, `guest` on Linux SSH in 12 seconds from external IP `198.51.100.44`.

---

## 7. Expected Answers & Tuning Recommendations
1. **Scenario 1**: **FALSE POSITIVE / Benign**. Windows services periodically execute identity verification tasks.
2. **Scenario 2**: **TRUE POSITIVE**. Microsoft Word spawning command-line utilities indicates phishing document / malicious macro exploitation (`T1059.003`).
3. **Scenario 3**: **FALSE POSITIVE**. Routine human password typo.
4. **Scenario 4**: **TRUE POSITIVE**. Automated SSH brute-force dictionary attack (`T1110.001`). Immediate IP block recommended.

---

## 8. Conclusion
- **Conclusion**: Understanding context (parent process, user, execution velocity, time of day) is the cornerstone of accurate alert triage and prevents alert fatigue.
