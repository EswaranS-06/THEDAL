"""
THEDAL Control Plane — Learning Portal Service
Manages curriculum catalog, Markdown rendering, and SQLite learner state.
"""

import os
import re
import html
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
        "mitre": "General"
    },
    {
        "id": "02-windows-process",
        "title": "Windows Process Investigation & Sysmon",
        "level": "Level 1: Foundations",
        "level_code": "1",
        "source": "Sysmon EID 1",
        "target_index": "socforge-sysmon-*",
        "rel_path": "docs/labs/02-windows-process/README.md",
        "mitre": "T1059"
    },
    {
        "id": "03-powershell-investigation",
        "title": "PowerShell Telemetry & ScriptBlock Logging",
        "level": "Level 1: Foundations",
        "level_code": "1",
        "source": "PowerShell 4104",
        "target_index": "socforge-powershell-*",
        "rel_path": "docs/labs/03-powershell-investigation/README.md",
        "mitre": "T1059.001"
    },
    {
        "id": "04-failed-authentication",
        "title": "Failed Authentication Analysis",
        "level": "Level 1: Foundations",
        "level_code": "1",
        "source": "Auth.log & 4625",
        "target_index": "socforge-linux-auth-*",
        "rel_path": "docs/labs/04-failed-authentication/README.md",
        "mitre": "T1110"
    },
    {
        "id": "05-dvwa-sqli",
        "title": "DVWA SQL Injection Investigation",
        "level": "Level 2: Investigation",
        "level_code": "2",
        "source": "Nginx Access",
        "target_index": "socforge-nginx-access-*",
        "rel_path": "docs/labs/05-dvwa-sqli/README.md",
        "mitre": "T1190"
    },
    {
        "id": "06-dvwa-command-injection",
        "title": "DVWA Command Injection & Linux Auditd",
        "level": "Level 2: Investigation",
        "level_code": "2",
        "source": "Nginx + Auditd",
        "target_index": "socforge-auditd-*",
        "rel_path": "docs/labs/06-dvwa-command-injection/README.md",
        "mitre": "T1059.004"
    },
    {
        "id": "07-dvwa-lfi",
        "title": "DVWA Local File Inclusion (LFI)",
        "level": "Level 2: Investigation",
        "level_code": "2",
        "source": "Nginx Access",
        "target_index": "socforge-nginx-access-*",
        "rel_path": "docs/labs/07-dvwa-lfi/README.md",
        "mitre": "T1083"
    },
    {
        "id": "08-juice-shop-api",
        "title": "Juice Shop Container REST API Probing",
        "level": "Level 2: Investigation",
        "level_code": "2",
        "source": "Docker JSON Logs",
        "target_index": "socforge-juice-shop-*",
        "rel_path": "docs/labs/08-juice-shop-api/README.md",
        "mitre": "T1087 / T1595"
    },
    {
        "id": "09-atomic-red-team",
        "title": "Atomic Red Team Reconnaissance",
        "level": "Level 3: Attack Correlation",
        "level_code": "3",
        "source": "Windows Security + Sysmon",
        "target_index": "socforge-sysmon-*",
        "rel_path": "docs/labs/09-atomic-red-team/README.md",
        "mitre": "T1082"
    },
    {
        "id": "10-powershell-attack",
        "title": "PowerShell Attack & Obfuscation",
        "level": "Level 3: Attack Correlation",
        "level_code": "3",
        "source": "Sysmon + ScriptBlock",
        "target_index": "socforge-powershell-*",
        "rel_path": "docs/labs/10-powershell-attack/README.md",
        "mitre": "T1027.013"
    },
    {
        "id": "11-scheduled-task",
        "title": "Scheduled Task Persistence",
        "level": "Level 3: Attack Correlation",
        "level_code": "3",
        "source": "Sysmon Event ID 1",
        "target_index": "socforge-sysmon-*",
        "rel_path": "docs/labs/11-scheduled-task/README.md",
        "mitre": "T1053.005"
    },
    {
        "id": "12-multi-source-correlation",
        "title": "Multi-Source Incident Correlation",
        "level": "Level 3: Attack Correlation",
        "level_code": "3",
        "source": "Web + Kernel Syscalls",
        "target_index": "wazuh-alerts-*",
        "rel_path": "docs/labs/12-multi-source-correlation/README.md",
        "mitre": "DET-COR-001"
    },
    {
        "id": "13-tp-vs-fp",
        "title": "True Positive vs. False Positive Triage",
        "level": "Level 3: Attack Correlation",
        "level_code": "3",
        "source": "Multi-Source Comparative",
        "target_index": "All Indices",
        "rel_path": "docs/labs/13-tp-vs-fp/README.md",
        "mitre": "Triage"
    },
    {
        "id": "14-incident-timeline",
        "title": "End-to-End Incident Timeline Reconstruction",
        "level": "Level 3: Attack Correlation",
        "level_code": "3",
        "source": "Full Multi-Host Stream",
        "target_index": "All Indices",
        "rel_path": "docs/labs/14-incident-timeline/README.md",
        "mitre": "Full Chain"
    },
    {
        "id": "challenge-01",
        "title": "Challenge 01: Unauthorized Web Tampering",
        "level": "Challenge Mode",
        "level_code": "C",
        "source": "Blind Telemetry",
        "target_index": "socforge-nginx-access-*",
        "rel_path": "docs/labs/challenges/challenge-01-web-tampering.md",
        "mitre": "Mystery"
    },
    {
        "id": "challenge-02",
        "title": "Challenge 02: Suspicious Administrative Activity",
        "level": "Challenge Mode",
        "level_code": "C",
        "source": "Blind Telemetry",
        "target_index": "socforge-sysmon-*",
        "rel_path": "docs/labs/challenges/challenge-02-suspicious-admin.md",
        "mitre": "Mystery"
    },
    {
        "id": "challenge-03",
        "title": "Challenge 03: Stealth Host Reconnaissance",
        "level": "Challenge Mode",
        "level_code": "C",
        "source": "Blind Telemetry",
        "target_index": "socforge-powershell-*",
        "rel_path": "docs/labs/challenges/challenge-03-stealth-enumeration.md",
        "mitre": "Mystery"
    }
]


class LearningService:
    """Service for handling learning curriculum and learner progress."""

    @classmethod
    def _get_db(cls) -> sqlite3.Connection:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn

    @classmethod
    def init_db(cls):
        """Initialize SQLite database for learner progress."""
        with cls._get_db() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS lab_progress (
                    lab_id TEXT PRIMARY KEY,
                    status TEXT DEFAULT 'Not Started',
                    started_at TEXT,
                    completed_at TEXT,
                    notes TEXT DEFAULT '',
                    attempts INTEGER DEFAULT 0,
                    bookmarked INTEGER DEFAULT 0
                )
            """)
            conn.commit()

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
                "started_at": None,
                "completed_at": None,
                "notes": "",
                "attempts": 0,
                "bookmarked": 0
            })
            item.update(prog)
            result.append(item)
        return result

    @classmethod
    def get_lab_detail(cls, lab_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve single lab details, rendered markdown, and learner state."""
        cls.init_db()
        lab_meta = next((item for item in LAB_CATALOG if item["id"] == lab_id), None)
        if not lab_meta:
            return None

        with cls._get_db() as conn:
            cur = conn.cursor()
            cur.execute("SELECT * FROM lab_progress WHERE lab_id = ?", (lab_id,))
            row = cur.fetchone()
            prog = dict(row) if row else {
                "status": "Not Started",
                "started_at": None,
                "completed_at": None,
                "notes": "",
                "attempts": 0,
                "bookmarked": 0
            }

        # Read canonical Markdown file
        file_path = os.path.join(settings.PROJECT_ROOT, lab_meta["rel_path"])
        raw_markdown = ""
        if os.path.exists(file_path):
            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                raw_markdown = f.read()
        else:
            raw_markdown = f"# Lab content not found\n\nFile `{lab_meta['rel_path']}` does not exist."

        rendered_html = cls.render_markdown_safely(raw_markdown)

        result = dict(lab_meta)
        result.update(prog)
        result["raw_markdown"] = raw_markdown
        result["rendered_html"] = rendered_html
        return result

    @classmethod
    def update_progress(cls, lab_id: str, status: Optional[str] = None, notes: Optional[str] = None, bookmarked: Optional[bool] = None) -> Dict[str, Any]:
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
                    INSERT INTO lab_progress (lab_id, status, started_at, completed_at, notes, attempts, bookmarked)
                    VALUES (?, ?, ?, ?, ?, 1, ?)
                """, (lab_id, status or "Not Started", started, completed, notes or "", 1 if bookmarked else 0))
            else:
                existing = dict(row)
                new_status = status if status is not None else existing["status"]
                new_notes = notes if notes is not None else existing["notes"]
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
                    SET status = ?, started_at = ?, completed_at = ?, notes = ?, bookmarked = ?, attempts = attempts + 1
                    WHERE lab_id = ?
                """, (new_status, started, completed, new_notes, new_bm, lab_id))
            conn.commit()

        return {"success": True, "lab_id": lab_id}

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

        # Level breakdowns
        l1 = [l for l in regular_labs if l.get("level_code") == "1"]
        l2 = [l for l in regular_labs if l.get("level_code") == "2"]
        l3 = [l for l in regular_labs if l.get("level_code") == "3"]

        l1_completed = sum(1 for l in l1 if l.get("status") == "Completed")
        l2_completed = sum(1 for l in l2 if l.get("status") == "Completed")
        l3_completed = sum(1 for l in l3 if l.get("status") == "Completed")
        challenges_completed = sum(1 for c in challenges if c.get("status") == "Completed")

        # Next recommended lab
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
        detail = cls.get_lab_detail(challenge_id)
        if not detail:
            return None
        detail["difficulty"] = "Advanced / Mystery"
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
        # Extract section for this challenge
        pattern = rf'## Challenge {num}:[^\n]*\n([\s\S]*?)(?=\n## Challenge|\Z)'
        match = re.search(pattern, raw_text, re.IGNORECASE)
        if not match:
            return {"solution_markdown": raw_text, "solution_html": cls.render_markdown_safely(raw_text)}

        sol_md = f"## Solution: Challenge {num}\n\n" + match.group(1).strip()
        return {
            "challenge_id": challenge_id,
            "solution_markdown": sol_md,
            "solution_html": cls.render_markdown_safely(sol_md)
        }

    @classmethod
    def search_content(cls, query: str) -> List[Dict[str, Any]]:
        """Search across labs, challenges, runbooks, and learning path."""
        if not query or len(query.strip()) < 2:
            return []

        q = query.strip().lower()
        results = []

        # 1. Search in LAB_CATALOG
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

            # Search in file content if exists
            file_path = os.path.join(settings.PROJECT_ROOT, lab.get("rel_path", ""))
            snippet = ""
            if os.path.exists(file_path):
                try:
                    with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                        content = f.read()
                        if q in content.lower():
                            score += 3
                            idx = content.lower().find(q)
                            start = max(0, idx - 40)
                            end = min(len(content), idx + 80)
                            snippet = content[start:end].replace("\n", " ").strip()
                except Exception:
                    pass

            if score > 0:
                results.append({
                    "id": lab["id"],
                    "title": title,
                    "type": "Challenge" if lab["id"].startswith("challenge-") else "Lab",
                    "level": lab.get("level", ""),
                    "mitre": mitre,
                    "score": score,
                    "snippet": f"...{snippet}..." if snippet else f"{source} -> {index}",
                    "url": f"/learning/challenges/{lab['id']}" if lab["id"].startswith("challenge-") else f"/learning/labs/{lab['id']}"
                })

        # 2. Search runbooks and learning-path
        extra_docs = [
            ("learning-path", "THEDAL Learning Path & SOC Curriculum", "docs/learning-path.md", "/learning"),
            ("detection-catalog", "Detection Rule Catalog", "docs/detection-catalog.md", "/learning"),
            ("telemetry-arch", "Telemetry Ingest Pipeline Architecture", "docs/telemetry-architecture.md", "/learning"),
        ]

        for doc_id, doc_title, doc_rel, doc_url in extra_docs:
            doc_path = os.path.join(settings.PROJECT_ROOT, doc_rel)
            if os.path.exists(doc_path):
                try:
                    with open(doc_path, "r", encoding="utf-8", errors="replace") as f:
                        content = f.read()
                        if q in doc_title.lower() or q in content.lower():
                            idx = content.lower().find(q)
                            start = max(0, idx - 40) if idx != -1 else 0
                            end = min(len(content), idx + 80) if idx != -1 else 100
                            snippet = content[start:end].replace("\n", " ").strip()
                            results.append({
                                "id": doc_id,
                                "title": doc_title,
                                "type": "Documentation",
                                "level": "Guide",
                                "mitre": "Reference",
                                "score": 4,
                                "snippet": f"...{snippet}..." if snippet else "Reference guide",
                                "url": doc_url
                            })
                except Exception:
                    pass

        results.sort(key=lambda x: x["score"], reverse=True)
        return results

    @classmethod
    def render_markdown_safely(cls, md_text: str) -> str:
        """
        Safely converts standard Markdown into sanitized HTML.
        Strips arbitrary scripts and dangerous tags while preserving code blocks,
        tables, headers, bold, italics, links, and blockquotes.
        """
        # Escape any raw HTML tags to prevent XSS
        text = html.escape(md_text)

        # Code blocks (```lang ... ```)
        def replace_code_block(match):
            lang = match.group(1) or ""
            code_content = match.group(2)
            return f'<div class="code-block-wrap"><div class="code-block-header">{lang}</div><pre class="terminal-window"><code>{code_content}</code></pre></div>'

        text = re.sub(r'```([a-zA-Z0-9_\-]*)\n([\s\S]*?)```', replace_code_block, text)

        # Inline code `code`
        text = re.sub(r'`([^`]+)`', r'<code class="table-cell-mono code-inline">\1</code>', text)

        # Headings
        text = re.sub(r'^### (.*)$', r'<h3 class="lab-h3">\1</h3>', text, flags=re.MULTILINE)
        text = re.sub(r'^## (.*)$', r'<h2 class="lab-h2">\1</h2>', text, flags=re.MULTILINE)
        text = re.sub(r'^# (.*)$', r'<h1 class="lab-h1">\1</h1>', text, flags=re.MULTILINE)

        # Bold and Italic
        text = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', text)
        text = re.sub(r'\*([^*]+)\*', r'<em>\1</em>', text)

        # Blockquotes
        text = re.sub(r'^&gt; (.*)$', r'<blockquote class="lab-quote">\1</blockquote>', text, flags=re.MULTILINE)

        # Markdown links [text](url) -> safe links
        def replace_link(match):
            link_text = match.group(1)
            url = match.group(2)
            # Sanitize URL
            if url.startswith("http://") or url.startswith("https://") or url.startswith("#") or url.startswith("file://") or url.startswith("/"):
                return f'<a href="{url}" target="_blank" rel="noopener noreferrer" class="lab-link">{link_text}</a>'
            return link_text

        text = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', replace_link, text)

        # Unordered list items
        text = re.sub(r'^\s*-\s+(.*)$', r'<li class="lab-list-item">\1</li>', text, flags=re.MULTILINE)

        # Simple table processing
        lines = text.split("\n")
        in_table = False
        table_html = []
        out_lines = []

        for line in lines:
            if line.strip().startswith("|") and line.strip().endswith("|"):
                if not in_table:
                    in_table = True
                    table_html = ['<div class="table-container" style="margin: 1rem 0;"><table>']
                
                # Check if it's separator row | :--- | :--- |
                if re.match(r'^\s*\|(?:\s*:?-+:?\s*\|)+\s*$', line):
                    continue

                cells = [c.strip() for c in line.strip().strip("|").split("|")]
                row_type = "th" if len(table_html) == 1 else "td"
                row_str = "<tr>" + "".join(f"<{row_type}>{c}</{row_type}>" for c in cells) + "</tr>"
                table_html.append(row_str)
            else:
                if in_table:
                    table_html.append("</table></div>")
                    out_lines.append("".join(table_html))
                    in_table = False
                    table_html = []
                out_lines.append(line)

        if in_table:
            table_html.append("</table></div>")
            out_lines.append("".join(table_html))

        html_out = "\n".join(out_lines)

        # Paragraphs for standalone lines
        html_out = re.sub(r'\n\n+', '</p><p class="lab-paragraph">', html_out)
        return f'<div class="lab-rendered-content"><p class="lab-paragraph">{html_out}</p></div>'
