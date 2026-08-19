# THEDAL — Detection Engineering & Custom Wazuh Rule Architecture

### Threat Hunting, Exploration, Detection, Analysis and Learn

---

## 1. Detection Engineering Philosophy

THEDAL detection engineering adheres to the following principles:

1. **Context-Driven Detections**: Every detection answers:
   * **WHAT** occurred (e.g. SQL syntax injection, LSASS memory handle access).
   * **WHERE** it occurred (target host, application endpoint, process lineage).
   * **WHY** it is anomalous (unauthorized privilege level, abnormal parent process).
   * **WHAT TELEMETRY** proves it (EventChannel, Nginx access logs, Sysmon, Auditd).
   * **WHAT ATT&CK TECHNIQUE** it represents (e.g. `T1190`, `T1059.001`, `T1003.001`).
2. **False-Positive Minimization**: Avoid broad, uncontextualized string matches. Include strict preconditions, frequency thresholds, or multi-field constraints.
3. **No Overwriting Native Rules**: All custom logic is housed in dedicated custom XML files (`/var/ossec/etc/decoders/socforge_decoders.xml` and `/var/ossec/etc/rules/socforge_rules.xml`).
4. **Offline Reproducibility**: Every rule is tested against positive (malicious) and negative (legitimate baseline) test fixtures before deployment.

---

## 2. Rule ID Namespace

The project reserves the `100100 – 100699` namespace to avoid collisions with standard Wazuh rules (which reside below `100000` or above `200000`):

| Rule ID Range | Subsystem / Focus Area | Key Monitored Telemetry Sources |
| :--- | :--- | :--- |
| **`100100 – 100199`** | **DVWA Web Target Detections** | `nginx_access` (:8000), `dvwa` application logs |
| **`100200 – 100299`** | **OWASP Juice Shop Web Detections** | `juice_shop` container JSON stream (:3000) |
| **`100300 – 100399`** | **Nginx Threat & Scanning Detections** | `nginx_access`, `nginx_error` (:8000) |
| **`100400 – 100499`** | **Windows Endpoint & Sysmon Lineage** | `sysmon`, `powershell`, `windows_security` |
| **`100500 – 100599`** | **Linux System & Auditd Detections** | `auditd` (/var/log/audit/audit.log), `linux_auth` |
| **`100600 – 100699`** | **Multi-Source Correlation Rules** | `nginx_access` + `auditd`, `syscheck` FIM, `juice_shop` auth |

---

## 3. Severity Model & Level Mapping

Wazuh uses an integer level scale (0 to 16). SOCForge categorizes alerts as follows:

| Wazuh Level Range | SOC Severity Category | Operational Impact & SOC Triage Expectations | Example Detections |
| :--- | :--- | :--- | :--- |
| **Level 0** | **Grouping / Internal** | Non-alerting base grouping rules for decoders and streams. | Rule 100100 (DVWA base), Rule 100400 (Windows base) |
| **Level 3–5** | **Informational / Low** | Baseline operational traffic and single 404/401 errors. Logged for contextual search. | Single 404 response, regular administrative command |
| **Level 6–7** | **Medium / Suspicious** | Reconnaissance, directory fuzzing, unusual HTTP methods, discovery tool execution. | `DET-WIN-004` (Recon tools), `DET-NGX-001` (404 scanning), `DET-JS-001` (API enum) |
| **Level 8–9** | **High / Confirmed Attack** | Active exploitation attempts (SQLi, Command Injection, Encoded PowerShell, Parent-Child anomaly). | `DET-WEB-001` (SQLi), `DET-WIN-002` (PS encoded), `DET-WIN-003` (Office spawning cmd) |
| **Level 10–12** | **Critical / High Confidence** | Credential dumping (LSASS access) or correlated multi-source exploit chains. | `DET-WIN-005` (LSASS 0x1010), `DET-COR-001` (Web injection -> Auditd execution) |

---

## 4. Multi-Source Correlation Logic

```text
+------------------------------------+          +------------------------------------+
|    Nginx Reverse Proxy Access      |          |        Linux Kernel Auditd         |
|                                    |          |                                    |
| DET-WEB-002: Command Injection     |          | DET-LNX-001: Execution by www-data |
| (Rule 100102: "whoami; cat /etc")  |          | (Rule 100501: "/usr/bin/whoami")   |
+-----------------+------------------+          +-----------------+------------------+
                  |                                               |
                  | [Event within 30s window on same host]        |
                  +-----------------------+-----------------------+
                                          |
                                          v
                         +---------------------------------+
                         |      DET-COR-001 (Rule 100601)  |
                         |   High-Confidence Remote Code   |
                         |      Execution (Severity 11)    |
                         +---------------------------------+
```

---

## 5. MITRE ATT&CK Mapping Matrix

| Technique ID | Technique Name | Detection ID | Wazuh Rule ID | Monitored Platform |
| :--- | :--- | :--- | :--- | :--- |
| **`T1190`** | Exploit Public-Facing Application | `DET-WEB-001`, `DET-JS-003` | `100101`, `100203` | Linux (`SOCForge-web`) |
| **`T1059.004`** | Command & Scripting Interpreter: Unix Shell | `DET-WEB-002`, `DET-LNX-001` | `100102`, `100501` | Linux (`SOCForge-web`) |
| **`T1083`** | File and Directory Discovery | `DET-WEB-003`, `DET-JS-004` | `100103`, `100204` | Linux (`SOCForge-web`) |
| **`T1505.003`** | Server Software Component: Web Shell | `DET-WEB-004`, `DET-COR-002` | `100104`, `100602` | Linux (`SOCForge-web`) |
| **`T1087`** | Account Discovery | `DET-JS-001`, `DET-WIN-004` | `100201`, `100404` | Linux / Windows |
| **`T1110.001`** | Brute Force: Password Spraying | `DET-JS-002`, `DET-COR-003` | `100202`, `100603` | Linux (`SOCForge-web`) |
| **`T1595.002`** | Active Scanning: Vulnerability Scanning | `DET-NGX-001`, `DET-NGX-003` | `100301`, `100303` | Linux (`SOCForge-web`) |
| **`T1071.001`** | Application Layer Protocol: Web Protocols | `DET-NGX-002` | `100302` | Linux (`SOCForge-web`) |
| **`T1059.001`** | Command & Scripting Interpreter: PowerShell | `DET-WIN-001` | `100401` | Windows (`SOCForge-windows`) |
| **`T1027.013`** | Obfuscated Files: Encoded Script | `DET-WIN-002` | `100402` | Windows (`SOCForge-windows`) |
| **`T1059.003`** | Command & Scripting: Windows Command Shell | `DET-WIN-003` | `100403` | Windows (`SOCForge-windows`) |
| **`T1082`** | System Information Discovery | `DET-WIN-004` | `100404` | Windows (`SOCForge-windows`) |
| **`T1016`** | System Network Configuration Discovery | `DET-WIN-004` | `100404` | Windows (`SOCForge-windows`) |
| **`T1003.001`** | OS Credential Dumping: LSASS Memory | `DET-WIN-005` | `100405` | Windows (`SOCForge-windows`) |
| **`T1053.005`** | Scheduled Task/Job: Scheduled Task | `DET-WIN-006` | `100406` | Windows (`SOCForge-windows`) |
| **`T1548.003`** | Sudo and Sudo Caching | `DET-LNX-002` | `100502` | Linux (`SOCForge-web`) |

---

## 6. Atomic Red Team Test Mapping

| Atomic Test ID | ATT&CK Technique | Expected Windows Event | Monitored Channel | Triggered Wazuh Rule |
| :--- | :--- | :--- | :--- | :--- |
| `T1059.001-1` | `T1059.001` | Sysmon Event 1 / ScriptBlock 4104 | `sysmon` / `powershell` | Rule `100401` (Cradle) & `100402` (Encoded) |
| `T1082-1` | `T1082` | Sysmon Event 1 (`systeminfo.exe`) | `sysmon` | Rule `100404` (Host Discovery) |
| `T1087.001-1` | `T1087.001` | Sysmon Event 1 (`net.exe user`) | `sysmon` | Rule `100404` (Account Discovery) |
| `T1016-1` | `T1016` | Sysmon Event 1 (`ipconfig.exe /all`) | `sysmon` | Rule `100404` (Network Discovery) |
| `T1053.005-1` | `T1053.005` | Sysmon Event 1 (`schtasks.exe /create`)| `sysmon` | Rule `100406` (Scheduled Task) |

---

## 7. Testing Methodology

Offline testing validates each detection using test fixtures stored under `tests/detections/`:
* **Positive Samples (`*_positive.log`)**: Emulate adversary activity and must match the target rule condition.
* **Negative Samples (`*_negative.log`)**: Emulate normal operational activity and must not trigger false alerts.
* **Validation Script**: `scripts/detection-health-check.sh` validates XML syntax, ensures non-overlapping rule IDs, and verifies positive/negative test fixtures.
