#!/usr/bin/env bash
# ==============================================================================
# THEDAL — Universal Linux Installer & Environment Setup
# Product: Threat Hunting, Exploration, Detection, Analysis and Learn
# ==============================================================================

set -eo pipefail
export LC_ALL=C.UTF-8
export LANG=C.UTF-8

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CHECK_ONLY=false
NON_INTERACTIVE=false
BIND_HOST="127.0.0.1"
BIND_PORT="8080"
SSH_KEY_PATH="${HOME}/.ssh/thedal_key"

# Colors for output
BOLD="\033[1m"
GREEN="\033[0;32m"
AMBER="\033[0;33m"
RED="\033[0;31m"
BLUE="\033[0;34m"
CYAN="\033[0;36m"
NC="\033[0m"

# Parse CLI arguments
while [[ "$#" -gt 0 ]]; do
    case "$1" in
        --check)
            CHECK_ONLY=true
            shift
            ;;
        --non-interactive|-n)
            NON_INTERACTIVE=true
            shift
            ;;
        --host)
            BIND_HOST="$2"
            shift 2
            ;;
        --port)
            BIND_PORT="$2"
            shift 2
            ;;
        --help|-h)
            echo -e "${BOLD}THEDAL Universal Installer${NC}"
            echo -e "Usage: ./install.sh [OPTIONS]"
            echo -e ""
            echo -e "Options:"
            echo -e "  --check             Check dependencies without installing or configuring"
            echo -e "  --non-interactive   Run without interactive prompts (will not auto-install packages)"
            echo -e "  --host HOST         Control plane bind host (default: 127.0.0.1)"
            echo -e "  --port PORT         Control plane bind port (default: 8080)"
            echo -e "  -h, --help          Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown argument: $1${NC}"
            exit 1
            ;;
    esac
done

echo -e "${BOLD}${BLUE}╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${BLUE}║                     THEDAL Universal Linux Installer                      ║${NC}"
echo -e "${BOLD}${BLUE}║       Threat Hunting, Exploration, Detection, Analysis and Learn          ║${NC}"
echo -e "${BOLD}${BLUE}╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
echo -e ""

# 1. Detect Operating System & Architecture
OS_NAME="Unknown"
OS_VER="Unknown"
PKG_MGR="Unknown"
ARCH="$(uname -m)"

if [[ -f /etc/os-release ]]; then
    . /etc/os-release
    OS_NAME="${NAME:-Linux}"
    OS_VER="${VERSION_ID:-Unknown}"
fi

if command -v apt-get &>/dev/null; then
    PKG_MGR="apt"
elif command -v dnf &>/dev/null; then
    PKG_MGR="dnf"
elif command -v pacman &>/dev/null; then
    PKG_MGR="pacman"
elif command -v zypper &>/dev/null; then
    PKG_MGR="zypper"
fi

echo -e "${CYAN}Platform:${NC} ${OS_NAME} ${OS_VER} (${ARCH}) &bull; Package Manager: ${PKG_MGR}"
echo -e ""

# 2. Dependency Checking Function
declare -A DEPS_INSTALLED
declare -A DEPS_REQUIRED=(
    ["git"]="2.x+"
    ["python3"]="3.11+"
    ["ssh"]="OpenSSH"
    ["terraform"]="1.5+"
    ["ansible"]="2.14+"
    ["aws"]="AWS CLI v2"
    ["uv"]="0.1+"
    ["node"]="18.x+ (Optional)"
)

MISSING_DEPS=0

check_dependencies() {
    MISSING_DEPS=0
    echo -e "${BOLD}┌──────────────────┬──────────────────────┬──────────────────────┬──────────┐${NC}"
    echo -e "${BOLD}│ Dependency       │ Installed Version    │ Required             │ Status   │${NC}"
    echo -e "${BOLD}├──────────────────┼──────────────────────┼──────────────────────┼──────────┤${NC}"

    # Git
    if command -v git &>/dev/null; then
        GIT_VER="$(git --version | awk '{print $3}')"
        printf "│ %-16s │ %-20s │ %-20s │ ${GREEN}%-8s${NC} │\n" "git" "$GIT_VER" "${DEPS_REQUIRED[git]}" "OK"
    else
        printf "│ %-16s │ %-20s │ %-20s │ ${RED}%-8s${NC} │\n" "git" "Missing" "${DEPS_REQUIRED[git]}" "MISSING"
        MISSING_DEPS=$((MISSING_DEPS + 1))
    fi

    # Python3
    if command -v python3 &>/dev/null; then
        PY_VER="$(python3 --version 2>&1 | awk '{print $2}')"
        printf "│ %-16s │ %-20s │ %-20s │ ${GREEN}%-8s${NC} │\n" "python3" "$PY_VER" "${DEPS_REQUIRED[python3]}" "OK"
    else
        printf "│ %-16s │ %-20s │ %-20s │ ${RED}%-8s${NC} │\n" "python3" "Missing" "${DEPS_REQUIRED[python3]}" "MISSING"
        MISSING_DEPS=$((MISSING_DEPS + 1))
    fi

    # SSH
    if command -v ssh &>/dev/null; then
        SSH_VER="$(ssh -V 2>&1 | awk '{print $1}')"
        printf "│ %-16s │ %-20s │ %-20s │ ${GREEN}%-8s${NC} │\n" "ssh" "$SSH_VER" "${DEPS_REQUIRED[ssh]}" "OK"
    else
        printf "│ %-16s │ %-20s │ %-20s │ ${RED}%-8s${NC} │\n" "ssh" "Missing" "${DEPS_REQUIRED[ssh]}" "MISSING"
        MISSING_DEPS=$((MISSING_DEPS + 1))
    fi

    # Terraform
    if command -v terraform &>/dev/null; then
        TF_VER="$(terraform version 2>&1 | sed -n '1p' | awk '{print $2}')"
        printf "│ %-16s │ %-20s │ %-20s │ ${GREEN}%-8s${NC} │\n" "terraform" "$TF_VER" "${DEPS_REQUIRED[terraform]}" "OK"
    else
        printf "│ %-16s │ %-20s │ %-20s │ ${RED}%-8s${NC} │\n" "terraform" "Missing" "${DEPS_REQUIRED[terraform]}" "MISSING"
        MISSING_DEPS=$((MISSING_DEPS + 1))
    fi

    # Ansible
    if command -v ansible &>/dev/null; then
        ANS_VER="$(LC_ALL=C.UTF-8 ansible --version 2>&1 | grep -E '^ansible ' | awk '{print $NF}' | tr -d '[]' || echo 'Installed')"
        [[ -z "$ANS_VER" ]] && ANS_VER="Installed"
        printf "│ %-16s │ %-20s │ %-20s │ ${GREEN}%-8s${NC} │\n" "ansible" "$ANS_VER" "${DEPS_REQUIRED[ansible]}" "OK"
    else
        printf "│ %-16s │ %-20s │ %-20s │ ${RED}%-8s${NC} │\n" "ansible" "Missing" "${DEPS_REQUIRED[ansible]}" "MISSING"
        MISSING_DEPS=$((MISSING_DEPS + 1))
    fi

    # AWS CLI
    if command -v aws &>/dev/null; then
        AWS_VER="$(aws --version 2>&1 | awk '{print $1}' | cut -d/ -f2)"
        printf "│ %-16s │ %-20s │ %-20s │ ${GREEN}%-8s${NC} │\n" "aws" "$AWS_VER" "${DEPS_REQUIRED[aws]}" "OK"
    else
        printf "│ %-16s │ %-20s │ %-20s │ ${RED}%-8s${NC} │\n" "aws" "Missing" "${DEPS_REQUIRED[aws]}" "MISSING"
        MISSING_DEPS=$((MISSING_DEPS + 1))
    fi

    # uv
    if command -v uv &>/dev/null; then
        UV_VER="$(uv --version 2>&1 | awk '{print $2}')"
        printf "│ %-16s │ %-20s │ %-20s │ ${GREEN}%-8s${NC} │\n" "uv" "$UV_VER" "${DEPS_REQUIRED[uv]}" "OK"
    else
        printf "│ %-16s │ %-20s │ %-20s │ ${AMBER}%-8s${NC} │\n" "uv" "Missing" "${DEPS_REQUIRED[uv]}" "OPTIONAL"
    fi

    # Node.js
    if command -v node &>/dev/null; then
        NODE_VER="$(node --version)"
        printf "│ %-16s │ %-20s │ %-20s │ ${GREEN}%-8s${NC} │\n" "node" "$NODE_VER" "${DEPS_REQUIRED[node]}" "OK"
    else
        printf "│ %-16s │ %-20s │ %-20s │ ${AMBER}%-8s${NC} │\n" "node" "Missing" "${DEPS_REQUIRED[node]}" "OPTIONAL"
    fi

    echo -e "${BOLD}└──────────────────┴──────────────────────┴──────────────────────┴──────────┘${NC}"
}

check_dependencies

if [[ "$CHECK_ONLY" == true ]]; then
    echo -e ""
    if [[ $MISSING_DEPS -eq 0 ]]; then
        echo -e "${GREEN}All required dependencies are satisfied.${NC}"
        exit 0
    else
        echo -e "${RED}${MISSING_DEPS} required dependency/dependencies missing.${NC}"
        exit 1
    fi
fi

# 3. Handle Missing Dependencies
if [[ $MISSING_DEPS -gt 0 ]]; then
    echo -e ""
    if [[ "$NON_INTERACTIVE" == true ]]; then
        echo -e "${RED}Error: Missing dependencies detected in non-interactive mode. Please install them before proceeding.${NC}"
        exit 1
    fi

    read -r -p "Missing dependencies were detected. Attempt to install them now? [y/N]: " INSTALL_CONFIRM
    if [[ "$INSTALL_CONFIRM" =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}Installing required packages using ${PKG_MGR}...${NC}"
        if [[ "$PKG_MGR" == "apt" ]]; then
            sudo apt-get update
            sudo apt-get install -y git python3 python3-pip python3-venv openssh-client curl unzip
            # Check if terraform needs installation
            if ! command -v terraform &>/dev/null; then
                sudo apt-get install -y wget gpg
                wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg --yes
                echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
                sudo apt-get update && sudo apt-get install -y terraform
            fi
            # Check if ansible needs installation
            if ! command -v ansible &>/dev/null; then
                sudo apt-get install -y ansible
            fi
            # Check if aws cli needs installation
            if ! command -v aws &>/dev/null; then
                sudo apt-get install -y awscli || true
            fi
        elif [[ "$PKG_MGR" == "dnf" ]]; then
            sudo dnf install -y git python3 python3-pip openssh-clients terraform ansible awscli
        else
            echo -e "${AMBER}Automated installation not configured for package manager: ${PKG_MGR}. Please install missing tools manually.${NC}"
        fi
        echo -e ""
        echo -e "${BLUE}Re-evaluating dependencies...${NC}"
        check_dependencies
    else
        echo -e "${AMBER}Skipping automatic dependency installation.${NC}"
    fi
fi

# 4. Validate AWS Credentials
echo -e ""
echo -e "${BOLD}Checking AWS Authentication...${NC}"
if command -v aws &>/dev/null; then
    if AWS_IDENTITY="$(aws sts get-caller-identity --output json 2>/dev/null)"; then
        AWS_ACCOUNT="$(echo "$AWS_IDENTITY" | grep '"Account"' | awk -F'"' '{print $4}')"
        AWS_ARN="$(echo "$AWS_IDENTITY" | grep '"Arn"' | awk -F'"' '{print $4}')"
        echo -e "${GREEN}✓ AWS Authentication Verified!${NC}"
        echo -e "  Account ID: ${AWS_ACCOUNT}"
        echo -e "  IAM Identity: ${AWS_ARN}"
    else
        echo -e "${AMBER}⚠ AWS credentials not configured or session expired.${NC}"
        if [[ "$NON_INTERACTIVE" == false ]]; then
            read -r -p "Would you like to run 'aws configure' now? [y/N]: " AWS_CONF_PROMPT
            if [[ "$AWS_CONF_PROMPT" =~ ^[Yy]$ ]]; then
                aws configure
            fi
        fi
    fi
else
    echo -e "${RED}AWS CLI not found. Please install aws-cli v2.${NC}"
fi

# 5. Local SSH Key Lifecycle
echo -e ""
echo -e "${BOLD}Checking Local SSH Key Pair...${NC}"
if [[ -f "${SSH_KEY_PATH}" ]]; then
    echo -e "${GREEN}✓ SSH private key exists at: ${SSH_KEY_PATH}${NC}"
elif [[ -f "${HOME}/.ssh/socforge_key" ]]; then
    echo -e "${GREEN}✓ Legacy SSH key found at: ${HOME}/.ssh/socforge_key${NC}"
    SSH_KEY_PATH="${HOME}/.ssh/socforge_key"
else
    echo -e "${BLUE}Generating new Ed25519 key pair for THEDAL at ${SSH_KEY_PATH}...${NC}"
    mkdir -p "${HOME}/.ssh"
    chmod 700 "${HOME}/.ssh"
    ssh-keygen -t ed25519 -f "${SSH_KEY_PATH}" -N "" -C "thedal-operator-key"
    chmod 600 "${SSH_KEY_PATH}"
    chmod 644 "${SSH_KEY_PATH}.pub"
    echo -e "${GREEN}✓ SSH Key Pair generated successfully!${NC}"
fi

# 6. Configure Control Plane Environment
echo -e ""
echo -e "${BOLD}Configuring Control Plane...${NC}"
if [[ "$NON_INTERACTIVE" == false ]]; then
    echo -e "Select Control Plane Bind Address:"
    echo -e "  1) 127.0.0.1 (Recommended — Localhost Only, Safe)"
    echo -e "  2) 0.0.0.0   (All Interfaces — ${RED}Warning: Exposes UI to local network${NC})"
    read -r -p "Enter choice [1]: " BIND_CHOICE
    if [[ "$BIND_CHOICE" == "2" ]]; then
        BIND_HOST="0.0.0.0"
        echo -e "${AMBER}Notice: Binding to 0.0.0.0 allows remote access on your network.${NC}"
    else
        BIND_HOST="127.0.0.1"
    fi
fi

# Initialize Python Virtual Environment for Control Plane
if [[ -d "${SCRIPT_DIR}/control-plane" ]]; then
    echo -e "${BLUE}Setting up Python environment for Control Plane...${NC}"
    cd "${SCRIPT_DIR}/control-plane"
    if command -v uv &>/dev/null; then
        uv venv .venv --quiet || true
        uv sync --quiet || true
    else
        python3 -m venv .venv
        .venv/bin/pip install -e . --quiet || true
    fi
    cd "${SCRIPT_DIR}"
fi

echo -e ""
echo -e "${BOLD}${GREEN}╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${GREEN}║                          THEDAL is Ready!                                 ║${NC}"
echo -e "${BOLD}${GREEN}╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
echo -e ""
echo -e "${BOLD}Control Plane Dashboard:${NC} ${CYAN}http://${BIND_HOST}:${BIND_PORT}${NC}"
echo -e ""
echo -e "${BOLD}Next Steps:${NC}"
echo -e "  1. Launch Control Plane:  ${GREEN}make control-plane${NC}"
echo -e "  2. Deploy Infrastructure: ${GREEN}make deploy${NC}"
echo -e "  3. Provision Hosts:       ${GREEN}make inventory && make provision${NC}"
echo -e "  4. Open Wazuh Dashboard:  ${GREEN}make tunnel${NC}"
echo -e ""
