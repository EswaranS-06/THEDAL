#!/usr/bin/env bash
# ==============================================================================
# THEDAL — Wazuh Dashboard ↔ API Credential Synchronization Repair
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

echo -e "${BOLD}${CYAN}=== THEDAL Wazuh Credential Synchronization Repair ===${NC}"
echo -e "This operation will:"
echo -e "  1. Verify/ensure centralized credentials in ansible/inventory/secrets.yml"
echo -e "  2. Synchronize Wazuh API credentials on Wazuh Manager"
echo -e "  3. Regenerate Dashboard wazuh.yml with synchronized credentials"
echo -e "  4. Restart Wazuh Dashboard service"
echo -e "  5. Re-verify API authentication"
echo -e ""

if command -v uv &>/dev/null; then
    uv run python -c "
from app.services.wazuh_credentials import WazuhCredentialService
import json

res = WazuhCredentialService.repair_wazuh_configuration()
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

res = WazuhCredentialService.repair_wazuh_configuration()
print(json.dumps(res, indent=2))
if not res['success']:
    exit(1)
"
fi

echo -e ""
echo -e "${GREEN}✓ Wazuh API and Dashboard credentials successfully synchronized!${NC}"
