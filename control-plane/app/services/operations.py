"""
SOCForge Control Plane — Operations Manager & Security Lock
"""

import os
import time
import json
import subprocess
import threading
from pathlib import Path
from typing import List, Optional, Tuple, Generator
from datetime import datetime

from app.config import settings


class OperationLockError(Exception):
    """Raised when an operation is attempted while another is in progress."""
    pass


class SecurityValidationError(Exception):
    """Raised when an invalid or disallowed parameter is passed."""
    pass


class OperationsManager:
    """
    Thread-safe operation manager that handles:
    - Subprocess execution without shell=True
    - File-based operation locking (.operation.lock)
    - Structured audit logging to control-plane/logs/
    - Log streaming for real-time dashboard updates
    """

    _lock = threading.Lock()
    _active_operation: Optional[str] = None
    _active_log_file: Optional[Path] = None

    @classmethod
    def is_locked(cls) -> bool:
        if settings.LOCK_FILE.exists():
            return True
        return cls._active_operation is not None

    @classmethod
    def get_active_operation(cls) -> Optional[str]:
        if settings.LOCK_FILE.exists():
            try:
                content = json.loads(settings.LOCK_FILE.read_text())
                return content.get("operation")
            except Exception:
                return "running_operation"
        return cls._active_operation

    @classmethod
    def acquire_lock(cls, operation_name: str) -> None:
        with cls._lock:
            if cls.is_locked():
                active = cls.get_active_operation()
                raise OperationLockError(f"Operation '{active}' is currently in progress. Please wait.")
            
            cls._active_operation = operation_name
            lock_data = {
                "operation": operation_name,
                "timestamp": datetime.utcnow().isoformat(),
                "pid": os.getpid()
            }
            settings.LOCK_FILE.write_text(json.dumps(lock_data, indent=2))

    @classmethod
    def release_lock(cls) -> None:
        with cls._lock:
            cls._active_operation = None
            if settings.LOCK_FILE.exists():
                try:
                    settings.LOCK_FILE.unlink()
                except Exception:
                    pass

    @classmethod
    def sanitize_log_content(cls, text: str) -> str:
        """Strip sensitive credentials from output before writing to logs."""
        sensitive_patterns = [
            "AWS_SECRET_ACCESS_KEY",
            "AWS_SESSION_TOKEN",
            "PRIVATE KEY",
            "SOCForge@2026!Sec",
            "SOCForge_Adm1n_Lab2026!"
        ]
        sanitized = text
        for pattern in sensitive_patterns:
            if pattern in sanitized:
                sanitized = sanitized.replace(pattern, "[REDACTED]")
        return sanitized

    @classmethod
    def run_command(
        cls,
        cmd: List[str],
        cwd: Path,
        operation_name: str,
        env: Optional[dict] = None
    ) -> Tuple[int, str, Path]:
        """
        Executes a safe allowlisted command array, logging output to disk.
        """
        cls.acquire_lock(operation_name)
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        log_filename = f"{timestamp}_{operation_name}.log"
        log_path = settings.LOGS_DIR / log_filename
        cls._active_log_file = log_path

        start_time = time.time()
        exit_code = -1
        full_output = []

        try:
            # Ensure CWD is valid
            if not cwd.exists() or not cwd.is_dir():
                raise SecurityValidationError(f"Invalid execution directory: {cwd}")

            # Merge environment if provided
            cmd_env = os.environ.copy()
            if env:
                cmd_env.update(env)

            # Execute via subprocess without shell=True
            process = subprocess.Popen(
                cmd,
                cwd=str(cwd),
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                universal_newlines=True,
                env=cmd_env
            )

            with open(log_path, "w", encoding="utf-8") as f:
                header = (
                    f"=================================================================\n"
                    f" SOCForge Operation Log: {operation_name}\n"
                    f" Timestamp: {datetime.utcnow().isoformat()} UTC\n"
                    f" Directory: {cwd}\n"
                    f" Command:   {' '.join(cmd)}\n"
                    f"=================================================================\n\n"
                )
                f.write(header)

                if process.stdout:
                    for line in process.stdout:
                        sanitized_line = cls.sanitize_log_content(line)
                        f.write(sanitized_line)
                        f.flush()
                        full_output.append(sanitized_line)

                process.wait()
                exit_code = process.returncode

                duration = time.time() - start_time
                footer = (
                    f"\n=================================================================\n"
                    f" Operation Finished with Exit Code: {exit_code}\n"
                    f" Total Duration: {duration:.2f} seconds\n"
                    f" Status: {'SUCCESS' if exit_code == 0 else 'FAILED'}\n"
                    f"=================================================================\n"
                )
                f.write(footer)

            return exit_code, "".join(full_output), log_path

        finally:
            cls.release_lock()
            cls._active_log_file = None

    @classmethod
    def list_logs(cls) -> List[dict]:
        """Returns metadata for recent operation logs."""
        logs = []
        if not settings.LOGS_DIR.exists():
            return logs

        for file in sorted(settings.LOGS_DIR.glob("*.log"), reverse=True):
            try:
                stat = file.stat()
                parts = file.stem.split("_", 2)
                op_name = parts[2] if len(parts) >= 3 else file.stem
                logs.append({
                    "filename": file.name,
                    "operation": op_name,
                    "size_bytes": stat.st_size,
                    "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                    "path": str(file)
                })
            except Exception:
                continue
        return logs[:50]

    @classmethod
    def read_log_file(cls, filename: str) -> str:
        """Safely reads a log file from the logs directory."""
        # Prevent path traversal attacks
        safe_path = (settings.LOGS_DIR / filename).resolve()
        if not str(safe_path).startswith(str(settings.LOGS_DIR.resolve())):
            raise SecurityValidationError("Path traversal attempt detected.")
        
        if not safe_path.exists() or not safe_path.is_file():
            return "Log file not found."

        return safe_path.read_text(encoding="utf-8", errors="replace")
