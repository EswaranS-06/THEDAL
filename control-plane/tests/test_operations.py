"""
SOCForge Control Plane — Operations & Concurrency Unit Tests
"""

import pytest
from app.services.operations import OperationsManager, OperationLockError
from app.config import settings


def test_operation_lock_lifecycle():
    """Verify that lock acquisition and release work cleanly."""
    # Ensure clean starting state
    OperationsManager.release_lock()
    assert not OperationsManager.is_locked()

    # Acquire lock
    OperationsManager.acquire_lock("test_operation")
    assert OperationsManager.is_locked()
    assert OperationsManager.get_active_operation() == "test_operation"

    # Attempting to acquire lock again should raise OperationLockError
    with pytest.raises(OperationLockError):
        OperationsManager.acquire_lock("second_operation")

    # Release lock
    OperationsManager.release_lock()
    assert not OperationsManager.is_locked()


def test_log_sanitization():
    """Verify that secret patterns are scrubbed from log output."""
    raw_log = "Error during auth: AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY and SOCForge@2026!Sec"
    sanitized = OperationsManager.sanitize_log_content(raw_log)

    assert "AWS_SECRET_ACCESS_KEY" not in sanitized
    assert "SOCForge@2026!Sec" not in sanitized
    assert "[REDACTED]" in sanitized
