#!/bin/bash

#################################################################################
# Quick Management Console Launcher
# 
# This script quickly starts just the essential services and management console,
# allowing you to control everything else from the web interface.
#################################################################################

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎛️  Starting Management Console System...${NC}"

# Parse arguments
ALLOW_LAN=""
if [[ "$*" == *"--allow-lan"* ]]; then
    ALLOW_LAN="--allow-lan"
    echo -e "${BLUE}🌐 LAN access enabled${NC}"
fi

# Get project directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

# Stop any existing services
echo -e "${BLUE}🛑 Stopping existing services...${NC}"
pkill -f "ssh-ws-server.js" 2>/dev/null || true
pkill -f "auth-server.js" 2>/dev/null || true
pkill -f "management-server.js" 2>/dev/null || true
pkill -f "simple-proxy" 2>/dev/null || true
sleep 2

# Start essential backend services
echo -e "${BLUE}🚀 Starting backend services...${NC}"
nohup node backend/ssh-ws-server.js > backend/ssh-ws-server.log 2>&1 &
sleep 1
nohup node backend/auth-server.js > backend/auth-server.log 2>&1 &
sleep 1

# Start management console
echo -e "${BLUE}🎛️  Starting management console...${NC}"
nohup node backend/management-server.js $ALLOW_LAN > backend/management-server.log 2>&1 &
sleep 2

# Get server IP for LAN access
SERVER_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "YOUR_SERVER_IP")

# Show access information
echo -e "${GREEN}✅ Management Console Started!${NC}"
echo ""
echo "🌐 Access URLs:"
echo "  Local: http://localhost:3099"
if [[ "$ALLOW_LAN" == "--allow-lan" ]]; then
    echo "  LAN:   http://$SERVER_IP:3099"
fi
echo ""
echo "📋 Features Available:"
echo "  • Service monitoring and control"
echo "  • Web application management (start/stop/build)"
echo "  • VPN management with SAML/2FA support"
echo "  • System diagnostics and troubleshooting"
echo "  • Real-time logs and file management"
echo ""
echo "🎯 Next Steps:"
echo "  1. Open the management console in your browser"
echo "  2. Go to Services → Web Application → Start"
echo "  3. Monitor and control all services from the web interface"
echo ""
echo "🛑 To stop all services: ./stop-robust.sh"
