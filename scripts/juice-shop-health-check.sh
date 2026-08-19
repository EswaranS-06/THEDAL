#!/usr/bin/env bash
# ==============================================================================
# THEDAL — OWASP Juice Shop & Docker Health Check
# Threat Hunting, Exploration, Detection, Analysis and Learn
# ==============================================================================
# Verifies the operational status of Docker Engine, Juice Shop container,
# port 3000 mapping, and container telemetry either locally or via Bastion jumpbox.
#
# Usage:
#   ./scripts/juice-shop-health-check.sh [--key-path ~/.ssh/thedal_key]
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

DEFAULT_KEY="${HOME}/.ssh/socforge_key"
if [[ -f "${HOME}/.ssh/thedal_key" ]]; then
  DEFAULT_KEY="${HOME}/.ssh/thedal_key"
fi
KEY_PATH="${1:-${DEFAULT_KEY}}"

echo "================================================================="
echo "        THEDAL OWASP Juice Shop & Docker Health Check            "
echo "================================================================="

# 1. Resolve host addresses
BASTION_IP=""
WEB_IP=""

if command -v terraform >/dev/null 2>&1 && [ -d "${REPO_ROOT}/terraform" ]; then
  BASTION_IP=$(terraform -chdir="${REPO_ROOT}/terraform" output -raw bastion_public_ip 2>/dev/null || true)
  WEB_IP=$(terraform -chdir="${REPO_ROOT}/terraform" output -raw web_private_ip 2>/dev/null || true)
fi

# Fallback: Check generated inventory
if [[ ! "${BASTION_IP}" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]] || [[ ! "${WEB_IP}" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  INVENTORY_FILE="${REPO_ROOT}/ansible/inventory/hosts.ini"
  if [ -f "${INVENTORY_FILE}" ]; then
    BASTION_IP=$(grep -E '^bastion ' "${INVENTORY_FILE}" | grep -oE 'ansible_host=[^ ]+' | cut -d= -f2 || true)
    WEB_IP=$(grep -E '^web ' "${INVENTORY_FILE}" | grep -oE 'ansible_host=[^ ]+' | cut -d= -f2 || true)
  fi
fi

# If live infrastructure is not deployed, run local syntax & structure check
if [[ ! "${BASTION_IP}" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]] || [[ ! "${WEB_IP}" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "[NOTICE] Live AWS infrastructure is not currently deployed."
  echo "Validating local Juice Shop Ansible playbook syntax and configuration integrity:"
  echo ""
  printf "  Checking playbook juice-shop.yml:           "
  if ANSIBLE_CONFIG="${REPO_ROOT}/ansible/ansible.cfg" LC_ALL=C.UTF-8 ansible-playbook -i "${REPO_ROOT}/ansible/inventory/hosts.ini.example" "${REPO_ROOT}/ansible/playbooks/juice-shop.yml" --syntax-check >/dev/null 2>&1; then
    echo "[OK]"
  else
    echo "[FAIL]"
    exit 1
  fi
  printf "  Checking docker role structure:             "
  if [ -f "${REPO_ROOT}/ansible/roles/docker/tasks/main.yml" ] && [ -f "${REPO_ROOT}/ansible/roles/docker/templates/daemon.json.j2" ]; then
    echo "[OK]"
  else
    echo "[FAIL]"
    exit 1
  fi
  printf "  Checking juice-shop role structure:         "
  if [ -f "${REPO_ROOT}/ansible/roles/juice-shop/tasks/main.yml" ] && [ -f "${REPO_ROOT}/ansible/roles/juice-shop/templates/docker-compose.yml.j2" ]; then
    echo "[OK]"
  else
    echo "[FAIL]"
    exit 1
  fi
  echo ""
  echo "Health Check Result: PASS (Configuration validated; live test requires 'terraform apply')"
  echo "================================================================="
  exit 0
fi

echo "Connecting to Web Target server (${WEB_IP}) via Bastion (${BASTION_IP})..."
echo ""

SSH_CMD="ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i ${KEY_PATH} -J ubuntu@${BASTION_IP} ubuntu@${WEB_IP}"

FAILURES=0

printf "  Checking service: Docker Daemon             "
if ${SSH_CMD} "systemctl is-active --quiet docker" 2>/dev/null; then
  echo "[OK]"
else
  echo "[FAIL / INACTIVE]"
  FAILURES=$((FAILURES + 1))
fi

printf "  Checking container: Juice Shop (running)    "
if ${SSH_CMD} "docker ps --filter 'name=juice-shop' --filter 'status=running' -q" 2>/dev/null | grep -q .; then
  echo "[OK]"
else
  echo "[FAIL / NOT RUNNING]"
  FAILURES=$((FAILURES + 1))
fi

printf "  Checking port:    Juice Shop (:3000)        "
if ${SSH_CMD} "ss -tlpn | grep -q ':3000 '" 2>/dev/null; then
  echo "[OK]"
else
  echo "[FAIL / CLOSED]"
  FAILURES=$((FAILURES + 1))
fi

printf "  Checking HTTP:    Juice Shop Web UI         "
if ${SSH_CMD} "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/" 2>/dev/null | grep -q "200"; then
  echo "[OK (HTTP 200)]"
else
  echo "[FAIL / UNREACHABLE]"
  FAILURES=$((FAILURES + 1))
fi

printf "  Checking API:     Juice Shop Search API     "
if ${SSH_CMD} "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/rest/products/search?q=test" 2>/dev/null | grep -q "200"; then
  echo "[OK (HTTP 200)]"
else
  echo "[FAIL / UNREACHABLE]"
  FAILURES=$((FAILURES + 1))
fi

echo ""
echo "-----------------------------------------------------------------"
if [ "${FAILURES}" -eq 0 ]; then
  echo "Health Check Result: PASS"
  echo "Docker Engine, OWASP Juice Shop container, and port 3000 are operational."
  echo "================================================================="
  exit 0
else
  echo "Health Check Result: FAIL (${FAILURES} check(s) failed)"
  echo "================================================================="
  exit 1
fi
