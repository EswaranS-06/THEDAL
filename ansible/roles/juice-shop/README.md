# SOCForge — OWASP Juice Shop Docker Ansible Role

> **Scope**: Deploys the containerized OWASP Juice Shop vulnerable web application on port `3000/TCP` with JSON-file log rotation and automated Wazuh Agent container log ingestion.

---

## 1. Deployed Stack & Container Specifications

| Property | Value | Notes |
| :--- | :--- | :--- |
| **Docker Image** | `bkimminich/juice-shop:v17.1.1` | Pinned official multi-arch container image |
| **Container Name** | `juice-shop` | Dedicated container identifier |
| **Listening Port** | `3000/TCP` | Host port mapped 1:1 to container port 3000 |
| **Restart Policy** | `unless-stopped` | Auto-restart across Docker and host reboots |
| **Log Driver** | `json-file` | Max-size: 50m, Max-file: 3 |
| **Log Path** | `/var/lib/docker/containers/*/*-json.log` | Ingested by Wazuh Agent with `<log_format>json</log_format>` |

---

## 2. Usage & Playbook

Deploy Docker Engine, Juice Shop, and container telemetry:

```bash
ansible-playbook -i ansible/inventory/hosts.ini ansible/playbooks/juice-shop.yml
```
