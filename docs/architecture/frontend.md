# THEDAL — Frontend & Control Plane Architecture

**Document ID:** `ARCH-FRONTEND-01`  
**Version:** `1.0.0`  
**Status:** **ACTIVE / PRODUCTION**  
**Author:** THEDAL Engineering & Platform Architecture  
**Target Environment:** Localhost (Linux / Debian 13 / Ubuntu 22.04+)

---

## 1. Executive Architecture Summary

The **THEDAL Local Control Plane** provides a secure, high-density, type-safe operations interface for orchestrating, diagnosing, and investigating an enterprise cybersecurity laboratory deployed into AWS.

```text
+-------------------------------------------------------------------------------+
|                             BROWSER (Localhost)                               |
|          Next.js 14 Client / Server Components (React 18 + Tailwind)          |
+-------------------------------------------------------------------------------+
                                      |
                     REST Calls (via typed API client)
                                      v
+-------------------------------------------------------------------------------+
|                       FASTAPI BACKEND (Python 3.11+)                          |
|         Port 8080 • Localhost/Private Binding • Allowlisted Endpoints         |
+-------------------------------------------------------------------------------+
         |                |                |                |             |
         v                v                v                v             v
+----------------+ +--------------+ +---------------+ +-----------+ +-----------+
| Terraform      | | Ansible      | | AWS SDK       | | SQLite    | | SSH /     |
| CLI (State of  | | Playbooks    | | Boto3         | | Learner   | | Forward   |
| Truth)         | | (Config)     | | (STS/EC2/VPC) | | State DB  | | Tunnels   |
+----------------+ +--------------+ +---------------+ +-----------+ +-----------+
```

---

## 2. Technology Choices & Design Rationale

| Component | Technology | Rationale |
|---|---|---|
| **Frontend Framework** | Next.js 14 (App Router) | High-performance React 18, React Server Components (RSC) for initial page loads, built-in optimization, and strong developer ecosystem. |
| **Language** | TypeScript (Strict Mode) | Strict interface typing, complete end-to-end API response guarantees, and elimination of runtime schema mismatches. |
| **Styling & Theme** | Tailwind CSS + Custom Tokens | Minimalist Swiss visual language, OLED dark backgrounds, high data density, zero unnecessary runtime CSS overhead. |
| **Backend API** | FastAPI (uvicorn) | High-throughput asynchronous Python framework, native Pydantic validation, tight subprocess execution controls. |
| **Database** | SQLite (`learner_state.db`) | Zero-configuration, local-first embedded persistence for student investigation notes, progress checkpoints, and timestamps. |
| **Testing** | pytest + Playwright | Unit and API integration testing on Python backend; end-to-end browser and visual regression testing on frontend. |

---

## 3. Layer Separation & Security Boundaries

### 3.1 Strict Localhost & Non-Public Ingress
* The Control Plane operates exclusively on the local machine (or private network).
* The browser never interacts directly with AWS APIs, Terraform state files, or SSH tunnels.
* All cloud and infrastructure interactions are mediated by the authoritative FastAPI backend.

### 3.2 Authoritative Sources of Truth
1. **Infrastructure State**: `terraform.tfstate` is the sole source of truth for cloud resources. The backend invokes `terraform show -json` and never hallucinates resource presence.
2. **Configuration State**: Ansible playbooks define the desired state of provisioned software.
3. **Operational Logs**: Sanitized text files stored in `logs/` with strict path traversal protection (`os.path.basename` validation).
4. **Learner Progress**: SQLite database tracking lab completion flags and analyst notes.

---

## 4. Real-Time Operations & Asynchronous Execution

Long-running commands (e.g. `terraform apply`, `ansible-playbook`, `make attack`) execute asynchronously through a thread-safe operation manager:

1. **Initiation**: The user triggers an operation from the UI (e.g., `POST /api/operations/apply`).
2. **Locking**: A process-wide lock prevents concurrent destructive actions.
3. **Execution**: The command runs in a detached subprocess; standard output and error streams are redirected to a dedicated log file (`logs/op_<timestamp>_<type>.log`).
4. **Streaming / Polling**: The frontend streams live log output via `/api/operations/{id}` and updates status badges in real time without freezing the browser thread.

---

## 5. Learning Management Architecture

The learning portal dynamically scans and indexes markdown curriculum files from `docs/labs/` and `docs/challenges/`:
* **Zero Hardcoding**: New labs added to the filesystem are automatically discovered.
* **Markdown Rendering**: Rendered safely on the client with copyable code snippets, syntax highlighting, and MITRE ATT&CK technique badges.
* **Protected Solution Keys**: Challenge solutions are gated behind explicit confirmation dialogs to preserve the investigative experience.

---

## 6. Verification and Testing Strategy

* **Unit & Security Tests**: Backend test suite covering path traversal, destructive command confirmation phrases, credential redaction, and concurrency locks (`make test-control-plane`).
* **Static Analysis**: TypeScript compiler (`tsc --noEmit`), Next.js linter (`npm run lint`), Python syntax checks, Terraform validate, and Ansible syntax verification (`make lint`).
* **Production Build**: Full static and dynamic route compilation (`npm run build`).
