"""
THEDAL Control Plane — Execution Adapter Layer
==============================================
Provides unified execution abstractions for Native Linux and Docker runtimes.
"""

from app.adapters.base import ExecutionAdapter
from app.adapters.native import NativeExecutionAdapter
from app.adapters.docker import DockerExecutionAdapter

__all__ = [
    "ExecutionAdapter",
    "NativeExecutionAdapter",
    "DockerExecutionAdapter",
]
