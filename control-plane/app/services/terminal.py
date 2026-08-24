"""
THEDAL Control Plane — Multi-Session Interactive Web Terminal Service
Spawns and manages real Linux pseudo-terminals (PTY) and command execution.
"""

import os
import pty
import select
import struct
import fcntl
import termios
import signal
import asyncio
import logging
import uuid
import subprocess
from datetime import datetime
from typing import Dict, Optional, List, Any
from app.config import settings

logger = logging.getLogger("thedal.terminal")


class PTYSession:
    """Represents an active interactive PTY bash process."""

    def __init__(self, session_id: str, title: str = "Terminal", cols: int = 80, rows: int = 24):
        self.session_id = session_id
        self.title = title
        self.cols = cols
        self.rows = rows
        self.created_at = datetime.utcnow().isoformat() + "Z"
        self.master_fd: Optional[int] = None
        self.pid: Optional[int] = None
        self.alive = False
        self._spawn()

    def _spawn(self) -> None:
        """Forks a child process attached to a new pseudo-terminal."""
        master_fd, slave_fd = pty.openpty()

        # Set initial terminal size
        self._set_size(master_fd, self.cols, self.rows)

        env = os.environ.copy()
        env["TERM"] = "xterm-256color"
        env["COLORTERM"] = "truecolor"
        env["LANG"] = "en_US.UTF-8"
        env["LC_ALL"] = "en_US.UTF-8"
        env["PS1"] = r"\[\033[01;36m\]thedal\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]\$ "
        env["HISTCONTROL"] = "ignoredups:erasedups"

        pid = os.fork()
        if pid == 0:
            # Child process
            os.close(master_fd)
            os.setsid()

            # Set slave as controlling tty
            os.dup2(slave_fd, 0)
            os.dup2(slave_fd, 1)
            os.dup2(slave_fd, 2)
            if slave_fd > 2:
                os.close(slave_fd)

            # Change to project root directory
            try:
                os.chdir(str(settings.PROJECT_ROOT))
            except Exception:
                pass

            # Execute bash shell
            shell = os.environ.get("SHELL", "/bin/bash")
            os.execvpe(shell, [shell, "--login"], env)
        else:
            # Parent process
            os.close(slave_fd)
            # Set master_fd to non-blocking
            flags = fcntl.fcntl(master_fd, fcntl.F_GETFL)
            fcntl.fcntl(master_fd, fcntl.F_SETFL, flags | os.O_NONBLOCK)

            self.master_fd = master_fd
            self.pid = pid
            self.alive = True
            logger.info(f"Spawned PTY session {self.session_id} (PID: {pid})")

    def _set_size(self, fd: int, cols: int, rows: int) -> None:
        """Sets terminal window dimensions via ioctl."""
        try:
            winsize = struct.pack("HHHH", rows, cols, 0, 0)
            fcntl.ioctl(fd, termios.TIOCSWINSZ, winsize)
        except Exception as err:
            logger.warning(f"Failed to set PTY size: {err}")

    def resize(self, cols: int, rows: int) -> None:
        """Resizes the active terminal window."""
        self.cols = max(10, cols)
        self.rows = max(4, rows)
        if self.master_fd and self.alive:
            self._set_size(self.master_fd, self.cols, self.rows)

    def write(self, data: bytes) -> None:
        """Writes input bytes into the terminal master fd."""
        if not self.master_fd or not self.alive:
            return
        try:
            os.write(self.master_fd, data)
        except OSError as err:
            logger.error(f"Error writing to PTY {self.session_id}: {err}")
            self.alive = False

    def read(self, max_bytes: int = 4096) -> Optional[bytes]:
        """Reads available output bytes from the terminal master fd without blocking."""
        if not self.master_fd or not self.alive:
            return None
        try:
            r, _, _ = select.select([self.master_fd], [], [], 0)
            if r:
                data = os.read(self.master_fd, max_bytes)
                if not data:
                    self.alive = False
                    return None
                return data
        except OSError:
            self.alive = False
        return None

    def terminate(self) -> None:
        """Cleans up the child process and master fd."""
        self.alive = False
        if self.pid:
            try:
                os.kill(self.pid, signal.SIGTERM)
                os.waitpid(self.pid, os.WNOHANG)
            except Exception:
                pass
            self.pid = None
        if self.master_fd:
            try:
                os.close(self.master_fd)
            except Exception:
                pass
            self.master_fd = None
        logger.info(f"Terminated PTY session {self.session_id}")


class TerminalManager:
    """Manages active terminal sessions and command executions."""

    _sessions: Dict[str, PTYSession] = {}

    @classmethod
    def create_session(
        cls,
        session_id: Optional[str] = None,
        title: Optional[str] = None,
        cols: int = 80,
        rows: int = 24
    ) -> PTYSession:
        """Creates and tracks a new interactive PTY session."""
        sid = session_id or f"term-{uuid.uuid4().hex[:6]}"
        t = title or f"Shell {len(cls._sessions) + 1}"

        # If session already exists and is alive, return it
        if sid in cls._sessions and cls._sessions[sid].alive:
            return cls._sessions[sid]

        # If old dead session exists, clean it up first
        if sid in cls._sessions:
            cls._sessions[sid].terminate()

        session = PTYSession(session_id=sid, title=t, cols=cols, rows=rows)
        cls._sessions[sid] = session
        return session

    @classmethod
    def get_session(cls, session_id: str) -> Optional[PTYSession]:
        """Retrieves a session by ID."""
        session = cls._sessions.get(session_id)
        if session and not session.alive:
            session.terminate()
            cls._sessions.pop(session_id, None)
            return None
        return session

    @classmethod
    def list_sessions(cls) -> List[Dict[str, Any]]:
        """Returns metadata for all active sessions."""
        active = []
        dead = []
        for sid, sess in list(cls._sessions.items()):
            if sess.alive:
                active.append({
                    "session_id": sess.session_id,
                    "title": sess.title,
                    "cols": sess.cols,
                    "rows": sess.rows,
                    "created_at": sess.created_at,
                    "alive": sess.alive,
                })
            else:
                dead.append(sid)
        for sid in dead:
            cls.close_session(sid)
        return active

    @classmethod
    def close_session(cls, session_id: str) -> bool:
        """Closes and removes a session."""
        session = cls._sessions.pop(session_id, None)
        if session:
            session.terminate()
            return True
        return False

    @classmethod
    def close_all(cls) -> None:
        """Terminates all running sessions."""
        for sid, sess in list(cls._sessions.items()):
            sess.terminate()
        cls._sessions.clear()

    @classmethod
    def execute_command_sync(
        cls,
        command: str,
        timeout: int = 120,
        cwd: Optional[str] = None
    ) -> Dict[str, Any]:
        """Executes a command synchronously and returns stdout, stderr, and exit_code."""
        target_dir = cwd or str(settings.PROJECT_ROOT)
        started_at = datetime.utcnow().isoformat() + "Z"
        try:
            res = subprocess.run(
                command,
                shell=True,
                cwd=target_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                timeout=timeout,
                env=os.environ.copy()
            )
            return {
                "command": command,
                "exit_code": res.returncode,
                "output": res.stdout,
                "status": "COMPLETED" if res.returncode == 0 else "FAILED",
                "started_at": started_at,
                "finished_at": datetime.utcnow().isoformat() + "Z",
                "cwd": target_dir,
            }
        except subprocess.TimeoutExpired as err:
            return {
                "command": command,
                "exit_code": 124,
                "output": (err.stdout or "") + f"\n[ERROR: Command timed out after {timeout} seconds]",
                "status": "TIMED_OUT",
                "started_at": started_at,
                "finished_at": datetime.utcnow().isoformat() + "Z",
                "cwd": target_dir,
            }
        except Exception as err:
            return {
                "command": command,
                "exit_code": 1,
                "output": f"[ERROR: {str(err)}]",
                "status": "ERROR",
                "started_at": started_at,
                "finished_at": datetime.utcnow().isoformat() + "Z",
                "cwd": target_dir,
            }
