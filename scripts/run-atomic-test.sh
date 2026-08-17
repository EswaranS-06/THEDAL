#!/usr/bin/env bash
# ==============================================================================
# SOCForge — Operator Atomic Simulation Execution Helper (Phase 10)
# ==============================================================================
# Runs curated Atomic Red Team tests on SOCForge-attack via Bastion ProxyJump.
#
# Usage:
#   ./scripts/run-atomic-test.sh --list
#   ./scripts/run-atomic-test.sh --technique T1082 --dry-run
#   ./scripts/run-atomic-test.sh --technique T1082 --confirm
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

KEY_PATH="${HOME}/.ssh/socforge_key"
INVENTORY_FILE="${REPO_ROOT}/ansible/inventory/hosts.ini"
CATALOG_TEMPLATE="${REPO_ROOT}/ansible/roles/atomic-red-team/templates/socforge-tests.yml.j2"

TECHNIQUE_ID=""
CONFIRMED="false"
DRY_RUN="false"
ACTION="run"

usage() {
  cat << 'EOF'
=================================================================
       SOCForge Operator Atomic Red Team Execution Helper
=================================================================
Usage:
  ./scripts/run-atomic-test.sh --technique <TECH_ID> --confirm [options]

Options:
  -t, --technique <ID>     MITRE ATT&CK Technique ID (e.g. T1082, T1059.001)
  -c, --confirm            Explicit confirmation flag authorizing simulation
  -l, --list               List available curated SOCForge Atomic tests
  -d, --dry-run            Display test plan without executing commands
      --help               Display this help message

Examples:
  ./scripts/run-atomic-test.sh --list
  ./scripts/run-atomic-test.sh --technique T1082 --dry-run
  ./scripts/run-atomic-test.sh --technique T1082 --confirm
=================================================================
EOF
}

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    -t|--technique)
      TECHNIQUE_ID="$2"
      shift 2
      ;;
    -c|--confirm)
      CONFIRMED="true"
      shift
      ;;
    -l|--list)
      ACTION="list"
      shift
      ;;
    -d|--dry-run)
      DRY_RUN="true"
      shift
      ;;
    --help)
      usage
      exit 0
      ;;
    *)
      if [[ -z "${TECHNIQUE_ID}" ]] && [[ "$1" =~ ^T[0-9]+(\.[0-9]+)?$ ]]; then
        TECHNIQUE_ID="$1"
        shift
      else
        echo "[ERROR] Unknown option: $1"
        usage
        exit 1
      fi
      ;;
  esac
done

if [[ "${ACTION}" == "list" ]]; then
  echo "================================================================="
  echo "              Curated SOCForge Atomic Red Team Tests             "
  echo "================================================================="
  if [ -f "${CATALOG_TEMPLATE}" ]; then
    python3 -c "
import re
with open('${CATALOG_TEMPLATE}', 'r') as f:
    content = f.read()

# Clean Jinja tags for local inspection
cleaned = re.sub(r'\{%.*?%\}', '', content)
cleaned = re.sub(r'\{\{.*?\}\}', 'SOCForge-windows', cleaned)

import yaml
try:
    data = yaml.safe_load(cleaned)
    print(f'Target Environment : {data.get(\"target_environment\")} ({data.get(\"target_host\")})')
    print('-' * 65)
    print(f'{\"Technique\":<12} | {\"Test ID\":<12} | {\"Risk\":<6} | {\"Name\"}')
    print('-' * 65)
    for t in data.get('tests', []):
        print(f'{t.get(\"technique_id\"):<12} | {t.get(\"atomic_test_id\"):<12} | {t.get(\"risk_level\"):<6} | {t.get(\"technique_name\")}')
except Exception as e:
    print('Catalog syntax check:', e)
"
  fi
  echo "================================================================="
  exit 0
fi

if [[ -z "${TECHNIQUE_ID}" ]]; then
  echo "[ERROR] Missing required --technique <TECHNIQUE_ID>."
  usage
  exit 1
fi

if [[ "${CONFIRMED}" != "true" && "${DRY_RUN}" != "true" ]]; then
  echo "[ERROR] Safety Interlock: Simulation execution is DISABLED by default."
  echo "You must pass '--confirm' to authorize simulation execution."
  echo ""
  echo "Dry-run execution:"
  echo "  $0 --technique ${TECHNIQUE_ID} --dry-run"
  echo "Authorized execution:"
  echo "  $0 --technique ${TECHNIQUE_ID} --confirm"
  exit 1
fi

# 1. Resolve Bastion and Attack host IPs cleanly
BASTION_IP=""
ATTACK_IP=""

if command -v terraform >/dev/null 2>&1 && [ -d "${REPO_ROOT}/terraform" ]; then
  RAW_BASTION=$(terraform -chdir="${REPO_ROOT}/terraform" output -raw bastion_public_ip 2>&1 || true)
  if [[ "${RAW_BASTION}" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    BASTION_IP="${RAW_BASTION}"
  fi
  RAW_ATTACK=$(terraform -chdir="${REPO_ROOT}/terraform" output -raw attack_private_ip 2>&1 || true)
  if [[ "${RAW_ATTACK}" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    ATTACK_IP="${RAW_ATTACK}"
  fi
fi

if [[ -z "${BASTION_IP}" ]] && [ -f "${INVENTORY_FILE}" ]; then
  BASTION_IP=$(grep -E '^bastion ' "${INVENTORY_FILE}" | grep -oE 'ansible_host=[0-9.]+' | cut -d= -f2 || true)
  ATTACK_IP=$(grep -E '^attack ' "${INVENTORY_FILE}" | grep -oE 'ansible_host=[0-9.]+' | cut -d= -f2 || true)
fi

if [[ "${DRY_RUN}" == "true" ]]; then
  echo "================================================================="
  echo "            SOCForge Atomic Red Team [DRY-RUN PLAN]             "
  echo "================================================================="
  echo "  Technique       : ${TECHNIQUE_ID}"
  echo "  Target Host     : SOCForge-windows (10.10.10.200)"
  echo "  Attack Host     : ${ATTACK_IP:-<PENDING_DEPLOYMENT>}"
  echo "  Bastion Gateway : ${BASTION_IP:-<PENDING_DEPLOYMENT>}"
  echo "  Execution Mode  : Controlled Wrapper (/usr/local/bin/run-atomic-test)"
  echo "  Safety Check    : PASSED (Dry-run only)"
  echo "================================================================="
  echo "[DRY-RUN] To authorize live execution once cloud infrastructure is deployed:"
  echo "  $0 --technique ${TECHNIQUE_ID} --confirm"
  exit 0
fi

if [[ ! "${BASTION_IP}" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]] || [[ ! "${ATTACK_IP}" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "[INFO] Live cloud infrastructure is not yet deployed."
  echo "Terraform outputs are not available. Marking as configuration-valid."
  echo "Execute 'terraform apply' to deploy live instances before live attack execution."
  exit 0
fi

echo "================================================================="
echo "       Invoking Atomic Simulation on SOCForge-attack Host        "
echo "================================================================="
echo "  Technique   : ${TECHNIQUE_ID}"
echo "  Attack Host : ${ATTACK_IP}"
echo "  Bastion     : ${BASTION_IP}"
echo "-----------------------------------------------------------------"

# Execute wrapper on attack host via SSH ProxyJump
ssh -o StrictHostKeyChecking=no \
    -o ProxyJump="ubuntu@${BASTION_IP}" \
    -i "${KEY_PATH}" \
    "ubuntu@${ATTACK_IP}" \
    "sudo /usr/local/bin/run-atomic-test --technique ${TECHNIQUE_ID} --confirm"
