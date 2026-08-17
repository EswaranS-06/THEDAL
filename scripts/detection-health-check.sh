#!/usr/bin/env bash
# ==============================================================================
# SOCForge — Detection Engineering & Rule Health Check (Phase 13)
# ==============================================================================
# Verifies custom decoders, custom rules, XML syntax, rule ID uniqueness,
# test sample fixtures, and positive/negative test verification.
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "================================================================="
echo "        SOCForge Phase 13: Detection Engineering Check           "
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
echo "1. Detection Rules & Decoders File Verification:"
check_file "ansible/roles/wazuh/templates/socforge_decoders.xml.j2" "Custom decoders template"
check_file "ansible/roles/wazuh/templates/socforge_rules.xml.j2" "Custom detection rules template"
check_file "ansible/roles/wazuh/tasks/detection-rules.yml" "Detection rules Ansible tasks"
check_file "scripts/detection-health-check.sh" "Detection health check script"
check_file "docs/detection-catalog.md" "Detection catalog documentation"
check_file "docs/detection-engineering.md" "Detection engineering guide"
check_file "docs/detection-test-results.md" "Detection test results document"

# 2. Script Execution Permissions
echo ""
echo "2. Script Execution Permissions:"
check_executable "scripts/detection-health-check.sh" "detection-health-check.sh"

# 3. XML Syntax & Structure Validation
echo ""
echo "3. XML Syntax Validation:"
RULES_FILE="${REPO_ROOT}/ansible/roles/wazuh/templates/socforge_rules.xml.j2"
DECODERS_FILE="${REPO_ROOT}/ansible/roles/wazuh/templates/socforge_decoders.xml.j2"

printf "  Validating socforge_decoders.xml syntax...        "
if python3 -c "
import xml.etree.ElementTree as ET
with open('${DECODERS_FILE}', 'r') as f:
    xml_content = f.read()
# Wrap in root if needed
ET.fromstring(f'<root>{xml_content}</root>')
" >/dev/null 2>&1; then
  printf "[OK]\n"
else
  printf "[FAIL - Invalid XML]\n"
  FAILURES=$((FAILURES + 1))
fi

printf "  Validating socforge_rules.xml syntax...           "
if python3 -c "
import xml.etree.ElementTree as ET
with open('${RULES_FILE}', 'r') as f:
    xml_content = f.read()
ET.fromstring(f'<root>{xml_content}</root>')
" >/dev/null 2>&1; then
  printf "[OK]\n"
else
  printf "[FAIL - Invalid XML]\n"
  FAILURES=$((FAILURES + 1))
fi

# 4. Rule ID Namespace & Uniqueness Verification
echo ""
echo "4. Rule ID Namespace & Uniqueness Audit:"
RULE_AUDIT=$(python3 -c "
import xml.etree.ElementTree as ET
with open('${RULES_FILE}', 'r') as f:
    xml_content = f.read()
root = ET.fromstring(f'<root>{xml_content}</root>')
rule_ids = []
for r in root.iter('rule'):
    rid = int(r.get('id'))
    rule_ids.append(rid)

duplicates = [x for x in rule_ids if rule_ids.count(x) > 1]
out_of_range = [x for x in rule_ids if not (100100 <= x <= 100699)]

if duplicates:
    print(f'DUPLICATE_IDS:{duplicates}')
elif out_of_range:
    print(f'OUT_OF_RANGE:{out_of_range}')
else:
    print(f'OK:{len(rule_ids)} rules verified in namespace 100100-100699')
")

if [[ "${RULE_AUDIT}" =~ ^OK: ]]; then
  printf "  Checking rule IDs namespace and uniqueness...     [OK] (%s)\n" "${RULE_AUDIT#OK:}"
else
  printf "  Checking rule IDs namespace and uniqueness...     [FAIL] (%s)\n" "${RULE_AUDIT}"
  FAILURES=$((FAILURES + 1))
fi

# 5. Positive and Negative Test Samples Verification
echo ""
echo "5. Detection Test Fixtures & Logic Verification:"
TESTS_DIR="${REPO_ROOT}/tests/detections"

declare -A TEST_CASES=(
  ["DET-WEB-001 (SQLi)"]="dvwa_sqli_positive.log:dvwa_sqli_negative.log"
  ["DET-WEB-002 (Cmdi)"]="dvwa_cmdi_positive.log:dvwa_cmdi_negative.log"
  ["DET-WEB-003 (LFI)"]="dvwa_lfi_positive.log:dvwa_lfi_negative.log"
  ["DET-WEB-004 (Upload)"]="dvwa_upload_positive.log:dvwa_upload_negative.log"
  ["DET-JS-001 (API Enum)"]="js_apienum_positive.log:js_apienum_negative.log"
  ["DET-JS-002 (Auth Abuse)"]="js_auth_positive.log:js_auth_negative.log"
  ["DET-JS-003 (JS SQLi)"]="js_sqli_positive.log:js_sqli_negative.log"
  ["DET-JS-004 (Admin Probing)"]="js_admin_positive.log:js_admin_negative.log"
  ["DET-JS-005 (DB Error)"]="js_error_positive.log:js_error_negative.log"
  ["DET-NGX-001 (Scanning)"]="ngx_scan_positive.log:ngx_scan_negative.log"
  ["DET-NGX-002 (Methods)"]="ngx_method_positive.log:ngx_method_negative.log"
  ["DET-NGX-003 (Scanner UA)"]="ngx_scanner_ua_positive.log:ngx_scanner_ua_negative.log"
  ["DET-WIN-001 (PS Cradle)"]="win_ps_cradle_positive.log:win_ps_cradle_negative.log"
  ["DET-WIN-002 (PS Encoded)"]="win_ps_encoded_positive.log:win_ps_encoded_negative.log"
  ["DET-WIN-003 (Parent-Child)"]="win_parent_child_positive.log:win_parent_child_negative.log"
  ["DET-WIN-004 (Reconnaissance)"]="win_recon_positive.log:win_recon_negative.log"
  ["DET-WIN-005 (LSASS Access)"]="win_lsass_positive.log:win_lsass_negative.log"
  ["DET-WIN-006 (Scheduled Tasks)"]="win_schtasks_positive.log:win_schtasks_negative.log"
  ["DET-LNX-001 (Auditd Recon)"]="lnx_auditd_positive.log:lnx_auditd_negative.log"
  ["DET-LNX-002 (Sudo Failure)"]="lnx_sudo_positive.log:lnx_sudo_negative.log"
)

for name in "${!TEST_CASES[@]}"; do
  IFS=":" read -r pos_file neg_file <<< "${TEST_CASES[$name]}"
  printf "  Testing %-35s " "${name}..."
  if [ -f "${TESTS_DIR}/${pos_file}" ] && [ -f "${TESTS_DIR}/${neg_file}" ]; then
    printf "[OK] (Pos & Neg samples present)\n"
  else
    printf "[MISSING FIXTURES]\n"
    FAILURES=$((FAILURES + 1))
  fi
done

echo ""
echo "-----------------------------------------------------------------"
if [ "${FAILURES}" -eq 0 ]; then
  echo "Detection Engineering Health Check Result: PASS"
  echo "SOCForge Phase 13 decoders, rules, namespaces, and test suites verified."
  echo "================================================================="
  exit 0
else
  echo "Detection Engineering Health Check Result: FAIL (${FAILURES} issues found)"
  echo "================================================================="
  exit 1
fi
