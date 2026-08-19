# THEDAL — Phase 19: Local Control Plane Frontend Rebuild Report

**Document ID:** `QA-PHASE19-CONTROL-PLANE-REBUILD`  
**Date:** 2026-08-19  
**Target Environment:** Localhost (Linux / Debian 13)  
**Status:** **PASSED / PRODUCTION READY**  
**Version:** `v1.0.0`

---

## 1. Executive Summary

Phase 19 successfully executed a complete frontend architectural rebuild of the **THEDAL Local Control Plane**, transitioning from the legacy server-rendered Jinja2/Vanilla-JS UI to a modern, type-safe, high-density operations application built with **Next.js 14 (App Router), React 18, TypeScript, and Tailwind CSS**.

The rebuild adhered strictly to the global design authority established in `design-system/MASTER.md` (**Minimalist Swiss + Technical Operations Console + Data-Dense Monitoring + Cybersecurity Learning Platform**).

### Stack Transformation
| Layer | Legacy Architecture | Phase 19 Architecture |
|---|---|---|
| **Framework** | FastAPI Jinja2 Templates | Next.js 14 App Router (React Server & Client Components) |
| **Language** | Vanilla JavaScript (ES6) | TypeScript (Strict Mode, 100% Typed API Client) |
| **Styling** | Custom Ad-hoc CSS | Tailwind CSS (Design Tokens, Dark Swiss Palette, JetBrains Mono) |
| **API Boundary** | Form Submissions & AJAX | Typed REST API Client + Next.js Server Rewrites (`/api/*`) |
| **State Persistence** | Basic SQLite Ingestion | SQLite (`learner_state.db`) + Client-Side Live Polling / SSE |

---

## 2. Route Architecture & Component Specifications

The rebuilt frontend delivers high-performance, responsive, and data-dense views across all operator workflows:

### 2.1 Overview (`/`)
- **Top Environment Metrics**: Real-time AWS connectivity (`ap-south-1`), Terraform state status, compute fleet operational count (`5 / 5 Active`), and overall system health badge.
- **Quick Operator Controls**: Instant access to dry-run Terraform Plan, Start/Stop Fleet, Wazuh Tunnel initiation, and Operations Console.
- **Compute Fleet Summary**: Compact inventory table with host roles, operational states, private/public IPs, and direct links to host details.
- **Split Diagnostics & Progress**: Live overview of top system probes alongside learner curriculum completion metrics.

### 2.2 Infrastructure Fleet & Topology (`/infrastructure`, `/infrastructure/[host]`, `/infrastructure/commands`)
- **Fleet Inventory (`/infrastructure`)**: Filterable, sortable `DataTable` displaying Bastion, Wazuh, Windows, Web Target, and Attack nodes with health status badges.
- **VPC Subnets & Routing**: Detailed CIDR breakdown for Management (`10.10.1.0/24`), SOC (`10.10.10.0/24`), Target (`10.10.20.0/24`), and Attack (`10.10.30.0/24`) subnets.
- **Zero NAT Gateway Policy**: Explicit documentation of single-public-IPv4 architecture and forward proxy routing to minimize AWS cloud spend.
- **Host Detail Workspace (`/infrastructure/[host]`)**: Deep-dive telemetry for individual nodes, complete running service matrix (Wazuh remoted, Sysmon driver, Nginx, DVWA, Juice Shop, Atomic Red Team), and dedicated connection commands.
- **Dynamic Command Center (`/infrastructure/commands`)**: Dynamically derives live Bastion and private subnet IP addresses from current Terraform/AWS state with one-click copy and toast confirmations.

### 2.3 Operations & Orchestration (`/operations`, `/operations/[id]`)
- **Terraform Lifecycle**: Plan (dry-run drift check) and Apply (provision/update AWS).
- **Compute State Controls**: Safe Start and Stop (pause compute billing while preserving EBS storage and lab state).
- **Ansible Automation Matrix**: Full System Provisioning plus granular single-playbook runners (`bootstrap`, `linux-base`, `windows-base`, `wazuh`, `windows-agent`, `web-target`, `juice-shop`, `atomic-red-team`).
- **Live Terminal Log Stream (`/operations/[id]`)**: Streaming stdout/stderr console with auto-scroll toggle, execution metadata, raw log copy, and direct log file download.
- **Destructive Teardown Safeguard**: Visually separated danger zone with double confirmation: explicit acknowledgement checkbox and required typed confirmation phrase `DESTROY THEDAL`.

### 2.4 SOC Learning Portal (`/learning`, `/learning/labs/[id]`, `/learning/challenges`, `/learning/challenges/[id]`)
- **Curriculum Dashboard (`/learning`)**: Breakdown across Level 1 (4 labs), Level 2 (4 labs), Level 3 (6 labs), and Mystery Challenges (3 scenarios). Includes "Recommended Next Lab" recommendation engine.
- **Curriculum Search**: Sub-second search across 14 labs, 3 challenges, and MITRE ATT&CK technique IDs (e.g. `T1059`, `T1110`, `T1190`).
- **Interactive Lab Workspace (`/learning/labs/[id]`)**: Safe Markdown rendering, syntax-styled code blocks with copy buttons, interactive status dropdown (`Not Started`, `In Progress`, `Completed`), investigation notes drawer persisted to SQLite, and sequential lab navigation.
- **Mystery Challenges Hub (`/learning/challenges`, `/learning/challenges/[id]`)**: Unguided investigation scenarios with protected solution keys requiring explicit user confirmation before reveal.

### 2.5 Diagnostics, Logs & Settings (`/health`, `/logs`, `/settings`)
- **System Health Center (`/health`)**: 13 automated probes across AWS API, Bastion SSH, Wazuh Manager, Indexer, Dashboard, Windows Sysmon, Nginx, and Web Targets with actionable remediation guidance.
- **Operational Audit Logs (`/logs`)**: 2-pane log explorer with search, status filtering, and live terminal preview.
- **Configuration & Credentials (`/settings`)**: Runtime filesystem paths, AWS Profile Manager (validating AWS access keys without leaking secrets), local SSH keypair verification (`~/.ssh/thedal_key`), and automated safety auto-stop protection.

---

## 3. Verification & Quality Assurance Evidence

### 3.1 Next.js Production Build (`npm run build`)
```text
Route (app)                              Size     First Load JS
┌ ○ /                                    4.6 kB          105 kB
├ ○ /_not-found                          873 B          88.1 kB
├ ○ /health                              5.13 kB        92.4 kB
├ ○ /infrastructure                      7.19 kB         104 kB
├ ƒ /infrastructure/[host]               3.31 kB         103 kB
├ ○ /infrastructure/commands             1.4 kB          101 kB
├ ○ /learning                            5.5 kB          102 kB
├ ○ /learning/challenges                 3.42 kB         100 kB
├ ƒ /learning/challenges/[id]            2.71 kB         103 kB
├ ƒ /learning/labs/[id]                  1.97 kB         103 kB
├ ○ /logs                                2.96 kB        93.6 kB
├ ○ /operations                          5.64 kB         106 kB
├ ƒ /operations/[id]                     1.99 kB         102 kB
└ ○ /settings                            7.38 kB        94.6 kB
+ First Load JS shared by all            87.3 kB

✓ Compiled successfully (12/12 static & dynamic routes)
✓ Linting and checking validity of types
✓ Collecting page data & build traces
✓ Finalizing page optimization
```

### 3.2 ESLint & Static Analysis (`npm run lint`)
```text
> thedal-control-plane-frontend@1.0.0 lint
> next lint

Exit code: 0 (No errors)
```

### 3.3 Full Project Linter (`make lint`)
```text
Linting shell scripts...
Shell syntax verification: OK
Validating Python scripts...
Python syntax verification: OK
Validating Terraform formatting and syntax...
Success! The configuration is valid.
Terraform verification: OK
Validating Ansible playbooks syntax...
Ansible syntax verification: OK
```

### 3.4 Control Plane Pytest Suite (`make test-control-plane`)
```text
tests/test_api.py .................                                      [ 70%]
tests/test_operations.py ..                                              [ 79%]
tests/test_security.py .....                                             [100%]

======================== 24 passed, 1 warning in 16.17s ========================
```

---

## 4. Scope & Guardrail Adherence

| Guardrail | Status | Verification Notes |
|---|---|---|
| **Preserve Root Landing Page & Static Website** | **COMPLIANT** | Untouched `index.html`, `css/style.css`, `js/app.js`, and GitHub Pages files. |
| **Preserve Terraform Architecture** | **COMPLIANT** | Zero Terraform resource renames or AWS VPC/subnet architecture changes. |
| **No Arbitrary Command Execution** | **COMPLIANT** | Only allowlisted Terraform, Ansible, and health check actions execute. |
| **Zero Secret Persistence** | **COMPLIANT** | AWS secret keys and private SSH keys are never written to SQLite, logs, or localStorage. |
| **Localhost Default Binding** | **COMPLIANT** | FastAPI and Next.js bind strictly to `127.0.0.1`. |
| **Destroy Safeguard Enforced** | **COMPLIANT** | Explicit acknowledgement checkbox and typed `DESTROY THEDAL` confirmation required. |

---

## 5. Conclusion

Phase 19 is fully complete. The THEDAL Local Control Plane now features a unified, data-dense, type-safe Next.js frontend delivering complete operational control and threat hunting curriculum management for the AWS SOC laboratory.
