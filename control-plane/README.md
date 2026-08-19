# THEDAL Control Plane

> A lightweight, local web dashboard and operator control center for managing the THEDAL AWS laboratory.

---

## 1. Overview & Purpose

The **THEDAL Control Plane** provides a web interface on `127.0.0.1:8080` to monitor live AWS infrastructure status, trigger allowlisted Terraform operations, dispatch Ansible playbooks, view operation audit logs, and establish SSH access tunnels.

### Core Design Principles
- **Terraform & Ansible Remain Authoritative**: The control plane does not replace Infrastructure as Code. Terraform is the single source of truth for AWS resources; Ansible is the single source of truth for host configuration.
- **Strict Localhost Binding**: Binds exclusively to `127.0.0.1` and is never exposed publicly.
- **No Arbitrary Command Execution**: Exposes strictly allowlisted operations (e.g. `terraform plan`, `terraform apply`, specific playbooks). There are no generic shell execution endpoints.
- **Zero Secret Exposure**: AWS secret keys, session tokens, passwords, and private SSH keys are never displayed in the UI or written to logs.
- **Concurrency & Destroy Guardrails**: Employs an operation lock (`.operation.lock`) to prevent race conditions and requires a typed confirmation phrase (`DESTROY THEDAL`) for teardown.

---

## 2. Technology Stack

- **Backend**: Python 3.11+ (FastAPI, Uvicorn, Pydantic v2)
- **Frontend**: Server-rendered Jinja2 templates, modern SOC dark CSS, vanilla JavaScript
- **AWS Integration**: Boto3 (read-only queries and safe EC2 start/stop)
- **Package & Environment Management**: `uv`

---

## 3. Quick Start

### A. Run via `uv` (Recommended)
```bash
# Navigate to control-plane directory
cd control-plane

# Start the dashboard server on localhost
uv run uvicorn app.main:app --host 127.0.0.1 --port 8080
```

### B. Access the Dashboard
Open your browser and navigate to:
```text
http://127.0.0.1:8080
```

---

## 4. Architecture & Navigation

The control plane offers 5 primary views:
1. **Dashboard (`/`)**: High-level status cards (AWS connection, Terraform state, active instances, overall health), monitored node cards, and quick diagnostics.
2. **AWS Resources (`/resources`)**: Detailed EC2 instance table, VPC/subnet topology, and AWS cost management advisories.
3. **Operations Console (`/operations`)**: Safe operator controls for Terraform Plan, Deploy, EC2 Start/Stop, Destroy (with confirmation guardrail), and Ansible playbooks.
4. **Audit Logs (`/logs`)**: Interactive log viewer displaying execution history from `control-plane/logs/`.
5. **Settings (`/settings`)**: Local paths, AWS region, SSH key verification, and connection cheat-sheet.

---

## 5. Security & Lifecycle Semantics

| Action | Mechanism | Behavior & Impact |
| :--- | :--- | :--- |
| **Deploy** | Terraform Apply | Creates or updates AWS VPC, subnets, security groups, and EC2 instances. |
| **Stop EC2** | AWS EC2 API | Safely pauses hourly compute charges while preserving EBS state. |
| **Start EC2** | AWS EC2 API | Resumes stopped EC2 instances and initiates health checks. |
| **Destroy** | Terraform Destroy | Requires typing `DESTROY THEDAL`. Terminates compute and deletes EBS volumes. |

---

## 6. Running Tests

```bash
cd control-plane
uv run pytest tests/
```
