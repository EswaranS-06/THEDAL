"""
THEDAL Control Plane — AWS Profile & Credential Management Service
==================================================================
Handles AWS profiles strictly via standard ~/.aws/credentials and ~/.aws/config
without persistent secret storage in DB/logs. Provides live STS validation,
safe editing, masking, and profile lifecycle management.
"""

import os
import configparser
from pathlib import Path
from typing import List, Dict, Any, Optional
import boto3
from botocore.exceptions import ClientError, ProfileNotFound, NoRegionError


class AWSProfileService:
    """Manages AWS credential profiles securely via standard config files."""

    AWS_DIR = Path.home() / ".aws"
    CREDENTIALS_FILE = AWS_DIR / "credentials"
    CONFIG_FILE = AWS_DIR / "config"

    @classmethod
    def get_profile_region(cls, profile_name: str) -> str:
        """Retrieves default region for profile from ~/.aws/config or environment."""
        if cls.CONFIG_FILE.exists():
            cp_conf = configparser.ConfigParser()
            try:
                cp_conf.read(cls.CONFIG_FILE)
                conf_sec = "default" if profile_name == "default" else f"profile {profile_name}"
                if conf_sec in cp_conf and "region" in cp_conf[conf_sec]:
                    return cp_conf[conf_sec]["region"]
            except Exception:
                pass
        return os.getenv("AWS_DEFAULT_REGION", "ap-south-1")

    @classmethod
    def list_profiles(cls) -> List[Dict[str, Any]]:
        """List all configured AWS profiles with accurate live validation status."""
        profiles = []
        if not cls.CREDENTIALS_FILE.exists():
            return profiles

        cp = configparser.ConfigParser()
        try:
            cp.read(cls.CREDENTIALS_FILE)
        except Exception:
            return profiles

        for sec in cp.sections():
            profile_name = sec
            region = cls.get_profile_region(profile_name)
            
            # Mask access key for preview
            raw_key = cp[sec].get("aws_access_key_id", "")
            masked_key = ""
            if raw_key:
                if len(raw_key) > 8:
                    masked_key = f"{raw_key[:4]}...{raw_key[-4:]}"
                else:
                    masked_key = f"{raw_key[:2]}***"

            val_info = cls.validate_profile(profile_name)
            is_valid = bool(val_info.get("valid", False))

            profiles.append({
                "name": profile_name,
                "valid": is_valid,
                "status": "VALID" if is_valid else "INVALID",
                "account_id": val_info.get("account"),
                "account": val_info.get("account"),
                "arn": val_info.get("arn"),
                "region": region,
                "access_key_preview": masked_key,
                "error": val_info.get("error")
            })

        return profiles

    @classmethod
    def validate_profile(cls, profile_name: str) -> Dict[str, Any]:
        """Validate credentials of a profile using STS get_caller_identity."""
        region = cls.get_profile_region(profile_name)
        try:
            session = boto3.Session(profile_name=profile_name, region_name=region)
            sts = session.client("sts")
            identity = sts.get_caller_identity()
            return {
                "valid": True,
                "account": identity.get("Account"),
                "arn": identity.get("Arn"),
                "error": None
            }
        except ProfileNotFound:
            return {"valid": False, "error": f"Profile '{profile_name}' not found in credentials file"}
        except ClientError as e:
            err_code = e.response.get("Error", {}).get("Code", "ClientError")
            err_msg = e.response.get("Error", {}).get("Message", str(e))
            return {"valid": False, "error": f"{err_code}: {err_msg}"}
        except NoRegionError:
            return {"valid": False, "error": "No AWS region configured for profile"}
        except Exception as e:
            return {"valid": False, "error": str(e)}

    @classmethod
    def save_profile(
        cls,
        profile_name: str,
        access_key_id: str,
        secret_access_key: str,
        region: str = "ap-south-1",
        old_profile_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Save or update credentials in ~/.aws/credentials and region in ~/.aws/config.
        Secret is written directly to ~/.aws/credentials with 0600 permissions.
        """
        profile_name = profile_name.strip()
        if not profile_name:
            raise ValueError("Profile name cannot be empty.")

        cls.AWS_DIR.mkdir(mode=0o700, parents=True, exist_ok=True)

        cp_cred = configparser.ConfigParser()
        if cls.CREDENTIALS_FILE.exists():
            try:
                cp_cred.read(cls.CREDENTIALS_FILE)
            except Exception:
                pass

        # If renaming from an old profile name, remove old section
        if old_profile_name and old_profile_name != profile_name and old_profile_name in cp_cred:
            cp_cred.remove_section(old_profile_name)

        # If updating without providing new secrets, keep existing
        existing_key = cp_cred[profile_name].get("aws_access_key_id", "") if profile_name in cp_cred else ""
        existing_sec = cp_cred[profile_name].get("aws_secret_access_key", "") if profile_name in cp_cred else ""

        key_to_save = access_key_id.strip() if access_key_id and access_key_id.strip() else existing_key
        sec_to_save = secret_access_key.strip() if secret_access_key and secret_access_key.strip() else existing_sec

        if not key_to_save or not sec_to_save:
            raise ValueError("AWS Access Key ID and Secret Access Key are required.")

        cp_cred[profile_name] = {
            "aws_access_key_id": key_to_save,
            "aws_secret_access_key": sec_to_save
        }

        with open(cls.CREDENTIALS_FILE, "w") as f:
            cp_cred.write(f)
        os.chmod(cls.CREDENTIALS_FILE, 0o600)

        # Update region in config file
        cp_conf = configparser.ConfigParser()
        if cls.CONFIG_FILE.exists():
            try:
                cp_conf.read(cls.CONFIG_FILE)
            except Exception:
                pass

        if old_profile_name and old_profile_name != profile_name:
            old_conf_sec = "default" if old_profile_name == "default" else f"profile {old_profile_name}"
            if old_conf_sec in cp_conf:
                cp_conf.remove_section(old_conf_sec)

        conf_sec = "default" if profile_name == "default" else f"profile {profile_name}"
        if conf_sec not in cp_conf:
            cp_conf[conf_sec] = {}
        cp_conf[conf_sec]["region"] = region.strip() if region else "ap-south-1"

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

    @classmethod
    def delete_profile(cls, profile_name: str) -> Dict[str, Any]:
        """Deletes a profile from ~/.aws/credentials and ~/.aws/config."""
        profile_name = profile_name.strip()
        deleted = False

        if cls.CREDENTIALS_FILE.exists():
            cp_cred = configparser.ConfigParser()
            try:
                cp_cred.read(cls.CREDENTIALS_FILE)
                if profile_name in cp_cred:
                    cp_cred.remove_section(profile_name)
                    with open(cls.CREDENTIALS_FILE, "w") as f:
                        cp_cred.write(f)
                    os.chmod(cls.CREDENTIALS_FILE, 0o600)
                    deleted = True
            except Exception as e:
                raise RuntimeError(f"Failed to update credentials file: {str(e)}")

        if cls.CONFIG_FILE.exists():
            cp_conf = configparser.ConfigParser()
            try:
                cp_conf.read(cls.CONFIG_FILE)
                conf_sec = "default" if profile_name == "default" else f"profile {profile_name}"
                if conf_sec in cp_conf:
                    cp_conf.remove_section(conf_sec)
                    with open(cls.CONFIG_FILE, "w") as f:
                        cp_conf.write(f)
                    os.chmod(cls.CONFIG_FILE, 0o600)
            except Exception:
                pass

        if not deleted:
            raise ValueError(f"Profile '{profile_name}' not found in credentials file.")

        return {
            "success": True,
            "message": f"Profile '{profile_name}' deleted successfully."
        }
