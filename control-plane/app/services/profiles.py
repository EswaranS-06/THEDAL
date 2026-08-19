"""
THEDAL Control Plane — AWS Profile & Credential Management Service
Handles AWS profiles strictly via standard ~/.aws/credentials without persistent secret storage in DB/logs.
"""

import os
import configparser
from pathlib import Path
from typing import List, Dict, Any, Optional
import boto3
from botocore.exceptions import ClientError, ProfileNotFound


class AWSProfileService:
    """Manages AWS credential profiles securely via standard config files."""

    AWS_DIR = Path.home() / ".aws"
    CREDENTIALS_FILE = AWS_DIR / "credentials"
    CONFIG_FILE = AWS_DIR / "config"

    @classmethod
    def list_profiles(cls) -> List[Dict[str, Any]]:
        """List all configured AWS profiles with their validation status."""
        profiles = []
        if not cls.CREDENTIALS_FILE.exists():
            return profiles

        cp = configparser.ConfigParser()
        cp.read(cls.CREDENTIALS_FILE)

        for sec in cp.sections():
            profile_name = sec
            val_info = cls.validate_profile(profile_name)
            profiles.append({
                "name": profile_name,
                "valid": val_info["valid"],
                "account": val_info.get("account"),
                "arn": val_info.get("arn"),
                "error": val_info.get("error")
            })

        return profiles

    @classmethod
    def validate_profile(cls, profile_name: str) -> Dict[str, Any]:
        """Validate credentials of a profile using STS get_caller_identity without exposing secrets."""
        try:
            session = boto3.Session(profile_name=profile_name)
            sts = session.client("sts")
            identity = sts.get_caller_identity()
            return {
                "valid": True,
                "account": identity.get("Account"),
                "arn": identity.get("Arn"),
                "error": None
            }
        except ProfileNotFound:
            return {"valid": False, "error": "Profile not found in credentials file"}
        except ClientError as e:
            return {"valid": False, "error": str(e.response.get("Error", {}).get("Message", str(e)))}
        except Exception as e:
            return {"valid": False, "error": str(e)}

    @classmethod
    def save_profile(cls, profile_name: str, access_key_id: str, secret_access_key: str, region: str = "ap-south-1") -> Dict[str, Any]:
        """
        Save/update credentials in ~/.aws/credentials and region in ~/.aws/config.
        Secret is written directly to ~/.aws/credentials and discarded immediately.
        """
        cls.AWS_DIR.mkdir(mode=0o700, parents=True, exist_ok=True)

        # Update credentials file
        cp_cred = configparser.ConfigParser()
        if cls.CREDENTIALS_FILE.exists():
            cp_cred.read(cls.CREDENTIALS_FILE)

        cp_cred[profile_name] = {
            "aws_access_key_id": access_key_id.strip(),
            "aws_secret_access_key": secret_access_key.strip()
        }

        with open(cls.CREDENTIALS_FILE, "w") as f:
            cp_cred.write(f)
        os.chmod(cls.CREDENTIALS_FILE, 0o600)

        # Update config file with region
        cp_conf = configparser.ConfigParser()
        if cls.CONFIG_FILE.exists():
            cp_conf.read(cls.CONFIG_FILE)

        conf_sec = f"profile {profile_name}" if profile_name != "default" else "default"
        if conf_sec not in cp_conf:
            cp_conf[conf_sec] = {}
        cp_conf[conf_sec]["region"] = region.strip()

        with open(cls.CONFIG_FILE, "w") as f:
            cp_conf.write(f)
        os.chmod(cls.CONFIG_FILE, 0o600)

        # Validate saved profile
        val = cls.validate_profile(profile_name)
        return {
            "success": val["valid"],
            "profile": profile_name,
            "account": val.get("account"),
            "arn": val.get("arn"),
            "error": val.get("error")
        }
