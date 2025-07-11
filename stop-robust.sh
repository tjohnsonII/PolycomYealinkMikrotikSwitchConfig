#!/bin/bash

#################################################################################
# Stop Script - Polycom/Yealink Phone Configuration Generator
# 
# This script stops all services started by start-robust.sh
#################################################################################

echo "🛑 Stopping all services..."

# Stop all node processes related to the app
pkill -f "ssh-ws-server.js" 2>/dev/null || true
pkill -f "auth-server.js" 2>/dev/null || true
pkill -f "simple-proxy" 2>/dev/null || true

sleep 2

# Force kill if still running
pkill -9 -f "ssh-ws-server.js" 2>/dev/null || true
pkill -9 -f "auth-server.js" 2>/dev/null || true
pkill -9 -f "simple-proxy" 2>/dev/null || true

echo "✅ All services stopped"

# Check for any remaining processes
remaining=$(pgrep -f "ssh-ws-server\|auth-server\|simple-proxy" 2>/dev/null || echo "")
if [ ! -z "$remaining" ]; then
    echo "⚠️  Some processes might still be running: $remaining"
else
    echo "🏁 Clean shutdown complete"
fi
