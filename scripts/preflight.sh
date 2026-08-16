#!/usr/bin/env bash
# ==============================================================================
# SOCForge — Control Machine Preflight Checker
# ==============================================================================
# Verifies prerequisites on the local control machine (e.g. Debian 13 VM)
# without modifying system state or auto-installing packages.
# ==============================================================================

set -euo pipefail

# Header
echo "================================================================="
echo "                      SOCForge Preflight                         "
echo "================================================================="
echo ""

# 1. Operating System
echo "OS Information:"
if [ -f /etc/os-release ]; then
  # shellcheck source=/dev/null
  . /etc/os-release
  echo "  Distribution : ${PRETTY_NAME:-$NAME $VERSION}"
else
  echo "  OS Kernel    : $(uname -s) $(uname -r)"
fi

# 2. Architecture
ARCH=$(uname -m)
echo "  Architecture : ${ARCH}"
echo ""

# 3. System Resources
echo "Resource Availability:"
# Available disk space on current filesystem
DISK_AVAIL=$(df -h . | awk 'NR==2 {print $4}')
echo "  Disk Space Available : ${DISK_AVAIL}"

# Memory information
if [ -f /proc/meminfo ]; then
  MEM_AVAIL_KB=$(grep MemAvailable /proc/meminfo | awk '{print $2}')
  if [ -n "${MEM_AVAIL_KB}" ]; then
    MEM_AVAIL_MB=$((MEM_AVAIL_KB / 1024))
    echo "  Available Memory     : ${MEM_AVAIL_MB} MB"
  else
    echo "  Available Memory     : Unknown"
  fi
else
  echo "  Available Memory     : Not accessible"
fi
echo ""

# 4. Required Tools Check
echo "Required Tools:"

REQUIRED_TOOLS=(
  "git:Git"
  "terraform:Terraform"
  "ansible:Ansible"
  "aws:AWS CLI"
  "python3:Python3"
  "ssh:SSH"
)

MISSING_TOOLS=()

for tool_entry in "${REQUIRED_TOOLS[@]}"; do
  binary="${tool_entry%%:*}"
  display_name="${tool_entry##*:}"

  printf "  %-12s " "${display_name}"
  if command -v "${binary}" >/dev/null 2>&1; then
    VERSION_INFO=""
    case "${binary}" in
      git)
        VERSION_INFO=$(git --version 2>/dev/null | head -n 1)
        ;;
      terraform)
        VERSION_INFO=$(terraform version 2>/dev/null | head -n 1)
        ;;
      ansible)
        VERSION_INFO=$(ansible --version 2>/dev/null | head -n 1)
        ;;
      aws)
        VERSION_INFO=$(aws --version 2>/dev/null | head -n 1)
        ;;
      python3)
        VERSION_INFO=$(python3 --version 2>/dev/null | head -n 1)
        ;;
      ssh)
        VERSION_INFO=$(ssh -V 2>&1 | head -n 1)
        ;;
    esac
    printf "[OK] (%s)\n" "${VERSION_INFO}"
  else
    printf "[MISSING]\n"
    MISSING_TOOLS+=("${display_name} (${binary})")
  fi
done

echo ""
echo "-----------------------------------------------------------------"

# 5. Summary & Exit Code
if [ ${#MISSING_TOOLS[@]} -eq 0 ]; then
  echo "Result:"
  echo "PASS — All required control-machine tools and prerequisites are available."
  echo "================================================================="
  exit 0
else
  echo "Result:"
  echo "FAIL — Missing required tools on the control machine."
  echo ""
  echo "Missing:"
  for missing in "${MISSING_TOOLS[@]}"; do
    echo "  - ${missing}"
  done
  echo ""
  echo "Please install missing packages before deploying future phases."
  echo "================================================================="
  exit 1
fi
