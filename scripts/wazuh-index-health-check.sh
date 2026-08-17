#!/usr/bin/env bash
# ==============================================================================
# SOCForge — Wazuh Telemetry & Index Architecture Health Check (Phase 12)
# ==============================================================================
# Verifies OpenSearch index templates, ISM retention policies, Filebeat routing,
# dashboard saved objects, and offline configuration integrity.
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "================================================================="
echo "   SOCForge Phase 12: Telemetry & Index Architecture Check       "
echo "================================================================="

FAILURES=0

check_file() {
  local filepath="$1"
  local desc="$2"
  printf "  Checking %-44s " "${desc}..."
  if [ -f "${REPO_ROOT}/${filepath}" ]; then
    printf "[OK]\n"
  else
    printf "[MISSING]\n"
    FAILURES=$((FAILURES + 1))
  fi
}

check_executable() {
  local filepath="$1"
  local desc="$2"
  printf "  Checking executable: %-34s " "${desc}..."
  if [ -x "${REPO_ROOT}/${filepath}" ]; then
    printf "[OK]\n"
  else
    printf "[FAIL]\n"
    FAILURES=$((FAILURES + 1))
  fi
}

# 1. Structural File Verification
echo ""
echo "1. Telemetry & Index Architecture Structure Verification:"
check_file "ansible/roles/wazuh/defaults/main.yml" "Wazuh defaults & ISM settings"
check_file "ansible/roles/wazuh/templates/filebeat.yml.j2" "Filebeat routing template"
check_file "ansible/roles/wazuh/templates/socforge-template.json.j2" "OpenSearch index template"
check_file "ansible/roles/wazuh/templates/socforge-ism-policy.json.j2" "OpenSearch ISM retention policy"
check_file "ansible/roles/wazuh/templates/socforge-dashboards.ndjson.j2" "Dashboard saved objects NDJSON"
check_file "ansible/roles/wazuh/tasks/telemetry.yml" "Telemetry & template tasks"
check_file "ansible/roles/wazuh/tasks/dashboards.yml" "Dashboard import tasks"
check_file "scripts/wazuh-index-health-check.sh" "Index health check script"
check_file "docs/telemetry-architecture.md" "Telemetry architecture guide"

# 2. Permissions Verification
echo ""
echo "2. Script Execution Permissions:"
check_executable "scripts/wazuh-index-health-check.sh" "wazuh-index-health-check.sh"

# 3. JSON / NDJSON / YAML Syntax Validation
echo ""
echo "3. Templates & Policy Syntax Validation:"
TEMPLATE_FILE="${REPO_ROOT}/ansible/roles/wazuh/templates/socforge-template.json.j2"
ISM_FILE="${REPO_ROOT}/ansible/roles/wazuh/templates/socforge-ism-policy.json.j2"
NDJSON_FILE="${REPO_ROOT}/ansible/roles/wazuh/templates/socforge-dashboards.ndjson.j2"
FILEBEAT_FILE="${REPO_ROOT}/ansible/roles/wazuh/templates/filebeat.yml.j2"

printf "  Validating OpenSearch index template JSON syntax... "
if python3 -m json.tool "${TEMPLATE_FILE}" >/dev/null 2>&1; then
  printf "[OK]\n"
else
  printf "[FAIL - Invalid JSON]\n"
  FAILURES=$((FAILURES + 1))
fi

printf "  Validating ISM retention policy JSON syntax...     "
if python3 -c "
import re, json
with open('${ISM_FILE}', 'r') as f:
    content = f.read()
cleaned = re.sub(r'\{\{.*?\}\}', '7', content)
json.loads(cleaned)
" >/dev/null 2>&1; then
  printf "[OK]\n"
else
  printf "[FAIL - Invalid JSON]\n"
  FAILURES=$((FAILURES + 1))
fi

printf "  Validating Dashboards NDJSON lines syntax...       "
NDJSON_CHECK=$(python3 -c "
import json
count = 0
with open('${NDJSON_FILE}', 'r') as f:
    for line in f:
        line = line.strip()
        if line:
            json.loads(line)
            count += 1
print(f'OK ({count} saved objects verified)')
" 2>&1 || echo "FAIL")

if [[ "${NDJSON_CHECK}" =~ ^OK ]]; then
  printf "[OK] (%s)\n" "${NDJSON_CHECK}"
else
  printf "[FAIL] (%s)\n" "${NDJSON_CHECK}"
  FAILURES=$((FAILURES + 1))
fi

# 4. Canonical Source Routing Verification
echo ""
echo "4. Filebeat Source Routing Verification:"
REQUIRED_SOURCES=(
  "windows_security"
  "sysmon"
  "powershell"
  "nginx_access"
  "nginx_error"
  "dvwa"
  "auditd"
  "linux_auth"
  "juice_shop"
  "atomic"
  "web_attack"
)

ALL_ROUTED="true"
for src in "${REQUIRED_SOURCES[@]}"; do
  printf "  Checking routing rule for '%-17s'... " "${src}"
  if grep -q "data.labels.socforge.source: \"${src}\"" "${FILEBEAT_FILE}"; then
    printf "[OK]\n"
  else
    printf "[MISSING]\n"
    ALL_ROUTED="false"
    FAILURES=$((FAILURES + 1))
  fi
done

echo ""
echo "-----------------------------------------------------------------"
if [ "${FAILURES}" -eq 0 ]; then
  echo "Index Architecture Health Check Result: PASS"
  echo "SOCForge Phase 12 telemetry routing, index templates, and dashboards verified."
  echo "================================================================="
  exit 0
else
  echo "Index Architecture Health Check Result: FAIL (${FAILURES} issues found)"
  echo "================================================================="
  exit 1
fi
