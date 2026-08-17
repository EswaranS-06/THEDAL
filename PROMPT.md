SOCForge — Phase 13: Detection Engineering, Custom Wazuh Rules, Decoders & SOC Alert Logic

You are continuing the SOCForge project.

Phases 2–12 have established:

- AWS VPC and private network
- Bastion management architecture
- Security Groups
- IAM
- EC2 infrastructure
- Terraform → Ansible handoff
- Bastion forward proxy
- Wazuh 4.14.7
- Windows endpoint
- Sysmon
- Windows Wazuh Agent
- Linux web target
- Nginx
- DVWA
- MariaDB
- auditd
- Linux authentication telemetry
- OWASP Juice Shop
- Docker telemetry
- Atomic Red Team
- controlled web attack testing
- canonical telemetry taxonomy
- source-specific indexes
- OpenSearch templates
- ISM retention
- investigation dashboards

Phase 12 established the telemetry destinations.

Phase 13 now establishes the SOC detection layer.

==================================================
CRITICAL SCOPE
==================================================

This phase is ONLY for:

- Wazuh decoders
- Wazuh custom rules
- detection logic
- alert severity
- correlation
- thresholds
- suppression
- false-positive handling
- MITRE ATT&CK mapping
- detection documentation
- detection testing framework

DO NOT:

- deploy AWS infrastructure
- execute attacks automatically
- modify the network architecture
- add EC2 instances
- add NAT Gateway
- add SOAR
- add MISP
- implement automated remediation
- automatically execute Atomic Red Team
- automatically exploit DVWA
- automatically exploit Juice Shop

Detection rules must be created from the telemetry architecture already established.

==================================================
1. INSPECT EXISTING WAZUH CONFIGURATION
==================================================

Before modifying anything, inspect:

- Wazuh Manager configuration
- existing rules
- existing decoders
- existing local_rules.xml
- existing custom decoder files
- existing Filebeat configuration
- existing socforge.source fields
- existing index routing
- existing dashboard objects

Do NOT overwrite existing Wazuh rules.

Use the existing custom-rule mechanism.

==================================================
2. DETECTION ENGINEERING PRINCIPLE
==================================================

Do not create rules merely because a log contains suspicious text.

Every detection must answer:

WHAT happened?

WHERE did it happen?

WHY is it suspicious?

WHAT telemetry proves it?

WHAT ATT&CK technique does it represent?

WHAT severity should it receive?

WHAT legitimate activity could trigger it?

HOW can an analyst investigate it?

==================================================
3. DETECTION CATALOG
==================================================

Create:

docs/detection-catalog.md

Each detection must have:

- Detection ID
- Name
- Description
- Data source
- Required fields
- Detection logic
- Severity
- MITRE ATT&CK technique
- Expected false positives
- Investigation steps
- Related simulation
- Test method

Example:

DET-WEB-001
    SQL Injection Attempt

Source:
    nginx_access

Scenario:
    DVWA-03

Technique:
    T1190 / relevant ATT&CK mapping

Severity:
    appropriate level

Expected evidence:
    suspicious query parameter

Do not invent ATT&CK mappings.
Verify mappings against the actual technique.

==================================================
4. WEB DETECTIONS — DVWA
==================================================

Implement controlled detections for:

### DET-WEB-001
SQL Injection

Detect:

- common SQL injection patterns
- suspicious query-string structures
- encoded injection attempts where practical

Do not rely on one exact payload.

Avoid excessive false positives.

### DET-WEB-002
Command Injection

Detect:

- suspicious command separators
- command execution patterns
- known dangerous shell execution indicators

Correlate Nginx activity with auditd where possible.

### DET-WEB-003
Path Traversal / LFI

Detect:

- ../
- encoded traversal
- suspicious file path access

### DET-WEB-004
Suspicious File Upload

Detect:

- suspicious uploads
- modifications in DVWA upload directory
- FIM events

Correlate:

Nginx
+
auditd
+
FIM

when available.

==================================================
5. WEB DETECTIONS — JUICE SHOP
==================================================

Create detections for:

### DET-JS-001
Suspicious API enumeration

### DET-JS-002
Authentication abuse

### DET-JS-003
Injection probing

### DET-JS-004
Administrative endpoint access/probing

### DET-JS-005
Application error exploitation indicators

Use the actual Juice Shop log format.

Do NOT assume Nginx logs exist for Juice Shop.

Juice Shop telemetry comes through:

Docker JSON
    ↓
Wazuh Agent
    ↓
Wazuh

==================================================
6. NGINX DETECTIONS
==================================================

Create detections based on:

- unusual HTTP methods
- repeated 401/403
- repeated 404
- suspicious URI patterns
- suspicious query strings
- traversal patterns
- SQL injection patterns
- command injection indicators
- scanning behavior

Do NOT alert on every 404.

Implement thresholding where appropriate.

For example:

Single 404:
    informational

Many 404s from same source within time window:
    suspicious

==================================================
7. WINDOWS DETECTIONS
==================================================

Use:

windows_security
sysmon
powershell

Create initial detections for:

### DET-WIN-001
Suspicious PowerShell execution

### DET-WIN-002
PowerShell encoded/obfuscated command indicators

### DET-WIN-003
Suspicious parent-child process relationship

### DET-WIN-004
Suspicious command execution

### DET-WIN-005
Potential credential-access behavior

Do NOT create extremely broad rules such as:

"powershell = malicious"

They will generate excessive false positives.

==================================================
8. SYSMON PROCESS LINEAGE
==================================================

Use Sysmon Event ID 1.

Build detections around suspicious relationships.

Examples to evaluate:

Office application
    ↓
PowerShell

Browser
    ↓
PowerShell

Word/Excel
    ↓
cmd.exe

Web-related process
    ↓
shell

Do not assume every parent-child relationship is malicious.

Use contextual conditions.

==================================================
9. ATOMIC RED TEAM DETECTIONS
==================================================

Use the existing:

atomic

ground-truth telemetry.

Do not execute Atomic tests automatically.

Instead create detection mappings:

Atomic Test
    ↓
Expected Windows Event
    ↓
Sysmon/PowerShell
    ↓
Wazuh Rule
    ↓
MITRE ATT&CK

Each mapping must have:

- Atomic test ID
- technique ID
- expected telemetry
- detection ID
- Wazuh rule ID

Do not invent rule IDs.

==================================================
10. CORRELATION RULES
==================================================

Create correlation where meaningful.

Example:

WEB ATTACK:

Nginx suspicious request
        +
auditd command execution
        ↓
HIGHER confidence detection

Another:

PowerShell
    +
suspicious parent process
        ↓
HIGHER confidence detection

Another:

multiple authentication failures
        +
successful authentication
        ↓
potential credential attack

Do not create correlation merely for complexity.

==================================================
11. SEVERITY MODEL
==================================================

Define a SOCForge severity model.

Example:

Level 3–4
    informational / low

Level 5–7
    suspicious / medium

Level 8–10
    high / critical

Use the Wazuh rule level appropriately.

Document why each detection receives its severity.

Do not mark every web probe as critical.

==================================================
12. FALSE POSITIVE CONTROL
==================================================

Every detection must document expected false positives.

Examples:

Legitimate administrator:
    PowerShell

Normal application:
    404 responses

Security scanner:
    multiple suspicious requests

Developer:
    API endpoint testing

Create suppression/threshold logic where appropriate.

Do NOT suppress detections globally.

Use narrow conditions.

==================================================
13. RULE NAMING
==================================================

Create a consistent rule ID namespace.

Do not conflict with Wazuh's built-in rules.

Before assigning IDs:

inspect existing local rule IDs.

Reserve a SOCForge range.

Example concept:

SOCForge custom rules:
    100000–100999

Do not blindly use this range if Wazuh has another convention.

Verify first.

Document the selected range.

==================================================
14. DECODERS
==================================================

Only create custom decoders when the existing Wazuh decoder cannot properly parse the telemetry.

Do NOT create unnecessary decoders.

For each decoder document:

- source
- prematch
- regex
- fields
- parent decoder
- expected sample log

Create sample logs for testing.

==================================================
15. RULE TESTING
==================================================

Create:

tests/detections/

For every custom decoder/rule provide:

positive sample
negative sample

Example:

tests/detections/dvwa_sqli_positive.log
tests/detections/dvwa_sqli_negative.log

The negative sample must represent legitimate traffic that should NOT alert.

This is mandatory.

==================================================
16. OFFLINE DETECTION TESTING
==================================================

Use the Wazuh testing mechanism available in the installed version.

For example:

wazuh-logtest

or the correct supported mechanism.

Test:

positive event
    → expected decoder
    → expected rule
    → expected severity

negative event
    → no alert

Do not claim the detection works if it has not passed the test.

==================================================
17. DETECTION QUALITY
==================================================

For every detection report:

Detection ID
Rule ID
Decoder
Source
Technique
Positive test
Negative test
Expected alert
Observed alert
False-positive consideration

Use:

PASS
FAIL
NOT TESTED

Do not use vague language.

==================================================
18. MITRE ATT&CK
==================================================

Map detections to MITRE ATT&CK where appropriate.

At minimum evaluate mappings for:

- PowerShell
- Command/Scripting Interpreter
- Process Discovery
- System Information Discovery
- Network Discovery
- Credential Access
- Web exploitation where appropriate

Do not force ATT&CK mappings onto simple operational events.

Use the correct technique/sub-technique IDs.

==================================================
19. DASHBOARD INTEGRATION
==================================================

Update the existing dashboards where useful.

Add panels for:

- detection count
- severity
- top detection
- ATT&CK technique
- affected host
- source
- simulation ID
- scenario ID

Do not create a new dashboard for every detection.

==================================================
20. INVESTIGATION CONTEXT
==================================================

Detection alerts should preserve useful context:

- source IP
- destination
- URI
- HTTP method
- process name
- parent process
- command line
- username
- agent name
- agent IP
- simulation ID
- scenario ID
- technique ID

Do not destroy the original event.

==================================================
21. ALERT DEDUPLICATION
==================================================

Review noisy detections.

If a single attack produces:

100 identical alerts

consider thresholding or suppression.

But do not suppress genuinely distinct events.

Document:

- threshold
- timeframe
- grouping key

==================================================
22. NO LIVE ATTACK EXECUTION
==================================================

This phase must remain configuration/testing focused.

Do NOT automatically execute:

Atomic Red Team
DVWA attacks
Juice Shop attacks

The existing attack wrappers remain operator-controlled.

Detection tests should initially use:

- sample logs
- wazuh-logtest
- controlled synthetic events

Live attack validation will happen later.

==================================================
23. ANSIBLE IMPLEMENTATION
==================================================

Extend:

ansible/roles/wazuh/

Add:

- custom rules
- custom decoders
- test samples
- validation tasks

Everything must be reproducible.

Do not manually modify only the live server.

==================================================
24. DETECTION HEALTH CHECK
==================================================

Create:

scripts/detection-health-check.sh

It must verify:

- custom rule files exist
- custom decoder files exist
- rule IDs do not conflict
- XML syntax valid
- sample tests exist
- positive tests pass
- negative tests pass

Return:

PASS
FAIL

with useful error messages.

==================================================
25. VALIDATION
==================================================

Run:

terraform fmt -check -recursive
terraform validate
terraform plan

Run:

make ansible-syntax

Run:

make health-check

Run:

detection-health-check.sh

Run:

wazuh-logtest

or the correct supported testing mechanism.

Run secret scanning.

==================================================
26. LIVE INFRASTRUCTURE STATUS
==================================================

Terraform apply has STILL NOT been automatically authorized.

Therefore do NOT claim:

- Wazuh rules work live
- alerts appear in Dashboard
- source-specific indexes receive alerts
- correlation works live

Only report offline detection testing results.

The future live-validation phase will test:

real attack
    ↓
real telemetry
    ↓
real Wazuh rule
    ↓
real index
    ↓
real Dashboard

==================================================
27. DOCUMENTATION
==================================================

Create:

docs/detection-engineering.md

Include:

- detection philosophy
- rule ID range
- decoder architecture
- detection catalog
- severity model
- false-positive strategy
- ATT&CK mappings
- testing methodology
- correlation strategy

Also create:

docs/detection-test-results.md

Record every positive/negative test.

==================================================
28. GIT
==================================================

Before committing:

git status
git diff

Run all validation.

Run secret scanning.

Then:

git add ansible tests scripts docs
git commit -m "feat: add SOCForge detection engineering"

Do NOT push.

Do NOT create a GitHub remote.

Verify:

git status
git log --oneline -3
git remote -v

Working tree must be clean.

==================================================
29. FINAL REPORT
==================================================

Report:

1. Detection catalog
2. Custom rules
3. Custom decoders
4. Rule ID namespace
5. ATT&CK mappings
6. Severity model
7. False-positive controls
8. Correlation logic
9. Positive test results
10. Negative test results
11. Dashboard changes
12. Terraform validation
13. Ansible validation
14. Secret scan
15. Git commit hash
16. Live validation status

Clearly separate:

OFFLINE DETECTION VALIDATION

from:

LIVE SOC VALIDATION

==================================================
30. NEXT PHASE
==================================================

After Phase 13, recommend:

Phase 14 — SOCForge Live Infrastructure Deployment & End-to-End Validation

This will be the first phase where the project is actually deployed to AWS.

It must:

1. Verify AWS credentials.
2. Review Terraform plan.
3. Explicitly obtain deployment authorization.
4. Run terraform apply.
5. Generate Terraform outputs.
6. Generate Ansible inventory.
7. Establish Bastion connectivity.
8. Run Ansible provisioning.
9. Deploy Wazuh.
10. Configure Windows/Sysmon.
11. Configure Web target.
12. Configure Juice Shop.
13. Configure Attack host.
14. Validate Wazuh ingestion.
15. Validate separate indexes.
16. Validate detections.
17. Run controlled Atomic tests.
18. Run controlled web tests.
19. Measure resource usage.
20. Fix real deployment issues.
21. Re-run all health checks.
22. Destroy infrastructure after validation if requested.

DO NOT implement Phase 14 automatically.

STOP after Phase 13.