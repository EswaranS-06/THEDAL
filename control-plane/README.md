# THEDAL Control Plane

> A modern, local web dashboard and operator control center for managing the THEDAL AWS laboratory, executing adversary simulations, and mastering SOC investigation workflows.

---

## 1. Overview & Purpose

The **THEDAL Control Plane** provides a unified web interface on `127.0.0.1:8080` (FastAPI backend + Next.js frontend) to monitor live AWS infrastructure status, trigger allowlisted Terraform operations, dispatch Ansible playbooks, view operation audit logs, execute 1-click adversary simulations, and explore interactive Learning Labs.

### Core Design Principles
- **Terraform & Ansible Remain Authoritative**: The control plane does not replace Infrastructure as Code. Terraform is the single source of truth for AWS resources; Ansible is the single source of truth for host configuration.
- **Strict Localhost Binding**: Binds exclusively to `127.0.0.1` and is never exposed publicly.
- **1-Click Adversary Emulation**: Direct dispatch of Atomic Red Team & web attack techniques with live execution stream and expected OpenSearch index correlation.
- **No Arbitrary Command Execution**: Exposes strictly allowlisted operations (e.g. `terraform plan`, `terraform apply`, specific playbooks, approved ATT&CK IDs). There are no generic shell execution endpoints.
- **Zero Secret Exposure**: AWS secret keys, session tokens, passwords, and private SSH keys are never displayed in the UI or written to logs.
- **Concurrency & Destroy Guardrails**: Employs an operation lock (`.operation.lock`) to prevent race conditions and requires a typed confirmation phrase (`DESTROY THEDAL`) for teardown.

---

## 2. Technology Stack

- **Backend**: Python 3.11+ (FastAPI, Uvicorn, Pydantic v2, Boto3, SQLite)
- **Frontend**: Next.js 14 (React, TypeScript, Tailwind CSS, Lucide Icons)
- **AWS Integration**: Boto3 (read-only queries and safe EC2 start/stop)
- **Package & Environment Management**: `uv` (Python) & `npm` (Node.js)

---

## 3. Quick Start

### A. Run via `Makefile` (Recommended)
```bash
# Start backend API (8080) and frontend interface (3000)
make control-plane
```

### B. Access the Dashboard
Open your browser and navigate to:
```text
http://127.0.0.1:8080 (or http://localhost:3000)
```

---

## 4. Architecture & Navigation

The control plane offers 6 primary views:
1. **Dashboard (`/`)**: High-level status cards (AWS connection, Terraform state, active instances, overall health), monitored node cards, and quick diagnostics.
2. **Infrastructure (`/infrastructure`)**: Detailed EC2 instance table, static private IP topology, live health status, and the **Dynamic Operator Command Matrix** (`/infrastructure/commands`).
3. **Learning Labs (`/learning`)**: 14 interactive, guided SOC investigation labs and 3 challenge scenarios with live adversary simulation triggering.
4. **Operations Console (`/operations`)**: Safe operator controls for Terraform Plan, Deploy, EC2 Start/Stop, Destroy (with confirmation guardrail), and Ansible playbooks.
5. **Audit Logs (`/logs`)**: Interactive log viewer displaying execution history from `control-plane/logs/`.
6. **Settings (`/settings`)**: Local paths, AWS region, SSH key verification, and connection cheat-sheet.

---

## 5. Security & Lifecycle Semantics

| Action | Mechanism | Behavior & Impact |
| :--- | :--- | :--- |
| **Deploy** | Terraform Apply | Creates or updates AWS VPC, subnets, security groups, and EC2 instances with static IPs. |
| **Stop EC2** | AWS EC2 API | Safely pauses hourly compute charges while preserving EBS state. |
| **Start EC2** | AWS EC2 API | Resumes stopped EC2 instances and initiates health checks. |
| **Destroy** | Terraform Destroy | Requires typing `DESTROY THEDAL`. Terminates compute and deletes EBS volumes. |
| **Run Simulation** | SSH via ProxyJump | Executes approved Atomic Test or Web Scenario non-interactively on the Attack Node. |

---

## 6. Running Tests

```bash
cd control-plane
uv run pytest tests/
# 55 passed in 20.80s
```
