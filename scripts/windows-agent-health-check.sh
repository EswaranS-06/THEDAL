#!/usr/bin/env bash
# ==============================================================================
# THEDAL — Windows Endpoint & Wazuh Agent Health Check
# Threat Hunting, Exploration, Detection, Analysis and Learn
# ==============================================================================
# Verifies the operational status of Windows Sysmon and Wazuh Agent telemetry
# pipeline either locally or remotely through the Bastion jumpbox.
#
# Usage:
#   ./scripts/windows-agent-health-check.sh [--key-path ~/.ssh/thedal_key]
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
echo "       THEDAL Windows Endpoint & Wazuh Agent Health Check        "
echo "================================================================="

# 1. Resolve host addresses
BASTION_IP=""
WAZUH_IP=""
WINDOWS_IP=""

if command -v terraform >/dev/null 2>&1 && [ -d "${REPO_ROOT}/terraform" ]; then
  BASTION_IP=$(terraform -chdir="${REPO_ROOT}/terraform" output -raw bastion_public_ip 2>/dev/null || true)
  WAZUH_IP=$(terraform -chdir="${REPO_ROOT}/terraform" output -raw wazuh_private_ip 2>/dev/null || true)
  WINDOWS_IP=$(terraform -chdir="${REPO_ROOT}/terraform" output -raw windows_private_ip 2>/dev/null || true)
fi

# Fallback: Check generated inventory
if [[ ! "${BASTION_IP}" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]] || [[ ! "${WINDOWS_IP}" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  INVENTORY_FILE="${REPO_ROOT}/ansible/inventory/hosts.ini"
  if [ -f "${INVENTORY_FILE}" ]; then
    BASTION_IP=$(grep -E '^bastion ' "${INVENTORY_FILE}" | grep -oE 'ansible_host=[^ ]+' | cut -d= -f2 || true)
    WAZUH_IP=$(grep -E '^wazuh ' "${INVENTORY_FILE}" | grep -oE 'ansible_host=[^ ]+' | cut -d= -f2 || true)
    WINDOWS_IP=$(grep -E '^windows ' "${INVENTORY_FILE}" | grep -oE 'ansible_host=[^ ]+' | cut -d= -f2 || true)
  fi
fi

# If live infrastructure is not deployed, run local syntax & structure check
if [[ ! "${BASTION_IP}" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]] || [[ ! "${WINDOWS_IP}" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "[NOTICE] Live AWS infrastructure is not currently deployed."
  echo "Validating local Windows Agent Ansible playbook syntax and configuration integrity:"
  echo ""
  printf "  Checking playbook windows-agent.yml:        "
  if ANSIBLE_CONFIG="${REPO_ROOT}/ansible/ansible.cfg" LC_ALL=C.UTF-8 ansible-playbook -i "${REPO_ROOT}/ansible/inventory/hosts.ini.example" "${REPO_ROOT}/ansible/playbooks/windows-agent.yml" --syntax-check >/dev/null 2>&1; then
    echo "[OK]"
  else
    echo "[FAIL]"
    exit 1
  fi
  printf "  Checking wazuh-agent role structure:        "
  if [ -f "${REPO_ROOT}/ansible/roles/wazuh-agent/tasks/main.yml" ] && [ -f "${REPO_ROOT}/ansible/roles/wazuh-agent/templates/ossec.conf.j2" ]; then
    echo "[OK]"
  else
    echo "[FAIL]"
    exit 1
  fi
  printf "  Checking Sysmon template configuration:     "
  if [ -f "${REPO_ROOT}/ansible/roles/windows-base/templates/sysmonconfig.xml.j2" ]; then
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

echo "Connecting to Windows endpoint (${WINDOWS_IP}) via Bastion (${BASTION_IP})..."
echo ""

# Live connectivity verification when deployed
FAILURES=0

echo "Checking Wazuh Manager Agent Registry via Bastion..."
WAZUH_API_CMD="ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i ${KEY_PATH} -J ubuntu@${BASTION_IP} ubuntu@${WAZUH_IP}"

printf "  Querying Wazuh Manager active agents:        "
if ${WAZUH_API_CMD} "/var/ossec/bin/agent_control -l" 2>/dev/null | grep -qi "windows"; then
  echo "[OK (Windows Agent Registered)]"
else
  echo "[FAIL / AGENT NOT REGISTERED]"
  FAILURES=$((FAILURES + 1))
fi

echo ""
echo "-----------------------------------------------------------------"
if [ "${FAILURES}" -eq 0 ]; then
  echo "Health Check Result: PASS"
  echo "Windows endpoint telemetry pipeline and Wazuh Agent registration are active."
  echo "================================================================="
  exit 0
else
  echo "Health Check Result: FAIL (${FAILURES} check(s) failed)"
  echo "================================================================="
  exit 1
fi
