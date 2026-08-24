"""
THEDAL Control Plane — Lab Simulation Engine
============================================
Provides controlled, structured adversary simulation execution for both Native Linux
and Docker modes without requiring manual terminal access on the attack host.
Strictly validates techniques and scenarios against an approved allowlist.
"""

import os
import uuid
import sqlite3
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path
from datetime import datetime

from app.config import settings
from app.services.aws import AWSService
from app.services.terraform import TerraformService
from app.services.operations import OperationsManager, SecurityValidationError
from app.services.runtime import RuntimeService


class SimulationService:
    """Manages controlled SOC adversary simulation tests."""

    DB_PATH = Path(settings.CONTROL_PLANE_DIR) / "data" / "learner_state.db"

    # Static allowlist of approved MITRE ATT&CK Atomic Tests
    ALLOWED_ATOMIC_TESTS = {
        "T1082": {
            "technique": "T1082",
            "name": "System Information Discovery",
            "category": "Discovery",
            "target": "Windows Endpoint (10.10.10.20)",
            "target_host": "windows",
            "description": "Executes systeminfo, net config workstation, and environment queries.",
            "expected_index": "socforge-sysmon-*",
            "expected_events": ["EventID 1 (Process Creation)", "EventID 4104 (ScriptBlock)"],
            "remote_cmd": "/usr/local/bin/run-atomic-test --technique T1082 --confirm",
        },
        "T1059.001": {
            "technique": "T1059.001",
            "name": "PowerShell ScriptBlock Execution & Obfuscation",
            "category": "Execution",
            "target": "Windows Endpoint (10.10.10.20)",
            "target_host": "windows",
            "description": "Simulates encoded command execution and bypass flags via PowerShell.",
            "expected_index": "socforge-powershell-*",
            "expected_events": ["EventID 4104 (ScriptBlock Logging)", "EventID 1 (Sysmon)"],
            "remote_cmd": "/usr/local/bin/run-atomic-test --technique T1059.001 --confirm",
        },
        "T1027.013": {
            "technique": "T1027.013",
            "name": "PowerShell Obfuscation & Encoded Payload",
            "category": "Defense Evasion",
            "target": "Windows Endpoint (10.10.10.20)",
            "target_host": "windows",
            "description": "Simulates encoded command execution and bypass flags via PowerShell.",
            "expected_index": "socforge-powershell-*",
            "expected_events": ["EventID 4104 (ScriptBlock Logging)", "EventID 1 (Sysmon)"],
            "remote_cmd": "/usr/local/bin/run-atomic-test --technique T1059.001 --confirm",
        },
        "T1027": {
            "technique": "T1027",
            "name": "Obfuscated Files or Information",
            "category": "Defense Evasion",
            "target": "Windows Endpoint (10.10.10.20)",
            "target_host": "windows",
            "description": "Simulates obfuscated payload execution via PowerShell.",
            "expected_index": "socforge-powershell-*",
            "expected_events": ["EventID 4104 (ScriptBlock Logging)"],
            "remote_cmd": "/usr/local/bin/run-atomic-test --technique T1059.001 --confirm",
        },
        "T1053.005": {
            "technique": "T1053.005",
            "name": "Scheduled Task Persistence Creation",
            "category": "Persistence",
            "target": "Windows Endpoint (10.10.10.20)",
            "target_host": "windows",
            "description": "Registers a persistence task using schtasks.exe.",
            "expected_index": "socforge-sysmon-*",
            "expected_events": ["EventID 1 (Process Create: schtasks.exe)", "EventID 106 (Task Scheduled)"],
            "remote_cmd": "/usr/local/bin/run-atomic-test --technique T1053.005 --confirm",
        },
        "T1003.001": {
            "technique": "T1003.001",
            "name": "LSASS Memory Dump Simulation (Safety Hook)",
            "category": "Credential Access",
            "target": "Windows Endpoint (10.10.10.20)",
            "target_host": "windows",
            "description": "Simulates LSASS process access telemetry (EventID 10) without extracting live credentials.",
            "expected_index": "socforge-sysmon-*",
            "expected_events": ["EventID 10 (ProcessAccess to lsass.exe)"],
            "remote_cmd": "/usr/local/bin/run-atomic-test --technique T1003.001 --confirm",
        },
        "T1110.001": {
            "technique": "T1110.001",
            "name": "Password Guessing & Spraying",
            "category": "Credential Access",
            "target": "Windows Endpoint (10.10.10.20)",
            "target_host": "windows",
            "description": "Generates multiple failed authentication attempts against SMB / WinRM.",
            "expected_index": "socforge-sysmon-*",
            "expected_events": ["EventID 4625 (Failed Logon)"],
            "remote_cmd": "/usr/local/bin/run-atomic-test --technique T1110.001 --confirm",
        },
        "T1110": {
            "technique": "T1110",
            "name": "Brute Force / Password Guessing",
            "category": "Credential Access",
            "target": "Windows Endpoint (10.10.10.20)",
            "target_host": "windows",
            "description": "Generates multiple failed authentication attempts against SMB / WinRM.",
            "expected_index": "socforge-sysmon-*",
            "expected_events": ["EventID 4625 (Failed Logon)"],
            "remote_cmd": "/usr/local/bin/run-atomic-test --technique T1110.001 --confirm",
        },
        "T1562.001": {
            "technique": "T1562.001",
            "name": "Defense Evasion — Event Log Clearing Attempt",
            "category": "Defense Evasion",
            "target": "Windows Endpoint (10.10.10.20)",
            "target_host": "windows",
            "description": "Simulates wevtutil.exe cl event log manipulation.",
            "expected_index": "socforge-sysmon-*",
            "expected_events": ["EventID 1102 (The audit log was cleared)"],
            "remote_cmd": "/usr/local/bin/run-atomic-test --technique T1562.001 --confirm",
        },
        "T1046": {
            "technique": "T1046",
            "name": "Network Service Port Scan",
            "category": "Discovery",
            "target": "Linux Web Target (10.10.30.10)",
            "target_host": "web",
            "description": "Executes SYN port scan from Attack host to Web Target.",
            "expected_index": "socforge-auditd-*",
            "expected_events": ["Auditd Socket Connection", "Nginx Connection Logs"],
            "remote_cmd": "/usr/local/bin/run-atomic-test --technique T1046 --confirm",
        },
        "T1021": {
            "technique": "T1021",
            "name": "Remote Services / Lateral Movement Discovery",
            "category": "Lateral Movement",
            "target": "Windows Endpoint (10.10.10.20)",
            "target_host": "windows",
            "description": "Executes remote service enumeration against Windows target.",
            "expected_index": "socforge-sysmon-*",
            "expected_events": ["EventID 3 (Network Connection)", "EventID 1 (Process Create)"],
            "remote_cmd": "/usr/local/bin/run-atomic-test --technique T1082 --confirm",
        },
        "T1071": {
            "technique": "T1071",
            "name": "Application Layer Protocol Communication",
            "category": "Command and Control",
            "target": "Windows Endpoint (10.10.10.20)",
            "target_host": "windows",
            "description": "Executes outbound protocol connection probes.",
            "expected_index": "socforge-sysmon-*",
            "expected_events": ["EventID 3 (Network Connection)"],
            "remote_cmd": "/usr/local/bin/run-atomic-test --technique T1082 --confirm",
        },
        "DET-COR-001": {
            "technique": "DET-COR-001",
            "name": "Multi-Source Incident Correlation",
            "category": "Full Spectrum",
            "target": "Windows & Web Endpoints",
            "target_host": "windows",
            "description": "Generates multi-stream telemetry for incident correlation.",
            "expected_index": "wazuh-alerts-*",
            "expected_events": ["Wazuh Rule 5501", "Sysmon EventID 1"],
            "remote_cmd": "/usr/local/bin/run-atomic-test --technique T1059.001 --confirm",
        },
    }

    # Static allowlist of approved Web Application Attack Scenarios
    ALLOWED_WEB_SCENARIOS = {
        "DVWA-03": {
            "scenario": "DVWA-03",
            "name": "DVWA SQL Injection (Error-Based & Boolean)",
            "target": "Linux Web Target (10.10.30.10:8000)",
            "target_host": "web",
            "description": "Dispatches SQL injection payloads against DVWA /vulnerabilities/sqli/ endpoint.",
            "expected_index": "socforge-nginx-access-*",
            "expected_events": ["Nginx HTTP GET with SQL syntax payloads"],
            "remote_cmd": "/usr/local/bin/run-web-test --scenario DVWA-03 --confirm",
        },
        "DVWA-SQLI": {
            "scenario": "DVWA-SQLI",
            "name": "DVWA SQL Injection (Error-Based & Boolean)",
            "target": "Linux Web Target (10.10.30.10:8000)",
            "target_host": "web",
            "description": "Dispatches SQL injection payloads against DVWA /vulnerabilities/sqli/ endpoint.",
            "expected_index": "socforge-nginx-access-*",
            "expected_events": ["Nginx HTTP GET with SQL syntax payloads"],
            "remote_cmd": "/usr/local/bin/run-web-test --scenario DVWA-03 --confirm",
        },
        "T1190": {
            "scenario": "T1190",
            "name": "DVWA SQL Injection (T1190 Exploit Public-Facing App)",
            "target": "Linux Web Target (10.10.30.10:8000)",
            "target_host": "web",
            "description": "Dispatches SQL injection payloads against DVWA /vulnerabilities/sqli/ endpoint.",
            "expected_index": "socforge-nginx-access-*",
            "expected_events": ["Nginx HTTP GET with SQL syntax payloads"],
            "remote_cmd": "/usr/local/bin/run-web-test --scenario DVWA-03 --confirm",
        },
        "DVWA-04": {
            "scenario": "DVWA-04",
            "name": "DVWA Remote OS Command Injection",
            "target": "Linux Web Target (10.10.30.10:8000)",
            "target_host": "web",
            "description": "Tests semicolon and pipe OS command chaining against DVWA ping utility.",
            "expected_index": "socforge-auditd-*",
            "expected_events": ["Auditd execve /bin/cat /etc/passwd", "Nginx access log"],
            "remote_cmd": "/usr/local/bin/run-web-test --scenario DVWA-04 --confirm",
        },
        "DVWA-COMMAND-INJECTION": {
            "scenario": "DVWA-COMMAND-INJECTION",
            "name": "DVWA Remote OS Command Injection",
            "target": "Linux Web Target (10.10.30.10:8000)",
            "target_host": "web",
            "description": "Tests semicolon and pipe OS command chaining against DVWA ping utility.",
            "expected_index": "socforge-auditd-*",
            "expected_events": ["Auditd execve /bin/cat /etc/passwd", "Nginx access log"],
            "remote_cmd": "/usr/local/bin/run-web-test --scenario DVWA-04 --confirm",
        },
        "T1059.004": {
            "scenario": "T1059.004",
            "name": "DVWA Unix Shell Command Injection (T1059.004)",
            "target": "Linux Web Target (10.10.30.10:8000)",
            "target_host": "web",
            "description": "Tests semicolon and pipe OS command chaining against DVWA ping utility.",
            "expected_index": "socforge-auditd-*",
            "expected_events": ["Auditd execve /bin/cat /etc/passwd", "Nginx access log"],
            "remote_cmd": "/usr/local/bin/run-web-test --scenario DVWA-04 --confirm",
        },
        "T1505.003": {
            "scenario": "T1505.003",
            "name": "Web Shell & Command Execution (T1505.003)",
            "target": "Linux Web Target (10.10.30.10:8000)",
            "target_host": "web",
            "description": "Tests web command execution simulating web shell behavior.",
            "expected_index": "socforge-auditd-*",
            "expected_events": ["Auditd execve", "Nginx access log"],
            "remote_cmd": "/usr/local/bin/run-web-test --scenario DVWA-04 --confirm",
        },
        "DVWA-05": {
            "scenario": "DVWA-05",
            "name": "DVWA Local File Inclusion (LFI)",
            "target": "Linux Web Target (10.10.30.10:8000)",
            "target_host": "web",
            "description": "Sends path traversal probes against DVWA /vulnerabilities/fi/ endpoint.",
            "expected_index": "socforge-nginx-access-*",
            "expected_events": ["Nginx URI parameters containing ../../etc/passwd"],
            "remote_cmd": "/usr/local/bin/run-web-test --scenario DVWA-05 --confirm",
        },
        "T1083": {
            "scenario": "T1083",
            "name": "DVWA Local File Inclusion / File Discovery (T1083)",
            "target": "Linux Web Target (10.10.30.10:8000)",
            "target_host": "web",
            "description": "Sends path traversal probes against DVWA /vulnerabilities/fi/ endpoint.",
            "expected_index": "socforge-nginx-access-*",
            "expected_events": ["Nginx URI parameters containing ../../etc/passwd"],
            "remote_cmd": "/usr/local/bin/run-web-test --scenario DVWA-05 --confirm",
        },
        "DVWA-XSS": {
            "scenario": "DVWA-XSS",
            "name": "DVWA Local File Inclusion / Script Injection",
            "target": "Linux Web Target (10.10.30.10:8000)",
            "target_host": "web",
            "description": "Sends script injection probes against DVWA endpoint.",
            "expected_index": "socforge-nginx-access-*",
            "expected_events": ["Nginx URI parameters containing script tags"],
            "remote_cmd": "/usr/local/bin/run-web-test --scenario DVWA-05 --confirm",
        },
        "JS-05": {
            "scenario": "JS-05",
            "name": "OWASP Juice Shop SQLi Authentication Bypass",
            "target": "Linux Web Target (10.10.30.10:3000)",
            "target_host": "web",
            "description": "Sends ' OR 1=1-- payload to Juice Shop /rest/user/login endpoint.",
            "expected_index": "socforge-juice-shop-*",
            "expected_events": ["Juice Shop POST /rest/user/login bypass event"],
            "remote_cmd": "/usr/local/bin/run-web-test --scenario JS-05 --confirm",
        },
        "JUICESHOP-AUTH": {
            "scenario": "JUICESHOP-AUTH",
            "name": "OWASP Juice Shop SQLi Authentication Bypass",
            "target": "Linux Web Target (10.10.30.10:3000)",
            "target_host": "web",
            "description": "Sends ' OR 1=1-- payload to Juice Shop /rest/user/login endpoint.",
            "expected_index": "socforge-juice-shop-*",
            "expected_events": ["Juice Shop POST /rest/user/login bypass event"],
            "remote_cmd": "/usr/local/bin/run-web-test --scenario JS-05 --confirm",
        },
        "T1087": {
            "scenario": "T1087",
            "name": "Juice Shop User Account Discovery (T1087)",
            "target": "Linux Web Target (10.10.30.10:3000)",
            "target_host": "web",
            "description": "Sends account query requests to Juice Shop API.",
            "expected_index": "socforge-juice-shop-*",
            "expected_events": ["Juice Shop REST API access logs"],
            "remote_cmd": "/usr/local/bin/run-web-test --scenario JS-05 --confirm",
        },
        "T1595": {
            "scenario": "T1595",
            "name": "Active Vulnerability Scanning / API Probing (T1595)",
            "target": "Linux Web Target (10.10.30.10:3000)",
            "target_host": "web",
            "description": "Sends vulnerability probes against Juice Shop API.",
            "expected_index": "socforge-juice-shop-*",
            "expected_events": ["Juice Shop REST API access logs"],
            "remote_cmd": "/usr/local/bin/run-web-test --scenario JS-05 --confirm",
        },
    }

    # Static allowlist of Baseline telemetry generation
    ALLOWED_BASELINES = {
        "BASELINE-AUTH": {
            "event_type": "BASELINE-AUTH",
            "name": "Normal Linux Sudo & SSH Activity",
            "target": "Linux Web Target (10.10.30.10)",
            "description": "Generates benign sudo commands and standard user authentication logs.",
            "expected_index": "socforge-linux-auth-*",
            "remote_cmd": "/usr/local/bin/run-web-test --baseline --confirm",
        },
        "BASELINE-WEB": {
            "event_type": "BASELINE-WEB",
            "name": "Standard HTTP GET Traffic",
            "target": "Linux Web Target (10.10.30.10)",
            "description": "Fetches standard CSS/JS static assets to populate legitimate baseline traffic.",
            "expected_index": "socforge-nginx-access-*",
            "remote_cmd": "/usr/local/bin/run-web-test --baseline --confirm",
        },
        "BASELINE-WIN": {
            "event_type": "BASELINE-WIN",
            "name": "Normal Windows Service Status Query",
            "target": "Windows Endpoint (10.10.10.20)",
            "description": "Queries Windows services via Get-Service without anomalous flags.",
            "expected_index": "socforge-sysmon-*",
            "remote_cmd": "/usr/local/bin/run-atomic-test --technique T1082 --confirm",
        },
    }

    @classmethod
    def _init_db(cls):
        """Initializes SQLite database table for simulation audit history."""
        cls.DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        with sqlite3.connect(cls.DB_PATH) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS lab_simulations (
                    id TEXT PRIMARY KEY,
                    simulation_type TEXT NOT NULL,
                    identifier TEXT NOT NULL,
                    name TEXT NOT NULL,
                    target TEXT NOT NULL,
                    status TEXT NOT NULL,
                    exit_code INTEGER,
                    started_at TEXT NOT NULL,
                    completed_at TEXT,
                    log_file TEXT,
                    runtime_mode TEXT NOT NULL
                )
            """)
            conn.commit()

    @classmethod
    def get_catalog(cls) -> Dict[str, Any]:
        """Returns the full catalog of approved simulation operations."""
        return {
            "atomic_tests": list(cls.ALLOWED_ATOMIC_TESTS.values()),
            "web_scenarios": list(cls.ALLOWED_WEB_SCENARIOS.values()),
            "baseline_events": list(cls.ALLOWED_BASELINES.values()),
        }

    @classmethod
    def run_simulation(
        cls,
        simulation_type: str,
        identifier: str,
        confirm: bool = False
    ) -> Dict[str, Any]:
        """
        Executes an approved simulation in a safe, non-interactive manner.
        1. Validates simulation_type and identifier against strict allowlists.
        2. Resolves Bastion and Attack host connectivity.
        3. Executes the approved wrapper script via SSH ProxyJump.
        4. Streams and records output in audit database.
        """
        if not confirm:
            raise SecurityValidationError("Confirmation is required to execute a lab simulation.")

        cls._init_db()
        sim_id = f"sim-{uuid.uuid4().hex[:8]}"
        started_at = datetime.utcnow().isoformat() + "Z"
        runtime_mode = RuntimeService.get_runtime_mode()

        import re
        simulation_type = (simulation_type or "").lower().strip()
        clean_id = (identifier or "").strip().upper()

        # Auto-detect simulation type if needed
        if not simulation_type or simulation_type not in ("atomic", "web", "baseline"):
            if clean_id in cls.ALLOWED_ATOMIC_TESTS or re.match(r"^T\d{4}(\.\d{3})?$", clean_id):
                simulation_type = "atomic"
            elif clean_id in cls.ALLOWED_WEB_SCENARIOS or "DVWA" in clean_id or "JS" in clean_id:
                simulation_type = "web"
            elif clean_id in cls.ALLOWED_BASELINES or "BASELINE" in clean_id:
                simulation_type = "baseline"
            else:
                simulation_type = "atomic"

        # Validate against allowlists
        target_info: Dict[str, Any] = {}
        remote_cmd: str = ""

        if simulation_type == "atomic":
            if clean_id in cls.ALLOWED_ATOMIC_TESTS:
                target_info = cls.ALLOWED_ATOMIC_TESTS[clean_id]
                remote_cmd = target_info["remote_cmd"]
            elif re.match(r"^T\d{4}(\.\d{3})?$", clean_id):
                target_info = {
                    "technique": clean_id,
                    "name": f"Atomic Test {clean_id}",
                    "target": "Windows Endpoint (10.10.10.20)",
                    "target_host": "windows",
                    "expected_index": "socforge-sysmon-*",
                    "expected_events": ["Sysmon / PowerShell Telemetry"],
                    "remote_cmd": f"/usr/local/bin/run-atomic-test --technique {clean_id} --confirm",
                }
                remote_cmd = target_info["remote_cmd"]
            else:
                raise SecurityValidationError(f"Invalid or unapproved Atomic Test technique: '{identifier}'.")
        elif simulation_type == "web":
            if clean_id in cls.ALLOWED_WEB_SCENARIOS:
                target_info = cls.ALLOWED_WEB_SCENARIOS[clean_id]
                remote_cmd = target_info["remote_cmd"]
            else:
                raise SecurityValidationError(f"Invalid or unapproved Web Scenario: '{identifier}'.")
        elif simulation_type == "baseline":
            if clean_id in cls.ALLOWED_BASELINES:
                target_info = cls.ALLOWED_BASELINES[clean_id]
                remote_cmd = target_info["remote_cmd"]
            else:
                raise SecurityValidationError(f"Invalid or unapproved Baseline type: '{identifier}'.")
        else:
            raise SecurityValidationError(f"Unknown simulation type: '{simulation_type}'.")

        # Resolve live Bastion and Attack host IPs
        instances = AWSService.get_instances()
        bastion_node = next((i for i in instances if "bastion" in i.name.lower() and i.public_ip and i.public_ip != "None"), None)
        attack_node = next((i for i in instances if "attack" in i.name.lower() and i.private_ip and i.private_ip != "None"), None)

        if not bastion_node or bastion_node.state != "running":
            raise SecurityValidationError("Bastion host is not running. Please start EC2 instances first.")

        bastion_ip = bastion_node.public_ip
        attack_ip = attack_node.private_ip if attack_node else "10.10.20.10"
        key_path = settings.SSH_KEY_PATH

        # Build controlled SSH execution command
        # Wrapper script executes in-place without allowing arbitrary argument injection
        proxy_cmd = (
            f"ssh -i {key_path} -o BatchMode=yes -o StrictHostKeyChecking=no "
            f"-o UserKnownHostsFile=/dev/null -o LogLevel=ERROR -o ConnectTimeout=5 "
            f"-W %h:%p ubuntu@{bastion_ip}"
        )

        ssh_cmd = [
            "ssh",
            "-i", str(key_path),
            "-o", "BatchMode=yes",
            "-o", "StrictHostKeyChecking=no",
            "-o", "UserKnownHostsFile=/dev/null",
            "-o", "LogLevel=ERROR",
            "-o", "ConnectTimeout=10",
            "-o", f"ProxyCommand={proxy_cmd}",
            f"ubuntu@{attack_ip}",
            remote_cmd
        ]

        action_name = f"simulation_{simulation_type}_{identifier.lower().replace('.', '_')}"
        exit_code, output, log_path = OperationsManager.run_command(
            ssh_cmd,
            settings.PROJECT_ROOT,
            action_name
        )

        completed_at = datetime.utcnow().isoformat() + "Z"
        status = "COMPLETED" if exit_code == 0 else "FAILED"
        log_file = log_path.name if log_path else None

        # Record in SQLite audit database
        with sqlite3.connect(cls.DB_PATH) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO lab_simulations (
                    id, simulation_type, identifier, name, target, status, exit_code, started_at, completed_at, log_file, runtime_mode
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                sim_id,
                simulation_type,
                identifier,
                target_info["name"],
                target_info["target"],
                status,
                exit_code,
                started_at,
                completed_at,
                log_file,
                runtime_mode
            ))
            conn.commit()

        return {
            "simulation_id": sim_id,
            "simulation_type": simulation_type,
            "identifier": identifier,
            "name": target_info["name"],
            "target": target_info["target"],
            "status": status,
            "exit_code": exit_code,
            "started_at": started_at,
            "completed_at": completed_at,
            "log_file": log_file,
            "output_preview": output[-1500:] if output else "",
            "expected_index": target_info.get("expected_index"),
            "expected_events": target_info.get("expected_events", []),
        }

    @classmethod
    def get_simulation_history(cls, limit: int = 10) -> List[Dict[str, Any]]:
        """Returns recent simulation audit records."""
        cls._init_db()
        with sqlite3.connect(cls.DB_PATH) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM lab_simulations ORDER BY started_at DESC LIMIT ?
            """, (limit,))
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
