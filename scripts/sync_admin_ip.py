#!/usr/bin/env python3
"""
SOCForge — Management IP Synchronization & Dynamic SSH Access CLI Utility
========================================================================
Detects current public IPv4 address, checks Terraform security group CIDR,
identifies IP mismatches/drift, previews changes, and applies updates safely.
"""

import sys
import os
import argparse
import ipaddress
import re
import socket
import urllib.request
from pathlib import Path

# Add control-plane to sys.path so we can reuse app services if available
ROOT_DIR = Path(__file__).resolve().parent.parent
CONTROL_PLANE_DIR = ROOT_DIR / "control-plane"
if str(CONTROL_PLANE_DIR) not in sys.path:
    sys.path.insert(0, str(CONTROL_PLANE_DIR))

# ANSI Color codes for SOC Terminal output
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
BLUE = "\033[94m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"


IP_PROVIDERS = [
    "https://api.ipify.org?format=text",
    "https://icanhazip.com",
    "https://checkip.amazonaws.com",
    "https://ifconfig.me/ip",
    "https://ipinfo.io/ip",
]

IPV4_REGEX = re.compile(r"^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$")


def detect_public_ip() -> str:
    """Detects current public IPv4 address using resilient fallback providers."""
    for url in IP_PROVIDERS:
        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "SOCForge-CLI/1.0"}
            )
            with urllib.request.urlopen(req, timeout=3.0) as resp:
                if resp.status == 200:
                    raw = resp.read().decode("utf-8", errors="ignore").strip()
                    if IPV4_REGEX.match(raw):
                        ip = ipaddress.IPv4Address(raw)
                        if not ip.is_multicast and not ip.is_loopback:
                            return str(ip)
        except Exception:
            continue
    return ""


def get_configured_cidr() -> str:
    """Reads configured admin_cidr from terraform/admin_ip.auto.tfvars or terraform.tfvars."""
    tf_dir = ROOT_DIR / "terraform"
    auto_tfvars = tf_dir / "admin_ip.auto.tfvars"
    main_tfvars = tf_dir / "terraform.tfvars"

    if auto_tfvars.exists():
        try:
            content = auto_tfvars.read_text(encoding="utf-8")
            match = re.search(r'admin_cidr\s*=\s*"([^"]+)"', content)
            if match:
                return match.group(1).strip()
        except Exception:
            pass

    if main_tfvars.exists():
        try:
            content = main_tfvars.read_text(encoding="utf-8")
            match = re.search(r'admin_cidr\s*=\s*"([^"]+)"', content)
            if match:
                return match.group(1).strip()
        except Exception:
            pass

    return "127.0.0.1/32"


def is_ip_in_network(ip_str: str, cidr_str: str) -> bool:
    """Checks if ip_str is contained in cidr_str network."""
    if not ip_str or not cidr_str:
        return False
    try:
        ip = ipaddress.ip_address(ip_str.strip())
        net = ipaddress.ip_network(cidr_str.strip(), strict=False)
        return ip in net
    except Exception:
        return False


def check_port_22(host: str, timeout: float = 3.0) -> bool:
    """Checks TCP port 22 connectivity."""
    if not host:
        return False
    try:
        with socket.create_connection((host, 22), timeout=timeout):
            return True
    except Exception:
        return False


def run_check():
    """Performs read-only check of current public IP vs configured CIDR."""
    print(f"\n{BOLD}{CYAN}THEDAL Management IP Check{RESET}")
    print(f"{'─' * 45}")

    print("Detecting current public IP...")
    current_ip = detect_public_ip()
    if not current_ip:
        print(f"{RED}✗ Error: Unable to detect public IPv4 address.{RESET}")
        sys.exit(1)

    configured_cidr = get_configured_cidr()
    is_match = is_ip_in_network(current_ip, configured_cidr)

    print(f"Current Public IP : {BOLD}{current_ip}{RESET}")
    print(f"Configured CIDR   : {BOLD}{configured_cidr}{RESET}")

    if configured_cidr == "0.0.0.0/0":
        print(f"Status            : {YELLOW}OPEN ACCESS (0.0.0.0/0){RESET}")
    elif is_match:
        print(f"Status            : {GREEN}AUTHORIZED (MATCH){RESET}")
    else:
        print(f"Status            : {YELLOW}MISMATCH (Action Required){RESET}")
        print(f"\n{YELLOW}Your public IP is not covered by the current Terraform Security Group rule.{RESET}")
        print(f"Run {BOLD}make sync-ip{RESET} to synchronize your IP with AWS.")
    print()


def run_ssh_status():
    """Performs comprehensive SSH readiness status check."""
    print(f"\n{BOLD}{CYAN}THEDAL Dynamic SSH Readiness Status{RESET}")
    print(f"{'─' * 45}")

    try:
        from app.services.management_ip import ManagementIPService
        status = ManagementIPService.get_status()
    except Exception:
        current_ip = detect_public_ip()
        configured_cidr = get_configured_cidr()
        is_match = is_ip_in_network(current_ip, configured_cidr)
        status = {
            "detected_ip": current_ip,
            "configured_cidr": configured_cidr,
            "is_match": is_match,
            "status": "READY" if is_match else "MISMATCH",
            "live_bastion_ip": None,
            "port_22_reachable": False,
            "message": "Assessed via standalone CLI mode."
        }

    det_ip = status.get("detected_ip") or "Unknown"
    cfg_cidr = status.get("configured_cidr") or "Unknown"
    bastion_ip = status.get("live_bastion_ip") or "Offline / Not Deployed"
    p22 = status.get("port_22_reachable")
    st = status.get("status")

    status_color = GREEN if st == "READY" else YELLOW if st in ("MISMATCH", "OPEN_ACCESS") else RED

    print(f"Public IPv4       : {BOLD}{det_ip}{RESET}")
    print(f"Configured CIDR   : {BOLD}{cfg_cidr}{RESET}")
    print(f"Access Status     : {status_color}{st}{RESET}")
    print(f"Bastion Public IP : {BOLD}{bastion_ip}{RESET}")
    print(f"Port 22 Reachable : {GREEN if p22 else RED}{'YES' if p22 else 'NO / UNREACHABLE'}{RESET}")
    print(f"Assessment        : {status.get('message')}")
    print()


def run_sync(cidr_override: str = None, suffix: str = "32", auto_approve: bool = False):
    """Interactively or automatically synchronizes the current public IP with Terraform."""
    print(f"\n{BOLD}{CYAN}THEDAL Management IP Synchronization{RESET}")
    print(f"{'─' * 45}")

    print("Detecting current public IP...")
    current_ip = detect_public_ip()
    if not current_ip and not cidr_override:
        print(f"{RED}✗ Error: Unable to detect public IPv4 address. Specify --cidr manually.{RESET}")
        sys.exit(1)

    configured_cidr = get_configured_cidr()

    if cidr_override:
        proposed_cidr = cidr_override
    else:
        clean_suffix = suffix.replace("/", "").strip()
        proposed_cidr = f"{current_ip}/{clean_suffix}"

    try:
        net = ipaddress.IPv4Network(proposed_cidr, strict=False)
        proposed_cidr = str(net)
    except Exception as e:
        print(f"{RED}✗ Error: Invalid proposed CIDR '{proposed_cidr}': {str(e)}{RESET}")
        sys.exit(1)

    is_match = is_ip_in_network(current_ip, configured_cidr)

    print(f"Current Public IP : {BOLD}{current_ip or 'Custom'}{RESET}")
    print(f"Configured CIDR   : {BOLD}{configured_cidr}{RESET}")
    print(f"Status            : {GREEN if is_match else YELLOW}{'MATCH' if is_match else 'MISMATCH'}{RESET}")
    print(f"Proposed CIDR     : {BOLD}{GREEN}{proposed_cidr}{RESET}")

    if proposed_cidr == configured_cidr and is_match:
        print(f"\n{GREEN}✓ Current IP is already synchronized and authorized.{RESET}\n")
        return

    if not auto_approve:
        try:
            choice = input(f"\nApply Terraform update for {BOLD}{proposed_cidr}{RESET}? [y/N]: ").strip().lower()
            if choice not in ("y", "yes"):
                print(f"{YELLOW}Update cancelled.{RESET}\n")
                return
        except KeyboardInterrupt:
            print("\nCancelled.")
            sys.exit(0)

    print(f"\n{CYAN}Applying update via Terraform...{RESET}")
    try:
        from app.services.management_ip import ManagementIPService
        res = ManagementIPService.apply_sync(
            new_cidr=proposed_cidr,
            mode="automatic" if not cidr_override else "custom",
            actor="CLI (sync-admin-ip)"
        )
        if res.get("success"):
            print(f"{GREEN}✓ Successfully updated and applied management CIDR to AWS!{RESET}")
            if res.get("live_bastion_ip"):
                p22_ok = res.get("port_22_reachable")
                print(f"Bastion IP        : {BOLD}{res.get('live_bastion_ip')}{RESET}")
                print(f"Port 22 Check     : {GREEN if p22_ok else RED}{'REACHABLE (Ready for SSH)' if p22_ok else 'UNREACHABLE'}{RESET}")
            print(f"Audit log saved   : {res.get('log_file')}")
        else:
            print(f"{RED}✗ Terraform apply failed. Exit code: {res.get('exit_code')}{RESET}")
            sys.exit(1)
    except Exception as e:
        print(f"{RED}✗ Sync failed: {str(e)}{RESET}")
        sys.exit(1)

    print()


def main():
    parser = argparse.ArgumentParser(description="SOCForge Dynamic Management IP & SSH Access Sync")
    parser.add_argument("--check", action="store_true", help="Check current public IP against configured CIDR (read-only)")
    parser.add_argument("--status", action="store_true", help="Display full SSH readiness and connectivity status")
    parser.add_argument("--sync", action="store_true", help="Synchronize current public IP with Terraform")
    parser.add_argument("--cidr", type=str, default=None, help="Custom CIDR block override (e.g. '122.167.158.64/32')")
    parser.add_argument("--suffix", type=str, default="32", help="CIDR suffix for current IP (default: 32)")
    parser.add_argument("-y", "--yes", "--auto-approve", action="store_true", dest="auto_approve", help="Apply without prompting")

    args = parser.parse_args()

    if args.check:
        run_check()
    elif args.status:
        run_ssh_status()
    elif args.sync or args.cidr:
        run_sync(cidr_override=args.cidr, suffix=args.suffix, auto_approve=args.auto_approve)
    else:
        # Default behavior: run check, and if mismatch ask to sync
        current_ip = detect_public_ip()
        configured_cidr = get_configured_cidr()
        is_match = is_ip_in_network(current_ip, configured_cidr)
        if not is_match:
            run_sync(suffix=args.suffix, auto_approve=args.auto_approve)
        else:
            run_check()


if __name__ == "__main__":
    main()
