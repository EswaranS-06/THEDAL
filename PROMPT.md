SOCForge — Phase 15: Live Telemetry Routing, Detection Integrity & SOC Validation

Phase 14 successfully deployed SOCForge into AWS and fixed 19 live infrastructure defects.

DO NOT redesign the infrastructure.

DO NOT add new EC2 instances.

DO NOT add NAT Gateway.

DO NOT add new major features.

This phase exists to prove that the LIVE SOC telemetry architecture created in Phases 12–13 actually works end-to-end.

==================================================
1. PRIMARY OBJECTIVE
==================================================

Prove this complete chain for every telemetry source:

SOURCE
 ↓
COLLECTOR
 ↓
WAZUH AGENT / MANAGER
 ↓
CLASSIFICATION
 ↓
INDEX ROUTING
 ↓
SOCFORGE INDEX
 ↓
WAZUH ALERT
 ↓
DASHBOARD
 ↓
DETECTION

Do not consider configuration files as proof.

Only actual live events count as validation.

==================================================
2. LIVE INDEX INVENTORY
==================================================

On the live Wazuh Indexer/OpenSearch instance:

List all indices.

Verify whether the following actually exist:

socforge-windows-security-*
socforge-sysmon-*
socforge-powershell-*
socforge-nginx-access-*
socforge-nginx-error-*
socforge-dvwa-*
socforge-auditd-*
socforge-linux-auth-*
socforge-juice-shop-*
socforge-atomic-*
socforge-web-attack-*

Also verify:

wazuh-alerts-*
wazuh-archives-*

Do not assume they exist.

For every expected index record:

FOUND
EMPTY
MISSING
NOT APPLICABLE

==================================================
3. TELEMETRY SOURCE MATRIX
==================================================

Create a live validation matrix:

Source
Generator
Collector
Classification
Expected Index
Actual Index
Alert
Dashboard
Status

Required sources:

windows_security
sysmon
powershell
nginx_access
nginx_error
dvwa
auditd
linux_auth
juice_shop
atomic
web_attack

==================================================
4. WINDOWS SECURITY
==================================================

Generate a harmless Windows security event.

Verify:

Windows Event Log
 ↓
Wazuh Agent
 ↓
Wazuh Manager
 ↓
OpenSearch

Confirm:

socforge.source
agent.name
timestamp
event ID

Verify expected index.

==================================================
5. SYSMON
==================================================

Generate:

whoami.exe
systeminfo.exe
ipconfig.exe

Verify Sysmon Event ID 1.

Verify Wazuh ingestion.

Verify:

socforge.source=sysmon

Verify actual index.

==================================================
6. POWERSHELL
==================================================

Generate harmless PowerShell activity.

Verify:

ScriptBlock
Module logging where configured
Sysmon process creation

Verify:

socforge.source=powershell

Verify actual index.

==================================================
7. NGINX ACCESS
==================================================

Generate normal HTTP requests against DVWA.

Verify:

/var/log/nginx/access.log

then:

Wazuh Agent
 ↓
Wazuh Manager
 ↓
OpenSearch

Verify:

socforge.source=nginx_access

Verify the correct index.

==================================================
8. NGINX ERROR
==================================================

Generate a controlled HTTP error.

Verify:

/var/log/nginx/error.log

Verify:

socforge.source=nginx_error

Verify separate routing from nginx_access.

==================================================
9. DVWA
==================================================

Generate one controlled request for each:

SQL injection
Command injection
LFI/traversal

Verify:

Nginx event
Wazuh event
custom rule
alert
index
dashboard

Record exact Wazuh rule ID and alert level.

==================================================
10. AUDITD
==================================================

Generate a harmless command execution that auditd records.

Verify:

audit.log
 ↓
Wazuh
 ↓
socforge.source=auditd
 ↓
expected index

==================================================
11. LINUX AUTH
==================================================

Generate a controlled authentication event.

Verify:

/var/log/auth.log

Verify:

socforge.source=linux_auth

Verify actual index.

==================================================
12. JUICE SHOP
==================================================

Generate normal Juice Shop traffic.

Then run one controlled Juice Shop test.

Verify:

Docker JSON log
 ↓
Wazuh Agent
 ↓
Wazuh Manager
 ↓
socforge.source=juice_shop
 ↓
socforge-juice-shop-*
 ↓
Dashboard

This chain is mandatory.

Do not accept "Wazuh received the log" as sufficient.

==================================================
13. ATOMIC
==================================================

Run only:

T1082
T1087.001
T1016
T1053.005

Verify:

Atomic ground truth
 ↓
Windows
 ↓
Sysmon/Security
 ↓
Wazuh
 ↓
custom detection
 ↓
socforge-atomic-*

Verify the simulation metadata:

simulation_id
scenario_id
technique_id
target

==================================================
14. WEB ATTACK
==================================================

Run:

DVWA-03
DVWA-05
JS-01

Verify:

web_attack metadata

and:

socforge-web-attack-*

Do not run the entire attack catalog.

==================================================
15. NATIVE WAZUH INDEX REGRESSION
==================================================

This is mandatory.

Verify that:

wazuh-alerts-*

still receives alerts.

Verify Wazuh Dashboard's native alert functionality still works.

Verify that source-specific routing did NOT break native Wazuh functionality.

==================================================
16. DETECTION VALIDATION
==================================================

For every live-tested detection:

Detection ID
Rule ID
Expected
Observed
Index
Severity
Dashboard
Status

Use only:

PASS
FAIL
BLOCKED

Do not claim success from configuration alone.

==================================================
17. CORRELATION VALIDATION
==================================================

Test:

Nginx suspicious request
+
Auditd execution

Test:

Web upload
+
FIM

Test:

Juice Shop failed authentication
+
successful authentication

Verify actual correlation alerts.

==================================================
18. DASHBOARD VALIDATION
==================================================

Open:

SOCForge Overview
Windows Endpoint
Web Applications
Attack Activity

Verify every panel against live data.

Record:

Panel
Expected data
Actual data
Status

==================================================
19. ADMIN CREDENTIAL REMEDIATION
==================================================

The current live report exposes:

admin / admin

This MUST NOT remain the learner default.

Implement secure credential handling.

Requirements:

- no plaintext password in Git
- no password in Terraform output
- no password in Ansible logs
- support environment variable or Ansible Vault
- document how the operator supplies the password
- change the current live admin password

Verify Git secret scan after the change.

==================================================
20. RESOURCE / COST REVIEW
==================================================

Record actual running instance types.

Record:

CPU
RAM
EBS size
EBS usage
running hours

Compare against the current AWS Free Tier eligibility.

Do not claim "free" simply because there is no NAT Gateway.

Document:

Free Tier eligible
Credit usage
Potential charge
Storage considerations

Do not change instance types during this phase unless a real resource/cost issue is discovered.

==================================================
21. ATTACK HOST AGENT DECISION
==================================================

Determine whether SOCForge-attack intentionally does NOT run a Wazuh Agent.

If intentional:

document:

Attack Host
    ↓
does not send normal endpoint telemetry
    ↓
ground-truth simulation logs only

If it SHOULD run an agent:

identify the required implementation.

Do not change it automatically without documenting the reason.

==================================================
22. DETECTION COUNT RECONCILIATION
==================================================

Phase 13 reported:

18 detection rules

but the health check reported:

26 rules in namespace 100100–100699

Resolve this discrepancy.

Produce:

custom detection rules
support/correlation rules
total rules

Clearly distinguish them.

==================================================
23. LIVE HEALTH REPORT
==================================================

Create:

docs/live-telemetry-validation.md

Include:

Infrastructure
Connectivity
Sources
Indexes
Rules
Correlations
Dashboards
Credentials
Resource usage
Cost considerations

==================================================
24. FAILURE HANDLING
==================================================

If something fails:

DO NOT fake the result.

Record:

LIVE-020
LIVE-021
etc.

Format:

Issue
Symptom
Expected
Observed
Root cause
Fix
Files changed
Retest
Final status

Every permanent fix must be implemented in Terraform/Ansible/configuration.

No undocumented manual-only fixes.

==================================================
25. GIT
==================================================

Commit meaningful fixes individually.

Examples:

fix: repair juice shop index routing
fix: correct sysmon source classification
fix: secure wazuh dashboard credentials
fix: repair telemetry dashboard
fix: reconcile detection rule inventory

Do not push.

Do not create a GitHub remote.

==================================================
26. FINAL ACCEPTANCE CRITERIA
==================================================

Phase 15 is PASS only when:

[ ] all expected telemetry sources tested
[ ] source classification verified
[ ] source-specific indexes verified
[ ] native Wazuh indexes still work
[ ] Juice Shop routing verified
[ ] Windows telemetry verified
[ ] Sysmon verified
[ ] PowerShell verified
[ ] Nginx access verified
[ ] Nginx error verified
[ ] DVWA verified
[ ] auditd verified
[ ] Linux auth verified
[ ] Atomic telemetry verified
[ ] web attack telemetry verified
[ ] custom detections verified
[ ] correlation verified
[ ] dashboards verified
[ ] admin password secured
[ ] detection count reconciled
[ ] cost status documented
[ ] no secrets committed
[ ] repository clean

==================================================
27. DO NOT DESTROY AWS
==================================================

Do NOT run:

terraform destroy

The infrastructure must remain available for the next SOC learning phase.

==================================================
28. NEXT PHASE
==================================================

After Phase 15:

Phase 16 — SOC Analyst Learning Experience

Focus on turning the working infrastructure into a genuinely usable learning environment:

- guided investigation scenarios
- analyst runbooks
- alert triage workflow
- incident investigation exercises
- evidence collection
- timelines
- severity/priority decisions
- false-positive exercises
- MITRE ATT&CK mapping
- beginner-to-intermediate SOC labs

Do NOT implement Phase 16 automatically.

STOP after Phase 15.