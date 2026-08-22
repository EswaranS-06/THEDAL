"""
THEDAL Control Plane — User Profile & Central Credential Store Service
======================================================================
Provides single source of truth for THEDAL operator credentials, first-run setup detection,
secure local profile persistence, password management with explicit unmasking,
and synchronization with provisioning secrets.
"""

import json
import os
import secrets
import hashlib
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional

from app.config import settings
from app.services.wazuh_credentials import WazuhCredentialService


class UserProfileService:
    """Manages the THEDAL operator profile, first-run wizard state, and central credentials."""

    PROFILE_FILE = Path(settings.CONTROL_PLANE_DIR) / "data" / "user_profile.json"
    SECRETS_FILE = settings.ANSIBLE_DIR / "inventory" / "secrets.yml"

    @classmethod
    def _hash_password(cls, password: str, salt: Optional[str] = None) -> str:
        if not salt:
            salt = secrets.token_hex(16)
        h = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000)
        return f"{salt}${h.hex()}"

    @classmethod
    def _verify_password(cls, password: str, hashed: str) -> bool:
        try:
            salt, stored_hash = hashed.split("$", 1)
            calculated = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000).hex()
            return secrets.compare_digest(stored_hash, calculated)
        except Exception:
            return False

    @classmethod
    def is_setup_complete(cls) -> bool:
        """Returns True if the initial setup wizard has been completed."""
        if not cls.PROFILE_FILE.exists():
            return False
        try:
            data = json.loads(cls.PROFILE_FILE.read_text(encoding="utf-8"))
            return bool(data.get("setup_complete", False))
        except Exception:
            return False

    @classmethod
    def get_public_profile(cls) -> Dict[str, Any]:
        """Returns non-sensitive profile state for UI layout and routing."""
        if not cls.PROFILE_FILE.exists():
            return {
                "setup_complete": False,
                "display_name": "Analyst",
                "username": "admin",
            }
        try:
            data = json.loads(cls.PROFILE_FILE.read_text(encoding="utf-8"))
            return {
                "setup_complete": bool(data.get("setup_complete", False)),
                "display_name": data.get("display_name", "Analyst"),
                "username": data.get("username", "admin"),
                "created_at": data.get("created_at"),
                "updated_at": data.get("updated_at"),
            }
        except Exception:
            return {
                "setup_complete": False,
                "display_name": "Analyst",
                "username": "admin",
            }

    @classmethod
    def get_profile_details(cls) -> Dict[str, Any]:
        """Returns profile details including stored password for local educational lab viewing."""
        if not cls.PROFILE_FILE.exists():
            return {
                "setup_complete": False,
                "display_name": "Analyst",
                "username": "admin",
                "password": "",
                "created_at": None,
                "updated_at": None,
            }
        try:
            data = json.loads(cls.PROFILE_FILE.read_text(encoding="utf-8"))
            return {
                "setup_complete": bool(data.get("setup_complete", False)),
                "display_name": data.get("display_name", "Analyst"),
                "username": data.get("username", "admin"),
                "password": data.get("raw_password", ""),
                "created_at": data.get("created_at"),
                "updated_at": data.get("updated_at"),
            }
        except Exception:
            return {
                "setup_complete": False,
                "display_name": "Analyst",
                "username": "admin",
                "password": "",
                "created_at": None,
                "updated_at": None,
            }

    @classmethod
    def setup_initial_profile(
        cls,
        display_name: str,
        username: str,
        password: str
    ) -> Dict[str, Any]:
        """Completes the one-time initial setup wizard."""
        display_name = display_name.strip()
        username = username.strip()
        password = password.strip()

        if not display_name or not username or not password:
            raise ValueError("Display Name, Username, and Password are all required.")

        if len(password) < 8:
            raise ValueError("Password must be at least 8 characters long.")

        cls.PROFILE_FILE.parent.mkdir(parents=True, exist_ok=True)

        now = datetime.utcnow().isoformat()
        profile_data = {
            "setup_complete": True,
            "display_name": display_name,
            "username": username,
            "password_hash": cls._hash_password(password),
            "raw_password": password,  # Stored securely for local educational lab viewing
            "created_at": now,
            "updated_at": now,
        }

        cls.PROFILE_FILE.write_text(json.dumps(profile_data, indent=2), encoding="utf-8")
        os.chmod(cls.PROFILE_FILE, 0o600)

        # Inject into central provisioning secrets
        cls.sync_central_secrets(username=username, password=password)

        return {
            "success": True,
            "setup_complete": True,
            "display_name": display_name,
            "username": username,
            "message": "Initial THEDAL setup completed successfully."
        }

    @classmethod
    def sync_central_secrets(cls, username: str, password: str) -> None:
        """Synchronizes credentials into ansible/inventory/secrets.yml with 0600 permissions."""
        cls.SECRETS_FILE.parent.mkdir(parents=True, exist_ok=True)
        
        # Ensure strong Wazuh API password (derive from user password if strong, or keep compliant)
        wazuh_api_pass = password if len(password) >= 12 and any(c.isupper() for c in password) and any(c.isdigit() for c in password) else f"{password}Lab2026!"

        content = f"""---
# ==============================================================================
# THEDAL — Centralized Provisioning Secrets (Single Source of Truth)
# Generated automatically by THEDAL UserProfileService. Excluded from Git.
# ==============================================================================
thedal_operator_user: "{username}"
thedal_operator_password: "{password}"
thedal_wazuh_admin_password: "{password}"
thedal_wazuh_api_user: "{WazuhCredentialService.DEFAULT_USER}"
thedal_wazuh_api_password: "{wazuh_api_pass}"
"""
        cls.SECRETS_FILE.write_text(content, encoding="utf-8")
        os.chmod(cls.SECRETS_FILE, 0o600)

    @classmethod
    def update_profile(
        cls,
        display_name: Optional[str] = None,
        username: Optional[str] = None,
        password: Optional[str] = None,
        scope: str = "future_deployments"
    ) -> Dict[str, Any]:
        """
        Updates profile information.
        Scopes:
          - 'profile_only': updates local app display name/password
          - 'future_deployments': updates local profile + ansible/inventory/secrets.yml
          - 'rotate_existing': updates profile + secrets + live Wazuh infrastructure
        """
        curr = cls.get_profile_details()
        new_display = display_name.strip() if display_name and display_name.strip() else curr["display_name"]
        new_user = username.strip() if username and username.strip() else curr["username"]
        new_pass = password.strip() if password and password.strip() else curr["password"]

        now = datetime.utcnow().isoformat()
        profile_data = {
            "setup_complete": True,
            "display_name": new_display,
            "username": new_user,
            "password_hash": cls._hash_password(new_pass),
            "raw_password": new_pass,
            "created_at": curr.get("created_at") or now,
            "updated_at": now,
        }

        cls.PROFILE_FILE.parent.mkdir(parents=True, exist_ok=True)
        cls.PROFILE_FILE.write_text(json.dumps(profile_data, indent=2), encoding="utf-8")
        os.chmod(cls.PROFILE_FILE, 0o600)

        sync_msg = "Profile updated."
        if scope in ("future_deployments", "rotate_existing"):
            cls.sync_central_secrets(username=new_user, password=new_pass)
            sync_msg = "Profile updated and centralized secrets synchronized for future deployments."

        if scope == "rotate_existing":
            # Attempt live repair/sync with deployed Wazuh infrastructure if active
            try:
                repair_res = WazuhCredentialService.repair_wazuh_configuration()
                if repair_res.get("success"):
                    sync_msg = "Profile updated, secrets synchronized, and live Wazuh cluster updated."
                else:
                    sync_msg = f"Profile updated and secrets saved. Note: Live Wazuh update notice: {repair_res.get('message')}"
            except Exception as e:
                sync_msg = f"Profile updated and secrets saved. Live sync skipped: {str(e)}"

        return {
            "success": True,
            "display_name": new_display,
            "username": new_user,
            "scope": scope,
            "message": sync_msg,
        }
