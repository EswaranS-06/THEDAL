# Page Specification: Settings & Configuration

> **Route**: `/settings`  
> **Purpose**: Read-only display of environment configuration, filesystem paths, and SSH connection cheat-sheets.

---

## 1. Information Hierarchy

1. **Local Paths & Directories**: Project Root, Terraform Directory, Ansible Directory, Logs Directory, SSH Key Path.
2. **Security & Guardrails**: Binding Interface (`127.0.0.1:8080`), AWS Region, CLI Execution Policy (Allowlist Only), Destroy Guardrail (`DESTROY THEDAL`).
3. **SSH & Tunnel Quick-Reference**: Pre-rendered SSH ProxyJump and tunnel commands for all 5 nodes.

---

## 2. Page Layout Structure

```text
+-----------------------------------------------------------------------------------+
| Page Header: Control Plane Settings & Environment                                 |
+-----------------------------------------------------------------------------------+
| 2-Column Split:                                                                   |
| [ Local Directory Paths Card ]     | [ Security Guardrails & Tool Inventory Card ] |
+-----------------------------------------------------------------------------------+
| Full-Width Direct SSH & Tunnel Quick-Reference Table                              |
+-----------------------------------------------------------------------------------+
```

---

## 3. Security Boundary
* Zero AWS secret keys, session tokens, or private SSH keys are displayed on this page.
