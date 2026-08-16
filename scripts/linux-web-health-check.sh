#!/usr/bin/env bash
# ==============================================================================
# SOCForge — Linux Web Target & DVWA Health Check (Phase 8)
# ==============================================================================
# Verifies the operational status of Nginx, DVWA, MariaDB, auditd, and Wazuh Agent
# either locally or remotely through the Bastion jumpbox.
#
# Usage:
#   ./scripts/linux-web-health-check.sh [--key-path ~/.ssh/socforge_key]
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
KEY_PATH="${1:-${HOME}/.ssh/socforge_key}"

echo "================================================================="
echo "       SOCForge Linux Web Target & DVWA Health Check             "
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
  echo "Validating local Web Target Ansible playbook syntax and configuration integrity:"
  echo ""
  printf "  Checking playbook web-target.yml:           "
  if ANSIBLE_CONFIG="${REPO_ROOT}/ansible/ansible.cfg" LC_ALL=C.UTF-8 ansible-playbook -i "${REPO_ROOT}/ansible/inventory/hosts.ini.example" "${REPO_ROOT}/ansible/playbooks/web-target.yml" --syntax-check >/dev/null 2>&1; then
    echo "[OK]"
  else
    echo "[FAIL]"
    exit 1
  fi
  printf "  Checking web-target role structure:         "
  if [ -f "${REPO_ROOT}/ansible/roles/web-target/tasks/main.yml" ] && [ -f "${REPO_ROOT}/ansible/roles/web-target/defaults/main.yml" ]; then
    echo "[OK]"
  else
    echo "[FAIL]"
    exit 1
  fi
  printf "  Checking Nginx DVWA template:               "
  if [ -f "${REPO_ROOT}/ansible/roles/web-target/templates/nginx-dvwa.conf.j2" ]; then
    echo "[OK]"
  else
    echo "[FAIL]"
    exit 1
  fi
  printf "  Checking auditd rules template:             "
  if [ -f "${REPO_ROOT}/ansible/roles/web-target/templates/audit.rules.j2" ]; then
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

check_file() {
  local file_path="$1"
  local display_name="$2"
  printf "  Checking log:     %-25s " "${display_name}"
  if ${SSH_CMD} "test -f ${file_path}" 2>/dev/null; then
    echo "[OK]"
  else
    echo "[FAIL / MISSING]"
    FAILURES=$((FAILURES + 1))
  fi
}

# 1. Check services
check_service "nginx" "Nginx Web Server"
check_service "mariadb" "MariaDB Database"
check_service "auditd" "Linux Auditd"
check_service "wazuh-agent" "Wazuh Agent"

echo ""
echo "Service Ports Check:"
check_port "8000" "Nginx DVWA HTTP"
check_port "3306" "MariaDB Localhost"

echo ""
echo "HTTP Endpoint & Log Files Check:"
printf "  Checking DVWA endpoint (HTTP 8000):         "
if ${SSH_CMD} "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8000/login.php" 2>/dev/null | grep -qE "200|302"; then
  echo "[OK (HTTP 200/302)]"
else
  echo "[FAIL / UNREACHABLE]"
  FAILURES=$((FAILURES + 1))
fi

check_file "/var/log/nginx/access.log" "Nginx Access Log"
check_file "/var/log/nginx/error.log" "Nginx Error Log"
check_file "/var/log/audit/audit.log" "Auditd Telemetry Log"
check_file "/var/log/auth.log" "Linux Auth Log"

echo ""
echo "-----------------------------------------------------------------"
if [ "${FAILURES}" -eq 0 ]; then
  echo "Health Check Result: PASS"
  echo "All Linux Web Target components, Nginx, DVWA, and telemetry logs are active."
  echo "================================================================="
  exit 0
else
  echo "Health Check Result: FAIL (${FAILURES} check(s) failed)"
  echo "================================================================="
  exit 1
fi
