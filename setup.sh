#!/bin/bash
# ══════════════════════════════════════════════════════════════════════════════
# RapidCare — One-Command Setup & Launch (Mac / Linux)
#
# Usage:
#   chmod +x setup.sh   (first time only)
#   ./setup.sh
# ══════════════════════════════════════════════════════════════════════════════

set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

echo ""
echo "══════════════════════════════════════════════"
echo "        RAPIDCARE SYSTEM INITIALIZER"
echo "══════════════════════════════════════════════"
echo ""

# 1. Check for Node.js
if ! command -v node &> /dev/null; then
    echo "[!] Node.js is not installed."
    echo "    Install it from https://nodejs.org/ or use nvm:"
    echo "    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash"
    exit 1
fi

echo "[1/3] Node.js $(node -v) detected ✔"

# 2. Kill any existing process on port 5000
echo "[2/3] Checking port 5000..."
PID=""
if command -v lsof &> /dev/null; then
    PID=$(lsof -i :5000 -t)
elif command -v fuser &> /dev/null; then
    PID=$(fuser 5000/tcp 2>/dev/null | awk '{print $NF}')
elif command -v ss &> /dev/null; then
    PID=$(ss -lptn 'sport = :5000' 2>/dev/null | grep -oP 'pid=\K[0-9]+' | head -n 1)
fi

if [ -n "$PID" ]; then
    echo "       Port 5000 is in use by PID $PID. Killing existing process..."
    kill -9 $PID 2>/dev/null || true
fi

# 3. Run the automatic setup script
echo "[3/3] Running environment setup..."
cd Backend
node scripts/setup.js

# 4. Start the server
echo ""
echo "Starting RapidCare Backend..."
node server.js &
SERVER_PID=$!

# Graceful cleanup trap
cleanup() {
    echo ""
    echo "Shutting down RapidCare Backend..."
    if [ -n "$SERVER_PID" ]; then
        kill "$SERVER_PID" 2>/dev/null || true
    fi
}
trap cleanup EXIT INT TERM

# Wait for server to be ready
sleep 2

# Open browser
if command -v open &> /dev/null; then
    open "http://localhost:5000"
elif command -v xdg-open &> /dev/null; then
    xdg-open "http://localhost:5000"
fi

echo ""
echo "══════════════════════════════════════════════"
echo "  Unified backend running on http://localhost:5000"
echo "  Dev Dashboard: http://localhost:5000/dev"
echo "  Auth API:      http://localhost:5000/api/v1/auth"
echo ""
echo "  Press Ctrl+C to stop the server."
echo "══════════════════════════════════════════════"
echo ""

# Keep script running so Ctrl+C can stop the server
wait $SERVER_PID
