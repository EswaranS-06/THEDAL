#!/usr/bin/env bash
# ==============================================================================
# THEDAL — Wazuh API Credential Rotation
# ==============================================================================

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${SCRIPT_DIR}"

BOLD="\033[1m"
GREEN="\033[0;32m"
AMBER="\033[0;33m"
RED="\033[0;31m"
CYAN="\033[0;36m"
NC="\033[0m"

echo -e "${BOLD}${CYAN}=== THEDAL Wazuh Credential Rotation ===${NC}"
echo -e "Rotating centralized Wazuh API credentials atomically..."

if command -v uv &>/dev/null; then
    uv run python -c "
from app.services.wazuh_credentials import WazuhCredentialService
import json

res = WazuhCredentialService.rotate_api_credentials()
print(json.dumps(res, indent=2))
if not res['success']:
    exit(1)
"
else
    python3 -c "
import sys
sys.path.insert(0, 'control-plane')
from app.services.wazuh_credentials import WazuhCredentialService
import json

res = WazuhCredentialService.rotate_api_credentials()
print(json.dumps(res, indent=2))
if not res['success']:
    exit(1)
"
fi

echo -e ""
echo -e "${GREEN}✓ Wazuh API credentials rotated and synchronized successfully!${NC}"
