#!/usr/bin/env bash
# ==============================================================================
# SOCForge — Health Check Script (Phases 1–6: Local Integrity)
# ==============================================================================
# Performs local control machine and repository structure verification.
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "================================================================="
echo "                SOCForge Project Health Check                    "
echo "================================================================="
echo "Repository Root: ${REPO_ROOT}"
echo ""

FAILURES=0

# Helper functions
check_dir() {
  local dir="$1"
  printf "  Checking directory: %-42s " "${dir}"
  if [ -d "${REPO_ROOT}/${dir}" ]; then
    echo "[OK]"
  else
    echo "[MISSING]"
    FAILURES=$((FAILURES + 1))
  fi
}

check_file() {
  local file="$1"
  printf "  Checking file:      %-42s " "${file}"
  if [ -f "${REPO_ROOT}/${file}" ]; then
    echo "[OK]"
  else
    echo "[MISSING]"
    FAILURES=$((FAILURES + 1))
  fi
}

# 1. Version Control Integrity
echo "1. Version Control Integrity:"
printf "  Checking Git repository:                       "
if git -C "${REPO_ROOT}" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  CURRENT_BRANCH=$(git -C "${REPO_ROOT}" branch --show-current 2>/dev/null || true)
  if [ -z "${CURRENT_BRANCH}" ]; then
    CURRENT_BRANCH=$(git -C "${REPO_ROOT}" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "detached")
  fi
  echo "[OK] (branch: ${CURRENT_BRANCH})"
else
  echo "[FAIL - Not a git repository]"
  FAILURES=$((FAILURES + 1))
fi
echo ""

# 2. Directory Structure Verification
echo "2. Required Project Directories:"
REQUIRED_DIRS=(
  "docs"
  "scripts"
  "terraform"
  "ansible"
  "ansible/inventory"
  "ansible/group_vars"
  "ansible/playbooks"
  "ansible/roles"
  "ansible/roles/common"
  "ansible/roles/linux-base"
  "ansible/roles/windows-base"
  "ansible/roles/wazuh"
  "ansible/roles/wazuh/tasks"
  "ansible/roles/wazuh/templates"
  "detection"
  "attacks"
  "tests"
)

for d in "${REQUIRED_DIRS[@]}"; do
  check_dir "${d}"
done
echo ""

# 3. Core Project & Configuration Files
echo "3. Core Project & Configuration Files:"
REQUIRED_FILES=(
  "README.md"
  "LICENSE"
  ".gitignore"
  ".editorconfig"
  "Makefile"
  "docs/architecture.md"
  "docs/deployment.md"
  "docs/networking.md"
  "docs/logging.md"
  "docs/learning-path.md"
  "terraform/versions.tf"
  "terraform/provider.tf"
  "terraform/variables.tf"
  "terraform/locals.tf"
  "terraform/networking.tf"
  "terraform/security_groups.tf"
  "terraform/iam.tf"
  "terraform/access.tf"
  "terraform/compute.tf"
  "terraform/outputs.tf"
  "terraform/terraform.tfvars.example"
  "terraform/README.md"
  "ansible/ansible.cfg"
  "ansible/README.md"
  "ansible/inventory/hosts.ini.example"
  "ansible/group_vars/all.yml"
  "ansible/group_vars/linux.yml"
  "ansible/group_vars/windows.yml"
  "ansible/playbooks/bootstrap.yml"
  "ansible/playbooks/linux-base.yml"
  "ansible/playbooks/windows-base.yml"
  "ansible/playbooks/wazuh.yml"
  "ansible/roles/common/tasks/main.yml"
  "ansible/roles/linux-base/tasks/main.yml"
  "ansible/roles/windows-base/tasks/main.yml"
  "ansible/roles/wazuh/README.md"
  "ansible/roles/wazuh/defaults/main.yml"
  "ansible/roles/wazuh/handlers/main.yml"
  "ansible/roles/wazuh/tasks/main.yml"
  "ansible/roles/wazuh/tasks/prerequisites.yml"
  "ansible/roles/wazuh/tasks/repository.yml"
  "ansible/roles/wazuh/tasks/certificates.yml"
  "ansible/roles/wazuh/tasks/indexer.yml"
  "ansible/roles/wazuh/tasks/manager.yml"
  "ansible/roles/wazuh/tasks/dashboard.yml"
  "ansible/roles/wazuh/tasks/validation.yml"
  "ansible/roles/wazuh/templates/opensearch.yml.j2"
  "ansible/roles/wazuh/templates/ossec.conf.j2"
  "ansible/roles/wazuh/templates/filebeat.yml.j2"
  "ansible/roles/wazuh/templates/opensearch_dashboards.yml.j2"
  "ansible/roles/wazuh/templates/wazuh_dashboard.yml.j2"
  "scripts/preflight.sh"
  "scripts/health-check.sh"
  "scripts/generate-inventory.py"
  "scripts/wazuh-tunnel.sh"
  "scripts/wazuh-health-check.sh"
)

for f in "${REQUIRED_FILES[@]}"; do
  check_file "${f}"
done
echo ""

# 4. Script Executable Permissions
echo "4. Script Execution Permissions:"
for s in "scripts/preflight.sh" "scripts/health-check.sh" "scripts/generate-inventory.py" "scripts/wazuh-tunnel.sh" "scripts/wazuh-health-check.sh"; do
  printf "  Checking executable bit: %-35s " "${s}"
  if [ -x "${REPO_ROOT}/${s}" ]; then
    echo "[OK]"
  else
    echo "[FAIL - Not executable]"
    FAILURES=$((FAILURES + 1))
  fi
done
echo ""

# 5. Summary & Status
echo "-----------------------------------------------------------------"
if [ "${FAILURES}" -eq 0 ]; then
  echo "Health Check Result: PASS"
  echo "SOCForge project foundation, compute declarations, and Wazuh SIEM platform are intact."
  echo "================================================================="
  exit 0
else
  echo "Health Check Result: FAIL"
  echo "Encountered ${FAILURES} missing or misconfigured component(s)."
  echo "================================================================="
  exit 1
fi
