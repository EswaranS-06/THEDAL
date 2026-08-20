#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# THEDAL Control Plane — End-to-End Local Launcher
# Launches both FastAPI Backend (Port 8080) and Next.js Frontend (Port 3000)
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

BACKEND_DIR="${PROJECT_ROOT}/control-plane"
FRONTEND_DIR="${PROJECT_ROOT}/control-plane/frontend"

BACKEND_PORT="8080"
FRONTEND_PORT="3000"
BACKEND_HOST="0.0.0.0"
FRONTEND_HOST="0.0.0.0"

echo "======================================================================"
echo "  THEDAL — Control Plane End-to-End Environment Starter"
echo "======================================================================"

# Find Python / uv runner
UV_BIN=""
if command -v /home/rex/.local/bin/uv &> /dev/null; then
    UV_BIN="/home/rex/.local/bin/uv"
elif command -v uv &> /dev/null; then
    UV_BIN="uv"
fi

if [ -z "${UV_BIN}" ]; then
    echo "[-] Error: 'uv' binary not found. Please ensure uv is installed."
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "[-] Error: 'node' binary not found. Please ensure Node.js is installed."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "[-] Error: 'npm' binary not found. Please ensure npm is installed."
    exit 1
fi

# Cleanup handler on exit
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
    echo ""
    echo "[*] Shutting down THEDAL Control Plane services..."
    if [ -n "${FRONTEND_PID}" ] && kill -0 "${FRONTEND_PID}" 2>/dev/null; then
        echo "[*] Stopping Next.js Frontend (PID: ${FRONTEND_PID})..."
        kill -TERM "${FRONTEND_PID}" 2>/dev/null || true
    fi
    if [ -n "${BACKEND_PID}" ] && kill -0 "${BACKEND_PID}" 2>/dev/null; then
        echo "[*] Stopping FastAPI Backend (PID: ${BACKEND_PID})..."
        kill -TERM "${BACKEND_PID}" 2>/dev/null || true
    fi
    echo "[+] All services terminated cleanly."
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# 1. Start FastAPI Backend
echo "[*] Starting FastAPI Backend on http://${BACKEND_HOST}:${BACKEND_PORT}..."
(
    cd "${BACKEND_DIR}"
    exec "${UV_BIN}" run uvicorn app.main:app --host "${BACKEND_HOST}" --port "${BACKEND_PORT}" --log-level info
) &
BACKEND_PID=$!

# Wait for backend readiness
echo "[*] Waiting for backend API to be ready..."
MAX_RETRIES=30
RETRY_COUNT=0
BACKEND_READY=0

while [ ${RETRY_COUNT} -lt ${MAX_RETRIES} ]; do
    if curl -s "http://${BACKEND_HOST}:${BACKEND_PORT}/api/status" > /dev/null 2>&1; then
        BACKEND_READY=1
        break
    fi
    sleep 0.5
    RETRY_COUNT=$((RETRY_COUNT + 1))
done

if [ ${BACKEND_READY} -eq 1 ]; then
    echo "[+] FastAPI Backend is live at http://${BACKEND_HOST}:${BACKEND_PORT}"
else
    echo "[-] Warning: Backend did not respond within 15 seconds. Proceeding anyway..."
fi

# 2. Start Next.js Frontend
echo "[*] Starting Next.js Frontend on http://${FRONTEND_HOST}:${FRONTEND_PORT}..."
(
    cd "${FRONTEND_DIR}"
    exec npm run dev -- -H "${FRONTEND_HOST}"
) &
FRONTEND_PID=$!

echo ""
echo "======================================================================"
echo "  THEDAL Control Plane is running!"
echo "  - Web UI:      http://${FRONTEND_HOST}:${FRONTEND_PORT}"
echo "  - REST API:    http://${BACKEND_HOST}:${BACKEND_PORT}/api/docs"
echo "  Press Ctrl+C to stop all services."
echo "======================================================================"
echo ""

# Wait for both processes
wait
