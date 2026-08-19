#!/usr/bin/env bash
# ==============================================================================
# THEDAL — Web Target & Security Testing Health Check Script
# Threat Hunting, Exploration, Detection, Analysis and Learn
# ==============================================================================
# Validates web testing suite files, scenario catalogs, execution wrappers,
# safety boundaries, and offline configuration integrity.
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "================================================================="
echo "        THEDAL Web Security Testing Health Check                 "
echo "================================================================="

FAILURES=0

check_file() {
  local filepath="$1"
  local desc="$2"
  printf "  Checking %-42s " "${desc}..."
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
  printf "  Checking executable: %-32s " "${desc}..."
  if [ -x "${REPO_ROOT}/${filepath}" ]; then
    printf "[OK]\n"
  else
    printf "[FAIL]\n"
    FAILURES=$((FAILURES + 1))
  fi
}

# 1. Structural Files Verification
echo ""
echo "1. Web Security Testing Suite Structure Verification:"
check_file "ansible/roles/web-attack/defaults/main.yml" "Role defaults"
check_file "ansible/roles/web-attack/handlers/main.yml" "Role handlers"
check_file "ansible/roles/web-attack/tasks/main.yml" "Master task sequence"
check_file "ansible/roles/web-attack/tasks/prerequisites.yml" "Prerequisites tasks"
check_file "ansible/roles/web-attack/tasks/scenarios.yml" "Scenarios deployment tasks"
check_file "ansible/roles/web-attack/tasks/validation.yml" "Validation tasks"
check_file "ansible/roles/web-attack/templates/web-scenarios.yml.j2" "Web scenario catalog template"
check_file "ansible/roles/web-attack/templates/run-web-test.sh.j2" "Web execution wrapper template"
check_file "ansible/roles/web-attack/README.md" "Role README"
check_file "ansible/playbooks/web-attack.yml" "Master deployment playbook"
check_file "scripts/run-web-test.sh" "Control machine wrapper"
check_file "scripts/web-target-health-check.sh" "Web target health check"
check_file "docs/web-test-catalog.md" "Web test catalog document"
check_file "docs/web-security-testing.md" "Phase 11 comprehensive guide"

# 2. Permissions Verification
echo ""
echo "2. Script Execution Permissions:"
check_executable "scripts/run-web-test.sh" "run-web-test.sh"
check_executable "scripts/web-target-health-check.sh" "web-target-health-check.sh"

# 3. Web Scenario Catalog Integrity
echo ""
echo "3. Web Scenario Catalog Validation:"
CATALOG_TEMPLATE="${REPO_ROOT}/ansible/roles/web-attack/templates/web-scenarios.yml.j2"
printf "  Parsing YAML and verifying DVWA & Juice Shop scenarios... "
PYTHON_CATALOG_CHECK=$(python3 -c "
import re, yaml, sys

with open('${CATALOG_TEMPLATE}', 'r') as f:
    content = f.read()

cleaned = re.sub(r'\{%.*?%\}', '', content)
cleaned = re.sub(r'\{\{.*?\}\}', 'SOCForge-web', cleaned)

try:
    data = yaml.safe_load(cleaned)
    scenarios = data.get('scenarios', [])
    sc_ids = [s.get('scenario_id') for s in scenarios]
    required_dvwa = ['DVWA-01', 'DVWA-02', 'DVWA-03', 'DVWA-04', 'DVWA-05', 'DVWA-06']
    required_js = ['JS-01', 'JS-02', 'JS-03', 'JS-04', 'JS-05', 'JS-06']
    missing_dvwa = [r for r in required_dvwa if r not in sc_ids]
    missing_js = [r for r in required_js if r not in sc_ids]
    if missing_dvwa or missing_js:
        print(f'Missing scenarios: DVWA={missing_dvwa}, JS={missing_js}')
        sys.exit(1)
    print(f'OK ({len(required_dvwa)} DVWA + {len(required_js)} Juice Shop scenarios verified)')
except Exception as e:
    print(f'YAML parse error: {e}')
    sys.exit(1)
" 2>&1)

if [[ "${PYTHON_CATALOG_CHECK}" =~ ^OK ]]; then
  printf "[OK] (%s)\n" "${PYTHON_CATALOG_CHECK}"
else
  printf "[FAIL] (%s)\n" "${PYTHON_CATALOG_CHECK}"
  FAILURES=$((FAILURES + 1))
fi

# 4. Safety Interlock Verification
echo ""
echo "4. Safety Interlocks & Target Validation:"
printf "  Verifying default execution state is DISABLED... "
DEFAULT_EXEC=$(grep -E '^web_attack_execute:' "${REPO_ROOT}/ansible/roles/web-attack/defaults/main.yml" | cut -d: -f2 | awk '{print $1}')
if [[ "${DEFAULT_EXEC}" == "false" ]]; then
  printf "[OK] (web_attack_execute: false)\n"
else
  printf "[FAIL] (Invalid default state: %s)\n" "${DEFAULT_EXEC}"
  FAILURES=$((FAILURES + 1))
fi

printf "  Verifying playbook safety assertion... "
if grep -q "not web_attack_execute" "${REPO_ROOT}/ansible/playbooks/web-attack.yml"; then
  printf "[OK] (Safety assertion verified)\n"
else
  printf "[FAIL] (Playbook missing safety assertion)\n"
  FAILURES=$((FAILURES + 1))
fi

echo ""
echo "-----------------------------------------------------------------"
if [ "${FAILURES}" -eq 0 ]; then
  echo "Web Security Testing Health Check Result: PASS"
  echo "THEDAL web testing suite automation is fully verified."
  echo "================================================================="
  exit 0
else
  echo "Web Security Testing Health Check Result: FAIL (${FAILURES} issues found)"
  echo "================================================================="
  exit 1
fi
