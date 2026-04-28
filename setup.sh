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
if lsof -i :5000 -t &> /dev/null; then
    echo "       Port 5000 is in use. Killing existing process..."
    kill -9 $(lsof -i :5000 -t) 2>/dev/null || true
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
