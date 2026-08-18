# SOC Runbook: Atomic Red Team & Adversary Simulation Correlation

---

## 1. Overview & Trigger Conditions
This runbook guides analysts through correlating simulated adversary actions executed via the Atomic Red Team framework on the Linux Attack Host (`10.10.20.114`) against defensive endpoint telemetry on `10.10.10.254`:
- Technique `T1059.001`: PowerShell Scripting & Execution
- Technique `T1082`: System Information Discovery
- Technique `T1087.001`: Local Account Enumeration
- Technique `T1016`: System Network Configuration Discovery
- Technique `T1053.005`: Scheduled Task Creation & Deletion

---

## 2. Ground-Truth Telemetry Architecture
When an attack is launched from the Attack Host using `/usr/local/bin/run-atomic-test`:
1. The Attack Host executes the atomic test via remote WinRM or API call.
2. The Attack Host writes a local audit log to `/var/log/socforge/atomic/simulation.log` with simulation ID, technique, and timestamp.
3. The Windows Endpoint executes the commands, generating Windows Security EventLog and Sysmon records.
4. Wazuh Agent forwards the logs to Wazuh Manager, triggering custom detection rules.

---

## 3. Investigation Querying & Dashboards

- **Primary OpenSearch Indices**: `socforge-sysmon-*`, `socforge-powershell-*`, `socforge-windows-security-*`
- **Simulation Audit Index**: `wazuh-alerts-*`
- **Recommended Dashboard**: **SOCForge — Adversary Attack Activity & Ground Truth**

### Useful OpenSearch Queries
```text
# Search for Atomic Red Team custom detection alerts
rule.groups: "socforge_windows" OR rule.id: (100401 OR 100402 OR 100404 OR 100406)

# Search for simulation ground-truth audit entries
rule.id: "100511" OR full_log: (*SOCForge Controlled ATT&CK Execution*)
```

---

## 4. Constructing the Adversary Simulation Timeline
To correlate simulation ground-truth to target SIEM detections:
1. Identify the simulation timestamp and Technique ID in the ground-truth log.
2. Search `socforge-sysmon-*` for process creation events occurring within **±5 seconds** of the simulation timestamp.
3. Verify that the command line captured in Sysmon matches the command executed by Atomic Red Team.
4. Verify that Wazuh generated the corresponding detection alert.

---

## 5. What to Document in the Incident Report
- Simulation ID and MITRE ATT&CK Technique ID.
- Target Host IP (`10.10.10.254`).
- Detected process commands and parent lineage.
- Detection Rule ID and Wazuh alert severity.
- Gap Analysis: Did the SIEM detect the attack immediately, or were there logging delays?
