#!/usr/bin/env bash
# ==============================================================================
# SOCForge — Wazuh Dashboard SSH Tunnel Helper (Phase 6)
# ==============================================================================
# Establishes an encrypted SSH local port forwarding tunnel through the Bastion
# jumpbox to securely access the Wazuh Dashboard at https://localhost:8443
#
# Usage:
#   ./scripts/wazuh-tunnel.sh [--local-port 8443] [--key-path ~/.ssh/socforge_key]
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

LOCAL_PORT="${1:-8443}"
KEY_PATH="${2:-${HOME}/.ssh/socforge_key}"

echo "================================================================="
echo "             SOCForge Wazuh Dashboard SSH Tunnel                "
echo "================================================================="

# 1. Resolve Bastion Public IP and Wazuh Private IP
BASTION_IP=""
WAZUH_IP=""

# Try extracting from Terraform outputs first
if command -v terraform >/dev/null 2>&1 && [ -d "${REPO_ROOT}/terraform" ]; then
  BASTION_IP=$(terraform -chdir="${REPO_ROOT}/terraform" output -raw bastion_public_ip 2>/dev/null || true)
  WAZUH_IP=$(terraform -chdir="${REPO_ROOT}/terraform" output -raw wazuh_private_ip 2>/dev/null || true)
fi

# Fallback: Extract from ansible/inventory/hosts.ini
if [[ ! "${BASTION_IP}" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]] || [[ ! "${WAZUH_IP}" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  INVENTORY_FILE="${REPO_ROOT}/ansible/inventory/hosts.ini"
  if [ -f "${INVENTORY_FILE}" ]; then
    BASTION_IP=$(grep -E '^bastion ' "${INVENTORY_FILE}" | grep -oE 'ansible_host=[^ ]+' | cut -d= -f2 || true)
    WAZUH_IP=$(grep -E '^wazuh ' "${INVENTORY_FILE}" | grep -oE 'ansible_host=[^ ]+' | cut -d= -f2 || true)
  fi
fi

if [[ ! "${BASTION_IP}" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]] || [[ ! "${WAZUH_IP}" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "[ERROR] Could not automatically determine valid Bastion and Wazuh IP addresses."
  echo "Please ensure Terraform has been applied and 'make inventory' has been run."
  echo "Or manually invoke:"
  echo "  ssh -N -L ${LOCAL_PORT}:<WAZUH_PRIVATE_IP>:443 -i ${KEY_PATH} ubuntu@<BASTION_PUBLIC_IP>"
  exit 1
fi

echo "Bastion Public IP  : ${BASTION_IP}"
echo "Wazuh Private IP   : ${WAZUH_IP}"
echo "Local Forward Port : ${LOCAL_PORT} -> ${WAZUH_IP}:443"
echo "SSH Private Key    : ${KEY_PATH}"
echo "-----------------------------------------------------------------"
echo "Tunnel starting... Press Ctrl+C to close the tunnel."
echo "Open your browser and navigate to:"
echo ""
echo "  👉  https://localhost:${LOCAL_PORT}"
echo ""
echo "================================================================="

# Establish the persistent SSH tunnel
exec ssh -N \
  -o StrictHostKeyChecking=no \
  -o UserKnownHostsFile=/dev/null \
  -o ServerAliveInterval=30 \
  -o ServerAliveCountMax=3 \
  -i "${KEY_PATH}" \
  -L "${LOCAL_PORT}:${WAZUH_IP}:443" \
  "ubuntu@${BASTION_IP}"
