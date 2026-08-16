# SOCForge — Phase 9: OWASP Juice Shop Docker Deployment & Wazuh Container Telemetry

> **Status**: Configuration and automation complete. Live cloud deployment pending execution of `terraform apply`.

---

## 1. Architectural Overview

OWASP Juice Shop is deployed as an isolated Docker container on `SOCForge-web` (`10.10.30.x`), exposing port `3000/TCP`. This establishes an independently observable, modern JavaScript/Node.js vulnerable application alongside the native PHP/Nginx DVWA target.

```text
               SOCForge Attack Host (10.10.20.x)
                               |
                               | HTTP / TCP 3000
                               v
+-------------------------------------------------------------------+
|               SOCForge Linux Web Target (10.10.30.x)               |
|                                                                   |
|   +-----------------------------------------------------------+   |
|   |         Docker Engine (dockerd with Bastion Proxy)        |   |
|   |                                                           |   |
|   |   +---------------------------------------------------+   |   |
|   |   |   OWASP Juice Shop Container (juice-shop:v17.1.1) |   |   |
|   |   |   - Listening: 0.0.0.0:3000 -> 3000/TCP           |   |   |
|   |   |   - Unprivileged, Isolated Bridge Network         |   |   |
|   |   |   - Restart: unless-stopped                       |   |   |
|   |   |   - JSON Log Driver: max-size=50m, max-file=3     |   |   |
|   |   +-----------------------------+---------------------+   |   |
|   +---------------------------------|-------------------------+   |
|                                     |                             |
|                                     v                             |
|             /var/lib/docker/containers/*/*-json.log               |
|                                     |                             |
|                                     v                             |
|   +-----------------------------------------------------------+   |
|   |              Wazuh Agent Daemon (v4.14.7)                 |   |
|   |   - Monitors container logs via <log_format>json          |   |
|   +-----------------------------+-----------------------------+   |
+---------------------------------|---------------------------------+
                                  |
                                  | Encrypted TCP 1514 / TLS
                                  v
+-------------------------------------------------------------------+
|               SOCForge Wazuh SIEM (10.10.10.x)                    |
|   - Manager (:1514/:1515) -> Indexer (:9200) -> Dashboard (:443)  |
+-------------------------------------------------------------------+
```

---

## 2. Docker & Container Specification

| Parameter | Configuration | Justification |
| :--- | :--- | :--- |
| **Docker Engine** | Official Docker CE (Current Stable) | Installed via official Docker APT repository & keyring |
| **Docker Compose** | `docker-compose-plugin` | Declarative container lifecycle management |
| **Image & Tag** | `bkimminich/juice-shop:v17.1.1` | Pinned official release; deterministic and reproducible |
| **Port Mapping** | `3000:3000/TCP` | Explicit host to container mapping |
| **Restart Policy** | `unless-stopped` | Auto-restart across Docker and OS reboots |
| **Log Driver** | `json-file` | Standard Docker logging with rotation (`max-size: 50m`, `max-file: 3`) |
| **Container Privileges** | Unprivileged | No root capabilities, no host filesystem mounts, no docker socket |

---

## 3. Forward Proxy Configuration for Container Pulls

Because `SOCForge-web` has **no public IP and no NAT Gateway**, the Docker daemon is configured via a systemd drop-in override:

```ini
# /etc/systemd/system/docker.service.d/http-proxy.conf
[Service]
Environment="HTTP_PROXY=http://10.10.1.10:3128"
Environment="HTTPS_PROXY=http://10.10.1.10:3128"
Environment="NO_PROXY=localhost,127.0.0.1,10.10.0.0/16,169.254.169.254,local.socforge"
```

This routes `docker pull` image requests through the Bastion forward proxy (`tinyproxy`).

---

## 4. Container Log Collection in Wazuh

Container logs are ingested directly into the existing Wazuh Agent on `SOCForge-web` via:

```xml
<!-- Docker Container Telemetry (OWASP Juice Shop) -->
<localfile>
  <location>/var/lib/docker/containers/*/*-json.log</location>
  <log_format>json</log_format>
</localfile>
```

### Telemetry Attributes Preserved:
* **`log`**: Application stdout/stderr log message (HTTP requests, Node.js uncaught exceptions, API calls).
* **`stream`**: stdout vs stderr descriptor.
* **`time`**: High-precision UTC timestamp from Docker runtime.
* **`container_id`**: Extracted from parent folder directory path.

---

## 5. Security & Isolation Controls

* **Network Isolation**: Accessible on port `3000` strictly from `SOCForge-attack-sg` (and `management-sg` for testing). **Never open to `0.0.0.0/0`**.
* **Separation of Targets**:
  * `http://10.10.30.x:8000/` -> DVWA (PHP/Nginx)
  * `http://10.10.30.x:3000/` -> OWASP Juice Shop (Node.js/Docker)
* **Log Rotation**: Capped at 3 files of 50 MB each (150 MB maximum per container) to protect disk space.

---

## 6. Verification Status

### 🟢 Configuration & Automation Validation (Passed)
* `terraform validate`: **Success**.
* `terraform plan`: **Success** (59 resources to add).
* `ansible-playbook ansible/playbooks/juice-shop.yml --syntax-check`: **Success**.
* `scripts/juice-shop-health-check.sh`: **Success**.

### 🟡 Live Deployment Validation (Pending)
* Live container instantiation and telemetry verification will occur upon execution of `terraform apply`.
