# Lab 06: Web Command Injection & Linux System Telemetry Correlation

---

## 1. Objective
Learn how to investigate a critical web Remote Code Execution (RCE) attack by correlating Nginx HTTP access telemetry with host-level Linux `auditd` system call logs, demonstrating how application exploits lead to operating system process execution.

---

## 2. Prerequisites
- Completed **Lab 05**.
- Reviewed [Web Attack Investigation Runbook](file:///home/rex/Documents/Projects/docs/runbooks/web-attack-investigation.md) and [Attack-to-Telemetry Guide](file:///home/rex/Documents/Projects/docs/learning/attack-to-telemetry.md).

---

## 3. Scenario
An adversary submits an operating system command injection string to the DVWA Ping form (`/vulnerabilities/exec/`). You must trace the attack from the incoming HTTP request through PHP-FPM execution down to the Linux kernel `execve` syscall audit event.

---

## 4. Attack / Event Generation
From the Linux Attack Host, execute the controlled Command Injection scenario:

```bash
# Connect to Attack Host via Bastion
ssh -i ~/.ssh/socforge_key -o ProxyJump=ubuntu@<BASTION_PUBLIC_IP> ubuntu@10.10.20.114

# Execute DVWA Command Injection test scenario
/usr/local/bin/run-web-test --scenario DVWA-04 --confirm
```

---

## 5. Expected Telemetry
- **Generating Host**: `SOCForge-web` (`10.10.30.148`).
- **Telemetry Streams**:
  1. Nginx HTTP Access Log (`/var/log/nginx/access.log`).
  2. Linux Kernel Auditd Log (`/var/log/audit/audit.log`).
- **Target Indices**: `socforge-nginx-access-*` and `socforge-auditd-*`.
- **Wazuh Detection Rules**:
  - `100102` (Level 9: *SOCForge (DET-WEB-002): Command Injection attempt detected against DVWA*).
  - `100501` (Level 7: *SOCForge (DET-LNX-001): Discovery or shell utility executed by web service account*).
  - `100601` (Level 11: *SOCForge (DET-COR-001): Multi-Source Correlation: High-confidence web exploit followed by immediate system command execution*).

---

## 6. Investigation Steps

1. **Investigate the HTTP Layer**:
   - In OpenSearch Dashboards Discover, select: `socforge-nginx-access-*`.
   - Search for:
     ```text
     rule.id: "100102"
     ```
   - Note the timestamp, source IP, and URL parameters (`?ip=127.0.0.1%3Bwhoami`).
2. **Investigate the Kernel Syscall Layer**:
   - Switch index pattern to: `socforge-auditd-*`.
   - Search for:
     ```text
     data.audit.euid: "33" OR data.audit.euid: "www-data"
     ```
   - Verify that `/usr/bin/whoami` was executed by Effective User ID 33 (`www-data`).
3. **Verify the Multi-Source Correlation Alert**:
   - Switch index pattern to: `wazuh-alerts-*`.
   - Search for:
     ```text
     rule.id: "100601"
     ```
   - Confirm that Wazuh correlated the HTTP request and the kernel execution within the 30-second window to generate a **Level 11 Critical Alert**.

---

## 7. Investigative Questions
1. **What command delimiter character was used in the URL?** (Decode `%3B`).
2. **Under which Linux user context did the command execute on the server?**
3. **What binary path did the web application invoke?**
4. **Why is an event in `socforge-auditd-*` crucial for verifying whether the web attack succeeded?**
5. **Why is the composite Level 11 correlation alert significantly higher confidence than a web access log alert alone?**

---

## 8. Expected Findings & Solutions
- **Delimiter**: Semicolon `;` (encoded as `%3B`).
- **Executed Command**: `/usr/bin/whoami` (and `uname -a`).
- **User Context**: Effective UID `33` (`www-data` - the Nginx/PHP service account).
- **Attack Chain Analysis**: An HTTP request alone only shows that an attacker *tried* to inject a command. The auditd `execve` event proves that the server actually *spawned* the process, confirming successful **Remote Code Execution (RCE)**.
- **Correlation Confidence**: Correlating the network request and the host syscall in under 30 seconds eliminates false alarms and confirms active host compromise.

---

## 9. MITRE ATT&CK Mapping
- **Tactic**: Execution (`TA0002`) / Initial Access (`TA0001`)
- **Technique**: Command and Scripting Interpreter: Unix Shell (`T1059.004`) / Exploit Public-Facing Application (`T1190`)

---

## 10. Conclusion & Cleanup
- **Conclusion**: You have successfully traced a full RCE attack chain from HTTP layer to Linux kernel syscalls and validated multi-source correlation alerting.
- **Cleanup**: No cleanup required.
