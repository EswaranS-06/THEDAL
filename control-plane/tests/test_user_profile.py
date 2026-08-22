"""
Tests for THEDAL User Profile, First-Run Wizard & Central Credential Store
==========================================================================
Verifies single source of truth operator credentials, first-run wizard detection,
password hashing/verification, secrets.yml synchronization, and REST endpoints.
"""

import json
import pytest
from pathlib import Path
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from app.main import app
from app.services.user_profile import UserProfileService


client = TestClient(app)


def test_first_run_detection_empty_state(tmp_path):
    """Verify is_setup_complete is False before initial setup."""
    fake_profile_file = tmp_path / "user_profile.json"
    with patch.object(UserProfileService, "PROFILE_FILE", fake_profile_file):
        assert UserProfileService.is_setup_complete() is False
        public = UserProfileService.get_public_profile()
        assert public["setup_complete"] is False


def test_initial_setup_wizard_flow(tmp_path):
    """Verify setup_initial_profile saves profile and syncs secrets.yml."""
    fake_profile_file = tmp_path / "user_profile.json"
    fake_secrets_file = tmp_path / "secrets.yml"

    with patch.object(UserProfileService, "PROFILE_FILE", fake_profile_file), \
         patch.object(UserProfileService, "SECRETS_FILE", fake_secrets_file):

        res = UserProfileService.setup_initial_profile(
            display_name="Analyst Rex",
            username="rex",
            password="RexSecretPassword2026!"
        )

        assert res["success"] is True
        assert res["setup_complete"] is True
        assert res["display_name"] == "Analyst Rex"
        assert UserProfileService.is_setup_complete() is True

        # Verify profile file saved
        assert fake_profile_file.exists()
        saved = json.loads(fake_profile_file.read_text())
        assert saved["display_name"] == "Analyst Rex"
        assert saved["username"] == "rex"
        assert saved["raw_password"] == "RexSecretPassword2026!"
        assert "password_hash" in saved

        # Verify secrets.yml synchronized
        assert fake_secrets_file.exists()
        secrets_content = fake_secrets_file.read_text()
        assert 'thedal_operator_user: "rex"' in secrets_content
        assert 'thedal_operator_password: "RexSecretPassword2026!"' in secrets_content
        assert 'thedal_wazuh_api_user: "wazuh-wui"' in secrets_content


def test_profile_update_scopes(tmp_path):
    """Verify updating profile with different scopes."""
    fake_profile_file = tmp_path / "user_profile.json"
    fake_secrets_file = tmp_path / "secrets.yml"

    with patch.object(UserProfileService, "PROFILE_FILE", fake_profile_file), \
         patch.object(UserProfileService, "SECRETS_FILE", fake_secrets_file):

        # Initial setup
        UserProfileService.setup_initial_profile("Rex", "rex", "OldPassword2026!")

        # Update profile only
        res_prof = UserProfileService.update_profile(
            display_name="Rex Senior",
            scope="profile_only"
        )
        assert res_prof["display_name"] == "Rex Senior"
        assert 'thedal_operator_password: "OldPassword2026!"' in fake_secrets_file.read_text()

        # Update future deployments with new password
        res_future = UserProfileService.update_profile(
            password="NewPassword2026!Sec",
            scope="future_deployments"
        )
        assert 'thedal_operator_password: "NewPassword2026!Sec"' in fake_secrets_file.read_text()


def test_api_profile_endpoints(tmp_path):
    """Verify FastAPI routes for /api/profile/*."""
    fake_profile_file = tmp_path / "user_profile.json"
    fake_secrets_file = tmp_path / "secrets.yml"

    with patch.object(UserProfileService, "PROFILE_FILE", fake_profile_file), \
         patch.object(UserProfileService, "SECRETS_FILE", fake_secrets_file):

        # 1. Status before setup
        stat_res = client.get("/api/profile/status")
        assert stat_res.status_code == 200
        assert stat_res.json()["setup_complete"] is False

        # 2. Setup POST
        setup_res = client.post("/api/profile/setup", json={
            "display_name": "Test Operator",
            "username": "tester",
            "password": "TestPassword2026!"
        })
        assert setup_res.status_code == 200
        assert setup_res.json()["success"] is True

        # 3. Status after setup
        stat_res2 = client.get("/api/profile/status")
        assert stat_res2.status_code == 200
        assert stat_res2.json()["setup_complete"] is True
        assert stat_res2.json()["display_name"] == "Test Operator"

        # 4. Details for Settings page
        det_res = client.get("/api/profile/details")
        assert det_res.status_code == 200
        assert det_res.json()["password"] == "TestPassword2026!"

        # 5. Update POST
        upd_res = client.post("/api/profile/update", json={
            "display_name": "Lead Analyst",
            "scope": "future_deployments"
        })
        assert upd_res.status_code == 200
        assert upd_res.json()["display_name"] == "Lead Analyst"
