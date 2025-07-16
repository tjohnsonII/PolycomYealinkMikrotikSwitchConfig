#!/bin/bash

#################################################################################
# Phone Configuration Generator - Management Console Startup
#
# This script starts ONLY the web management console on port 3099.
# All other services (main app, SSH backend, auth server) are controlled
# through the web management interface.
#
# Usage: ./start.sh
#################################################################################

set -e

# Configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MANAGEMENT_PORT=3099

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if setup has been run
if [ ! -f "dist/index.html" ]; then
    print_error "Setup required!"
    echo "Please run: ./setup.sh"
    exit 1
fi

# Check if management console is already running
if lsof -Pi :$MANAGEMENT_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_warning "Management console is already running on port $MANAGEMENT_PORT"
    echo ""
    echo "📱 Access the management console at: http://localhost:$MANAGEMENT_PORT"
    echo "🔄 From there you can start/stop the web application and all services"
    echo ""
    exit 0
fi

# Start management console
print_status "Starting Web Management Console..."
cd "$PROJECT_DIR"

# Create logs directory
mkdir -p logs

echo ""
echo -e "${GREEN}Starting Phone Configuration Generator Management Console...${NC}"
echo ""
echo "Project directory: $PROJECT_DIR"
echo "Management console: http://localhost:$MANAGEMENT_PORT"
echo ""
echo -e "${BLUE}Use the web interface to start and manage the main application.${NC}"
echo ""
echo "The management console provides:"
echo "  • Application start/stop controls"
echo "  • Service monitoring and health checks"
echo "  • Log viewing and troubleshooting"
echo "  • System diagnostics and maintenance"
echo ""

# Start management server
print_status "Launching management server..."
exec node backend/management-server.js
print_status "Use Ctrl+C to stop, or visit the web interface to manage services"

# Wait for Ctrl+C
trap 'print_status "Stopping management console..."; kill $MANAGEMENT_PID 2>/dev/null; exit 0' INT TERM

wait $MANAGEMENT_PID
