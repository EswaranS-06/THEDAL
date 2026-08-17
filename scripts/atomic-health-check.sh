#!/usr/bin/env bash
# ==============================================================================
# SOCForge — Atomic Red Team Role Health Check & Verification Script (Phase 10)
# ==============================================================================
# Validates Atomic Red Team role structure, catalog definitions, wrapper scripts,
# safety boundaries, and playbook configurations offline.
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "================================================================="
echo "        SOCForge Phase 10: Atomic Red Team Health Check         "
echo "================================================================="

FAILURES=0

check_file() {
  local filepath="$1"
  local desc="$2"
  printf "  Checking %-40s " "${desc}..."
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
  printf "  Checking executable: %-30s " "${desc}..."
  if [ -x "${REPO_ROOT}/${filepath}" ]; then
    printf "[OK]\n"
  else
    printf "[FAIL]\n"
    FAILURES=$((FAILURES + 1))
  fi
}

# 1. Structural Files Verification
echo ""
echo "1. Role & Playbook Structure Verification:"
check_file "ansible/roles/atomic-red-team/defaults/main.yml" "Role defaults"
check_file "ansible/roles/atomic-red-team/handlers/main.yml" "Role handlers"
check_file "ansible/roles/atomic-red-team/tasks/main.yml" "Master task sequence"
check_file "ansible/roles/atomic-red-team/tasks/prerequisites.yml" "Prerequisites tasks"
check_file "ansible/roles/atomic-red-team/tasks/powershell.yml" "PowerShell tasks"
check_file "ansible/roles/atomic-red-team/tasks/git.yml" "Git cloning tasks"
check_file "ansible/roles/atomic-red-team/tasks/atomic-red-team.yml" "Configuration tasks"
check_file "ansible/roles/atomic-red-team/tasks/validation.yml" "Validation tasks"
check_file "ansible/roles/atomic-red-team/templates/socforge-tests.yml.j2" "Test catalog template"
check_file "ansible/roles/atomic-red-team/templates/run-atomic-test.sh.j2" "Wrapper script template"
check_file "ansible/roles/atomic-red-team/templates/atomic-env.sh.j2" "Environment template"
check_file "ansible/roles/atomic-red-team/README.md" "Role README"
check_file "ansible/playbooks/atomic-red-team.yml" "Master deployment playbook"
check_file "scripts/run-atomic-test.sh" "Control machine wrapper"
check_file "docs/atomic-red-team.md" "Phase 10 documentation"

# 2. Permissions Verification
echo ""
echo "2. Script Execution Permissions:"
check_executable "scripts/run-atomic-test.sh" "run-atomic-test.sh"
check_executable "scripts/atomic-health-check.sh" "atomic-health-check.sh"

# 3. Test Catalog Integrity
echo ""
echo "3. MITRE ATT&CK Test Catalog Validation:"
CATALOG_TEMPLATE="${REPO_ROOT}/ansible/roles/atomic-red-team/templates/socforge-tests.yml.j2"
printf "  Parsing YAML and verifying initial low-risk techniques... "
PYTHON_CATALOG_CHECK=$(python3 -c "
import re, yaml, sys

with open('${CATALOG_TEMPLATE}', 'r') as f:
    content = f.read()

cleaned = re.sub(r'\{%.*?%\}', '', content)
cleaned = re.sub(r'\{\{.*?\}\}', 'SOCForge-windows', cleaned)

try:
    data = yaml.safe_load(cleaned)
    tests = data.get('tests', [])
    tech_ids = [t.get('technique_id') for t in tests]
    required = ['T1059.001', 'T1082', 'T1087.001', 'T1016', 'T1053.005']
    missing = [r for r in required if r not in tech_ids]
    if missing:
        print(f'Missing required techniques: {missing}')
        sys.exit(1)
    print(f'OK ({len(tests)} techniques verified)')
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
DEFAULT_EXEC=$(grep -E '^atomic_execute:' "${REPO_ROOT}/ansible/roles/atomic-red-team/defaults/main.yml" | cut -d: -f2 | awk '{print $1}')
if [[ "${DEFAULT_EXEC}" == "false" ]]; then
  printf "[OK] (atomic_execute: false)\n"
else
  printf "[FAIL] (Invalid default state: %s)\n" "${DEFAULT_EXEC}"
  FAILURES=$((FAILURES + 1))
fi

printf "  Verifying playbook safety assertion... "
if grep -q "not atomic_execute" "${REPO_ROOT}/ansible/playbooks/atomic-red-team.yml"; then
  printf "[OK] (Safety assertion verified)\n"
else
  printf "[FAIL] (Playbook missing safety assertion)\n"
  FAILURES=$((FAILURES + 1))
fi

echo ""
echo "-----------------------------------------------------------------"
if [ "${FAILURES}" -eq 0 ]; then
  echo "Atomic Red Team Health Check Result: PASS"
  echo "SOCForge Phase 10 attack simulation host automation is fully verified."
  echo "================================================================="
  exit 0
else
  echo "Atomic Red Team Health Check Result: FAIL (${FAILURES} issues found)"
  echo "================================================================="
  exit 1
fi
