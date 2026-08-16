# SOCForge — Phase 1: Project Foundation

You are working on a cybersecurity training project called **SOCForge**.

SOCForge is intended to become a reproducible SOC-as-Code training environment deployed on AWS using:

* Terraform for AWS infrastructure
* Ansible for machine configuration
* Wazuh as the SIEM/XDR platform
* Windows employee endpoint with Sysmon and Wazuh Agent
* Linux web server
* Nginx serving a deliberately vulnerable web application on port 8000
* OWASP Juice Shop running in Docker on port 3000
* Atomic Red Team for controlled attack simulation
* Centralized log collection and separated log sources/indexes
* MITRE ATT&CK-aligned detection and investigation scenarios

The project will eventually be deployed from a **Debian 13 VM** because the developer's primary host OS is Windows.

## IMPORTANT SCOPE RESTRICTION

This is **PHASE 1 ONLY**.

Do NOT:

* create AWS resources
* run `terraform apply`
* run `terraform destroy`
* configure AWS networking
* create EC2 instances
* install Wazuh
* install Ansible roles
* install Atomic Red Team
* deploy Juice Shop
* deploy DVWA
* configure Nginx
* create Wazuh indexes
* configure Wazuh agents
* push anything to GitHub

Do not make assumptions that later infrastructure already exists.

The goal of this phase is to create a clean, maintainable project foundation.

---

# 1. Inspect the current repository

First inspect the current working directory.

Determine:

* whether Git is already initialized
* current branch
* current commits
* existing files
* existing `.gitignore`
* existing Git remotes

Do not delete existing user work.

If the repository is already initialized, preserve the existing Git history.

Do not create a GitHub remote.

Do not push anything.

---

# 2. Establish the project structure

Create the following structure:

socforge/
├── README.md
├── LICENSE
├── .gitignore
├── .editorconfig
├── Makefile
│
├── docs/
│   ├── architecture.md
│   ├── deployment.md
│   ├── networking.md
│   ├── logging.md
│   └── learning-path.md
│
├── scripts/
│   ├── preflight.sh
│   └── health-check.sh
│
├── terraform/
│   └── .gitkeep
│
├── ansible/
│   └── .gitkeep
│
├── detection/
│   └── .gitkeep
│
├── attacks/
│   └── .gitkeep
│
└── tests/
└── .gitkeep

Do not create unnecessary directories.

Keep the structure intentionally small at this stage.

---

# 3. Create the README

Create a professional README for SOCForge.

Explain that SOCForge is intended to provide a reproducible SOC training environment where a learner can study:

1. AWS infrastructure
2. networking
3. Linux and Windows endpoints
4. SIEM
5. log collection
6. detection engineering
7. MITRE ATT&CK
8. attack simulation
9. alert investigation
10. incident-response fundamentals

Explain the eventual architecture at a high level.

The eventual environment will contain:

* Wazuh SIEM
* Windows employee endpoint
* Linux web server
* Nginx
* deliberately vulnerable web application on port 8000
* OWASP Juice Shop on port 3000
* Atomic Red Team attack environment

Make clear that the environment is intended for an isolated AWS security-training lab.

Include a prominent warning that AWS resources can incur costs and users must verify their own AWS Free Tier eligibility and destroy resources when finished.

Do NOT claim that the entire environment is guaranteed to be free.

---

# 4. Document the planned architecture

Create:

docs/architecture.md

Document the intended architecture, but do not implement it.

Use this conceptual structure:

Internet
|
v
AWS VPC
10.10.0.0/16
|
+-----------------------------+
|                             |
v                             v
Management / access          SOC lab network
|
+---------------------+---------------------+
|                     |                     |
v                     v                     v
Wazuh SIEM          Windows Employee        Web Server
|                     |
|              +------+------+
|              |             |
|           Nginx :8000   Juice Shop
|              |           :3000
|              v
|         Vulnerable Web
|
^
|
Atomic Red Team

Explain that this is the target architecture and will be implemented in later phases.

Also document that the architecture may evolve after resource/cost validation.

---

# 5. Document networking goals

Create:

docs/networking.md

Document the intended network design.

Initial target:

VPC:
10.10.0.0/16

Potential subnet layout:

Management:
10.10.1.0/24

SOC:
10.10.10.0/24

Attack:
10.10.20.0/24

Target/Web:
10.10.30.0/24

These are design targets only.

Do not create these networks yet.

Explain the security principle:

* avoid unnecessary public exposure
* internal communication should use private IPs
* security groups should follow least privilege
* management access should not be open to 0.0.0.0/0
* vulnerable applications should not be exposed directly to the public Internet
* the attack environment must remain isolated
* the project must clearly distinguish management traffic, telemetry traffic, application traffic and attack traffic

---

# 6. Document the logging architecture

Create:

docs/logging.md

Logging is a first-class requirement of SOCForge.

The eventual design should separate major log sources.

Target logical log groups/index patterns:

* Windows security/system/application logs
* Sysmon telemetry
* Nginx access logs
* Nginx error logs
* Juice Shop application/container logs
* Atomic Red Team/test telemetry
* Wazuh alerts

Use conceptual names such as:

soc-windows-*
soc-sysmon-*
soc-nginx-access-*
soc-nginx-error-*
soc-juiceshop-*
soc-atomic-*

Do NOT configure these indexes yet.

Clearly document that Wazuh's native alert/index architecture must be preserved and that custom log separation should be implemented without breaking Wazuh's built-in functionality.

The future goal is to allow a learner to investigate:

Web request
↓
Application event
↓
Endpoint telemetry
↓
Wazuh event
↓
Detection
↓
Alert
↓
Investigation

---

# 7. Document the learning path

Create:

docs/learning-path.md

Create a beginner-friendly progression:

## Level 1 — Infrastructure

* AWS
* VPC
* subnets
* route tables
* security groups
* EC2
* IAM
* Terraform

## Level 2 — System and endpoint telemetry

* Linux
* Windows
* Sysmon
* Windows Event Logs
* Wazuh Agent

## Level 3 — SIEM

* Wazuh Manager
* Wazuh Indexer
* Wazuh Dashboard
* events
* alerts
* rules
* decoders
* file integrity monitoring

## Level 4 — Web security

* HTTP
* Nginx
* access logs
* error logs
* Juice Shop
* vulnerable web applications
* web attack telemetry

## Level 5 — Attack simulation

* MITRE ATT&CK
* Atomic Red Team
* controlled attack techniques
* expected telemetry

## Level 6 — SOC investigation

* alert triage
* IOC identification
* timeline construction
* source/destination analysis
* process analysis
* false positive vs true positive
* MITRE ATT&CK mapping

## Level 7 — Detection engineering

* Wazuh rules
* detection logic
* severity
* tuning
* validation
* detection coverage

---

# 8. Create the deployment documentation

Create:

docs/deployment.md

Describe the eventual deployment pipeline:

Debian 13
|
+--> Terraform
|       |
|       +--> AWS infrastructure
|
+--> dynamic inventory
|
+--> Ansible
|
+--> Wazuh
+--> Windows endpoint
+--> Web server
+--> Juice Shop
+--> Atomic Red Team

Document the intended future commands conceptually:

./scripts/preflight.sh
terraform plan
terraform apply
ansible-playbook ...
./scripts/health-check.sh

Do not implement the full deployment yet.

---

# 9. Create .gitignore

The repository must never commit secrets or generated infrastructure state.

Include appropriate exclusions for:

* Terraform `.tfstate`
* Terraform `.tfstate.*`
* `.terraform/`
* Terraform crash logs
* variable files containing secrets
* SSH private keys
* AWS credentials
* `.env`
* Python virtual environments
* Ansible retry files
* generated inventories if they contain sensitive information
* logs
* OS/editor temporary files
* caches
* generated reports

Be careful not to ignore files that should be version controlled.

---

# 10. Create .editorconfig

Use a simple project-wide configuration.

Recommended:

* UTF-8
* LF line endings
* final newline
* spaces instead of tabs
* reasonable indentation

Do not over-engineer this.

---

# 11. Create the Makefile

Create basic development commands only.

For example:

make help
make preflight
make lint

At this phase they should only invoke functionality that actually exists.

Do not create fake commands.

`make help` should explain the available commands.

---

# 12. Create scripts/preflight.sh

Create a safe prerequisite checker for the Debian 13 control VM.

Check whether the following commands exist:

* git
* terraform
* ansible
* aws
* python3
* ssh

Also check:

* operating system
* architecture
* available disk space
* available memory

The script should NOT install anything automatically.

Instead it should report missing prerequisites clearly.

Example conceptual output:

# SOCForge Preflight

OS:
Debian GNU/Linux 13

Tools:
Git        [OK]
Terraform  [OK]
Ansible    [OK]
AWS CLI    [OK]
Python3    [OK]
SSH        [OK]

Result:
PASS

or:

Result:
FAIL

Missing:
Terraform
AWS CLI

Use proper exit codes:

0 = all required checks passed
non-zero = one or more checks failed

Make the script executable.

---

# 13. Create scripts/health-check.sh

For this phase, this script should only perform local/control-machine checks.

Do NOT attempt to connect to AWS.

Check:

* repository exists
* required directories exist
* Git repository exists
* required documentation files exist
* required tools are available

Later phases will extend this script to perform AWS/SOC health checks.

---

# 14. Code quality

Use:

* clear naming
* comments only where useful
* no unnecessary dependencies
* POSIX-compatible shell where practical
* safe shell practices such as `set -euo pipefail`
* meaningful exit codes
* no hard-coded AWS credentials
* no secrets
* no private keys
* no fake infrastructure state

Do not introduce Python dependencies in Phase 1 unless genuinely necessary.

---

# 15. Validate the implementation

Before committing:

Run the available validation.

At minimum:

```bash
git status
```

Check shell scripts for syntax errors:

```bash
bash -n scripts/preflight.sh
bash -n scripts/health-check.sh
```

Run:

```bash
./scripts/preflight.sh
./scripts/health-check.sh
make help
```

If Terraform exists on the system, verify that the empty Terraform directory does not cause problems, but do NOT run `terraform apply`.

Verify that no credentials, `.tfstate`, private keys or generated secrets were accidentally created.

Run:

```bash
git diff
git status
```

Review the changes before committing.

---

# 16. Git commit requirement

This is mandatory.

After successful validation:

```bash
git add .
git commit -m "chore: establish SOCForge project foundation"
```

Do NOT run:

```bash
git push
```

Do NOT create a GitHub remote.

After committing, run:

```bash
git status
git log --oneline -1
git remote -v
```

The working tree should be clean.

If there are validation failures, fix them before committing.

Do not make a commit that knowingly contains broken Phase 1 functionality.

---

# 17. Final response

After completing Phase 1, report:

1. Files created
2. Files modified
3. Validation commands executed
4. Validation results
5. Git commit hash
6. Git commit message
7. Current branch
8. Whether a Git remote exists
9. Any unresolved issues
10. What Phase 2 should implement

Do not proceed into Phase 2 automatically.

STOP after Phase 1 is complete.
# SOCForge — Phase 1: Project Foundation

You are working on a cybersecurity training project called **SOCForge**.

SOCForge is intended to become a reproducible SOC-as-Code training environment deployed on AWS using:

* Terraform for AWS infrastructure
* Ansible for machine configuration
* Wazuh as the SIEM/XDR platform
* Windows employee endpoint with Sysmon and Wazuh Agent
* Linux web server
* Nginx serving a deliberately vulnerable web application on port 8000
* OWASP Juice Shop running in Docker on port 3000
* Atomic Red Team for controlled attack simulation
* Centralized log collection and separated log sources/indexes
* MITRE ATT&CK-aligned detection and investigation scenarios

The project will eventually be deployed from a **Debian 13 VM** because the developer's primary host OS is Windows.

## IMPORTANT SCOPE RESTRICTION

This is **PHASE 1 ONLY**.

Do NOT:

* create AWS resources
* run `terraform apply`
* run `terraform destroy`
* configure AWS networking
* create EC2 instances
* install Wazuh
* install Ansible roles
* install Atomic Red Team
* deploy Juice Shop
* deploy DVWA
* configure Nginx
* create Wazuh indexes
* configure Wazuh agents
* push anything to GitHub

Do not make assumptions that later infrastructure already exists.

The goal of this phase is to create a clean, maintainable project foundation.

---

# 1. Inspect the current repository

First inspect the current working directory.

Determine:

* whether Git is already initialized
* current branch
* current commits
* existing files
* existing `.gitignore`
* existing Git remotes

Do not delete existing user work.

If the repository is already initialized, preserve the existing Git history.

Do not create a GitHub remote.

Do not push anything.

---

# 2. Establish the project structure

Create the following structure:

socforge/
├── README.md
├── LICENSE
├── .gitignore
├── .editorconfig
├── Makefile
│
├── docs/
│   ├── architecture.md
│   ├── deployment.md
│   ├── networking.md
│   ├── logging.md
│   └── learning-path.md
│
├── scripts/
│   ├── preflight.sh
│   └── health-check.sh
│
├── terraform/
│   └── .gitkeep
│
├── ansible/
│   └── .gitkeep
│
├── detection/
│   └── .gitkeep
│
├── attacks/
│   └── .gitkeep
│
└── tests/
└── .gitkeep

Do not create unnecessary directories.

Keep the structure intentionally small at this stage.

---

# 3. Create the README

Create a professional README for SOCForge.

Explain that SOCForge is intended to provide a reproducible SOC training environment where a learner can study:

1. AWS infrastructure
2. networking
3. Linux and Windows endpoints
4. SIEM
5. log collection
6. detection engineering
7. MITRE ATT&CK
8. attack simulation
9. alert investigation
10. incident-response fundamentals

Explain the eventual architecture at a high level.

The eventual environment will contain:

* Wazuh SIEM
* Windows employee endpoint
* Linux web server
* Nginx
* deliberately vulnerable web application on port 8000
* OWASP Juice Shop on port 3000
* Atomic Red Team attack environment

Make clear that the environment is intended for an isolated AWS security-training lab.

Include a prominent warning that AWS resources can incur costs and users must verify their own AWS Free Tier eligibility and destroy resources when finished.

Do NOT claim that the entire environment is guaranteed to be free.

---

# 4. Document the planned architecture

Create:

docs/architecture.md

Document the intended architecture, but do not implement it.

Use this conceptual structure:

Internet
|
v
AWS VPC
10.10.0.0/16
|
+-----------------------------+
|                             |
v                             v
Management / access          SOC lab network
|
+---------------------+---------------------+
|                     |                     |
v                     v                     v
Wazuh SIEM          Windows Employee        Web Server
|                     |
|              +------+------+
|              |             |
|           Nginx :8000   Juice Shop
|              |           :3000
|              v
|         Vulnerable Web
|
^
|
Atomic Red Team

Explain that this is the target architecture and will be implemented in later phases.

Also document that the architecture may evolve after resource/cost validation.

---

# 5. Document networking goals

Create:

docs/networking.md

Document the intended network design.

Initial target:

VPC:
10.10.0.0/16

Potential subnet layout:

Management:
10.10.1.0/24

SOC:
10.10.10.0/24

Attack:
10.10.20.0/24

Target/Web:
10.10.30.0/24

These are design targets only.

Do not create these networks yet.

Explain the security principle:

* avoid unnecessary public exposure
* internal communication should use private IPs
* security groups should follow least privilege
* management access should not be open to 0.0.0.0/0
* vulnerable applications should not be exposed directly to the public Internet
* the attack environment must remain isolated
* the project must clearly distinguish management traffic, telemetry traffic, application traffic and attack traffic

---

# 6. Document the logging architecture

Create:

docs/logging.md

Logging is a first-class requirement of SOCForge.

The eventual design should separate major log sources.

Target logical log groups/index patterns:

* Windows security/system/application logs
* Sysmon telemetry
* Nginx access logs
* Nginx error logs
* Juice Shop application/container logs
* Atomic Red Team/test telemetry
* Wazuh alerts

Use conceptual names such as:

soc-windows-*
soc-sysmon-*
soc-nginx-access-*
soc-nginx-error-*
soc-juiceshop-*
soc-atomic-*

Do NOT configure these indexes yet.

Clearly document that Wazuh's native alert/index architecture must be preserved and that custom log separation should be implemented without breaking Wazuh's built-in functionality.

The future goal is to allow a learner to investigate:

Web request
↓
Application event
↓
Endpoint telemetry
↓
Wazuh event
↓
Detection
↓
Alert
↓
Investigation

---

# 7. Document the learning path

Create:

docs/learning-path.md

Create a beginner-friendly progression:

## Level 1 — Infrastructure

* AWS
* VPC
* subnets
* route tables
* security groups
* EC2
* IAM
* Terraform

## Level 2 — System and endpoint telemetry

* Linux
* Windows
* Sysmon
* Windows Event Logs
* Wazuh Agent

## Level 3 — SIEM

* Wazuh Manager
* Wazuh Indexer
* Wazuh Dashboard
* events
* alerts
* rules
* decoders
* file integrity monitoring

## Level 4 — Web security

* HTTP
* Nginx
* access logs
* error logs
* Juice Shop
* vulnerable web applications
* web attack telemetry

## Level 5 — Attack simulation

* MITRE ATT&CK
* Atomic Red Team
* controlled attack techniques
* expected telemetry

## Level 6 — SOC investigation

* alert triage
* IOC identification
* timeline construction
* source/destination analysis
* process analysis
* false positive vs true positive
* MITRE ATT&CK mapping

## Level 7 — Detection engineering

* Wazuh rules
* detection logic
* severity
* tuning
* validation
* detection coverage

---

# 8. Create the deployment documentation

Create:

docs/deployment.md

Describe the eventual deployment pipeline:

Debian 13
|
+--> Terraform
|       |
|       +--> AWS infrastructure
|
+--> dynamic inventory
|
+--> Ansible
|
+--> Wazuh
+--> Windows endpoint
+--> Web server
+--> Juice Shop
+--> Atomic Red Team

Document the intended future commands conceptually:

./scripts/preflight.sh
terraform plan
terraform apply
ansible-playbook ...
./scripts/health-check.sh

Do not implement the full deployment yet.

---

# 9. Create .gitignore

The repository must never commit secrets or generated infrastructure state.

Include appropriate exclusions for:

* Terraform `.tfstate`
* Terraform `.tfstate.*`
* `.terraform/`
* Terraform crash logs
* variable files containing secrets
* SSH private keys
* AWS credentials
* `.env`
* Python virtual environments
* Ansible retry files
* generated inventories if they contain sensitive information
* logs
* OS/editor temporary files
* caches
* generated reports

Be careful not to ignore files that should be version controlled.

---

# 10. Create .editorconfig

Use a simple project-wide configuration.

Recommended:

* UTF-8
* LF line endings
* final newline
* spaces instead of tabs
* reasonable indentation

Do not over-engineer this.

---

# 11. Create the Makefile

Create basic development commands only.

For example:

make help
make preflight
make lint

At this phase they should only invoke functionality that actually exists.

Do not create fake commands.

`make help` should explain the available commands.

---

# 12. Create scripts/preflight.sh

Create a safe prerequisite checker for the Debian 13 control VM.

Check whether the following commands exist:

* git
* terraform
* ansible
* aws
* python3
* ssh

Also check:

* operating system
* architecture
* available disk space
* available memory

The script should NOT install anything automatically.

Instead it should report missing prerequisites clearly.

Example conceptual output:

# SOCForge Preflight

OS:
Debian GNU/Linux 13

Tools:
Git        [OK]
Terraform  [OK]
Ansible    [OK]
AWS CLI    [OK]
Python3    [OK]
SSH        [OK]

Result:
PASS

or:

Result:
FAIL

Missing:
Terraform
AWS CLI

Use proper exit codes:

0 = all required checks passed
non-zero = one or more checks failed

Make the script executable.

---

# 13. Create scripts/health-check.sh

For this phase, this script should only perform local/control-machine checks.

Do NOT attempt to connect to AWS.

Check:

* repository exists
* required directories exist
* Git repository exists
* required documentation files exist
* required tools are available

Later phases will extend this script to perform AWS/SOC health checks.

---

# 14. Code quality

Use:

* clear naming
* comments only where useful
* no unnecessary dependencies
* POSIX-compatible shell where practical
* safe shell practices such as `set -euo pipefail`
* meaningful exit codes
* no hard-coded AWS credentials
* no secrets
* no private keys
* no fake infrastructure state

Do not introduce Python dependencies in Phase 1 unless genuinely necessary.

---

# 15. Validate the implementation

Before committing:

Run the available validation.

At minimum:

```bash
git status
```

Check shell scripts for syntax errors:

```bash
bash -n scripts/preflight.sh
bash -n scripts/health-check.sh
```

Run:

```bash
./scripts/preflight.sh
./scripts/health-check.sh
make help
```

If Terraform exists on the system, verify that the empty Terraform directory does not cause problems, but do NOT run `terraform apply`.

Verify that no credentials, `.tfstate`, private keys or generated secrets were accidentally created.

Run:

```bash
git diff
git status
```

Review the changes before committing.

---

# 16. Git commit requirement

This is mandatory.

After successful validation:

```bash
git add .
git commit -m "chore: establish SOCForge project foundation"
```

Do NOT run:

```bash
git push
```

Do NOT create a GitHub remote.

After committing, run:

```bash
git status
git log --oneline -1
git remote -v
```

The working tree should be clean.

If there are validation failures, fix them before committing.

Do not make a commit that knowingly contains broken Phase 1 functionality.

---

# 17. Final response

After completing Phase 1, report:

1. Files created
2. Files modified
3. Validation commands executed
4. Validation results
5. Git commit hash
6. Git commit message
7. Current branch
8. Whether a Git remote exists
9. Any unresolved issues
10. What Phase 2 should implement

Do not proceed into Phase 2 automatically.

STOP after Phase 1 is complete.
# SOCForge — Phase 1: Project Foundation

You are working on a cybersecurity training project called **SOCForge**.

SOCForge is intended to become a reproducible SOC-as-Code training environment deployed on AWS using:

* Terraform for AWS infrastructure
* Ansible for machine configuration
* Wazuh as the SIEM/XDR platform
* Windows employee endpoint with Sysmon and Wazuh Agent
* Linux web server
* Nginx serving a deliberately vulnerable web application on port 8000
* OWASP Juice Shop running in Docker on port 3000
* Atomic Red Team for controlled attack simulation
* Centralized log collection and separated log sources/indexes
* MITRE ATT&CK-aligned detection and investigation scenarios

The project will eventually be deployed from a **Debian 13 VM** because the developer's primary host OS is Windows.

## IMPORTANT SCOPE RESTRICTION

This is **PHASE 1 ONLY**.

Do NOT:

* create AWS resources
* run `terraform apply`
* run `terraform destroy`
* configure AWS networking
* create EC2 instances
* install Wazuh
* install Ansible roles
* install Atomic Red Team
* deploy Juice Shop
* deploy DVWA
* configure Nginx
* create Wazuh indexes
* configure Wazuh agents
* push anything to GitHub

Do not make assumptions that later infrastructure already exists.

The goal of this phase is to create a clean, maintainable project foundation.

---

# 1. Inspect the current repository

First inspect the current working directory.

Determine:

* whether Git is already initialized
* current branch
* current commits
* existing files
* existing `.gitignore`
* existing Git remotes

Do not delete existing user work.

If the repository is already initialized, preserve the existing Git history.

Do not create a GitHub remote.

Do not push anything.

---

# 2. Establish the project structure

Create the following structure:

socforge/
├── README.md
├── LICENSE
├── .gitignore
├── .editorconfig
├── Makefile
│
├── docs/
│   ├── architecture.md
│   ├── deployment.md
│   ├── networking.md
│   ├── logging.md
│   └── learning-path.md
│
├── scripts/
│   ├── preflight.sh
│   └── health-check.sh
│
├── terraform/
│   └── .gitkeep
│
├── ansible/
│   └── .gitkeep
│
├── detection/
│   └── .gitkeep
│
├── attacks/
│   └── .gitkeep
│
└── tests/
└── .gitkeep

Do not create unnecessary directories.

Keep the structure intentionally small at this stage.

---

# 3. Create the README

Create a professional README for SOCForge.

Explain that SOCForge is intended to provide a reproducible SOC training environment where a learner can study:

1. AWS infrastructure
2. networking
3. Linux and Windows endpoints
4. SIEM
5. log collection
6. detection engineering
7. MITRE ATT&CK
8. attack simulation
9. alert investigation
10. incident-response fundamentals

Explain the eventual architecture at a high level.

The eventual environment will contain:

* Wazuh SIEM
* Windows employee endpoint
* Linux web server
* Nginx
* deliberately vulnerable web application on port 8000
* OWASP Juice Shop on port 3000
* Atomic Red Team attack environment

Make clear that the environment is intended for an isolated AWS security-training lab.

Include a prominent warning that AWS resources can incur costs and users must verify their own AWS Free Tier eligibility and destroy resources when finished.

Do NOT claim that the entire environment is guaranteed to be free.

---

# 4. Document the planned architecture

Create:

docs/architecture.md

Document the intended architecture, but do not implement it.

Use this conceptual structure:

Internet
|
v
AWS VPC
10.10.0.0/16
|
+-----------------------------+
|                             |
v                             v
Management / access          SOC lab network
|
+---------------------+---------------------+
|                     |                     |
v                     v                     v
Wazuh SIEM          Windows Employee        Web Server
|                     |
|              +------+------+
|              |             |
|           Nginx :8000   Juice Shop
|              |           :3000
|              v
|         Vulnerable Web
|
^
|
Atomic Red Team

Explain that this is the target architecture and will be implemented in later phases.

Also document that the architecture may evolve after resource/cost validation.

---

# 5. Document networking goals

Create:

docs/networking.md

Document the intended network design.

Initial target:

VPC:
10.10.0.0/16

Potential subnet layout:

Management:
10.10.1.0/24

SOC:
10.10.10.0/24

Attack:
10.10.20.0/24

Target/Web:
10.10.30.0/24

These are design targets only.

Do not create these networks yet.

Explain the security principle:

* avoid unnecessary public exposure
* internal communication should use private IPs
* security groups should follow least privilege
* management access should not be open to 0.0.0.0/0
* vulnerable applications should not be exposed directly to the public Internet
* the attack environment must remain isolated
* the project must clearly distinguish management traffic, telemetry traffic, application traffic and attack traffic

---

# 6. Document the logging architecture

Create:

docs/logging.md

Logging is a first-class requirement of SOCForge.

The eventual design should separate major log sources.

Target logical log groups/index patterns:

* Windows security/system/application logs
* Sysmon telemetry
* Nginx access logs
* Nginx error logs
* Juice Shop application/container logs
* Atomic Red Team/test telemetry
* Wazuh alerts

Use conceptual names such as:

soc-windows-*
soc-sysmon-*
soc-nginx-access-*
soc-nginx-error-*
soc-juiceshop-*
soc-atomic-*

Do NOT configure these indexes yet.

Clearly document that Wazuh's native alert/index architecture must be preserved and that custom log separation should be implemented without breaking Wazuh's built-in functionality.

The future goal is to allow a learner to investigate:

Web request
↓
Application event
↓
Endpoint telemetry
↓
Wazuh event
↓
Detection
↓
Alert
↓
Investigation

---

# 7. Document the learning path

Create:

docs/learning-path.md

Create a beginner-friendly progression:

## Level 1 — Infrastructure

* AWS
* VPC
* subnets
* route tables
* security groups
* EC2
* IAM
* Terraform

## Level 2 — System and endpoint telemetry

* Linux
* Windows
* Sysmon
* Windows Event Logs
* Wazuh Agent

## Level 3 — SIEM

* Wazuh Manager
* Wazuh Indexer
* Wazuh Dashboard
* events
* alerts
* rules
* decoders
* file integrity monitoring

## Level 4 — Web security

* HTTP
* Nginx
* access logs
* error logs
* Juice Shop
* vulnerable web applications
* web attack telemetry

## Level 5 — Attack simulation

* MITRE ATT&CK
* Atomic Red Team
* controlled attack techniques
* expected telemetry

## Level 6 — SOC investigation

* alert triage
* IOC identification
* timeline construction
* source/destination analysis
* process analysis
* false positive vs true positive
* MITRE ATT&CK mapping

## Level 7 — Detection engineering

* Wazuh rules
* detection logic
* severity
* tuning
* validation
* detection coverage

---

# 8. Create the deployment documentation

Create:

docs/deployment.md

Describe the eventual deployment pipeline:

Debian 13
|
+--> Terraform
|       |
|       +--> AWS infrastructure
|
+--> dynamic inventory
|
+--> Ansible
|
+--> Wazuh
+--> Windows endpoint
+--> Web server
+--> Juice Shop
+--> Atomic Red Team

Document the intended future commands conceptually:

./scripts/preflight.sh
terraform plan
terraform apply
ansible-playbook ...
./scripts/health-check.sh

Do not implement the full deployment yet.

---

# 9. Create .gitignore

The repository must never commit secrets or generated infrastructure state.

Include appropriate exclusions for:

* Terraform `.tfstate`
* Terraform `.tfstate.*`
* `.terraform/`
* Terraform crash logs
* variable files containing secrets
* SSH private keys
* AWS credentials
* `.env`
* Python virtual environments
* Ansible retry files
* generated inventories if they contain sensitive information
* logs
* OS/editor temporary files
* caches
* generated reports

Be careful not to ignore files that should be version controlled.

---

# 10. Create .editorconfig

Use a simple project-wide configuration.

Recommended:

* UTF-8
* LF line endings
* final newline
* spaces instead of tabs
* reasonable indentation

Do not over-engineer this.

---

# 11. Create the Makefile

Create basic development commands only.

For example:

make help
make preflight
make lint

At this phase they should only invoke functionality that actually exists.

Do not create fake commands.

`make help` should explain the available commands.

---

# 12. Create scripts/preflight.sh

Create a safe prerequisite checker for the Debian 13 control VM.

Check whether the following commands exist:

* git
* terraform
* ansible
* aws
* python3
* ssh

Also check:

* operating system
* architecture
* available disk space
* available memory

The script should NOT install anything automatically.

Instead it should report missing prerequisites clearly.

Example conceptual output:

# SOCForge Preflight

OS:
Debian GNU/Linux 13

Tools:
Git        [OK]
Terraform  [OK]
Ansible    [OK]
AWS CLI    [OK]
Python3    [OK]
SSH        [OK]

Result:
PASS

or:

Result:
FAIL

Missing:
Terraform
AWS CLI

Use proper exit codes:

0 = all required checks passed
non-zero = one or more checks failed

Make the script executable.

---

# 13. Create scripts/health-check.sh

For this phase, this script should only perform local/control-machine checks.

Do NOT attempt to connect to AWS.

Check:

* repository exists
* required directories exist
* Git repository exists
* required documentation files exist
* required tools are available

Later phases will extend this script to perform AWS/SOC health checks.

---

# 14. Code quality

Use:

* clear naming
* comments only where useful
* no unnecessary dependencies
* POSIX-compatible shell where practical
* safe shell practices such as `set -euo pipefail`
* meaningful exit codes
* no hard-coded AWS credentials
* no secrets
* no private keys
* no fake infrastructure state

Do not introduce Python dependencies in Phase 1 unless genuinely necessary.

---

# 15. Validate the implementation

Before committing:

Run the available validation.

At minimum:

```bash
git status
```

Check shell scripts for syntax errors:

```bash
bash -n scripts/preflight.sh
bash -n scripts/health-check.sh
```

Run:

```bash
./scripts/preflight.sh
./scripts/health-check.sh
make help
```

If Terraform exists on the system, verify that the empty Terraform directory does not cause problems, but do NOT run `terraform apply`.

Verify that no credentials, `.tfstate`, private keys or generated secrets were accidentally created.

Run:

```bash
git diff
git status
```

Review the changes before committing.

---

# 16. Git commit requirement

This is mandatory.

After successful validation:

```bash
git add .
git commit -m "chore: establish SOCForge project foundation"
```

Do NOT run:

```bash
git push
```

Do NOT create a GitHub remote.

After committing, run:

```bash
git status
git log --oneline -1
git remote -v
```

The working tree should be clean.

If there are validation failures, fix them before committing.

Do not make a commit that knowingly contains broken Phase 1 functionality.

---

# 17. Final response

After completing Phase 1, report:

1. Files created
2. Files modified
3. Validation commands executed
4. Validation results
5. Git commit hash
6. Git commit message
7. Current branch
8. Whether a Git remote exists
9. Any unresolved issues
10. What Phase 2 should implement

Do not proceed into Phase 2 automatically.

STOP after Phase 1 is complete.
