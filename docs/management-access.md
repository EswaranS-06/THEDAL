# SOCForge — Dynamic SSH Access & Management IP Automation

This guide explains how **SOCForge** automates dynamic public IP detection and synchronizes AWS Security Group rules via **Terraform** so that student and operator SSH access to the management bastion never breaks when their network changes.

---

## The Dynamic Public IP Challenge

SOCForge restricts inbound SSH traffic on port 22 of the AWS Management Bastion using a strict IPv4 CIDR rule in the bastion security group (`aws_security_group_rule.mgmt_ingress_ssh`).

By default, this is restricted to an exact host (`/32` CIDR):
```text
122.167.158.64/32
```

### Why Did My SSH Access Stop Working?

When you restart your home Wi-Fi router, disconnect from a VPN, switch to a mobile hotspot, or continue a lab session from a coffee shop, your Internet Service Provider (ISP) assigns you a **different public IPv4 address**.

When this happens:
1. Your public IP changes (e.g., from `106.200.21.252` to `122.167.158.64`).
2. The AWS Bastion Security Group still only permits packets from `106.200.21.252/32`.
3. Incoming SSH packets from your new IP are dropped silently by the AWS hypervisor firewall.
4. Your SSH client reports:
   ```text
   ssh: connect to host 13.232.202.163 port 22: Connection timed out
   ```

> [!NOTE]
> The EC2 instance, network interfaces, and OpenSSH service on the Bastion are completely healthy. Only the AWS Security Group rule needs to be synchronized.

---

## Design Principle: Terraform as Single Source of Truth

SOCForge does **not** inject temporary, unmanaged AWS CLI rules (`aws ec2 authorize-security-group-ingress`) that create infrastructure drift.

Instead, all management access changes update the Terraform configuration (`terraform/admin_ip.auto.tfvars` and `terraform/terraform.tfvars`) and are applied directly through Terraform.

```text
┌─────────────────────────────────────────────────────────────┐
│ 1. Detect Public IP via Multi-Provider Resilient Fallback   │
├─────────────────────────────────────────────────────────────┤
│ 2. Compare Current IP with Configured admin_cidr            │
├─────────────────────────────────────────────────────────────┤
│ 3. Preview Dry-Run Execution Plan (terraform plan)          │
├─────────────────────────────────────────────────────────────┤
│ 4. Apply Security Group Change (terraform apply)            │
├─────────────────────────────────────────────────────────────┤
│ 5. Perform Non-Interactive TCP Port 22 Verification         │
└─────────────────────────────────────────────────────────────┘
```

---

## Management Access Modes

| Mode | CIDR Suffix | Security Posture | Intended Use |
| :--- | :--- | :--- | :--- |
| **Automatic Current IP** | `/32` (Single IP) | Highest (Recommended) | Standard student & operator access. Restricts ingress to exactly one IPv4 host. |
| **Subnet Block** | `/24` (256 IPs) | Medium | For unstable ISP dynamic pools within the same local `/24` subnet. |
| **Custom CIDR** | Custom | Configurable | For corporate VPN egress gateways or dedicated static jumpboxes. |
| **Open Access** | `0.0.0.0/0` | Low (Warning) | Temporary lab troubleshooting. Requires explicit confirmation checkbox. |

---

## Using the Control Plane GUI

### 1. Dashboard SSH Management Access Card
On the main dashboard (`http://localhost:3000` or `http://localhost:8080`), check the **SSH MANAGEMENT ACCESS** status banner:

- `● AUTHORIZED`: Your active network is permitted.
- `⚠ IP MISMATCH`: Your public IP has changed.
- `⚠ OPEN ACCESS`: Ingress is open to `0.0.0.0/0`.

### 2. 1-Click "Sync My IP" Modal
1. Click **Sync My IP**.
2. Review the detected IPv4 address and proposed CIDR.
3. Select your CIDR suffix (`/32` recommended).
4. Click **Preview Terraform Changes** to see the plan diff.
5. Click **Apply SSH Access Update**.
6. The Control Plane runs Terraform apply and automatically runs a TCP port 22 reachability check on the Bastion.

### 3. Settings Configuration Panel
Navigate to **Settings → AWS Management Access** to change modes, test connectivity on demand, or view historical sync audit entries.

---

## Using the Command-Line Interface (CLI)

SOCForge includes dedicated Makefile targets and a Python CLI tool:

### 1. Check IP Status (Read-Only)
```bash
make check-ip
```
Output:
```text
SOCForge Management IP Check
─────────────────────────────────────────────
Detecting current public IP...
Current Public IP : 122.167.158.64
Configured CIDR   : 106.200.21.252/32
Status            : MISMATCH (Action Required)
```

### 2. Synchronize Current IP
```bash
# Interactive sync with /32 default:
make sync-ip

# Sync with /24 subnet block:
make sync-ip CIDR_SUFFIX=24

# Sync with custom CIDR:
make sync-ip CIDR="203.0.113.10/32"
```

### 3. Verify End-to-End SSH Readiness
```bash
make ssh-status
```
Output:
```text
SOCForge Dynamic SSH Readiness Status
─────────────────────────────────────────────
Public IPv4       : 122.167.158.64
Configured CIDR   : 122.167.158.64/32
Access Status     : READY
Bastion Public IP : 13.232.202.163
Port 22 Reachable : YES
Assessment        : SSH Access Ready: Current network is authorized.
```

---

## Troubleshooting Guide

### "Connection timed out" vs. "Connection refused"

| Error Message | Root Cause | Solution |
| :--- | :--- | :--- |
| `Connection timed out` | Packets dropped at firewall (Security Group blocking your IP or EC2 instance stopped). | Run `make sync-ip` to authorize your current IP or start the EC2 fleet in the Control Plane. |
| `Connection refused` | Port 22 reachable, but SSH service daemon on Bastion is stopped. | Log in via AWS Systems Manager (SSM) and run `sudo systemctl restart ssh`. |
| `Permission denied (publickey)` | SSH key mismatch. | Verify private key permissions (`chmod 600 ~/.ssh/socforge_key`) and ensure public key was deployed by Terraform. |

---

## Security & Audit Trail

- All synchronization events are stored in the SQLite audit database at `control-plane/data/learner_state.db`.
- Detailed Terraform execution logs are archived under `control-plane/logs/`.
- No credentials, secrets, or SSH private keys are ever exposed to log files or browser responses.
