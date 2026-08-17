# Ansible Role: `atomic-red-team`

> **Scope**: Deploys PowerShell Core, official Atomic Red Team execution framework (`Invoke-AtomicRedTeam`), curated MITRE ATT&CK test catalog, safety interlocks, and execution wrapper scripts on `SOCForge-attack` (`10.10.20.0/24`).

---

## 1. Overview

The `atomic-red-team` role establishes a controlled, auditable adversary emulation node. It configures the attack simulation environment while enforcing strict safety boundaries:
* **Default Disabled**: Attacks are never executed during provisioning (`atomic_execute: false`).
* **Target Allowlist**: Simulations are locked strictly to `SOCForge-windows` (`10.10.10.200`).
* **Audit Logging**: All simulation invocations, timestamps, durations, and cleanup outcomes are recorded to `/var/log/socforge/atomic/simulation.log`.

---

## 2. Directory Layout & Key Files

| File / Path | Purpose |
| :--- | :--- |
| `defaults/main.yml` | Pinned versions, proxy settings, target allowlists, and default safety toggles. |
| `tasks/prerequisites.yml` | Base utility packages (`git`, `curl`, `jq`, `gnupg`, `python3-yaml`). |
| `tasks/powershell.yml` | Microsoft APT repository configuration and PowerShell Core (`pwsh`) installation. |
| `tasks/git.yml` | Clones and pins `atomic-red-team` and `invoke-atomicredteam` to deterministic releases. |
| `tasks/atomic-red-team.yml` | Deploys test catalog (`socforge-tests.yml`) and execution wrapper (`run-atomic-test`). |
| `tasks/validation.yml` | Validates binaries, catalog syntax, wrapper permissions, and logging directory. |

---

## 3. Curated Initial Techniques (Phase 10)

1. **`T1059.001`**: Command and Scripting Interpreter: PowerShell
2. **`T1082`**: System Information Discovery (`systeminfo`, `whoami /all`, `hostname`)
3. **`T1087.001`**: Account Discovery: Local Accounts (`net user`, `net localgroup`)
4. **`T1016`**: System Network Configuration Discovery (`ipconfig /all`, `route print`, `arp -a`)
5. **`T1053.005`**: Scheduled Task/Job: Scheduled Task (`schtasks /create` & `/delete`)

---

## 4. Usage & Safety Controls

```bash
# List available curated tests
run-atomic-test --list

# Perform dry-run inspection
run-atomic-test --technique T1082 --dry-run

# Authorized execution with mandatory confirmation flag
run-atomic-test --technique T1082 --confirm
```
