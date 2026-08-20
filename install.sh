#!/usr/bin/env bash
# ==============================================================================
# THEDAL — Multi-Mode Installer & Environment Setup
# Product: Threat Hunting, Exploration, Detection, Analysis and Learn
# Modes: Native Linux / VM & Docker Container
# ==============================================================================

set -eo pipefail
export LC_ALL=C.UTF-8
export LANG=C.UTF-8

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CHECK_ONLY=false
NON_INTERACTIVE=false
SELECTED_MODE=""
BIND_HOST="0.0.0.0"
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
        --mode)
            SELECTED_MODE="$2"
            shift 2
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
            echo -e "${BOLD}THEDAL Multi-Mode Installer${NC}"
            echo -e "Usage: ./install.sh [OPTIONS]"
            echo -e ""
            echo -e "Options:"
            echo -e "  --mode native|docker Select execution mode"
            echo -e "  --check              Check dependencies without installing or configuring"
            echo -e "  --non-interactive    Run without interactive prompts"
            echo -e "  --host HOST          Control plane bind host (default: 0.0.0.0)"
            echo -e "  --port PORT          Control plane bind port (default: 8080)"
            echo -e "  -h, --help           Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown argument: $1${NC}"
            exit 1
            ;;
    esac
done

echo -e "${BOLD}${BLUE}╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${BLUE}║                     THEDAL Multi-Mode Installer                           ║${NC}"
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

echo -e "${CYAN}Platform:${NC} ${OS_NAME} ${OS_VER} (${ARCH}) • Package Manager: ${PKG_MGR}"
echo -e ""

# 2. Select Execution Mode
if [[ -z "${SELECTED_MODE}" ]]; then
    if [[ "${NON_INTERACTIVE}" == true ]]; then
        SELECTED_MODE="native"
    else
        echo -e "${BOLD}Select THEDAL Runtime Execution Mode:${NC}"
        echo -e "  ${BOLD}[1]${NC} Native Linux / VM  ${CYAN}(Recommended for full CLI + Web Control Plane)${NC}"
        echo -e "  ${BOLD}[2]${NC} Docker Container   ${CYAN}(Self-contained image, UI-first, no host tool installs)${NC}"
        read -r -p "Enter choice [1]: " MODE_CHOICE
        if [[ "${MODE_CHOICE}" == "2" ]]; then
            SELECTED_MODE="docker"
        else
            SELECTED_MODE="native"
        fi
    fi
fi

echo -e "${GREEN}✓ Selected Runtime Mode: ${BOLD}${SELECTED_MODE^^}${NC}"
echo -e ""

# Save mode selection to runtime metadata
mkdir -p "${SCRIPT_DIR}/control-plane/data"
echo "{\"mode\": \"${SELECTED_MODE}\"}" > "${SCRIPT_DIR}/control-plane/data/runtime_mode.json"

# ==============================================================================
# DOCKER INSTALLATION PATH
# ==============================================================================
if [[ "${SELECTED_MODE}" == "docker" ]]; then
    echo -e "${BOLD}${BLUE}Setting up THEDAL in Docker Mode...${NC}"

    # Verify Docker & Docker Compose
    if ! command -v docker &>/dev/null; then
        echo -e "${RED}Error: Docker is not installed. Please install Docker first (https://docs.docker.com/get-docker/).${NC}"
        exit 1
    fi

    if ! docker compose version &>/dev/null && ! command -v docker-compose &>/dev/null; then
        echo -e "${RED}Error: Docker Compose is required. Please install docker-compose-plugin.${NC}"
        exit 1
    fi

    echo -e "${GREEN}✓ Docker & Docker Compose detected.${NC}"

    # Initialize runtime persistent directories
    echo -e "${BLUE}Initializing persistent runtime directories...${NC}"
    mkdir -p "${SCRIPT_DIR}/runtime/data" \
             "${SCRIPT_DIR}/runtime/logs" \
             "${SCRIPT_DIR}/runtime/ssh" \
             "${SCRIPT_DIR}/runtime/aws"

    chmod 700 "${SCRIPT_DIR}/runtime/ssh"

    # Setup SSH Key for Docker volume
    DOCKER_SSH_KEY="${SCRIPT_DIR}/runtime/ssh/thedal_key"
    if [[ -f "${HOME}/.ssh/thedal_key" ]]; then
        echo -e "${GREEN}✓ Reusing existing SSH key from host ~/.ssh/thedal_key${NC}"
        cp "${HOME}/.ssh/thedal_key" "${DOCKER_SSH_KEY}"
        cp "${HOME}/.ssh/thedal_key.pub" "${DOCKER_SSH_KEY}.pub" 2>/dev/null || true
    elif [[ -f "${HOME}/.ssh/socforge_key" ]]; then
        echo -e "${GREEN}✓ Reusing existing SSH key from host ~/.ssh/socforge_key${NC}"
        cp "${HOME}/.ssh/socforge_key" "${DOCKER_SSH_KEY}"
        cp "${HOME}/.ssh/socforge_key.pub" "${DOCKER_SSH_KEY}.pub" 2>/dev/null || true
    elif [[ ! -f "${DOCKER_SSH_KEY}" ]]; then
        echo -e "${BLUE}Generating new Ed25519 SSH keypair in runtime/ssh/...${NC}"
        ssh-keygen -t ed25519 -f "${DOCKER_SSH_KEY}" -N "" -C "thedal-docker-operator"
    fi
    chmod 600 "${DOCKER_SSH_KEY}" 2>/dev/null || true

    # Link host AWS credentials if available
    if [[ -d "${HOME}/.aws" && ! -f "${SCRIPT_DIR}/runtime/aws/credentials" ]]; then
        echo -e "${GREEN}✓ Linking existing AWS credentials from ~/.aws${NC}"
        cp -r "${HOME}/.aws/"* "${SCRIPT_DIR}/runtime/aws/" 2>/dev/null || true
    fi

    # Build and start container
    echo -e "${BLUE}Building and launching THEDAL Control Plane container...${NC}"
    docker compose -f "${SCRIPT_DIR}/docker-compose.yml" build
    docker compose -f "${SCRIPT_DIR}/docker-compose.yml" up -d

    echo -e ""
    echo -e "${BOLD}${GREEN}╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${GREEN}║                      THEDAL is Ready in Docker Mode!                      ║${NC}"
    echo -e "${BOLD}${GREEN}╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
    echo -e ""
    echo -e "${BOLD}Control Plane Dashboard:${NC} ${CYAN}http://localhost:8080${NC}"
    echo -e ""
    echo -e "${BOLD}What you can do directly from the browser:${NC}"
    echo -e "  ✓ Configure AWS Credentials in Settings"
    echo -e "  ✓ Sync Dynamic SSH Management IP"
    echo -e "  ✓ Deploy & Start Cloud Infrastructure"
    echo -e "  ✓ Establish Wazuh SIEM SSH Tunnel (https://localhost:8443)"
    echo -e "  ✓ Run Adversary Lab Simulations (Atomic & Web Attacks)"
    echo -e "  ✓ Track Investigation Progress in SQLite"
    echo -e ""
    echo -e "Container management: ${GREEN}docker compose ps${NC} / ${GREEN}docker compose logs -f${NC}"
    exit 0
fi

# ==============================================================================
# NATIVE LINUX INSTALLATION PATH
# ==============================================================================

# Check dependencies
echo -e "${BOLD}Checking host dependencies...${NC}"
MISSING_DEPS=0
for tool in git python3 openssh-client curl unzip; do
    if ! command -v "$tool" &>/dev/null; then
        echo -e "  ❌ ${tool} : Missing"
        ((MISSING_DEPS++))
    else
        echo -e "  ✓ ${tool} : Installed"
    fi
done

if [[ $MISSING_DEPS -gt 0 && "${NON_INTERACTIVE}" == false ]]; then
    read -r -p "Missing dependencies detected. Install them now with ${PKG_MGR}? [y/N]: " INSTALL_CONFIRM
    if [[ "$INSTALL_CONFIRM" =~ ^[Yy]$ ]]; then
        if [[ "$PKG_MGR" == "apt" ]]; then
            sudo apt-get update && sudo apt-get install -y git python3 python3-pip python3-venv openssh-client curl unzip
        fi
    fi
fi

# SSH Keypair Setup
echo -e ""
echo -e "${BOLD}Checking Local SSH Keypair...${NC}"
if [[ -f "${SSH_KEY_PATH}" ]]; then
    echo -e "${GREEN}✓ SSH private key exists at: ${SSH_KEY_PATH}${NC}"
elif [[ -f "${HOME}/.ssh/socforge_key" ]]; then
    echo -e "${GREEN}✓ Legacy SSH key found at: ${HOME}/.ssh/socforge_key${NC}"
    SSH_KEY_PATH="${HOME}/.ssh/socforge_key"
else
    echo -e "${BLUE}Generating new Ed25519 keypair for THEDAL at ${SSH_KEY_PATH}...${NC}"
    mkdir -p "${HOME}/.ssh" && chmod 700 "${HOME}/.ssh"
    ssh-keygen -t ed25519 -f "${SSH_KEY_PATH}" -N "" -C "thedal-operator-key"
    chmod 600 "${SSH_KEY_PATH}"
fi

# Setup Virtualenv
if [[ -d "${SCRIPT_DIR}/control-plane" ]]; then
    echo -e "${BLUE}Setting up Python virtual environment...${NC}"
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
echo -e "${BOLD}${GREEN}║                      THEDAL is Ready in Native Mode!                      ║${NC}"
echo -e "${BOLD}${GREEN}╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
echo -e ""
echo -e "${BOLD}Control Plane Dashboard:${NC} ${CYAN}http://${BIND_HOST}:${BIND_PORT}${NC}"
echo -e ""
echo -e "${BOLD}Native Operator Next Steps:${NC}"
echo -e "  1. Launch Control Plane:  ${GREEN}make control-plane${NC}"
echo -e "  2. Sync Admin IP:         ${GREEN}make sync-ip${NC}"
echo -e "  3. Deploy Infrastructure: ${GREEN}make deploy${NC}"
echo -e "  4. Provision Hosts:       ${GREEN}make inventory && make provision${NC}"
echo -e "  5. Open Wazuh Dashboard:  ${GREEN}make tunnel${NC}"
echo -e ""
