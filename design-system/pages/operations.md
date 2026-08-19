# Page Specification: Operations Console

> **Route**: `/operations`  
> **Purpose**: Authoritative operator control center for Terraform lifecycles, Ansible provisioning, and diagnostics.

---

## 1. Information Hierarchy & Guardrails

1. **Active Operation Banner**: Live streaming output panel (displayed only during active operations).
2. **Infrastructure as Code (Terraform)**:
   - Generate Plan (Dry-run)
   - Deploy Infrastructure (`terraform apply`)
   - Start / Stop Compute (EC2 state management)
   - **Destructive Teardown (`terraform destroy`)**: Isolated in a distinct red-bordered danger zone requiring modal confirmation + typed phrase `DESTROY THEDAL`.
3. **Host Automation (Ansible)**:
   - Generate Dynamic Inventory (`hosts.ini`)
   - Full System Provisioning (All playbooks in sequence)
   - Modular Playbook Grid (Bootstrap, Linux Base, Windows Base, Wazuh Stack, Web Target, Juice Shop, Atomic Red Team, Web Attack).

---

## 2. Page Layout Structure

```text
+-----------------------------------------------------------------------------------+
| Page Header: Operations & Automation Console                                      |
+-----------------------------------------------------------------------------------+
| [ Live Streaming Terminal Window - Hidden when idle ]                             |
+-----------------------------------------------------------------------------------+
| 2-Column Split:                                                                   |
| [ Terraform Lifecycle Card ]        | [ Ansible Provisioning Card ]               |
| - Plan                              | - Generate Inventory                        |
| - Deploy                            | - Full Provision All                        |
| - Start / Stop EC2                  | - 8 Modular Playbook Buttons                |
| - [ Danger Zone: Destroy Lab ]      |                                             |
+-----------------------------------------------------------------------------------+
```

---

## 3. Destructive Action Workflow
1. User clicks **Destroy Lab**.
2. Modal overlay renders with high-contrast warning.
3. User must check acknowledgment checkbox.
4. User must type exact phrase: `DESTROY THEDAL`.
5. Submit button enables only when exact conditions are met.
