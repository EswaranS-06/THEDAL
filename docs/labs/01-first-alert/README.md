# Lab 01: Your First Wazuh Alert & Log Anatomy

---

## 1. Objective
Learn how to navigate the Wazuh SIEM interface, locate a monitored endpoint, search for an incoming security event, and dissect the basic anatomy of a SIEM alert (Timestamps, Agent ID, Hostname, Event Source, Rule ID, Severity Level).

---

## 2. Prerequisites
- Access to OpenSearch Dashboards at `https://localhost:8443` (via SSH tunnel through Bastion).
- SSH access to the SOCForge Bastion Jumpbox (`13.201.43.138`).
- Reviewed [SOC Terminology Glossary](file:///home/rex/Documents/Projects/docs/learning/glossary.md).

---

## 3. Scenario
A new Windows Server 2022 endpoint has been enrolled in the SOC environment. An administrator executes a benign system query. As a Tier 1 SOC analyst, you must locate the resulting telemetry in Wazuh and verify that the endpoint is reporting properly.

---

## 4. Attack / Event Generation
Connect to the Linux Attack Host and run the benign discovery test targeting the Windows endpoint:

```bash
# Connect to Attack Host via Bastion
ssh -i ~/.ssh/socforge_key -o ProxyJump=ubuntu@<BASTION_PUBLIC_IP> ubuntu@10.10.20.114

# Execute benign system discovery test
/usr/local/bin/run-atomic-test --technique T1082 --confirm
```

---

## 5. Expected Telemetry
- **Generating Host**: `SOCForge-windows` (`10.10.10.254`).
- **Telemetry Sources**: Windows Security Log (Event 4688) and Microsoft Sysmon (Event ID 1).
- **Target Index**: `socforge-sysmon-*` and `wazuh-alerts-*`.
- **Wazuh Detection Rule**: `100404` (Level 6: *Discovery and reconnaissance binary execution on Windows endpoint*).

---

## 6. Investigation Steps

1. **Open the SIEM Web UI**:
   - Navigate to `https://localhost:8443` and log in to OpenSearch Dashboards.
2. **Open the Overview Dashboard**:
   - In the left-hand navigation menu, click **Dashboard** -> **SOCForge — Security Operations Overview**.
3. **Set the Time Filter**:
   - Click the time filter in the upper-right corner and select **Last 15 minutes**.
4. **Search for the Alert**:
   - In the search bar, enter:
     ```text
     agent.name: "windows" AND rule.id: "100404"
     ```
5. **Inspect the Document Details**:
   - Click the expand arrow `>` next to the top event to view the full JSON document.
   - Locate and examine the following fields:
     - `@timestamp`
     - `agent.id` and `agent.name`
     - `agent.ip`
     - `rule.id` and `rule.level`
     - `rule.description`
     - `data.win.eventdata.image`
     - `data.win.eventdata.commandLine`

---

## 7. Investigative Questions
Answer the following questions based on the telemetry observed in OpenSearch:
1. **What happened?** What specific binary was executed on the Windows host?
2. **When did it occur?** What is the exact UTC timestamp of the event?
3. **Which host was affected?** What is the agent name and private IP address?
4. **Which user account executed the command?**
5. **Which Wazuh Rule ID triggered, and what is its assigned severity level?**
6. **Is this event dangerous in isolation, or does it represent routine discovery?**

---

## 8. Expected Findings & Solutions
- **Binary Executed**: `C:\Windows\System32\whoami.exe` (followed by `systeminfo.exe` and `ipconfig.exe`).
- **Target Host**: `windows` (`10.10.10.254`, Agent `003`).
- **User Account**: `Administrator` (or `SYSTEM`).
- **Triggered Rule**: Rule ID `100404` (Severity Level `6`).
- **Context**: Low-severity system information discovery. It captures standard administrative utilities often abused by adversaries during initial host triage.

---

## 9. MITRE ATT&CK Mapping
- **Tactic**: Discovery (`TA0007`)
- **Technique**: System Information Discovery (`T1082`)

---

## 10. Conclusion & Cleanup
- **Conclusion**: The Windows agent is actively streaming endpoint logs, and Wazuh successfully decoded and alerted on host discovery activity.
- **Cleanup**: No cleanup required. The atomic simulation runs read-only commands and leaves no persistent system modifications.
