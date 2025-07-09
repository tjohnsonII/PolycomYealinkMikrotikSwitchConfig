#!/bin/bash

# Stop HTTPS services script
# This script safely stops all HTTPS-enabled services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Stop services function
stop_services() {
    log "🔒 Stopping HTTPS services..."
    
    # Stop using PID files if they exist
    local services=("frontend" "ssh-ws-server" "auth-server")
    
    for service in "${services[@]}"; do
        local pid_file="logs/${service}.pid"
        
        if [[ -f "$pid_file" ]]; then
            local pid=$(cat "$pid_file")
            if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
                info "Stopping $service (PID: $pid)..."
                kill -TERM "$pid" 2>/dev/null || true
                
                # Wait for graceful shutdown
                local count=0
                while kill -0 "$pid" 2>/dev/null && [[ $count -lt 10 ]]; do
                    sleep 1
                    ((count++))
                done
                
                # Force kill if still running
                if kill -0 "$pid" 2>/dev/null; then
                    warn "Force killing $service..."
                    kill -KILL "$pid" 2>/dev/null || true
                fi
                
                log "$service stopped ✓"
            else
                info "$service was not running"
            fi
            
            # Remove PID file
            rm -f "$pid_file"
        fi
    done
    
    # Also stop by port (fallback method)
    local ports=(3000 3001 3002)
    for port in "${ports[@]}"; do
        local pids=$(lsof -ti:$port 2>/dev/null || true)
        if [[ -n "$pids" ]]; then
            warn "Found additional processes on port $port"
            for pid in $pids; do
                info "Stopping process $pid on port $port..."
                kill -TERM "$pid" 2>/dev/null || true
                sleep 2
                if kill -0 "$pid" 2>/dev/null; then
                    kill -KILL "$pid" 2>/dev/null || true
                fi
            done
        fi
    done
}

# Clean up function
cleanup_files() {
    log "Cleaning up temporary files..."
    
    # Remove any temporary VPN files
    if [[ -f "backend/temp_vpn_config.ovpn" ]]; then
        rm -f "backend/temp_vpn_config.ovpn"
        info "Removed temporary VPN config"
    fi
    
    if [[ -f "backend/temp_vpn_auth.txt" ]]; then
        rm -f "backend/temp_vpn_auth.txt"
        info "Removed temporary VPN auth file"
    fi
    
    # Clean up any lock files
    find . -name "*.lock" -type f -delete 2>/dev/null || true
}

# Verify all services stopped
verify_stopped() {
    log "Verifying all services are stopped..."
    
    local ports=(3000 3001 3002)
    local still_running=()
    
    for port in "${ports[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            still_running+=($port)
        fi
    done
    
    if [ ${#still_running[@]} -eq 0 ]; then
        log "All services stopped successfully ✓"
    else
        warn "Some services may still be running on ports: ${still_running[*]}"
        warn "You may need to manually stop them"
    fi
}

# Display final status
show_final_status() {
    echo ""
    log "🔒 HTTPS services shutdown complete"
    echo ""
    echo -e "${GREEN}┌─────────────────────────────────────────────────────────────┐${NC}"
    echo -e "${GREEN}│                    🔒 SHUTDOWN COMPLETE                     │${NC}"
    echo -e "${GREEN}├─────────────────────────────────────────────────────────────┤${NC}"
    echo -e "${GREEN}│ All HTTPS services have been stopped                       │${NC}"
    echo -e "${GREEN}│ SSL certificates preserved                                  │${NC}"
    echo -e "${GREEN}│ Logs preserved in ./logs/                                  │${NC}"
    echo -e "${GREEN}│                                                             │${NC}"
    echo -e "${GREEN}│ To restart: ./start-https.sh                               │${NC}"
    echo -e "${GREEN}└─────────────────────────────────────────────────────────────┘${NC}"
    echo ""
}

# Main execution
main() {
    info "🔒 Stopping HTTPS-enabled services..."
    
    stop_services
    cleanup_files
    verify_stopped
    show_final_status
}

# Run main function
main "$@"
