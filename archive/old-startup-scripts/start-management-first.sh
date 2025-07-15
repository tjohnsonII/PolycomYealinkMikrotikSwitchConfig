#!/bin/bash

#################################################################################
# Management-First Startup Script - Polycom/Yealink Phone Configuration Generator
# 
# This script starts the web management console first, then allows you to control
# the web application and other services through the management interface.
# 
# Startup Flow:
# 1. Start essential backend services (SSH-WS, Auth)
# 2. Start Web Management Console (port 3099)
# 3. Use management console to start/stop web app as needed
# 
# Features:
# - Web Management Console as primary control interface
# - Manual web app control via management UI
# - Real-time service monitoring
# - Process health checks
# - VPN management integration
# - LAN access support
# 
# Usage: 
#   ./start-management-first.sh                # Start management console only
#   ./start-management-first.sh --allow-lan    # Enable LAN access to management
#   ./start-management-first.sh --verbose      # Verbose output
#################################################################################

set -e  # Exit on any error

# Parse command line arguments
ALLOW_LAN="false"
VERBOSE="false"

for arg in "$@"; do
    case $arg in
        --allow-lan)
            ALLOW_LAN="true"
            ;;
        --verbose)
            VERBOSE="true"
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --allow-lan    Enable LAN access to management console"
            echo "  --verbose      Enable verbose output"
            echo "  --help         Show this help message"
            echo ""
            echo "After starting, access the management console at:"
            echo "  http://localhost:3099"
            if [ "$ALLOW_LAN" = "true" ]; then
                echo "  http://YOUR_SERVER_IP:3099 (from LAN)"
            fi
            echo ""
            echo "Use the management console to start/stop the web application."
            exit 0
            ;;
        *)
            echo "Unknown option: $arg"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "ERROR") echo -e "${RED}[${timestamp}] ❌ $message${NC}" ;;
        "SUCCESS") echo -e "${GREEN}[${timestamp}] ✅ $message${NC}" ;;
        "WARN") echo -e "${YELLOW}[${timestamp}] ⚠️  $message${NC}" ;;
        "INFO") echo -e "${BLUE}[${timestamp}] ℹ️  $message${NC}" ;;
        "DEBUG") 
            if [ "$VERBOSE" = "true" ]; then
                echo -e "${PURPLE}[${timestamp}] 🔍 $message${NC}"
            fi
            ;;
        "STEP") echo -e "${CYAN}[${timestamp}] 🔧 $message${NC}" ;;
    esac
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    log "ERROR" "Do not run this script as root/sudo"
    exit 1
fi

# Get project directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
log "INFO" "Project directory: $PROJECT_DIR"

# Change to project directory
cd "$PROJECT_DIR"

# Check if required files exist
REQUIRED_FILES=(
    "backend/ssh-ws-server.js"
    "backend/auth-server.js"
    "backend/management-server.js"
    "package.json"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        log "ERROR" "Required file not found: $file"
        exit 1
    fi
done

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    log "ERROR" "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm dependencies are installed
if [ ! -d "node_modules" ]; then
    log "WARN" "Node modules not found. Installing dependencies..."
    npm install
fi

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -i :$port > /dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to start a service
start_service() {
    local service_name=$1
    local script_path=$2
    local port=$3
    local log_file=$4
    local additional_args=${5:-}
    
    log "STEP" "Starting $service_name..."
    
    # Check if port is already in use
    if check_port $port; then
        log "WARN" "$service_name port $port is already in use"
        
        # Ask if we should kill the existing process
        read -p "Kill existing process on port $port? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log "INFO" "Killing existing process on port $port"
            pkill -f "$script_path" || true
            sleep 2
        else
            log "ERROR" "Cannot start $service_name - port $port is in use"
            return 1
        fi
    fi
    
    # Start the service
    log "DEBUG" "Command: nohup node $script_path $additional_args > $log_file 2>&1 &"
    nohup node "$script_path" $additional_args > "$log_file" 2>&1 &
    local pid=$!
    
    # Wait a moment for the service to start
    sleep 2
    
    # Check if the service is running
    if kill -0 $pid 2>/dev/null; then
        log "SUCCESS" "$service_name started successfully (PID: $pid)"
        return 0
    else
        log "ERROR" "$service_name failed to start"
        log "INFO" "Check log file: $log_file"
        return 1
    fi
}

# Function to test service health
test_service_health() {
    local service_name=$1
    local health_url=$2
    local max_attempts=5
    local attempt=1
    
    log "STEP" "Testing $service_name health..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$health_url" > /dev/null 2>&1; then
            log "SUCCESS" "$service_name is healthy"
            return 0
        else
            log "WARN" "$service_name health check failed (attempt $attempt/$max_attempts)"
            sleep 2
            ((attempt++))
        fi
    done
    
    log "ERROR" "$service_name health check failed after $max_attempts attempts"
    return 1
}

# Main startup sequence
log "INFO" "🚀 Starting Management-First System..."
log "INFO" "======================================"

# Step 1: Start SSH WebSocket Server
log "STEP" "1. Starting SSH WebSocket Server..."
if start_service "SSH WebSocket Server" "backend/ssh-ws-server.js" 3001 "backend/ssh-ws-server.log"; then
    test_service_health "SSH WebSocket Server" "http://localhost:3001/health"
else
    log "ERROR" "Failed to start SSH WebSocket Server"
    exit 1
fi

# Step 2: Start Authentication Server
log "STEP" "2. Starting Authentication Server..."
if start_service "Authentication Server" "backend/auth-server.js" 3002 "backend/auth-server.log"; then
    test_service_health "Authentication Server" "http://localhost:3002/health"
else
    log "ERROR" "Failed to start Authentication Server"
    exit 1
fi

# Step 3: Start Web Management Console
log "STEP" "3. Starting Web Management Console..."
MGMT_ARGS=""
if [ "$ALLOW_LAN" = "true" ]; then
    MGMT_ARGS="--allow-lan"
    log "INFO" "LAN access enabled for management console"
fi

if start_service "Web Management Console" "backend/management-server.js" 3099 "backend/management-server.log" "$MGMT_ARGS"; then
    test_service_health "Web Management Console" "http://localhost:3099/api/dashboard"
else
    log "ERROR" "Failed to start Web Management Console"
    exit 1
fi

# Show startup summary
log "SUCCESS" "🎉 Management Console System Started!"
log "INFO" "======================================"
log "INFO" "Services Status:"
log "INFO" "  ✅ SSH WebSocket Server: http://localhost:3001"
log "INFO" "  ✅ Authentication Server: http://localhost:3002"
log "INFO" "  ✅ Web Management Console: http://localhost:3099"
log "INFO" ""
log "INFO" "🎛️  Management Console Access:"
log "INFO" "  Local: http://localhost:3099"
if [ "$ALLOW_LAN" = "true" ]; then
    # Try to detect the server IP
    SERVER_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "YOUR_SERVER_IP")
    log "INFO" "  LAN: http://$SERVER_IP:3099"
fi
log "INFO" ""
log "INFO" "🌐 Web Application Control:"
log "INFO" "  Use the management console to start/stop the web application"
log "INFO" "  Navigate to: Services → Web Application → Start"
log "INFO" ""
log "INFO" "📋 Available Features:"
log "INFO" "  • Real-time service monitoring"
log "INFO" "  • Web application control (start/stop/restart)"
log "INFO" "  • VPN management and SAML authentication"
log "INFO" "  • System logs and troubleshooting"
log "INFO" "  • File management and configuration"
log "INFO" ""
log "INFO" "🛑 To stop all services: ./stop-robust.sh"
log "INFO" "📖 For help: ./start-management-first.sh --help"

# Keep the script running to monitor services
log "INFO" "Press Ctrl+C to stop monitoring (services will continue running)"
log "INFO" "Monitoring services..."

# Simple monitoring loop
while true; do
    sleep 30
    
    # Check service health
    if ! curl -s -f "http://localhost:3001/health" > /dev/null 2>&1; then
        log "ERROR" "SSH WebSocket Server health check failed"
    fi
    
    if ! curl -s -f "http://localhost:3002/health" > /dev/null 2>&1; then
        log "ERROR" "Authentication Server health check failed"
    fi
    
    if ! curl -s -f "http://localhost:3099/api/dashboard" > /dev/null 2>&1; then
        log "ERROR" "Web Management Console health check failed"
    fi
done
