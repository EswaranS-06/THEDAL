"""
Unit and API integration tests for Web Terminal Service and Endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.terminal import TerminalManager

client = TestClient(app)


def test_terminal_snippets_api():
    response = client.get("/api/terminal/snippets")
    assert response.status_code == 200
    data = response.json()
    assert "snippets" in data
    assert len(data["snippets"]) > 0
    assert any("Bastion" in s["title"] for s in data["snippets"])


def test_terminal_session_lifecycle():
    # 1. Create session
    res = client.post("/api/terminal/session/create", json={"title": "Test Shell", "cols": 80, "rows": 24})
    assert res.status_code == 200
    data = res.json()
    session_id = data["session_id"]
    assert data["title"] == "Test Shell"
    assert data["alive"] is True

    # 2. List sessions
    list_res = client.get("/api/terminal/sessions")
    assert list_res.status_code == 200
    sessions = list_res.json()["sessions"]
    assert any(s["session_id"] == session_id for s in sessions)

    # 3. Close session
    del_res = client.delete(f"/api/terminal/session/{session_id}")
    assert del_res.status_code == 200
    assert del_res.json()["closed"] is True


def test_terminal_execute_api():
    # Valid command
    res = client.post("/api/terminal/execute", json={"command": "echo 'THEDAL_TERMINAL_OK'"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "COMPLETED"
    assert data["exit_code"] == 0
    assert "THEDAL_TERMINAL_OK" in data["output"]

    # Empty command error
    bad_res = client.post("/api/terminal/execute", json={"command": ""})
    assert bad_res.status_code == 400
