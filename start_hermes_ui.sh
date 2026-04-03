#!/bin/bash
# NVM setup for environment compatibility
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

NODE_PATH=$(which node)
NPM_PATH=$(which npm)
HERMES_PATH="/home/xibalba/.local/bin/hermes"

echo "Starting Hermes Messaging Gateway (Background)..."
nohup $HERMES_PATH gateway > gateway.log 2>&1 &
GATEWAY_PID=$!

echo "Starting Hermes Backend API (Port 3008)..."
nohup $NODE_PATH server.js > server.log 2>&1 &
BACKEND_PID=$!

echo "Starting Hermes Frontend UI (Port 3006)..."
nohup $NPM_PATH run dev > vite.log 2>&1 &
FRONTEND_PID=$!

echo "Hermes System is running."
echo "UI: http://localhost:3006"
echo "API: http://localhost:3008"

# Write PIDs for manual management
echo $GATEWAY_PID > gateway.pid
echo $BACKEND_PID > backend.pid
echo $FRONTEND_PID > frontend.pid

# Don't wait, allow the script to exit while processes run
disown -a
echo "Processes disowned. System active."
