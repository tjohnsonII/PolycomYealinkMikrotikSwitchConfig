#!/bin/bash

# Simple Web Management Startup Script
# This script starts ONLY the web management console
# Everything else is controlled through the web interface

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MANAGEMENT_PORT=3099
WEBAPP_PORTS=(3000 3001 3002 8443)

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if management console is already running
if lsof -Pi :$MANAGEMENT_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_warning "Management console is already running on port $MANAGEMENT_PORT"
    echo ""
    echo "📱 Access the management console at: http://localhost:$MANAGEMENT_PORT"
    echo "🔄 From there you can start/stop the web application and all services"
    echo ""
    exit 0
fi

# Clean up webapp ports (not management port)
print_status "Cleaning up webapp ports for fresh start..."
for port in "${WEBAPP_PORTS[@]}"; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        pid=$(lsof -Pi :$port -sTCP:LISTEN -t | head -1)
        print_warning "Killing process $pid on port $port"
        kill -TERM $pid 2>/dev/null || kill -KILL $pid 2>/dev/null || true
        sleep 1
    fi
done

# Start management console
print_status "Starting Web Management Console..."
cd "$PROJECT_DIR"

# Create logs directory
mkdir -p logs

# Start the management server
export WEBUI_ALLOW_LAN=true
nohup node backend/management-server.js > logs/management.log 2>&1 &
MANAGEMENT_PID=$!

# Wait for management console to start
print_status "Waiting for management console to start..."
sleep 3

# Verify it's running
if ! lsof -Pi :$MANAGEMENT_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_error "Management console failed to start"
    echo "Log output:"
    cat logs/management.log
    exit 1
fi

# Success message
echo ""
echo -e "${GREEN}🎉 Web Management Console Started Successfully!${NC}"
echo ""
echo "📱 Management Console: http://localhost:$MANAGEMENT_PORT"
echo "🌐 LAN Access: http://$(hostname -I | awk '{print $1}'):$MANAGEMENT_PORT"
echo ""
echo "🔄 From the web interface you can:"
echo "   • Start/stop the web application"
echo "   • Monitor all services"
echo "   • View logs and diagnostics"
echo "   • Manage individual components"
echo ""
echo "💡 The management console has automatically cleaned up any"
echo "   conflicting ports and is ready to manage your services!"
echo ""

# Save PID for cleanup
echo $MANAGEMENT_PID > logs/management.pid

# Open browser automatically
if command -v xdg-open > /dev/null 2>&1; then
    xdg-open "http://localhost:$MANAGEMENT_PORT" 2>/dev/null || true
fi

print_status "Management console is running (PID: $MANAGEMENT_PID)"
print_status "Use Ctrl+C to stop, or visit the web interface to manage services"

# Wait for Ctrl+C
trap 'print_status "Stopping management console..."; kill $MANAGEMENT_PID 2>/dev/null; exit 0' INT TERM

wait $MANAGEMENT_PID
