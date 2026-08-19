#!/usr/bin/env bash
# ==============================================================================
# THEDAL — Health Check Script
# Threat Hunting, Exploration, Detection, Analysis and Learn
# ==============================================================================
# Performs local control machine and repository structure verification.
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "================================================================="
echo "                 THEDAL Project Health Check                     "
echo "================================================================="
echo "Repository Root: ${REPO_ROOT}"
echo ""

FAILURES=0

# Helper functions
check_dir() {
  local dir="$1"
  printf "  Checking directory: %-45s " "${dir}"
  if [ -d "${REPO_ROOT}/${dir}" ]; then
    echo "[OK]"
  else
    echo "[MISSING]"
    FAILURES=$((FAILURES + 1))
  fi
}

check_file() {
  local file="$1"
  printf "  Checking file:      %-45s " "${file}"
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
  "ansible/roles/windows-base/templates"
  "ansible/roles/wazuh"
  "ansible/roles/wazuh/tasks"
  "ansible/roles/wazuh/templates"
  "ansible/roles/wazuh-agent"
  "ansible/roles/wazuh-agent/tasks"
  "ansible/roles/wazuh-agent/templates"
  "ansible/roles/web-target"
  "ansible/roles/web-target/tasks"
  "ansible/roles/web-target/templates"
  "ansible/roles/docker"
  "ansible/roles/docker/tasks"
  "ansible/roles/docker/templates"
  "ansible/roles/juice-shop"
  "ansible/roles/juice-shop/tasks"
  "ansible/roles/juice-shop/templates"
  "ansible/roles/atomic-red-team"
  "ansible/roles/atomic-red-team/tasks"
  "ansible/roles/atomic-red-team/templates"
  "ansible/roles/web-attack"
  "ansible/roles/web-attack/tasks"
  "ansible/roles/web-attack/templates"
  "tests"
  "tests/detections"
  "detection"
  "attacks"
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
  "docs/phase-8-linux-web-target.md"
  "docs/phase-9-juice-shop-docker.md"
  "docs/atomic-red-team.md"
  "docs/web-test-catalog.md"
  "docs/web-security-testing.md"
  "docs/telemetry-architecture.md"
  "docs/detection-catalog.md"
  "docs/detection-engineering.md"
  "docs/detection-test-results.md"
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
  "ansible/playbooks/windows-agent.yml"
  "ansible/playbooks/wazuh.yml"
  "ansible/playbooks/web-target.yml"
  "ansible/playbooks/juice-shop.yml"
  "ansible/playbooks/atomic-red-team.yml"
  "ansible/playbooks/web-attack.yml"
  "ansible/roles/common/tasks/main.yml"
  "ansible/roles/linux-base/tasks/main.yml"
  "ansible/roles/windows-base/tasks/main.yml"
  "ansible/roles/windows-base/defaults/main.yml"
  "ansible/roles/windows-base/templates/sysmonconfig.xml.j2"
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
  "ansible/roles/wazuh/tasks/telemetry.yml"
  "ansible/roles/wazuh/tasks/dashboards.yml"
  "ansible/roles/wazuh/tasks/detection-rules.yml"
  "ansible/roles/wazuh/tasks/validation.yml"
  "ansible/roles/wazuh/templates/opensearch.yml.j2"
  "ansible/roles/wazuh/templates/ossec.conf.j2"
  "ansible/roles/wazuh/templates/filebeat.yml.j2"
  "ansible/roles/wazuh/templates/socforge-template.json.j2"
  "ansible/roles/wazuh/templates/socforge-ism-policy.json.j2"
  "ansible/roles/wazuh/templates/socforge-dashboards.ndjson.j2"
  "ansible/roles/wazuh/templates/socforge_decoders.xml.j2"
  "ansible/roles/wazuh/templates/socforge_rules.xml.j2"
  "ansible/roles/wazuh/templates/opensearch_dashboards.yml.j2"
  "ansible/roles/wazuh/templates/wazuh_dashboard.yml.j2"
  "ansible/roles/wazuh-agent/README.md"
  "ansible/roles/wazuh-agent/defaults/main.yml"
  "ansible/roles/wazuh-agent/handlers/main.yml"
  "ansible/roles/wazuh-agent/tasks/main.yml"
  "ansible/roles/wazuh-agent/tasks/prerequisites.yml"
  "ansible/roles/wazuh-agent/tasks/install-windows.yml"
  "ansible/roles/wazuh-agent/tasks/configure-windows.yml"
  "ansible/roles/wazuh-agent/tasks/registration-windows.yml"
  "ansible/roles/wazuh-agent/tasks/validation-windows.yml"
  "ansible/roles/wazuh-agent/templates/ossec.conf.j2"
  "ansible/roles/web-target/README.md"
  "ansible/roles/web-target/defaults/main.yml"
  "ansible/roles/web-target/handlers/main.yml"
  "ansible/roles/web-target/tasks/main.yml"
  "ansible/roles/web-target/tasks/prerequisites.yml"
  "ansible/roles/web-target/tasks/mariadb.yml"
  "ansible/roles/web-target/tasks/php.yml"
  "ansible/roles/web-target/tasks/dvwa.yml"
  "ansible/roles/web-target/tasks/nginx.yml"
  "ansible/roles/web-target/tasks/auditd.yml"
  "ansible/roles/web-target/tasks/wazuh-agent.yml"
  "ansible/roles/web-target/tasks/validation.yml"
  "ansible/roles/web-target/templates/nginx-dvwa.conf.j2"
  "ansible/roles/web-target/templates/dvwa-config.inc.php.j2"
  "ansible/roles/web-target/templates/audit.rules.j2"
  "ansible/roles/web-target/templates/ossec-web.conf.j2"
  "ansible/roles/docker/README.md"
  "ansible/roles/docker/defaults/main.yml"
  "ansible/roles/docker/handlers/main.yml"
  "ansible/roles/docker/tasks/main.yml"
  "ansible/roles/docker/tasks/prerequisites.yml"
  "ansible/roles/docker/tasks/install.yml"
  "ansible/roles/docker/tasks/proxy.yml"
  "ansible/roles/docker/tasks/validation.yml"
  "ansible/roles/docker/templates/daemon.json.j2"
  "ansible/roles/docker/templates/docker-proxy.conf.j2"
  "ansible/roles/juice-shop/README.md"
  "ansible/roles/juice-shop/defaults/main.yml"
  "ansible/roles/juice-shop/handlers/main.yml"
  "ansible/roles/juice-shop/tasks/main.yml"
  "ansible/roles/juice-shop/tasks/configure.yml"
  "ansible/roles/juice-shop/tasks/deploy.yml"
  "ansible/roles/juice-shop/tasks/validation.yml"
  "ansible/roles/juice-shop/templates/docker-compose.yml.j2"
  "ansible/roles/atomic-red-team/README.md"
  "ansible/roles/atomic-red-team/defaults/main.yml"
  "ansible/roles/atomic-red-team/handlers/main.yml"
  "ansible/roles/atomic-red-team/tasks/main.yml"
  "ansible/roles/atomic-red-team/tasks/prerequisites.yml"
  "ansible/roles/atomic-red-team/tasks/powershell.yml"
  "ansible/roles/atomic-red-team/tasks/git.yml"
  "ansible/roles/atomic-red-team/tasks/atomic-red-team.yml"
  "ansible/roles/atomic-red-team/tasks/validation.yml"
  "ansible/roles/atomic-red-team/templates/socforge-tests.yml.j2"
  "ansible/roles/atomic-red-team/templates/run-atomic-test.sh.j2"
  "ansible/roles/atomic-red-team/templates/atomic-env.sh.j2"
  "ansible/roles/web-attack/README.md"
  "ansible/roles/web-attack/defaults/main.yml"
  "ansible/roles/web-attack/handlers/main.yml"
  "ansible/roles/web-attack/tasks/main.yml"
  "ansible/roles/web-attack/tasks/prerequisites.yml"
  "ansible/roles/web-attack/tasks/scenarios.yml"
  "ansible/roles/web-attack/tasks/validation.yml"
  "ansible/roles/web-attack/templates/web-scenarios.yml.j2"
  "ansible/roles/web-attack/templates/run-web-test.sh.j2"
  "scripts/preflight.sh"
  "scripts/health-check.sh"
  "scripts/generate-inventory.py"
  "scripts/wazuh-tunnel.sh"
  "scripts/wazuh-health-check.sh"
  "scripts/wazuh-index-health-check.sh"
  "scripts/detection-health-check.sh"
  "scripts/windows-agent-health-check.sh"
  "scripts/linux-web-health-check.sh"
  "scripts/juice-shop-health-check.sh"
  "scripts/run-atomic-test.sh"
  "scripts/atomic-health-check.sh"
  "scripts/run-web-test.sh"
  "scripts/web-target-health-check.sh"
)

for f in "${REQUIRED_FILES[@]}"; do
  check_file "${f}"
done
echo ""

# 4. Script Executable Permissions
echo "4. Script Execution Permissions:"
for s in "scripts/preflight.sh" "scripts/health-check.sh" "scripts/generate-inventory.py" "scripts/wazuh-tunnel.sh" "scripts/wazuh-health-check.sh" "scripts/wazuh-index-health-check.sh" "scripts/detection-health-check.sh" "scripts/windows-agent-health-check.sh" "scripts/linux-web-health-check.sh" "scripts/juice-shop-health-check.sh" "scripts/run-atomic-test.sh" "scripts/atomic-health-check.sh" "scripts/run-web-test.sh" "scripts/web-target-health-check.sh"; do
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
  echo "THEDAL project foundation, compute declarations, Wazuh SIEM, Windows endpoint, Linux Web Target, OWASP Juice Shop, Atomic Red Team, Web Security Testing Suite, Telemetry Index Architecture, and Detection Engineering are intact."
  echo "================================================================="
  exit 0
else
  echo "Health Check Result: FAIL"
  echo "Encountered ${FAILURES} missing or misconfigured component(s)."
  echo "================================================================="
  exit 1
fi
