# SOCForge — Docker Engine Ansible Role

> **Scope**: Installs official Docker CE, Docker Compose plugin, configures systemd forward proxy for private air-gapped subnet downloads, and sets default JSON-file log rotation.

---

## 1. Role Capabilities

* **Official Docker CE**: Installs from `download.docker.com` via official GPG keyring.
* **Forward Proxy Support**: Automatically routes container pulls through Bastion proxy (`:3128`) without requiring a NAT Gateway.
* **Log Rotation Defaults**: Configures `/etc/docker/daemon.json` with `max-size: 50m` and `max-file: 3` to prevent disk exhaustion.
