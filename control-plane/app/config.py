"""
THEDAL Control Plane — Application Configuration
"""

import os
from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App Settings
    APP_NAME: str = "THEDAL Control Plane"
    APP_VERSION: str = "1.0.0"
    HOST: str = "127.0.0.1"
    PORT: int = 8080
    DEBUG: bool = False

    # Base Paths
    CONTROL_PLANE_DIR: Path = Path(__file__).resolve().parent.parent
    PROJECT_ROOT: Path = CONTROL_PLANE_DIR.parent
    TERRAFORM_DIR: Path = PROJECT_ROOT / "terraform"
    ANSIBLE_DIR: Path = PROJECT_ROOT / "ansible"
    SCRIPTS_DIR: Path = PROJECT_ROOT / "scripts"
    DOCS_DIR: Path = PROJECT_ROOT / "docs"
    LOGS_DIR: Path = CONTROL_PLANE_DIR / "logs"
    LOCK_FILE: Path = CONTROL_PLANE_DIR / ".operation.lock"

    # AWS Settings
    AWS_DEFAULT_REGION: str = os.getenv("AWS_DEFAULT_REGION", "ap-south-1")

    # SSH Settings (supports thedal_key with socforge_key fallback)
    @property
    def SSH_KEY_PATH(self) -> Path:
        primary = Path.home() / ".ssh" / "thedal_key"
        if primary.exists():
            return primary
        return Path.home() / ".ssh" / "socforge_key"

    # Security Guardrails
    REQUIRE_DESTROY_CONFIRMATION_PHRASE: str = "DESTROY THEDAL"
    LEGACY_DESTROY_CONFIRMATION_PHRASE: str = "DESTROY SOCFORGE"
    MAX_LOG_LINES_STREAM: int = 500

    def init_directories(self) -> None:
        """Ensure required log and cache directories exist."""
        self.LOGS_DIR.mkdir(parents=True, exist_ok=True)


settings = Settings()
settings.init_directories()
