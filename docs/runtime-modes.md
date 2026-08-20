# THEDAL — Multi-Mode Control Plane Architecture

THEDAL provides a unified, production-grade cybersecurity cyber range experience across two first-class runtime environments:

1. **Native Linux / Virtual Machine**
2. **Docker Container**

Both modes share the exact same FastAPI backend, Next.js user interface, SQLite progress tracking, security guardrails, and cloud orchestration logic. The only difference is the underlying **Execution Adapter**.

---

## 1. Feature Matrix

| Feature | Native Linux / VM | Docker |
| :--- | :--- | :--- |
| **Control Plane** | Yes | Yes |
| **Terminal commands** | Yes | Optional |
| **Terraform operations** | CLI + UI | UI |
| **AWS start/stop** | CLI + UI | UI |
| **IP synchronization** | CLI + UI | UI |
| **SSH tunnel** | CLI + UI | UI |
| **Wazuh access** | Browser | Browser |
| **Lab simulations** | CLI + UI | UI |

---

## 2. Architecture & Execution Adapters

```text
┌─────────────────────────────────────────────────────────────┐
│                 THEDAL Browser User Interface               │
│          (Dashboard, Learning Portal, Command Center)       │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON API
┌──────────────────────────────▼──────────────────────────────┐
│                  Shared FastAPI Control Plane                │
│    (Terraform, Ansible, AWS, SSH, Simulations, Progress)    │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌──────────────────────────────┐    ┌──────────────────────────────┐
│    NativeExecutionAdapter    │    │    DockerExecutionAdapter    │
├──────────────────────────────┤    ├──────────────────────────────┤
│ • Uses host binaries         │    │ • Self-contained in image    │
│ • Direct OS process execution│    │ • Uses isolated container tools│
│ • Full CLI + Web experience  │    │ • Browser-first, zero setup  │
└──────────────────────────────┘    └──────────────────────────────┘
```

---

## 3. Native Linux / VM Mode

### Ideal For:
Learners and operators who want hands-on experience with command-line tools: `terraform`, `ansible-playbook`, `aws-cli`, `ssh`, and Linux system administration.

### How It Works:
- The Control Plane runs directly on your host machine or Linux VM.
- CLI commands (`make check-ip`, `make sync-ip`, `make deploy`, `make tunnel`) interact directly with your local workspace.
- The web interface acts as an accelerator, allowing 1-click execution alongside terminal workflows.

### Quick Start:
```bash
./install.sh --mode native
make control-plane
```

---

## 4. Docker Mode

### Ideal For:
Beginners, students on Windows or macOS, and users who want a zero-configuration, browser-first experience without manually installing Terraform, Ansible, or AWS CLI on their host machine.

### How It Works:
- The THEDAL Control Plane runs inside an isolated Docker container with all necessary toolchains pre-installed.
- Persistent state (SQLite database, SSH keypair, AWS profiles, and audit logs) is mounted via dedicated `./runtime/` directories.
- All lab operations (infrastructure provisioning, dynamic SSH access synchronization, SIEM port-forwarding, and adversary threat simulations) are controlled 100% through the browser interface.
- **Terminal access is optional** — you never need `docker exec` for normal operations.

### Quick Start:
```bash
./install.sh --mode docker
```
Access the dashboard at `http://localhost:8080` and Wazuh SIEM at `https://localhost:8443`.

---

## 5. Lab Simulation Engine

In Docker mode, students do not need to log into the Attack container to execute threats. The Control Plane provides a **Controlled Remote Simulation Engine**:

1. Select an approved MITRE ATT&CK technique (e.g., `T1082`, `T1059.001`, `T1003.001`) or Web Scenario (e.g., `DVWA-SQLI`, `JUICESHOP-AUTH`).
2. Click **[ Confirm & Run Simulation ]**.
3. The Control Plane executes the authorized wrapper on the Attack host via the Bastion jumpbox.
4. Output is streamed live into the UI and recorded in the SQLite audit log.
5. Telemetry immediately appears in the Wazuh SIEM index (`socforge-sysmon-*`, `socforge-nginx-access-*`).

---

## 6. Network & Port Exposure

| Service | Container Port | Host Port | Purpose |
| :--- | :--- | :--- | :--- |
| **Control Plane Web UI** | `8080` | `8080` | Browser dashboard & REST API |
| **Wazuh SIEM SSH Tunnel** | `8443` | `8443` | Encrypted tunnel to OpenSearch Dashboards |

Both services bind to `0.0.0.0` by default to allow cross-VM access and seamless Docker port publishing.

---

## 7. Security Model & Volume Isolation

- **No Secrets Baked Into Container**: AWS secret keys and SSH private keys are never built into the Docker image.
- **Restricted Mounts**: Only dedicated runtime volumes (`./runtime/data`, `./runtime/ssh`, `./runtime/aws`) are mounted.
- **Unprivileged User**: The container runs under unprivileged UID 1000 (`thedal`).
- **No Docker Socket Mounting**: The container does not mount `/var/run/docker.sock` and does not require `--privileged` mode.
