#!/usr/bin/env bash
# ==============================================================================
# SOCForge — Operator Web Security Testing Execution Helper (Phase 11)
# ==============================================================================
# Runs curated web attacks against DVWA (:8000) and Juice Shop (:3000)
# from SOCForge-attack via Bastion ProxyJump.
#
# Usage:
#   ./scripts/run-web-test.sh --list
#   ./scripts/run-web-test.sh --baseline --confirm
#   ./scripts/run-web-test.sh --target dvwa --scenario DVWA-03 --dry-run
#   ./scripts/run-web-test.sh --target dvwa --scenario DVWA-03 --confirm
#   ./scripts/run-web-test.sh --target juice-shop --scenario JS-03 --confirm
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

KEY_PATH="${HOME}/.ssh/socforge_key"
INVENTORY_FILE="${REPO_ROOT}/ansible/inventory/hosts.ini"
CATALOG_TEMPLATE="${REPO_ROOT}/ansible/roles/web-attack/templates/web-scenarios.yml.j2"

TARGET_APP=""
SCENARIO_ID=""
CONFIRMED="false"
DRY_RUN="false"
ACTION="run"

usage() {
  cat << 'EOF'
=================================================================
       SOCForge Operator Web Attack Execution Helper
=================================================================
Usage:
  ./scripts/run-web-test.sh --target <dvwa|juice-shop> --scenario <ID> --confirm [options]

Options:
  --target <APP>           Target application: 'dvwa' or 'juice-shop'
  -s, --scenario <ID>      Scenario ID (e.g. DVWA-01..06, JS-01..06)
  -c, --confirm            Explicit confirmation flag authorizing execution
  -l, --list               List available curated web scenarios
  -b, --baseline           Generate baseline normal traffic against both apps
  -d, --dry-run            Display request details without sending network traffic
      --help               Display this help message

Examples:
  ./scripts/run-web-test.sh --list
  ./scripts/run-web-test.sh --baseline --confirm
  ./scripts/run-web-test.sh --target dvwa --scenario DVWA-03 --dry-run
  ./scripts/run-web-test.sh --target dvwa --scenario DVWA-03 --confirm
  ./scripts/run-web-test.sh --target juice-shop --scenario JS-05 --confirm
=================================================================
EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --target)
      TARGET_APP=$(echo "$2" | tr '[:upper:]' '[:lower:]')
      shift 2
      ;;
    -s|--scenario)
      SCENARIO_ID=$(echo "$2" | tr '[:lower:]' '[:upper:]')
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
    -b|--baseline)
      ACTION="baseline"
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
      if [[ -z "${SCENARIO_ID}" ]] && [[ "$1" =~ ^(DVWA|JS)-[0-9]{2}$ ]]; then
        SCENARIO_ID="$1"
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
  echo "              Curated SOCForge Web Security Scenarios            "
  echo "================================================================="
  if [ -f "${CATALOG_TEMPLATE}" ]; then
    python3 -c "
import re, yaml
with open('${CATALOG_TEMPLATE}', 'r') as f:
    content = f.read()

cleaned = re.sub(r'\{%.*?%\}', '', content)
cleaned = re.sub(r'\{\{.*?\}\}', 'SOCForge-web', cleaned)

try:
    data = yaml.safe_load(cleaned)
    print(f'Target Environment : {data.get(\"target_environment\")} ({data.get(\"target_host\")})')
    print('-' * 70)
    print(f'{\"Scenario ID\":<12} | {\"App\":<10} | {\"Port\":<5} | {\"Method\":<6} | {\"Name\"}')
    print('-' * 70)
    for s in data.get('scenarios', []):
        print(f'{s.get(\"scenario_id\"):<12} | {s.get(\"application\"):<10} | {s.get(\"target_port\"):<5} | {s.get(\"method\"):<6} | {s.get(\"name\")}')
except Exception as e:
    print('Catalog syntax check:', e)
"
  fi
  echo "================================================================="
  exit 0
fi

# Auto-infer target application if omitted
if [[ -z "${TARGET_APP}" ]] && [[ -n "${SCENARIO_ID}" ]]; then
  if [[ "${SCENARIO_ID}" =~ ^DVWA- ]]; then
    TARGET_APP="dvwa"
  elif [[ "${SCENARIO_ID}" =~ ^JS- ]]; then
    TARGET_APP="juice-shop"
  fi
fi

# Resolve IPs cleanly
BASTION_IP=""
ATTACK_IP=""
WEB_IP=""

if command -v terraform >/dev/null 2>&1 && [ -d "${REPO_ROOT}/terraform" ]; then
  RAW_BASTION=$(terraform -chdir="${REPO_ROOT}/terraform" output -raw bastion_public_ip 2>&1 || true)
  if [[ "${RAW_BASTION}" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    BASTION_IP="${RAW_BASTION}"
  fi
  RAW_ATTACK=$(terraform -chdir="${REPO_ROOT}/terraform" output -raw attack_private_ip 2>&1 || true)
  if [[ "${RAW_ATTACK}" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    ATTACK_IP="${RAW_ATTACK}"
  fi
  RAW_WEB=$(terraform -chdir="${REPO_ROOT}/terraform" output -raw web_private_ip 2>&1 || true)
  if [[ "${RAW_WEB}" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    WEB_IP="${RAW_WEB}"
  fi
fi

if [[ -z "${BASTION_IP}" ]] && [ -f "${INVENTORY_FILE}" ]; then
  BASTION_IP=$(grep -E '^bastion ' "${INVENTORY_FILE}" | grep -oE 'ansible_host=[0-9.]+' | cut -d= -f2 || true)
  ATTACK_IP=$(grep -E '^attack ' "${INVENTORY_FILE}" | grep -oE 'ansible_host=[0-9.]+' | cut -d= -f2 || true)
  WEB_IP=$(grep -E '^web ' "${INVENTORY_FILE}" | grep -oE 'ansible_host=[0-9.]+' | cut -d= -f2 || true)
fi

if [[ "${DRY_RUN}" == "true" ]]; then
  echo "================================================================="
  echo "            SOCForge Web Attack [DRY-RUN PLAN]                  "
  echo "================================================================="
  echo "  Action          : ${ACTION}"
  echo "  Scenario        : ${SCENARIO_ID:-BASELINE}"
  echo "  Target App      : ${TARGET_APP:-ALL}"
  echo "  Target Host     : SOCForge-web (${WEB_IP:-<PENDING_CLOUD_DEPLOYMENT>})"
  echo "  Attack Host     : ${ATTACK_IP:-<PENDING_CLOUD_DEPLOYMENT>}"
  echo "  Bastion Gateway : ${BASTION_IP:-<PENDING_CLOUD_DEPLOYMENT>}"
  echo "  Execution Mode  : Controlled Wrapper (/usr/local/bin/run-web-test)"
  echo "  Safety Check    : PASSED (Dry-run only)"
  echo "================================================================="
  echo "[DRY-RUN] To authorize live execution once cloud infrastructure is deployed:"
  if [[ "${ACTION}" == "baseline" ]]; then
    echo "  $0 --baseline --confirm"
  else
    echo "  $0 --target ${TARGET_APP} --scenario ${SCENARIO_ID} --confirm"
  fi
  exit 0
fi

if [[ "${CONFIRMED}" != "true" ]]; then
  echo "[ERROR] Safety Interlock: Web testing execution is DISABLED by default."
  echo "You must pass '--confirm' to authorize web test execution."
  exit 1
fi

if [[ -z "${BASTION_IP}" ]] || [[ -z "${ATTACK_IP}" ]]; then
  echo "[INFO] Live cloud infrastructure is not yet deployed."
  echo "Terraform outputs are not available. Marking as configuration-valid."
  echo "Execute 'terraform apply' to deploy live instances before live web attack execution."
  exit 0
fi

echo "================================================================="
echo "        Invoking Web Test on SOCForge-attack Host                "
echo "================================================================="
echo "  Scenario    : ${SCENARIO_ID:-BASELINE}"
echo "  Target App  : ${TARGET_APP:-ALL}"
echo "  Attack Host : ${ATTACK_IP}"
echo "  Target Web  : ${WEB_IP}"
echo "  Bastion     : ${BASTION_IP}"
echo "-----------------------------------------------------------------"

# Execute wrapper on attack host via SSH ProxyJump
if [[ "${ACTION}" == "baseline" ]]; then
  ssh -o StrictHostKeyChecking=no \
      -o ProxyJump="ubuntu@${BASTION_IP}" \
      -i "${KEY_PATH}" \
      "ubuntu@${ATTACK_IP}" \
      "sudo /usr/local/bin/run-web-test --baseline --confirm"
else
  ssh -o StrictHostKeyChecking=no \
      -o ProxyJump="ubuntu@${BASTION_IP}" \
      -i "${KEY_PATH}" \
      "ubuntu@${ATTACK_IP}" \
      "sudo /usr/local/bin/run-web-test --target ${TARGET_APP} --scenario ${SCENARIO_ID} --confirm"
fi
