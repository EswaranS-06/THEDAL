# THEDAL — Wazuh API Credential Architecture & Synchronization

This document describes the unified credential management architecture for the **Wazuh Manager REST API** and the **Wazuh Dashboard App Plugin** in THEDAL.

---

## 1. Single Source of Truth

To prevent authentication mismatches (HTTP 401 Unauthorized) between the Wazuh Dashboard and the Wazuh Manager API, THEDAL enforces a **Single Source of Truth** for API credentials:

```text
┌─────────────────────────────────────────────────────────────┐
│                 Centralized Secret Source                   │
│   (ansible/inventory/secrets.yml or Environment Variables)  │
│                                                             │
│   • THEDAL_WAZUH_API_USER     (Default: wazuh-wui)          │
│   • THEDAL_WAZUH_API_PASSWORD (<high-entropy-secret>)       │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌──────────────────────────────┐    ┌──────────────────────────────┐
│        Wazuh Manager         │    │       Wazuh Dashboard        │
├──────────────────────────────┤    ├──────────────────────────────┤
│ • Configured via auth_user.py│    │ • Configured in wazuh.yml    │
│ • Password hash synchronized │    │ • Same API user and password │
│ • Validates token requests   │    │ • Zero 401 Unauthorized      │
└──────────────────────────────┘    └──────────────────────────────┘
```

---

## 2. Configuration Precedence

1. **Environment Variables**:
   - `THEDAL_WAZUH_API_USER`
   - `THEDAL_WAZUH_API_PASSWORD`
2. **Persistent Secrets File** (`ansible/inventory/secrets.yml`):
   ```yaml
   ---
   # THEDAL Centralized Secrets (Excluded from Git)
   thedal_wazuh_api_user: "wazuh-wui"
   thedal_wazuh_api_password: "<configured-secret>"
   ```
3. **Automatic High-Entropy Generation**:
   - During fresh deployments, if no secret is provided, THEDAL automatically generates a 24-character password containing lowercase, uppercase, digits, and approved symbols.
   - The generated credential is automatically persisted to `ansible/inventory/secrets.yml` with `0600` permissions.

---

## 3. Deployment-Time Verification

During provisioning (`make wazuh-deploy` or `make provision`), the automation automatically tests the API authentication endpoint:

```bash
POST https://127.0.0.1:55000/security/user/authenticate
```

- **Success**: Returns HTTP 200 and a valid JWT token.
- **Failure**: Fails the deployment immediately if HTTP 401 or connection errors occur, redacting passwords from logs.

---

## 4. Diagnostics & Verification

To verify the synchronization of Wazuh services, listeners, and API authentication:

```bash
make verify-wazuh
```

Or via Control Plane: **Health Center → Wazuh SIEM Health → Verify Authentication**.

---

## 5. Idempotent Repair Workflow

If an existing or legacy deployment experiences a 401 mismatch:

```bash
make repair-wazuh-config
```

Or via Control Plane: **Health Center → Repair Credential Sync**.

### What the repair operation does:
1. Validates or ensures centralized secrets in `ansible/inventory/secrets.yml`.
2. Connects to the Wazuh Manager instance and synchronizes the API user password using `/var/ossec/api/scripts/auth_user.py`.
3. Regenerates `/usr/share/wazuh-dashboard/data/wazuh/config/wazuh.yml`.
4. Sets secure ownership `wazuh-dashboard:wazuh-dashboard` and permissions `0640`.
5. Restarts the `wazuh-dashboard` systemd service.
6. Re-verifies API authentication and confirms no new 401 errors appear in dashboard logs.

---

## 6. Atomic Credential Rotation

To rotate the Wazuh API credentials across all nodes:

```bash
make rotate-wazuh-credentials
```

Or via Control Plane: **Health Center → Rotate API Credentials**.

This generates a new secure password, updates the local secrets file, updates the Manager and Dashboard configurations, and confirms API health in a single operation.

---

## 7. Security Best Practices

- `ansible/inventory/secrets.yml` is strictly excluded from version control via `.gitignore`.
- Passwords and tokens are never logged to console outputs, audit log files, or browser responses.
- Default credentials (`wazuh-wui / wazuh-wui`) are not used as permanent production secrets.
