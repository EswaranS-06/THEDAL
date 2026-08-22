"""
THEDAL Control Plane — Learning Portal & SOC Investigation Workspace Service
Manages curriculum catalog, structured 3-panel workspace data, Markdown rendering, and SQLite learner state.
"""

import os
import re
import html
import json
import sqlite3
from datetime import datetime
from typing import Optional, Dict, Any, List
from app.config import settings

DB_PATH = os.path.join(settings.PROJECT_ROOT, "control-plane", "learner_state.db")

LAB_CATALOG = [
    {
        "id": "01-first-alert",
        "title": "Your First Wazuh Alert & Log Anatomy",
        "level": "Level 1: Foundations",
        "level_code": "1",
        "source": "Windows EventLog",
        "target_index": "wazuh-alerts-*",
        "rel_path": "docs/labs/01-first-alert/README.md",
        "mitre": "General",
        "difficulty": "Beginner",
        "estimated_time": "15–20 min",
        "required_hosts": ["wazuh", "bastion"],
        "required_index": "wazuh-alerts-*"
    },
    {
        "id": "02-windows-process",
        "title": "Windows Process Investigation & Sysmon",
        "level": "Level 1: Foundations",
        "level_code": "1",
        "source": "Sysmon EID 1",
        "target_index": "socforge-sysmon-*",
        "rel_path": "docs/labs/02-windows-process/README.md",
        "mitre": "T1059",
        "difficulty": "Beginner",
        "estimated_time": "20–25 min",
        "required_hosts": ["windows", "attack", "wazuh", "bastion"],
        "required_index": "socforge-sysmon-*"
    },
    {
        "id": "03-powershell-investigation",
        "title": "PowerShell Telemetry & ScriptBlock Logging",
        "level": "Level 1: Foundations",
        "level_code": "1",
        "source": "PowerShell 4104",
        "target_index": "socforge-powershell-*",
        "rel_path": "docs/labs/03-powershell-investigation/README.md",
        "mitre": "T1059.001",
        "difficulty": "Beginner",
        "estimated_time": "20–30 min",
        "required_hosts": ["windows", "attack", "wazuh", "bastion"],
        "required_index": "socforge-powershell-*"
    },
    {
        "id": "04-failed-authentication",
        "title": "Failed Authentication Analysis",
        "level": "Level 1: Foundations",
        "level_code": "1",
        "source": "Auth.log & 4625",
        "target_index": "socforge-linux-auth-*",
        "rel_path": "docs/labs/04-failed-authentication/README.md",
        "mitre": "T1110",
        "difficulty": "Beginner",
        "estimated_time": "20–25 min",
        "required_hosts": ["web", "attack", "wazuh", "bastion"],
        "required_index": "socforge-linux-auth-*"
    },
    {
        "id": "05-dvwa-sqli",
        "title": "DVWA SQL Injection Investigation",
        "level": "Level 2: Investigation",
        "level_code": "2",
        "source": "Nginx Access",
        "target_index": "socforge-nginx-access-*",
        "rel_path": "docs/labs/05-dvwa-sqli/README.md",
        "mitre": "T1190",
        "difficulty": "Intermediate",
        "estimated_time": "25–35 min",
        "required_hosts": ["web", "attack", "wazuh", "bastion"],
        "required_index": "socforge-nginx-access-*"
    },
    {
        "id": "06-dvwa-command-injection",
        "title": "DVWA Command Injection & Linux Auditd",
        "level": "Level 2: Investigation",
        "level_code": "2",
        "source": "Nginx + Auditd",
        "target_index": "socforge-auditd-*",
        "rel_path": "docs/labs/06-dvwa-command-injection/README.md",
        "mitre": "T1059.004",
        "difficulty": "Intermediate",
        "estimated_time": "25–35 min",
        "required_hosts": ["web", "attack", "wazuh", "bastion"],
        "required_index": "socforge-auditd-*"
    },
    {
        "id": "07-dvwa-lfi",
        "title": "DVWA Local File Inclusion (LFI)",
        "level": "Level 2: Investigation",
        "level_code": "2",
        "source": "Nginx Access",
        "target_index": "socforge-nginx-access-*",
        "rel_path": "docs/labs/07-dvwa-lfi/README.md",
        "mitre": "T1083",
        "difficulty": "Intermediate",
        "estimated_time": "25–30 min",
        "required_hosts": ["web", "attack", "wazuh", "bastion"],
        "required_index": "socforge-nginx-access-*"
    },
    {
        "id": "08-juice-shop-api",
        "title": "Juice Shop Container REST API Probing",
        "level": "Level 2: Investigation",
        "level_code": "2",
        "source": "Docker JSON Logs",
        "target_index": "socforge-juice-shop-*",
        "rel_path": "docs/labs/08-juice-shop-api/README.md",
        "mitre": "T1087 / T1595",
        "difficulty": "Intermediate",
        "estimated_time": "25–30 min",
        "required_hosts": ["web", "attack", "wazuh", "bastion"],
        "required_index": "socforge-juice-shop-*"
    },
    {
        "id": "09-atomic-red-team",
        "title": "Atomic Red Team Reconnaissance",
        "level": "Level 3: Attack Correlation",
        "level_code": "3",
        "source": "Windows Security + Sysmon",
        "target_index": "socforge-sysmon-*",
        "rel_path": "docs/labs/09-atomic-red-team/README.md",
        "mitre": "T1082",
        "difficulty": "Advanced",
        "estimated_time": "30–40 min",
        "required_hosts": ["windows", "attack", "wazuh", "bastion"],
        "required_index": "socforge-sysmon-*"
    },
    {
        "id": "10-powershell-attack",
        "title": "PowerShell Attack & Obfuscation",
        "level": "Level 3: Attack Correlation",
        "level_code": "3",
        "source": "Sysmon + ScriptBlock",
        "target_index": "socforge-powershell-*",
        "rel_path": "docs/labs/10-powershell-attack/README.md",
        "mitre": "T1027.013",
        "difficulty": "Advanced",
        "estimated_time": "30–40 min",
        "required_hosts": ["windows", "attack", "wazuh", "bastion"],
        "required_index": "socforge-powershell-*"
    },
    {
        "id": "11-scheduled-task",
        "title": "Scheduled Task Persistence",
        "level": "Level 3: Attack Correlation",
        "level_code": "3",
        "source": "Sysmon Event ID 1",
        "target_index": "socforge-sysmon-*",
        "rel_path": "docs/labs/11-scheduled-task/README.md",
        "mitre": "T1053.005",
        "difficulty": "Advanced",
        "estimated_time": "30–40 min",
        "required_hosts": ["windows", "attack", "wazuh", "bastion"],
        "required_index": "socforge-sysmon-*"
    },
    {
        "id": "12-multi-source-correlation",
        "title": "Multi-Source Incident Correlation",
        "level": "Level 3: Attack Correlation",
        "level_code": "3",
        "source": "Web + Kernel Syscalls",
        "target_index": "wazuh-alerts-*",
        "rel_path": "docs/labs/12-multi-source-correlation/README.md",
        "mitre": "DET-COR-001",
        "difficulty": "Advanced",
        "estimated_time": "35–45 min",
        "required_hosts": ["web", "windows", "attack", "wazuh", "bastion"],
        "required_index": "wazuh-alerts-*"
    },
    {
        "id": "13-tp-vs-fp",
        "title": "True Positive vs. False Positive Triage",
        "level": "Level 3: Attack Correlation",
        "level_code": "3",
        "source": "All Telemetry",
        "target_index": "wazuh-alerts-*",
        "rel_path": "docs/labs/13-tp-vs-fp/README.md",
        "mitre": "Methodology",
        "difficulty": "Advanced",
        "estimated_time": "30–45 min",
        "required_hosts": ["web", "windows", "attack", "wazuh", "bastion"],
        "required_index": "wazuh-alerts-*"
    },
    {
        "id": "14-incident-timeline",
        "title": "Full Incident Timeline Construction",
        "level": "Level 3: Attack Correlation",
        "level_code": "3",
        "source": "Full Fleet Correlation",
        "target_index": "wazuh-alerts-*",
        "rel_path": "docs/labs/14-incident-timeline/README.md",
        "mitre": "Timeline",
        "difficulty": "Advanced",
        "estimated_time": "45–60 min",
        "required_hosts": ["web", "windows", "attack", "wazuh", "bastion"],
        "required_index": "wazuh-alerts-*"
    },
    {
        "id": "challenge-01",
        "title": "Mystery Challenge 1: Lateral Movement & EID 3",
        "level": "Mystery Challenges",
        "level_code": "challenge",
        "source": "Sysmon + WinSec",
        "target_index": "socforge-sysmon-*",
        "rel_path": "docs/labs/challenges/challenge-01.md",
        "mitre": "T1021 / T1059",
        "difficulty": "Advanced / Mystery",
        "estimated_time": "30–45 min",
        "required_hosts": ["windows", "attack", "wazuh", "bastion"],
        "required_index": "socforge-sysmon-*"
    },
    {
        "id": "challenge-02",
        "title": "Mystery Challenge 2: Container Web Shell & Auditd",
        "level": "Mystery Challenges",
        "level_code": "challenge",
        "source": "Docker + Auditd",
        "target_index": "socforge-auditd-*",
        "rel_path": "docs/labs/challenges/challenge-02.md",
        "mitre": "T1505.003",
        "difficulty": "Advanced / Mystery",
        "estimated_time": "30–45 min",
        "required_hosts": ["web", "attack", "wazuh", "bastion"],
        "required_index": "socforge-auditd-*"
    },
    {
        "id": "challenge-03",
        "title": "Mystery Challenge 3: Scheduled Task C2 Beacon",
        "level": "Mystery Challenges",
        "level_code": "challenge",
        "source": "Sysmon + EventLog",
        "target_index": "socforge-sysmon-*",
        "rel_path": "docs/labs/challenges/challenge-03.md",
        "mitre": "T1053.005 / T1071",
        "difficulty": "Advanced / Mystery",
        "estimated_time": "35–50 min",
        "required_hosts": ["windows", "attack", "wazuh", "bastion"],
        "required_index": "socforge-sysmon-*"
    }
]


class LearningService:
    """Service for handling learning curriculum, progressive workspace, and SQLite learner state."""

    @classmethod
    def _get_db(cls) -> sqlite3.Connection:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn

    @classmethod
    def init_db(cls):
        """Initialize SQLite database for learner progress, evidence board, and assessment answers."""
        with cls._get_db() as conn:
            # 1. Main Progress Table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS lab_progress (
                    lab_id TEXT PRIMARY KEY,
                    status TEXT DEFAULT 'Not Started',
                    current_step INTEGER DEFAULT 0,
                    started_at TEXT,
                    completed_at TEXT,
                    notes TEXT DEFAULT '',
                    attempts INTEGER DEFAULT 0,
                    bookmarked INTEGER DEFAULT 0,
                    verdict TEXT DEFAULT '',
                    checklist TEXT DEFAULT '[]'
                )
            """)

            # 2. Case Evidence Board
            conn.execute("""
                CREATE TABLE IF NOT EXISTS lab_evidence (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    lab_id TEXT NOT NULL,
                    source TEXT NOT NULL,
                    event_id TEXT,
                    timestamp TEXT,
                    finding TEXT NOT NULL,
                    created_at TEXT NOT NULL
                )
            """)

            # 3. Interactive Question Answers
            conn.execute("""
                CREATE TABLE IF NOT EXISTS lab_answers (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    lab_id TEXT NOT NULL,
                    question_id TEXT NOT NULL,
                    selected_option TEXT NOT NULL,
                    is_correct INTEGER DEFAULT 0,
                    answered_at TEXT NOT NULL
                )
            """)

            # Migrate schema if columns missing
            cur = conn.cursor()
            cur.execute("PRAGMA table_info(lab_progress)")
            cols = [r["name"] for r in cur.fetchall()]
            if "current_step" not in cols:
                conn.execute("ALTER TABLE lab_progress ADD COLUMN current_step INTEGER DEFAULT 0")
            if "verdict" not in cols:
                conn.execute("ALTER TABLE lab_progress ADD COLUMN verdict TEXT DEFAULT ''")
            if "checklist" not in cols:
                conn.execute("ALTER TABLE lab_progress ADD COLUMN checklist TEXT DEFAULT '[]'")

            conn.commit()

    @classmethod
    def interpolate_live_telemetry(cls, text: str) -> str:
        """Dynamically substitutes placeholder IPs and key paths with live AWS/Terraform values."""
        if not text:
            return text
        try:
            from app.services.aws import AWSService
            from app.services.terraform import TerraformService
            instances = AWSService.get_instances()
            tf_outputs = TerraformService.get_outputs()

            bastion_node = next((i for i in instances if "bastion" in i.name.lower() and i.public_ip and i.public_ip != "None"), None)
            if bastion_node and bastion_node.public_ip:
                bastion_ip = bastion_node.public_ip
            else:
                bastion_ip = tf_outputs.get("bastion_public_ip", "")

            key_path = str(settings.SSH_KEY_PATH)

            if bastion_ip and bastion_ip != "<BASTION_PUBLIC_IP>":
                for placeholder in [
                    "<BASTION_PUBLIC_IP>",
                    "<bastion_public_ip>",
                    "<BASTION_IP>",
                    "<bastion_ip>",
                    "<bastion-ip>",
                    "<ubuntu-ip>",
                    "<ubuntu_ip>",
                    "<UBUNTU-IP>",
                    "<UBUNTU_IP>",
                    "<BASTION-IP>",
                    "<PUBLIC_IP>",
                    "<public_ip>"
                ]:
                    text = text.replace(placeholder, bastion_ip)

            if key_path:
                text = text.replace("~/.ssh/socforge_key", key_path)
                text = text.replace("~/.ssh/thedal_key", key_path)
        except Exception:
            pass
        return text

    @classmethod
    def get_all_labs_with_progress(cls) -> List[Dict[str, Any]]:
        """Get all labs annotated with learner progress."""
        cls.init_db()
        with cls._get_db() as conn:
            cur = conn.cursor()
            cur.execute("SELECT * FROM lab_progress")
            progress_map = {row["lab_id"]: dict(row) for row in cur.fetchall()}

        result = []
        for lab in LAB_CATALOG:
            item = dict(lab)
            prog = progress_map.get(lab["id"], {
                "status": "Not Started",
                "current_step": 0,
                "started_at": None,
                "completed_at": None,
                "notes": "",
                "attempts": 0,
                "bookmarked": 0,
                "verdict": "",
                "checklist": "[]"
            })
            item.update(prog)
            result.append(item)
        return result

    @classmethod
    def get_workspace(cls, lab_id: str) -> Optional[Dict[str, Any]]:
        """
        Builds a rich, interactive 3-panel SOC investigation workspace payload.
        Combines parsed markdown sections, progressive phase steps, live host readiness,
        dynamic copyable commands, analyst thinking prompts, interactive decision assessment,
        and persisted evidence board findings.
        """
        cls.init_db()
        lab_meta = next((item for item in LAB_CATALOG if item["id"] == lab_id), None)
        if not lab_meta:
            return None

        # 1. Fetch user progress & evidence from SQLite
        with cls._get_db() as conn:
            cur = conn.cursor()
            cur.execute("SELECT * FROM lab_progress WHERE lab_id = ?", (lab_id,))
            prog_row = cur.fetchone()
            prog = dict(prog_row) if prog_row else {
                "status": "Not Started",
                "current_step": 0,
                "started_at": None,
                "completed_at": None,
                "notes": "",
                "attempts": 0,
                "bookmarked": 0,
                "verdict": "",
                "checklist": "[]"
            }

            # Evidence findings
            cur.execute("SELECT * FROM lab_evidence WHERE lab_id = ? ORDER BY id ASC", (lab_id,))
            evidence_rows = [dict(r) for r in cur.fetchall()]

            # Saved question answers
            cur.execute("SELECT * FROM lab_answers WHERE lab_id = ?", (lab_id,))
            answers_rows = {r["question_id"]: {"selected_option": r["selected_option"], "is_correct": bool(r["is_correct"])} for r in cur.fetchall()}

        # 2. Check Live Cloud Environment Readiness for Required Hosts
        from app.services.aws import AWSService
        from app.services.terraform import TerraformService
        instances = AWSService.get_instances()
        tf_outputs = TerraformService.get_outputs()

        bastion_node = next((i for i in instances if "bastion" in i.name.lower() and i.public_ip and i.public_ip != "None"), None)
        live_bastion_ip = bastion_node.public_ip if bastion_node else tf_outputs.get("bastion_public_ip", "13.234.186.170")
        
        attack_node = next((i for i in instances if "attack" in i.name.lower() and i.private_ip and i.private_ip != "None"), None)
        live_attack_ip = attack_node.private_ip if attack_node else tf_outputs.get("attack_private_ip", "10.10.20.64")

        web_node = next((i for i in instances if "web" in i.name.lower() and i.private_ip and i.private_ip != "None"), None)
        live_web_ip = web_node.private_ip if web_node else tf_outputs.get("web_private_ip", "10.10.30.96")

        windows_node = next((i for i in instances if "windows" in i.name.lower() and i.private_ip and i.private_ip != "None"), None)
        live_windows_ip = windows_node.private_ip if windows_node else tf_outputs.get("windows_private_ip", "10.10.10.212")

        key_path = str(settings.SSH_KEY_PATH)

        required_hosts_list = lab_meta.get("required_hosts", ["wazuh", "bastion"])
        live_hosts_status = []
        for req_host in required_hosts_list:
            node = next((i for i in instances if req_host in i.name.lower()), None)
            is_running = node.state == "running" if node else False
            live_hosts_status.append({
                "key": req_host,
                "name": f"THEDAL-{req_host.capitalize()}",
                "status": "running" if is_running else "stopped",
                "ip": (node.public_ip if req_host == "bastion" else node.private_ip) if node else "10.10.x.x"
            })

        environment_ready = all(h["status"] == "running" for h in live_hosts_status)

        # 3. Read and parse markdown content into progressive phases
        file_path = os.path.join(settings.PROJECT_ROOT, lab_meta["rel_path"])
        raw_markdown = ""
        if os.path.exists(file_path):
            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                raw_markdown = f.read()
        else:
            raw_markdown = f"# Lab content not found\n\nFile `{lab_meta['rel_path']}` does not exist."

        raw_markdown = cls.interpolate_live_telemetry(raw_markdown)

        # Build progressive phases tailored for this specific lab
        phases = cls._build_lab_phases(
            lab_id=lab_id,
            meta=lab_meta,
            raw_md=raw_markdown,
            bastion_ip=live_bastion_ip,
            attack_ip=live_attack_ip,
            web_ip=live_web_ip,
            windows_ip=live_windows_ip,
            key_path=key_path
        )

        try:
            saved_checklist = json.loads(prog.get("checklist", "[]"))
        except Exception:
            saved_checklist = []

        rendered_html = cls.render_markdown_safely(raw_markdown)

        return {
            **lab_meta,
            "status": prog.get("status", "Not Started"),
            "current_step": prog.get("current_step", 0),
            "started_at": prog.get("started_at"),
            "completed_at": prog.get("completed_at"),
            "verdict": prog.get("verdict", ""),
            "rendered_html": rendered_html,
            "raw_markdown": raw_markdown,
            "lab": {
                **lab_meta,
                "status": prog.get("status", "Not Started"),
                "current_step": prog.get("current_step", 0),
                "started_at": prog.get("started_at"),
                "completed_at": prog.get("completed_at"),
                "verdict": prog.get("verdict", ""),
            },
            "environment_status": {
                "ready": environment_ready,
                "required_hosts": live_hosts_status,
                "required_index": lab_meta.get("required_index", "wazuh-alerts-*"),
                "bastion_ip": live_bastion_ip
            },
            "phases": phases,
            "evidence": evidence_rows,
            "checklist": saved_checklist,
            "notes": prog.get("notes", ""),
            "answers": answers_rows,
        }

    @classmethod
    def get_lab_detail(cls, lab_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve single lab details, rendered markdown, and workspace state."""
        return cls.get_workspace(lab_id)

    @classmethod
    def _build_lab_phases(
        cls,
        lab_id: str,
        meta: Dict[str, Any],
        raw_md: str,
        bastion_ip: str,
        attack_ip: str,
        web_ip: str,
        windows_ip: str,
        key_path: str
    ) -> List[Dict[str, Any]]:
        """Builds standardized, structured 6-phase progressive investigation steps."""
        title = meta.get("title", "SOC Investigation")
        mitre = meta.get("mitre", "T1059")
        difficulty = meta.get("difficulty", "Beginner")
        source = meta.get("source", "Telemetry")
        target_index = meta.get("target_index", "socforge-*")

        # Custom tailored data per lab ID
        lab_specs = {
            "03-powershell-investigation": {
                "mission": "Investigate a suspicious PowerShell process execution flagged on the Windows endpoint. Extract the in-memory ScriptBlock telemetry, assess execution policy bypass flags, and determine whether the execution represents benign administration or adversary simulation.",
                "attack_host": f"THEDAL-Attack ({attack_ip})",
                "target_host": f"THEDAL-Windows ({windows_ip})",
                "attack_cmd": f"ssh -i {key_path} -o ProxyJump=ubuntu@{bastion_ip} ubuntu@{attack_ip} '/usr/local/bin/run-atomic-test --technique T1059.001 --confirm'",
                "query": 'data.win.system.eventID: "4104"',
                "query_field": "data.win.eventdata.scriptBlockText",
                "cross_query": 'data.win.eventdata.image: *powershell.exe',
                "cross_index": "socforge-sysmon-*",
                "hint_1": "Windows Event ID 4104 (ScriptBlock Logging) captures the complete code block executed by the PowerShell engine, even when encoded or dynamically evaluated via Invoke-Expression (IEX).",
                "hint_2": "In OpenSearch Dashboards, switch index to 'socforge-powershell-*', apply time filter to 'Last 15 minutes', and inspect 'data.win.eventdata.scriptBlockText'.",
                "thinking_prompts": [
                    "What parent process spawned PowerShell (e.g. cmd.exe, explorer.exe, or wazuh-agent.exe)?",
                    "What exact CLI arguments were passed in the command line? Does it include -ExecutionPolicy Bypass or -NoProfile?",
                    "What actual PowerShell code is contained in the ScriptBlockText field?",
                    "Is PowerShell inherently malicious, or does the code context determine the verdict?"
                ],
                "questions": [
                    {
                        "id": "q1",
                        "question": "How was PowerShell executed according to the Sysmon Event ID 1 process telemetry?",
                        "options": [
                            "Interactive GUI console by a logged-in user",
                            "Command-line execution with explicit argument flags (-ExecutionPolicy Bypass)",
                            "Scheduled Windows service task running as SYSTEM",
                            "Cannot be determined from telemetry"
                        ],
                        "correct_index": 1,
                        "explanation": "Sysmon Event ID 1 captures the full commandLine field showing explicit non-interactive execution with arguments."
                    },
                    {
                        "id": "q2",
                        "question": "Why do threat actors frequently append '-ExecutionPolicy Bypass' to PowerShell invocations?",
                        "options": [
                            "To elevate process privileges from Standard User to NT AUTHORITY\\SYSTEM",
                            "To disable Windows Defender real-time antivirus engine",
                            "To circumvent local script execution restrictions without requiring admin rights",
                            "To encrypt the outgoing network traffic"
                        ],
                        "correct_index": 2,
                        "explanation": "ExecutionPolicy is a safety control, not a security boundary. -ExecutionPolicy Bypass allows executing unsigned script files without administrative privileges."
                    },
                    {
                        "id": "q3",
                        "question": "What is the primary advantage of Event ID 4104 (ScriptBlock) over Sysmon Event ID 1 (Process Creation)?",
                        "options": [
                            "Event ID 4104 records network connection port numbers",
                            "Event ID 4104 captures the full de-obfuscated script content from engine memory regardless of CLI obfuscation",
                            "Event ID 4104 prevents the script from executing",
                            "Event ID 4104 is only generated by administrative users"
                        ],
                        "correct_index": 1,
                        "explanation": "When PowerShell parses code into an Abstract Syntax Tree (AST), Event ID 4104 logs the underlying script in memory, defeating perimeter obfuscation."
                    }
                ],
                "expected_verdict": "Suspicious / Test Simulation",
                "expected_findings": "The telemetry demonstrates an automated PowerShell execution carrying '-ExecutionPolicy Bypass' that executes discovery logic. Event ID 4104 captures the raw ScriptBlock text in memory, confirming adversary technique T1059.001."
            },
            "05-dvwa-sqli": {
                "mission": "Investigate SQL Injection attack activity against the DVWA web target. Locate the Nginx access log records containing SQL injection syntax in the URI, identify the payload structure, and assess if the database was breached.",
                "attack_host": f"THEDAL-Attack ({attack_ip})",
                "target_host": f"THEDAL-Web ({web_ip}:8000)",
                "attack_cmd": f"ssh -i {key_path} -o ProxyJump=ubuntu@{bastion_ip} ubuntu@{attack_ip} '/usr/local/bin/run-web-test --scenario DVWA-03 --confirm'",
                "query": 'data.request: "*OR*1=1*" OR data.status: "200"',
                "query_field": "data.request",
                "cross_query": 'data.srcip: *',
                "cross_index": "socforge-nginx-access-*",
                "hint_1": "In OpenSearch Dashboards, look for HTTP GET requests to /vulnerabilities/sqli/ containing quote and boolean characters (%27 OR 1=1).",
                "hint_2": "Check whether the HTTP response code returned by Nginx is 200 OK or 302 redirect.",
                "thinking_prompts": [
                    "What IP address originated the web request?",
                    "What exact SQL injection payload was submitted in the query string?",
                    "Does a 200 OK or 302 response prove the exploit succeeded on the backend database?"
                ],
                "expected_verdict": "True Positive / Simulation",
                "expected_findings": "Nginx access logs capture HTTP GET requests containing SQL syntax tokens against the DVWA /vulnerabilities/sqli endpoint."
            },
            "06-dvwa-command-injection": {
                "mission": "Investigate OS Command Injection executed against DVWA. Cross-correlate Nginx web requests with Linux auditd process creation events (execve) to confirm remote shell command execution.",
                "attack_host": f"THEDAL-Attack ({attack_ip})",
                "target_host": f"THEDAL-Web ({web_ip}:8000)",
                "attack_cmd": f"ssh -i {key_path} -o ProxyJump=ubuntu@{bastion_ip} ubuntu@{attack_ip} '/usr/local/bin/run-web-test --scenario DVWA-04 --confirm'",
                "query": 'data.audit.type: "EXECVE" AND (data.audit.a0: "cat" OR data.audit.a1: "/etc/passwd")',
                "query_field": "data.audit.a0 / data.audit.a1",
                "cross_query": 'data.request: "*;*" OR data.request: "*|*"',
                "cross_index": "socforge-auditd-*",
                "hint_1": "Query the Auditd index pattern (socforge-auditd-*) for EXECVE events where www-data spawned system binaries.",
                "hint_2": "Correlate with Nginx access logs around the same second to identify the originating HTTP POST request.",
                "thinking_prompts": [
                    "What process spawned the 'cat' or 'id' command? Was the parent process php-fpm or nginx?",
                    "What user context did the executed command run under (www-data)?",
                    "How does Linux auditd prove that the command actually executed on the operating system?"
                ],
                "expected_verdict": "True Positive / Exploit Execution",
                "expected_findings": "Correlated Nginx POST requests with Auditd EXECVE logs showing www-data executing system commands."
            },
            "08-juice-shop-api": {
                "mission": "Investigate REST API authentication bypass attempts against OWASP Juice Shop running in Docker. Analyze containerized application logs to uncover SQLi login bypass attempts.",
                "attack_host": f"THEDAL-Attack ({attack_ip})",
                "target_host": f"THEDAL-Web ({web_ip}:3000)",
                "attack_cmd": f"ssh -i {key_path} -o ProxyJump=ubuntu@{bastion_ip} ubuntu@{attack_ip} '/usr/local/bin/run-web-test --scenario JS-05 --confirm'",
                "query": 'data.log: "*rest/user/login*" OR data.log: "*admin*"',
                "query_field": "data.log",
                "cross_query": 'data.container.name: "*juice-shop*"',
                "cross_index": "socforge-juice-shop-*",
                "hint_1": "Query socforge-juice-shop-* for authentication requests to /rest/user/login.",
                "hint_2": "Inspect JSON payload fields for SQL injection strings such as ' OR 1=1--.",
                "thinking_prompts": [
                    "What endpoint was targeted in the REST API?",
                    "What authentication payload was submitted in the JSON body?",
                    "How do Docker container logs differ from traditional host syslog?"
                ],
                "expected_verdict": "True Positive / Authentication Bypass",
                "expected_findings": "Juice Shop JSON logs show an authentication bypass attempt against /rest/user/login using SQL injection syntax."
            }
        }

        # Build fallback attack command based on technique type
        if mitre.startswith("T"):
            default_attack_cmd = f"ssh -i {key_path} -o ProxyJump=ubuntu@{bastion_ip} ubuntu@{attack_ip} '/usr/local/bin/run-atomic-test --technique {mitre} --confirm'"
        elif "DVWA" in lab_id.upper():
            default_attack_cmd = f"ssh -i {key_path} -o ProxyJump=ubuntu@{bastion_ip} ubuntu@{attack_ip} '/usr/local/bin/run-web-test --scenario DVWA-03 --confirm'"
        elif "JUICE" in lab_id.upper():
            default_attack_cmd = f"ssh -i {key_path} -o ProxyJump=ubuntu@{bastion_ip} ubuntu@{attack_ip} '/usr/local/bin/run-web-test --scenario JS-05 --confirm'"
        else:
            default_attack_cmd = f"ssh -i {key_path} -o ProxyJump=ubuntu@{bastion_ip} ubuntu@{attack_ip} '/usr/local/bin/run-web-test --baseline --confirm'"

        spec = lab_specs.get(lab_id, {
            "mission": f"Investigate {title} using dedicated telemetry sources ({source}). Cross-reference security events in OpenSearch index '{target_index}', analyze artifacts, and deliver an evidence-backed analyst verdict.",
            "attack_host": f"THEDAL-Attack ({attack_ip})",
            "target_host": f"THEDAL-Target Node",
            "attack_cmd": default_attack_cmd,
            "query": f'rule.mitre.id: "{mitre}" OR data.win.system.eventID: "*"',
            "query_field": "full_log / data.win.eventdata",
            "cross_query": f'data.win.eventdata.image: * OR rule.id: *',
            "cross_index": target_index,
            "hint_1": f"Filter OpenSearch Discover view by index pattern '{target_index}' and adjust the time filter to 'Last 15 minutes'.",
            "hint_2": "Look for spikes in level 7+ Wazuh alert rules or unique process lineage records.",
            "thinking_prompts": [
                "What user account and IP address initiated this event?",
                "Is this behavior normal for this environment or a deviation from baseline?",
                "What corroborating logs exist in secondary telemetry streams?",
                "What is the ultimate impact on confidentiality, integrity, or availability?"
            ],
            "questions": [
                {
                    "id": "q1",
                    "question": f"Which primary telemetry source captured the activity associated with {mitre}?",
                    "options": [
                        source,
                        "Unmonitored Network Tap",
                        "Third-Party Firewall",
                        "Unknown Host"
                    ],
                    "correct_index": 0,
                    "explanation": f"The primary telemetry stream is {source} routed directly into {target_index}."
                },
                {
                    "id": "q2",
                    "question": "What is the key indicator distinguishing true threat activity from benign administration?",
                    "options": [
                        "The time of day the event occurred",
                        "The presence of suspicious flags, unauthorized parent processes, or known exploit payloads",
                        "Whether the server is running Linux or Windows",
                        "The size of the hard drive"
                    ],
                    "correct_index": 1,
                    "explanation": "Contextual evidence such as anomalous parent-child lineages, download cradles, and injection tokens indicate malicious intent."
                }
            ],
            "expected_verdict": "True Positive / Simulation",
            "expected_findings": f"Verified {title} telemetry ingested in OpenSearch. Identified MITRE ATT&CK technique {mitre} with correlated audit logs."
        })

        return [
            # Phase 1: Mission Briefing
            {
                "id": "phase-1",
                "phase_num": 1,
                "title": "Mission Briefing",
                "tag": "BRIEFING",
                "objective": f"Master {title} and validate {mitre} detection coverage.",
                "mission": spec["mission"],
                "difficulty": difficulty,
                "mitre": mitre,
                "time": meta.get("estimated_time", "20–30 min"),
                "source": source,
                "target_index": target_index,
                "checklist_items": [
                    "Review Mission Briefing & Scenario",
                    "Verify Lab Infrastructure Status",
                    "Trigger Telemetry Simulation",
                    "Locate Security Event in OpenSearch",
                    "Collect Artifact Evidence",
                    "Form Final Analyst Verdict"
                ]
            },
            # Phase 2: Generate Telemetry
            {
                "id": "phase-2",
                "phase_num": 2,
                "title": "Generate Telemetry",
                "tag": "SIMULATION",
                "attack_host": spec["attack_host"],
                "target_host": spec["target_host"],
                "technique": f"{mitre} — {title}",
                "command": spec["attack_cmd"],
                "instructions": "Execute the following simulation command from your terminal. It will securely ProxyJump through the Bastion jumpbox and fire the adversary emulation payload."
            },
            # Phase 3: Locate Event & OpenSearch Discovery
            {
                "id": "phase-3",
                "phase_num": 3,
                "title": "Locate & Query Events",
                "tag": "DISCOVERY",
                "data_source": source,
                "target_index": target_index,
                "query": spec["query"],
                "query_field": spec.get("query_field", "data.win.eventdata"),
                "hints": [
                    {"title": f"How to search {target_index}", "content": spec["hint_1"]},
                    {"title": "Where to find the payload", "content": spec["hint_2"]}
                ]
            },
            # Phase 4: Cross-Reference & Analyst Thinking
            {
                "id": "phase-4",
                "phase_num": 4,
                "title": "Cross-Reference & Analyst Thinking",
                "tag": "METHODOLOGY",
                "cross_query": spec.get("cross_query", spec["query"]),
                "cross_index": spec.get("cross_index", target_index),
                "thinking_title": "🧠 SOC Analyst Thinking",
                "thinking_prompts": spec["thinking_prompts"]
            },
            # Phase 5: Analyst Decision & Verdict
            {
                "id": "phase-5",
                "phase_num": 5,
                "title": "Analyst Decision & Verdict",
                "tag": "ASSESSMENT",
                "questions": spec["questions"],
                "verdict_options": [
                    {"value": "True Positive", "label": "True Positive (Confirmed Threat / Exploit)"},
                    {"value": "Suspicious", "label": "Suspicious Activity (Requires Containment)"},
                    {"value": "False Positive", "label": "False Positive (Benign Admin Action)"},
                    {"value": "Inconclusive", "label": "Inconclusive (Needs Further Telemetry)"}
                ]
            },
            # Phase 6: Debrief & Solutions Gate
            {
                "id": "phase-6",
                "phase_num": 6,
                "title": "Debrief & Solutions",
                "tag": "SOLUTIONS",
                "expected_verdict": spec["expected_verdict"],
                "expected_findings": spec["expected_findings"],
                "mitre_tactic": "Execution / Discovery",
                "mitre_technique": mitre,
                "solution_markdown": raw_md
            }
        ]

    @classmethod
    def add_evidence(cls, lab_id: str, source: str, event_id: str, timestamp: str, finding: str) -> Dict[str, Any]:
        """Add an evidence item to the learner's investigation board."""
        cls.init_db()
        created_at = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
        with cls._get_db() as conn:
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO lab_evidence (lab_id, source, event_id, timestamp, finding, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (lab_id, source, event_id or "", timestamp or created_at, finding, created_at))
            conn.commit()
            evidence_id = cur.lastrowid

        return {
            "id": evidence_id,
            "lab_id": lab_id,
            "source": source,
            "event_id": event_id,
            "timestamp": timestamp or created_at,
            "finding": finding,
            "created_at": created_at
        }

    @classmethod
    def delete_evidence(cls, evidence_id: int) -> Dict[str, Any]:
        """Delete an evidence item."""
        cls.init_db()
        with cls._get_db() as conn:
            conn.execute("DELETE FROM lab_evidence WHERE id = ?", (evidence_id,))
            conn.commit()
        return {"success": True, "deleted_id": evidence_id}

    @classmethod
    def save_checklist(cls, lab_id: str, checklist: List[str]) -> Dict[str, Any]:
        """Save learner investigation checklist."""
        cls.init_db()
        checklist_json = json.dumps(checklist)
        with cls._get_db() as conn:
            conn.execute("""
                UPDATE lab_progress SET checklist = ? WHERE lab_id = ?
            """, (checklist_json, lab_id))
            conn.commit()
        return {"success": True, "lab_id": lab_id, "checklist": checklist}

    @classmethod
    def save_verdict(cls, lab_id: str, verdict: str) -> Dict[str, Any]:
        """Save final analyst verdict."""
        cls.init_db()
        with cls._get_db() as conn:
            conn.execute("""
                UPDATE lab_progress SET verdict = ? WHERE lab_id = ?
            """, (verdict, lab_id))
            conn.commit()
        return {"success": True, "lab_id": lab_id, "verdict": verdict}

    @classmethod
    def save_answer(cls, lab_id: str, question_id: str, selected_option: str, is_correct: bool) -> Dict[str, Any]:
        """Record answer to an assessment question."""
        cls.init_db()
        now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
        with cls._get_db() as conn:
            cur = conn.cursor()
            cur.execute("SELECT id FROM lab_answers WHERE lab_id = ? AND question_id = ?", (lab_id, question_id))
            row = cur.fetchone()
            if row:
                conn.execute("""
                    UPDATE lab_answers SET selected_option = ?, is_correct = ?, answered_at = ? WHERE id = ?
                """, (selected_option, 1 if is_correct else 0, now_str, row["id"]))
            else:
                conn.execute("""
                    INSERT INTO lab_answers (lab_id, question_id, selected_option, is_correct, answered_at)
                    VALUES (?, ?, ?, ?, ?)
                """, (lab_id, question_id, selected_option, 1 if is_correct else 0, now_str))
            conn.commit()

        return {"success": True, "question_id": question_id, "is_correct": is_correct}

    @classmethod
    def update_progress(cls, lab_id: str, status: Optional[str] = None, notes: Optional[str] = None, bookmarked: Optional[bool] = None, current_step: Optional[int] = None) -> Dict[str, Any]:
        """Update learner state for a specific lab."""
        cls.init_db()
        now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")

        with cls._get_db() as conn:
            cur = conn.cursor()
            cur.execute("SELECT * FROM lab_progress WHERE lab_id = ?", (lab_id,))
            row = cur.fetchone()

            if not row:
                started = now_str if status in ["In Progress", "Completed"] else None
                completed = now_str if status == "Completed" else None
                cur.execute("""
                    INSERT INTO lab_progress (lab_id, status, current_step, started_at, completed_at, notes, attempts, bookmarked)
                    VALUES (?, ?, ?, ?, ?, ?, 1, ?)
                """, (lab_id, status or "Not Started", current_step or 0, started, completed, notes or "", 1 if bookmarked else 0))
            else:
                existing = dict(row)
                new_status = status if status is not None else existing["status"]
                new_notes = notes if notes is not None else existing["notes"]
                new_step = current_step if current_step is not None else existing.get("current_step", 0)
                new_bm = (1 if bookmarked else 0) if bookmarked is not None else existing["bookmarked"]

                started = existing["started_at"]
                if not started and new_status in ["In Progress", "Completed"]:
                    started = now_str

                completed = existing["completed_at"]
                if new_status == "Completed" and not completed:
                    completed = now_str
                elif new_status != "Completed":
                    completed = None

                cur.execute("""
                    UPDATE lab_progress
                    SET status = ?, current_step = ?, started_at = ?, completed_at = ?, notes = ?, bookmarked = ?, attempts = attempts + 1
                    WHERE lab_id = ?
                """, (new_status, new_step, started, completed, new_notes, new_bm, lab_id))
            conn.commit()

        return {"success": True, "lab_id": lab_id}

    @classmethod
    def reset_lab(cls, lab_id: str) -> Dict[str, Any]:
        """Reset progress, notes, evidence, and answers for a specific lab."""
        cls.init_db()
        with cls._get_db() as conn:
            conn.execute("DELETE FROM lab_evidence WHERE lab_id = ?", (lab_id,))
            conn.execute("DELETE FROM lab_answers WHERE lab_id = ?", (lab_id,))
            conn.execute("""
                UPDATE lab_progress
                SET status = 'Not Started', current_step = 0, started_at = NULL, completed_at = NULL, notes = '', verdict = '', checklist = '[]'
                WHERE lab_id = ?
            """, (lab_id,))
            conn.commit()
        return {"success": True, "lab_id": lab_id, "message": "Lab progress reset."}

    @classmethod
    def get_curriculum_stats(cls) -> Dict[str, Any]:
        """Get summary statistics for learner progress."""
        labs = cls.get_all_labs_with_progress()
        regular_labs = [l for l in labs if not l["id"].startswith("challenge-")]
        challenges = [l for l in labs if l["id"].startswith("challenge-")]

        total_labs = len(regular_labs)
        completed_labs = sum(1 for lab in regular_labs if lab.get("status") == "Completed")
        in_progress_labs = sum(1 for lab in regular_labs if lab.get("status") == "In Progress")
        not_started_labs = sum(1 for lab in regular_labs if lab.get("status") == "Not Started" or not lab.get("status"))

        l1 = [l for l in regular_labs if l.get("level_code") == "1"]
        l2 = [l for l in regular_labs if l.get("level_code") == "2"]
        l3 = [l for l in regular_labs if l.get("level_code") == "3"]

        l1_completed = sum(1 for l in l1 if l.get("status") == "Completed")
        l2_completed = sum(1 for l in l2 if l.get("status") == "Completed")
        l3_completed = sum(1 for l in l3 if l.get("status") == "Completed")
        challenges_completed = sum(1 for c in challenges if c.get("status") == "Completed")

        next_lab = next((l for l in regular_labs if l.get("status") != "Completed"), None)

        return {
            "total_labs": total_labs,
            "completed": completed_labs,
            "in_progress": in_progress_labs,
            "not_started": not_started_labs,
            "percent_completed": int((completed_labs / total_labs) * 100) if total_labs > 0 else 0,
            "level1": {"total": len(l1), "completed": l1_completed},
            "level2": {"total": len(l2), "completed": l2_completed},
            "level3": {"total": len(l3), "completed": l3_completed},
            "challenges": {"total": len(challenges), "completed": challenges_completed},
            "next_lab": next_lab
        }

    @classmethod
    def get_challenges(cls) -> List[Dict[str, Any]]:
        """Get all 3 mystery challenges with progress."""
        all_items = cls.get_all_labs_with_progress()
        challenges = [item for item in all_items if item["id"].startswith("challenge-")]
        for c in challenges:
            c["difficulty"] = "Advanced / Mystery"
        return challenges

    @classmethod
    def get_challenge_detail(cls, challenge_id: str) -> Optional[Dict[str, Any]]:
        """Get challenge details without exposing solutions."""
        detail = cls.get_workspace(challenge_id)
        if not detail:
            return None
        return detail

    @classmethod
    def get_challenge_solution(cls, challenge_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve solution key for a specific challenge."""
        solutions_path = os.path.join(settings.PROJECT_ROOT, "docs", "labs", "challenges", "solutions.md")
        if not os.path.exists(solutions_path):
            return None

        with open(solutions_path, "r", encoding="utf-8", errors="replace") as f:
            raw_text = f.read()

        num = challenge_id.replace("challenge-", "")
        pattern = rf'## Challenge {num}:[^\n]*\n([\s\S]*?)(?=\n## Challenge|\Z)'
        match = re.search(pattern, raw_text, re.IGNORECASE)
        if not match:
            sol_raw = cls.interpolate_live_telemetry(raw_text)
            return {"solution_markdown": sol_raw, "solution_html": cls.render_markdown_safely(sol_raw)}

        sol_md = f"## Solution: Challenge {num}\n\n" + match.group(1).strip()
        sol_md = cls.interpolate_live_telemetry(sol_md)
        return {
            "challenge_id": challenge_id,
            "solution_markdown": sol_md,
            "solution_html": cls.render_markdown_safely(sol_md)
        }

    @classmethod
    def render_markdown_safely(cls, text: str) -> str:
        """Convert Markdown text to sanitized HTML."""
        if not text:
            return ""
        try:
            import markdown
            return markdown.markdown(text, extensions=["fenced_code", "tables", "nl2br"])
        except Exception:
            return f"<pre>{html.escape(text)}</pre>"

    @classmethod
    def search_content(cls, query: str) -> List[Dict[str, Any]]:
        """Search across labs, challenges, and MITRE techniques."""
        if not query or len(query.strip()) < 2:
            return []

        q = query.strip().lower()
        results = []

        for lab in LAB_CATALOG:
            title = lab.get("title", "")
            mitre = lab.get("mitre", "")
            source = lab.get("source", "")
            index = lab.get("target_index", "")

            score = 0
            if q in title.lower():
                score += 10
            if q in mitre.lower():
                score += 8
            if q in source.lower():
                score += 5
            if q in index.lower():
                score += 5

            if score > 0:
                results.append({
                    "id": lab["id"],
                    "title": title,
                    "type": "Challenge" if lab["id"].startswith("challenge-") else "Lab",
                    "level": lab.get("level", ""),
                    "mitre": mitre,
                    "score": score,
                    "snippet": f"{source} • {index}",
                    "url": f"/learning/challenges/{lab['id']}" if lab["id"].startswith("challenge-") else f"/learning/labs/{lab['id']}"
                })

        return sorted(results, key=lambda x: x["score"], reverse=True)
