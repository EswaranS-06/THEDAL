# SOC Runbook: Authentication Failure & Privilege Escalation Investigation

---

## 1. Overview & Trigger Conditions
This runbook guides investigations of authentication anomalies, brute-force attempts, and unauthorized privilege escalation across both Windows and Linux endpoints:
- Linux Sudo Privilege Escalation Failure (`DET-LNX-002` / Rule `100502`)
- Multiple Linux SSH / PAM Authentication Failures (`socforge-linux-auth-*`)
- Windows Failed Logons (Event ID `4625` in `socforge-windows-security-*`)
- Multi-Source Authentication Failure Followed by Success (`DET-COR-003` / Rule `100603`)

---

## 2. Initial Triage: What to Check First
1. **Target Asset**: Did the failure occur on `10.10.10.254` (Windows), `10.10.30.148` (Web), `10.10.10.33` (SIEM), or `10.10.1.131` (Bastion)?
2. **Frequency & Volume**: Was it an isolated single failure (e.g. user typo) or a high-velocity burst (password spray / brute-force)?
3. **Target Username**: Was the target `root`, `Administrator`, `ubuntu`, `www-data`, or an unknown user?
4. **Did a successful login immediately follow the burst?** (Indicates compromised credentials).

---

## 3. Investigation Querying & Dashboards

- **Primary OpenSearch Indices**: `socforge-linux-auth-*`, `socforge-windows-security-*`
- **Secondary OpenSearch Index**: `wazuh-alerts-*`
- **Recommended Dashboard**: **SOCForge — Security Operations Overview**

### Useful OpenSearch Queries
```text
# Search for Linux sudo failure alerts
rule.id: "100502" OR data.program_name: "sudo" AND data.status: "FAILURE"

# Search for Windows failed logon events (4625)
data.win.system.eventID: "4625" AND data.win.system.channel: "Security"

# Search for brute-force or authentication compromise rules
rule.groups: (*authentication_failed* OR *bruteforce* OR *privilege_escalation*)
```

---

## 4. Key Evidence Fields to Evaluate

| Field Name | Description | Key Indicators |
| :--- | :--- | :--- |
| `data.srcuser` / `data.win.eventdata.targetUserName` | Account targeted | `root`, `Administrator`, `admin`, invalid usernames |
| `data.srcip` / `data.win.eventdata.ipAddress` | Source IP | Bastion (`10.10.1.131`), Attack Host (`10.10.20.114`) |
| `data.program_name` | Subsystem | `sudo`, `sshd`, `su`, `pam_unix` |
| `data.win.eventdata.subStatus` | Windows Failure Code | `0xC000006A` (Bad Password), `0xC0000064` (User Not Found) |

---

## 5. Distinguishing True Positives from False Positives

- **True Positive (TP)**:
  - More than 5 failed logon attempts within 60 seconds targeting administrative accounts (`root`, `Administrator`, `admin`).
  - Sudo command execution attempts from service accounts (e.g. `www-data` attempting `sudo -l` or `sudo su`).
  - Multiple failed logins followed immediately by a successful authentication from the same IP (potential password spray success).
- **False Positive (FP)**:
  - 1–2 isolated failed logins followed by a successful login during standard business hours (typical user password mistype).

---

## 6. What to Document in the Incident Report
- Target Host and monitored subsystem (`sshd`, `sudo`, Windows Security).
- Target username(s) and Source IP.
- Total failure count, time span, and velocity.
- Whether subsequent access was achieved.
- Associated MITRE ATT&CK Techniques (`T1110.001` - Password Guessing, `T1548.003` - Sudo and Sudoers).
- Containment actions (Account lock, IP block, credential reset).
