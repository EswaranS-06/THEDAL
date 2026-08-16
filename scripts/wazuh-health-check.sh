#!/usr/bin/env bash
# ==============================================================================
# SOCForge — Wazuh SIEM Health Check Script (Phase 6)
# ==============================================================================
# Verifies the operational status of Wazuh Indexer, Manager, Filebeat, and Dashboard
# either locally or remotely through the Bastion jumpbox.
#
# Usage:
#   ./scripts/wazuh-health-check.sh [--key-path ~/.ssh/socforge_key]
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
KEY_PATH="${1:-${HOME}/.ssh/socforge_key}"

echo "================================================================="
echo "                SOCForge Wazuh SIEM Health Check                 "
echo "================================================================="

# 1. Resolve host addresses
BASTION_IP=""
WAZUH_IP=""

if command -v terraform >/dev/null 2>&1 && [ -d "${REPO_ROOT}/terraform" ]; then
  BASTION_IP=$(terraform -chdir="${REPO_ROOT}/terraform" output -raw bastion_public_ip 2>/dev/null || true)
  WAZUH_IP=$(terraform -chdir="${REPO_ROOT}/terraform" output -raw wazuh_private_ip 2>/dev/null || true)
fi

# Fallback: Check generated inventory
if [[ ! "${BASTION_IP}" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]] || [[ ! "${WAZUH_IP}" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  INVENTORY_FILE="${REPO_ROOT}/ansible/inventory/hosts.ini"
  if [ -f "${INVENTORY_FILE}" ]; then
    BASTION_IP=$(grep -E '^bastion ' "${INVENTORY_FILE}" | grep -oE 'ansible_host=[^ ]+' | cut -d= -f2 || true)
    WAZUH_IP=$(grep -E '^wazuh ' "${INVENTORY_FILE}" | grep -oE 'ansible_host=[^ ]+' | cut -d= -f2 || true)
  fi
fi

# If still not valid IP addresses, run local configuration check
if [[ ! "${BASTION_IP}" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]] || [[ ! "${WAZUH_IP}" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "[NOTICE] Live AWS infrastructure is not currently deployed."
  echo "Validating local Wazuh Ansible playbook syntax and configuration integrity:"
  echo ""
  printf "  Checking playbook wazuh.yml:                "
  if ANSIBLE_CONFIG="${REPO_ROOT}/ansible/ansible.cfg" LC_ALL=C.UTF-8 ansible-playbook -i "${REPO_ROOT}/ansible/inventory/hosts.ini.example" "${REPO_ROOT}/ansible/playbooks/wazuh.yml" --syntax-check >/dev/null 2>&1; then
    echo "[OK]"
  else
    echo "[FAIL]"
    exit 1
  fi
  printf "  Checking wazuh role structure:              "
  if [ -f "${REPO_ROOT}/ansible/roles/wazuh/tasks/main.yml" ] && [ -f "${REPO_ROOT}/ansible/roles/wazuh/defaults/main.yml" ]; then
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

echo "Connecting to Wazuh server (${WAZUH_IP}) via Bastion (${BASTION_IP})..."
echo ""

SSH_CMD="ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i ${KEY_PATH} -J ubuntu@${BASTION_IP} ubuntu@${WAZUH_IP}"

FAILURES=0

check_service() {
  local service_name="$1"
  local display_name="$2"
  printf "  Checking service: %-25s " "${display_name}"
  if ${SSH_CMD} "systemctl is-active --quiet ${service_name}" 2>/dev/null; then
    echo "[OK]"
  else
    echo "[FAIL / INACTIVE]"
    FAILURES=$((FAILURES + 1))
  fi
}

check_port() {
  local port="$1"
  local display_name="$2"
  printf "  Checking port:    %-25s " "${display_name} (:${port})"
  if ${SSH_CMD} "ss -tlpn | grep -q ':${port} '" 2>/dev/null; then
    echo "[OK]"
  else
    echo "[FAIL / CLOSED]"
    FAILURES=$((FAILURES + 1))
  fi
}

check_service "wazuh-indexer" "Wazuh Indexer"
check_service "wazuh-manager" "Wazuh Manager"
check_service "filebeat" "Filebeat Forwarder"
check_service "wazuh-dashboard" "Wazuh Dashboard"

echo ""
echo "Service Ports Check:"
check_port "9200" "Indexer REST API"
check_port "1514" "Agent Telemetry"
check_port "1515" "Agent Enrollment"
check_port "55000" "Wazuh API"
check_port "443" "Dashboard Web"

echo ""
echo "-----------------------------------------------------------------"
if [ "${FAILURES}" -eq 0 ]; then
  echo "Health Check Result: PASS"
  echo "All Wazuh SIEM components and ports are active and operational."
  echo "================================================================="
  exit 0
else
  echo "Health Check Result: FAIL (${FAILURES} check(s) failed)"
  echo "================================================================="
  exit 1
fi
