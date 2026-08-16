# SOCForge

> **SOCForge** is an open, reproducible **SOC-as-Code** cybersecurity training environment deployed on Amazon Web Services (AWS). It bridges infrastructure-as-code, endpoint telemetry, SIEM detection engineering, and attack simulation into an integrated hands-on lab.

---

## Table of Contents

- [Overview](#overview)
- [Core Learning Objectives](#core-learning-objectives)
- [Target Architecture Overview](#target-architecture-overview)
- [Project Phasing & Status](#project-phasing--status)
- [Important AWS Cost & Safety Warning](#important-aws-cost--safety-warning)
- [Repository Structure](#repository-structure)
- [Getting Started (Phase 1)](#getting-started-phase-1)
- [Documentation Index](#documentation-index)
- [License](#license)

---

## Overview

SOCForge is designed to give security analysts, detection engineers, and security enthusiasts a complete lifecycle environment for threat detection, incident triage, and forensic analysis. Using **Terraform** for infrastructure-as-code and **Ansible** for automated system configuration, SOCForge builds a realistic corporate threat simulation playground on AWS.

The lab connects real-world attacker techniques with high-fidelity endpoint and network telemetry, forwarding logs to a centralized **Wazuh** SIEM/XDR deployment for custom detection and rule engineering.

---

## Core Learning Objectives

Learners working through SOCForge study and practice ten core cybersecurity disciplines:

1. **AWS Infrastructure**: Deploying and managing cloud assets using Terraform.
2. **Cloud & Enterprise Networking**: VPC architecture, subnet segregation, routing, and least-privilege security groups.
3. **Linux & Windows Endpoint Telemetry**: Configuring audit subsystems, Sysmon, and Windows Event Logging.
4. **Security Information & Event Management (SIEM)**: Deploying, administering, and navigating Wazuh Manager, Indexer, and Dashboard.
5. **Centralized Log Collection**: Ingesting, parsing, and separating application, system, and network log streams into distinct index patterns.
6. **Detection Engineering**: Authoring custom Wazuh decoders and rules, tuning alert thresholds, and reducing false positives.
7. **MITRE ATT&CK Alignment**: Mapping adversary tactics, techniques, and procedures (TTPs) directly to detection alerts.
8. **Attack Simulation**: Executing controlled, reproducible adversary tests via Atomic Red Team.
9. **Alert Investigation & Triage**: Investigating alert timelines, correlating process execution chains, and identifying Indicators of Compromise (IOCs).
10. **Incident Response Fundamentals**: Developing response workflows, containment strategies, and post-incident forensic notes.

---

## Target Architecture Overview

The full SOCForge environment deploys an isolated AWS Virtual Private Cloud (VPC) hosting distinct functional tiers:

* **Wazuh SIEM / XDR Platform**: Centralized manager, OpenSearch-compatible indexer, and web dashboard.
* **Windows Employee Endpoint**: Windows Server / Windows client workstation configured with Microsoft Sysmon and the Wazuh Agent.
* **Linux Web Server**: Ubuntu/Debian server running an Nginx reverse proxy.
* **Deliberately Vulnerable Web Application**: Vulnerable target web app exposed internally on port `8000`.
* **OWASP Juice Shop**: Containerized vulnerable modern web application running in Docker on port `3000`.
* **Atomic Red Team Attack Environment**: Attack execution harness to emulate adversary techniques against endpoints and web services.

```text
                                  +-----------------------+
                                  |    Internet Access    |
                                  | (Restricted / Ingress)|
                                  +-----------+-----------+
                                              |
                                              v
+-----------------------------------------------------------------------------------------+
| AWS VPC: 10.10.0.0/16                                                                   |
|                                                                                         |
|  +--------------------------------+       +------------------------------------------+  |
|  | Management Subnet (10.10.1.0/24)|       | SOC Subnet (10.10.10.0/24)               |  |
|  | - Bastion / Control VM Access  |       | - Wazuh SIEM (Manager, Indexer, Web)     |  |
|  +--------------------------------+       +------------------------------------------+  |
|                                                                                         |
|  +--------------------------------+       +------------------------------------------+  |
|  | Target / Web (10.10.30.0/24)   |       | Endpoint Subnet                          |  |
|  | - Linux Web Server (Nginx)     |       | - Windows Employee Endpoint              |  |
|  | - Vuln App (:8000)             |       |   (Sysmon + Wazuh Agent)                 |  |
|  | - OWASP Juice Shop (:3000)     |       +------------------------------------------+  |
|  +--------------------------------+                                                     |
|                                                                                         |
|  +--------------------------------+                                                     |
|  | Attack Subnet (10.10.20.0/24)  |                                                     |
|  | - Atomic Red Team Harness      |                                                     |
|  +--------------------------------+                                                     |
+-----------------------------------------------------------------------------------------+
```

---

## Project Phasing & Status

SOCForge is developed in iterative phases:

* **Phase 1: Project Foundation (Current)** — Directory structure, standards, documentation, preflight verification scripts, and local health checks.
* **Phase 2: Terraform Infrastructure** — Modular AWS VPC, subnets, route tables, security groups, and EC2 instance declarations.
* **Phase 3: Ansible Configuration** — Automated provisioning for Wazuh, Windows endpoint (Sysmon), Linux Web Server (Nginx, Juice Shop), and Docker.
* **Phase 4: Telemetry & Log Routing** — Agent configuration, centralized log forwarding, and index separation.
* **Phase 5: Attack Simulation & Detection** — Atomic Red Team attack matrices and custom Wazuh detection rules aligned with MITRE ATT&CK.

> **Current Phase: Phase 1 (Foundation)**. No AWS cloud infrastructure is created in this phase.

---

## Important AWS Cost & Safety Warning

> ⚠️ **AWS BILLING & USAGE NOTICE**
>
> SOCForge deploys multi-node cloud infrastructure on Amazon Web Services (including EC2 compute instances, EBS storage volumes, and VPC networking resources).
>
> * **AWS resources can and will incur monetary costs.**
> * **Do NOT assume that all resources fall within the AWS Free Tier.** Windows instances, multi-core SIEM servers, and data transfer may exceed free allowances.
> * Users are solely responsible for monitoring their AWS billing dashboard, setting up AWS Billing Alerts / Budgets, and destroying all provisioned infrastructure (`terraform destroy`) immediately after training sessions.
> * Never expose vulnerable applications (DVWA, Juice Shop) to `0.0.0.0/0` (public Internet). Keep all vulnerable targets restricted to internal private subnets or authorized IP ranges.

---

## Repository Structure

```text
socforge/
├── README.md               # Project overview and main guide
├── LICENSE                 # MIT License
├── .gitignore              # Git ignore rules for state, secrets, and caches
├── .editorconfig           # Project-wide code style configuration
├── Makefile                # Developer build and verification targets
│
├── docs/                   # Conceptual and technical documentation
│   ├── architecture.md     # In-depth architectural blueprint
│   ├── deployment.md       # Target deployment lifecycle & pipeline
│   ├── networking.md       # Network layout, subnets, and traffic isolation
│   ├── logging.md          # Log sources, index patterns, and analysis flow
│   └── learning-path.md    # Step-by-step modular curriculum (Levels 1–7)
│
├── scripts/                # Utility scripts
│   ├── preflight.sh        # Prerequisite and tool validation script
│   └── health-check.sh     # Local repository integrity health check
│
├── terraform/              # Terraform modules (Phase 2)
│   └── .gitkeep
├── ansible/                # Ansible roles and playbooks (Phase 3)
│   └── .gitkeep
├── detection/              # Custom Wazuh detection rules & decoders (Phase 5)
│   └── .gitkeep
├── attacks/                # Atomic Red Team simulation playbooks (Phase 5)
│   └── .gitkeep
└── tests/                  # Automated integration tests
    └── .gitkeep
```

---

## Getting Started (Phase 1)

### Prerequisites

The control machine (such as a local Debian 13 VM or Linux workstation) requires the following tools for upcoming phases:

* `git` (>= 2.30)
* `terraform` (>= 1.5)
* `ansible` (>= 2.15)
* `aws-cli` (v2)
* `python3` (>= 3.10)
* `ssh` client

### Developer Commands

To view available management commands:

```bash
make help
```

To run the local control machine prerequisite checks:

```bash
make preflight
```

To verify local repository integrity:

```bash
make health-check
```

To run shell script syntax validation:

```bash
make lint
```

---

## Documentation Index

Detailed architectural blueprints and study guides are located in [`docs/`](docs/):

* [**Architecture Blueprint**](docs/architecture.md): Conceptual diagrams and component breakdown.
* [**Deployment Guide**](docs/deployment.md): Deployment workflow from Debian 13 control machine.
* [**Networking Specification**](docs/networking.md): Subnet designs, routing, and security boundaries.
* [**Logging & Telemetry Architecture**](docs/logging.md): Log ingestion, index schemas, and event correlation.
* [**Learning Path**](docs/learning-path.md): 7-tier beginner-to-advanced curriculum.

---

## License

This project is licensed under the terms of the [MIT License](LICENSE).
