#!/usr/bin/env bash
# ==============================================================================
# SOCForge — Health Check Script (Phase 1: Local Integrity)
# ==============================================================================
# Performs local control machine and repository structure verification.
# NOTE: In Phase 1, this script does NOT connect to AWS or external services.
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "================================================================="
echo "                SOCForge Phase 1 Health Check                    "
echo "================================================================="
echo "Repository Root: ${REPO_ROOT}"
echo ""

FAILURES=0

# Helper functions
check_dir() {
  local dir="$1"
  printf "  Checking directory: %-25s " "${dir}"
  if [ -d "${REPO_ROOT}/${dir}" ]; then
    echo "[OK]"
  else
    echo "[MISSING]"
    FAILURES=$((FAILURES + 1))
  fi
}

check_file() {
  local file="$1"
  printf "  Checking file:      %-25s " "${file}"
  if [ -f "${REPO_ROOT}/${file}" ]; then
    echo "[OK]"
  else
    echo "[MISSING]"
    FAILURES=$((FAILURES + 1))
  fi
}

# 1. Git Repository Verification
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
  "detection"
  "attacks"
  "tests"
)

for d in "${REQUIRED_DIRS[@]}"; do
  check_dir "${d}"
done
echo ""

# 3. Core Project & Documentation Files
echo "3. Core Project & Documentation Files:"
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
  "scripts/preflight.sh"
  "scripts/health-check.sh"
)

for f in "${REQUIRED_FILES[@]}"; do
  check_file "${f}"
done
echo ""

# 4. Script Executable Permissions
echo "4. Script Execution Permissions:"
for s in "scripts/preflight.sh" "scripts/health-check.sh"; do
  printf "  Checking executable bit: %-20s " "${s}"
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
  echo "Phase 1 project foundation and file structure are fully intact."
  echo "================================================================="
  exit 0
else
  echo "Health Check Result: FAIL"
  echo "Encountered ${FAILURES} missing or misconfigured component(s)."
  echo "================================================================="
  exit 1
fi
