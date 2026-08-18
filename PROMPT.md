SOCForge — Phase 16: SOC Analyst Learning Experience, Guided Investigations & Training Labs

SOCForge is now a functioning live AWS SOC environment.

Phase 14 proved the infrastructure works.

Phase 15 proved live telemetry, detections, correlation and resource behavior.

DO NOT redesign the infrastructure.

DO NOT add EC2 instances.

DO NOT add NAT Gateway.

DO NOT replace Wazuh.

DO NOT add SOAR.

DO NOT add MISP.

DO NOT create another major backend.

This phase transforms the existing SOCForge environment into a structured SOC learning platform.

The original motivation for SOCForge is:

    A beginner should be able to deploy the environment
    and learn SOC investigation step-by-step
    without having to figure out everything from scratch.

==================================================
1. PRIMARY OBJECTIVE
==================================================

Create a guided SOC analyst learning experience.

The learner should be able to:

    Generate an event
        ↓
    Observe the alert
        ↓
    Understand why it triggered
        ↓
    Investigate the evidence
        ↓
    Identify the attack
        ↓
    Map it to MITRE ATT&CK
        ↓
    Determine severity
        ↓
    Determine false positive / true positive
        ↓
    Write an investigation conclusion

The environment must teach investigation,
not simply demonstrate attacks.

==================================================
2. LEARNING LEVELS
==================================================

Create three levels.

LEVEL 1 — SOC FOUNDATION

Beginner.

Teach:

- what is a log?
- what is an alert?
- event vs alert
- severity
- source IP
- destination IP
- username
- process
- command line
- timestamp
- HTTP status
- Wazuh rule
- MITRE ATT&CK

LEVEL 2 — SOC INVESTIGATION

Teach:

- timeline construction
- event correlation
- process investigation
- authentication investigation
- web attack investigation
- endpoint investigation
- distinguishing FP vs TP

LEVEL 3 — ATTACK INVESTIGATION

Teach:

- Atomic Red Team
- Sysmon
- PowerShell
- DVWA
- Juice Shop
- multi-source correlation
- MITRE ATT&CK
- attack timeline

==================================================
3. LEARNING LAB STRUCTURE
==================================================

Create:

docs/labs/

Each lab must contain:

README.md

with:

Objective
Prerequisites
Scenario
Attack generation
Expected telemetry
Investigation steps
Questions
Expected findings
MITRE ATT&CK
Conclusion
Cleanup

==================================================
4. LAB 01 — FIRST WAZUH ALERT

Create:

labs/01-first-alert/

Scenario:

Generate a harmless Windows event.

Learner must:

1. Open Wazuh Dashboard.
2. Find the agent.
3. Find the event.
4. Identify timestamp.
5. Identify hostname.
6. Identify event source.
7. Identify rule.
8. Identify severity.

Questions:

What happened?

When?

Where?

Which host?

Which user?

Which rule?

What is the severity?

==================================================
5. LAB 02 — WINDOWS PROCESS INVESTIGATION
==================================================

Use Sysmon Event ID 1.

Generate:

whoami
systeminfo
ipconfig

Learner investigates:

process.name
process.parent
command line
user
timestamp

Questions:

What process executed?

Who started it?

What was the parent process?

Is this automatically malicious?

Why/why not?

==================================================
6. LAB 03 — POWERSHELL INVESTIGATION
==================================================

Use PowerShell telemetry.

Generate a harmless PowerShell command.

Learner investigates:

PowerShell event
ScriptBlock
process creation
user
command line

Questions:

Was PowerShell used?

What command executed?

Was the command encoded?

Is PowerShell itself malicious?

What additional evidence would you want?

==================================================
7. LAB 04 — FAILED AUTHENTICATION
==================================================

Generate controlled authentication failures.

Learner investigates:

source
username
timestamp
count
target

Teach:

single failure
vs
repeated failures

Questions:

Is this suspicious?

What threshold would increase confidence?

Could this be a false positive?

==================================================
8. LAB 05 — DVWA SQL INJECTION
==================================================

Use:

DVWA-03

Learner must identify:

HTTP request
source IP
URI
query parameter
HTTP response
Wazuh rule
severity

Then investigate:

Nginx
+
Wazuh
+
application

Questions:

What evidence proves SQL injection?

What is the source?

What endpoint was targeted?

What MITRE ATT&CK technique is associated?

==================================================
9. LAB 06 — DVWA COMMAND INJECTION
==================================================

Use:

DVWA-04

Learner investigates:

Nginx access
Wazuh alert
auditd
process execution

Teach multi-source correlation.

Timeline:

HTTP request
 ↓
application
 ↓
command execution
 ↓
auditd
 ↓
Wazuh alert

Learner must explain the complete attack chain.

==================================================
10. LAB 07 — DVWA LFI / PATH TRAVERSAL
==================================================

Use:

DVWA-05

Learner investigates:

URI
encoding
HTTP response
source
target

Questions:

What file was targeted?

Why is traversal suspicious?

What evidence would distinguish scanning from successful exploitation?

==================================================
11. LAB 08 — JUICE SHOP API INVESTIGATION
==================================================

Use:

JS-03

Learner investigates Docker-generated telemetry.

Teach:

container
application
endpoint
request
source
timestamp

Questions:

Why is this different from the Nginx/DVWA architecture?

Where does the log originate?

How does Docker logging reach Wazuh?

==================================================
12. LAB 09 — ATOMIC RED TEAM
==================================================

Use:

T1082

Learner investigates:

Atomic ground truth
+
Windows Security
+
Sysmon

Construct timeline:

simulation
 ↓
process creation
 ↓
Windows event
 ↓
Sysmon
 ↓
Wazuh alert

Learner identifies:

technique
command
process
user
host

==================================================
13. LAB 10 — POWERSHELL ATTACK
==================================================

Use:

T1059.001

Learner investigates:

PowerShell
Sysmon
ScriptBlock
Wazuh rule

Questions:

What makes this activity suspicious?

What evidence increases confidence?

What evidence would reduce confidence?

==================================================
14. LAB 11 — SCHEDULED TASK
==================================================

Use:

T1053.005

Learner investigates:

process
command line
scheduled task
user
timestamp

Map to:

MITRE ATT&CK

Determine:

TP / FP

==================================================
15. LAB 12 — MULTI-SOURCE CORRELATION
==================================================

Use:

DET-COR-001

Scenario:

Web command injection
+
system command execution

Learner must correlate:

Nginx
+
Wazuh
+
auditd

Question:

Why is the combined evidence stronger than either event alone?

==================================================
16. LAB 13 — TRUE POSITIVE VS FALSE POSITIVE
==================================================

Create paired scenarios.

Example:

Normal administrator PowerShell
vs
suspicious PowerShell execution.

Normal 404
vs
directory scanning.

Normal API request
vs
API enumeration.

Learner must determine:

TRUE POSITIVE
FALSE POSITIVE
BENIGN
SUSPICIOUS

==================================================
17. LAB 14 — INCIDENT TIMELINE
==================================================

Give the learner a simulated attack containing multiple events.

They must construct:

Time
Event
Source
Host
User
Technique
Evidence

Example:

10:00:01
Initial web request

10:00:02
Command injection

10:00:03
Process execution

10:00:04
Auditd event

10:00:05
Wazuh alert

==================================================
18. INVESTIGATION WORKSHEET
==================================================

Create:

docs/templates/investigation-report.md

Template:

Incident ID:
Analyst:
Date:

Alert:

Detection:

Severity:

Affected Host:

Source IP:

Destination:

User:

Timeline:

Evidence:

Initial Assessment:

MITRE ATT&CK:

True Positive / False Positive:

Confidence:

Impact:

Recommended Action:

Final Conclusion:

==================================================
19. SOC TRIAGE WORKSHEET
==================================================

Create:

docs/templates/triage-checklist.md

Checklist:

[ ] Identify alert
[ ] Validate timestamp
[ ] Identify affected asset
[ ] Identify user
[ ] Identify source
[ ] Identify destination
[ ] Review related events
[ ] Build timeline
[ ] Check MITRE technique
[ ] Determine TP/FP
[ ] Determine severity
[ ] Document conclusion

==================================================
20. ANALYST RUNBOOK
==================================================

Create:

docs/runbooks/

Include:

windows-alert-investigation.md
powershell-investigation.md
web-attack-investigation.md
juice-shop-investigation.md
authentication-investigation.md
sysmon-investigation.md
atomic-investigation.md

Each runbook should answer:

What happened?

What should I check first?

Which index?

Which fields?

Which dashboard?

What evidence matters?

What is a false positive?

What should I document?

==================================================
21. INDEX → INVESTIGATION GUIDE
==================================================

Create a simple mapping:

windows_security
    → Windows investigation

sysmon
    → process investigation

powershell
    → PowerShell investigation

nginx_access
    → web investigation

nginx_error
    → web error investigation

auditd
    → Linux process investigation

linux_auth
    → authentication investigation

juice_shop
    → container/application investigation

atomic
    → attack ground truth

web_attack
    → attack scenario metadata

==================================================
22. BEGINNER GLOSSARY
==================================================

Create:

docs/learning/glossary.md

Explain in simple language:

SIEM
SOC
Alert
Event
Log
Rule
Decoder
Agent
Indexer
Dashboard
Sysmon
Auditd
FIM
IOC
TTP
MITRE ATT&CK
False Positive
True Positive
Severity
Correlation
Incident
Incident Response

Use SOC terminology but explain it for beginners.

==================================================
23. ATTACK → TELEMETRY MAP
==================================================

Create:

docs/learning/attack-to-telemetry.md

Example:

SQL Injection
    ↓
Nginx access
    ↓
Wazuh
    ↓
DET-WEB-001
    ↓
socforge-nginx-access

PowerShell
    ↓
Sysmon
    ↓
PowerShell logs
    ↓
DET-WIN-001/002
    ↓
socforge-powershell / sysmon

Atomic T1082
    ↓
Windows Security
    +
Sysmon
    ↓
Wazuh
    ↓
Detection

==================================================
24. NO AUTOMATIC ATTACK EXECUTION
==================================================

Learning labs may reference:

run-atomic-test

run-web-test

but must NEVER execute attacks automatically when a learner opens documentation.

The learner must explicitly run the test.

==================================================
25. RESET / CLEANUP
==================================================

Each lab must specify:

What changes?

What persists?

What must be cleaned?

How to restore the environment?

Use existing cleanup mechanisms.

Do not create destructive reset scripts unless required.

==================================================
26. LEARNING PATH
==================================================

Create:

docs/learning-path.md

Structure:

BEGINNER

1. First Wazuh Alert
2. Windows Process
3. PowerShell
4. Authentication

INTERMEDIATE

5. DVWA SQLi
6. DVWA Command Injection
7. LFI
8. Juice Shop

ADVANCED

9. Atomic
10. PowerShell Attack
11. Scheduled Task
12. Correlation
13. FP/TP
14. Timeline

==================================================
27. CHALLENGE MODE
==================================================

Create optional challenge labs.

Do NOT reveal the answer immediately.

Example:

"You received Alert 100101.

Determine:

1. What happened?
2. Which host?
3. Which source?
4. Which endpoint?
5. Is this TP or FP?
6. Which ATT&CK technique?
7. What evidence supports your conclusion?"

Then provide:

HINT

and separately:

SOLUTION

This should allow the project to function as a self-learning SOC lab.

==================================================
28. VALIDATION
==================================================

Every lab must be checked for:

- correct target
- correct telemetry source
- correct index
- correct detection
- correct rule
- correct ATT&CK mapping
- correct expected result
- cleanup instructions

Do not invent expected events.

Where live evidence is required, reference actual validated Phase 15 results.

==================================================
29. DOCUMENTATION QUALITY
==================================================

Keep explanations:

clear
practical
SOC-oriented
beginner-friendly

Do not turn the documentation into generic cybersecurity theory.

The learner should be able to perform the lab directly.

==================================================
30. PROJECT ENTRY POINT
==================================================

Create:

docs/START-HERE.md

This is the first document a learner reads.

It should explain:

What is SOCForge?

What will I learn?

Architecture

Prerequisites

AWS requirements

Deployment

Accessing Wazuh

Starting the first lab

Where to find dashboards

Where to find runbooks

How to clean up AWS

==================================================
31. LEARNER SAFETY
==================================================

Clearly state:

SOCForge attacks are intended ONLY for:

- SOCForge lab infrastructure
- intentionally vulnerable applications
- authorized training

Never run the attack scripts against external systems.

==================================================
32. COST WARNING
==================================================

START-HERE.md must prominently explain that AWS infrastructure can incur charges.

Do NOT state that SOCForge is universally free.

Explain:

- Free Tier eligibility varies
- EC2 usage can exceed free limits
- EBS storage can incur charges
- data transfer may incur charges
- NAT Gateway is intentionally avoided
- destroy the infrastructure when finished

==================================================
33. VALIDATION
==================================================

Run:

make lint
make health-check

Validate all Markdown links.

Validate all referenced scripts exist.

Validate all referenced Wazuh rules exist.

Validate all referenced index names match the live architecture.

==================================================
34. GIT
==================================================

Commit meaningful groups.

Example:

docs: add SOCForge learning path
docs: add Windows investigation labs
docs: add web investigation labs
docs: add Atomic investigation labs
docs: add analyst runbooks
docs: add SOC investigation templates

Do NOT push.

Do NOT create GitHub remote.

==================================================
35. FINAL REPORT
==================================================

Report:

1. Learning path
2. Number of labs
3. Beginner labs
4. Intermediate labs
5. Advanced labs
6. Challenge labs
7. Runbooks
8. Investigation templates
9. Glossary
10. START-HERE guide
11. Validation results
12. Git commits

==================================================
36. IMPORTANT
==================================================

Do not change the working SOC infrastructure unless a documentation reference is incorrect.

This phase is primarily:

DOCUMENTATION
+
TRAINING
+
INVESTIGATION WORKFLOW

The live infrastructure has already been validated.

STOP after Phase 16.
