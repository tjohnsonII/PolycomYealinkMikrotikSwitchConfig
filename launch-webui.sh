#!/bin/bash

#################################################################################
# Web Management Console Launcher
# 
# This script provides a quick way to launch and access the web-based management
# console for the Phone Configuration Generator.
# 
# The web console provides:
# - Real-time service monitoring
# - Interactive troubleshooting tools
# - Log viewing and analysis
# - Service management (start/stop/restart)
# - File system overview
# - Health checks and diagnostics
# - SSL certificate management
# - Network monitoring
# 
# Usage:
#   ./launch-webui.sh                 # Launch console and open browser
#   ./launch-webui.sh --no-open       # Launch console only (no browser)
#   ./launch-webui.sh --status        # Check if console is running
#   ./launch-webui.sh --stop          # Stop the console
#   ./launch-webui.sh --allow-lan     # Allow LAN access
#   ./launch-webui.sh --allow-lan --no-open  # Allow LAN access without browser
#################################################################################

set -e

# Configuration
WEBUI_PORT=3099
WEBUI_URL="http://localhost:$WEBUI_PORT"
WEBUI_SCRIPT="backend/management-server.js"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ALLOW_LAN=false

# Parse arguments
for arg in "$@"; do
    case $arg in
        --allow-lan)
            ALLOW_LAN=true
            ;;
    esac
done

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "ERROR") echo -e "${RED}[$timestamp] ERROR: $message${NC}" ;;
        "SUCCESS") echo -e "${GREEN}[$timestamp] SUCCESS: $message${NC}" ;;
        "WARN") echo -e "${YELLOW}[$timestamp] WARN: $message${NC}" ;;
        "INFO") echo -e "${BLUE}[$timestamp] INFO: $message${NC}" ;;
    esac
}

# Check if web console is running
check_webui_status() {
    local pid=$(pgrep -f "management-server.js" 2>/dev/null || echo "")
    if [[ -n "$pid" ]]; then
        log "SUCCESS" "Web Management Console is running (PID: $pid)"
        if curl -s "$WEBUI_URL/api/dashboard" > /dev/null 2>&1; then
            log "SUCCESS" "Web console is responding at $WEBUI_URL"
            return 0
        else
            log "WARN" "Web console process running but not responding"
            return 1
        fi
    else
        log "INFO" "Web Management Console is not running"
        return 1
    fi
}

# Start the web console
start_webui() {
    log "INFO" "Starting Web Management Console..."
    
    cd "$PROJECT_DIR"
    
    # Check if already running
    if check_webui_status > /dev/null 2>&1; then
        log "INFO" "Web Management Console is already running"
        return 0
    fi
    
    # Check if required dependencies are installed
    if ! command -v node &> /dev/null; then
        log "ERROR" "Node.js is not installed"
        exit 1
    fi
    
    if ! npm list socket.io > /dev/null 2>&1; then
        log "INFO" "Installing required dependencies..."
        npm install socket.io express
    fi
    
    # Start the server
    log "INFO" "Launching management server on port $WEBUI_PORT..."
    
    if [ "$ALLOW_LAN" = true ]; then
        log "INFO" "Enabling LAN access for web console..."
        WEBUI_ALLOW_LAN=true nohup node "$WEBUI_SCRIPT" --allow-lan > webui.log 2>&1 &
    else
        nohup node "$WEBUI_SCRIPT" > webui.log 2>&1 &
    fi
    
    # Wait for startup
    for i in {1..10}; do
        sleep 1
        if check_webui_status > /dev/null 2>&1; then
            log "SUCCESS" "Web Management Console started successfully"
            return 0
        fi
    done
    
    log "ERROR" "Failed to start Web Management Console"
    return 1
}

# Stop the web console
stop_webui() {
    log "INFO" "Stopping Web Management Console..."
    
    local pid=$(pgrep -f "management-server.js" 2>/dev/null || echo "")
    if [[ -n "$pid" ]]; then
        kill -TERM "$pid" 2>/dev/null || kill -9 "$pid" 2>/dev/null || true
        log "SUCCESS" "Web Management Console stopped"
    else
        log "INFO" "Web Management Console was not running"
    fi
}

# Open browser to web console
open_browser() {
    local url="$1"
    
    if command -v xdg-open &> /dev/null; then
        xdg-open "$url" 2>/dev/null &
    elif command -v open &> /dev/null; then
        open "$url" 2>/dev/null &
    else
        log "INFO" "Please open your browser and navigate to: $url"
    fi
}

# Show help
show_help() {
    echo "Web Management Console Launcher"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  (no args)     Launch console and open browser (localhost only)"
    echo "  --no-open     Launch console only (no browser)"
    echo "  --allow-lan   Allow access from LAN/private networks"
    echo "  --status      Check if console is running"
    echo "  --stop        Stop the console"
    echo "  --help        Show this help"
    echo ""
    echo "Examples:"
    echo "  $0                    # Start with localhost access only"
    echo "  $0 --allow-lan        # Start with LAN access enabled"
    echo "  $0 --allow-lan --no-open  # Start with LAN access, no browser"
    echo ""
    echo "Security:"
    echo "  Localhost only: Access restricted to 127.0.0.1"
    echo "  LAN access: Access allowed from private IP ranges only"
    echo "  (10.x.x.x, 172.16-31.x.x, 192.168.x.x)"
}

# Main logic
case "${1:-}" in
    "--status")
        check_webui_status
        ;;
    "--stop")
        stop_webui
        ;;
    "--no-open")
        start_webui
        ;;
    "--help")
        show_help
        ;;
    "")
        # Default: Start and open browser
        if start_webui; then
            log "INFO" "Opening web console in browser..."
            open_browser "$WEBUI_URL"
            
            echo ""
            echo "🖥️ Web Management Console is now running!"
            echo "   📍 Localhost URL: $WEBUI_URL"
            
            if [ "$ALLOW_LAN" = true ]; then
                local_ip=$(hostname -I | awk '{print $1}')
                echo "   🌐 LAN Access: Enabled"
                echo "   🌐 LAN URL: http://$local_ip:$WEBUI_PORT"
                echo "   🔒 Security: Private network access only"
            else
                echo "   🔒 Security: Localhost access only"
            fi
            
            echo "   📊 Features: Service monitoring, troubleshooting, logs"
            echo ""
            echo "Press Ctrl+C to stop the console, or run: $0 --stop"
            echo ""
            
            # Keep script running to maintain console
            trap 'stop_webui; exit 0' INT TERM
            while true; do
                sleep 5
                if ! check_webui_status > /dev/null 2>&1; then
                    log "ERROR" "Web console stopped unexpectedly"
                    break
                fi
            done
        fi
        ;;
    *)
        log "ERROR" "Unknown option: $1"
        show_help
        exit 1
        ;;
esac
