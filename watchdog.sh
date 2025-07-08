#!/bin/bash

#################################################################################
# Watchdog Script - Independent monitoring for the phone config generator
# 
# This script runs independently and monitors the health of all services.
# It can be run via cron or systemd timer for additional redundancy.
# 
# Usage: ./watchdog.sh [--restart-on-failure]
#################################################################################

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$SCRIPT_DIR/watchdog.log"
RESTART_ON_FAILURE=${1:-"false"}
MAIN_SCRIPT="$SCRIPT_DIR/start-robust.sh"
LOCK_FILE="/tmp/phone-config-watchdog.lock"

# Service endpoints to check
declare -A ENDPOINTS=(
    ["Main App"]="http://localhost:3000/"
    ["SSH WebSocket"]="http://localhost:3001/health"
    ["Authentication"]="http://localhost:3002/health"
    ["Proxy Health"]="http://localhost:3000/proxy-health"
)

# Logging function
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "ERROR") color="\033[0;31m" ;;
        "WARN")  color="\033[0;33m" ;;
        "SUCCESS") color="\033[0;32m" ;;
        "INFO")  color="\033[0;36m" ;;
        *) color="\033[0m" ;;
    esac
    
    echo -e "${color}[$timestamp] [WATCHDOG] [$level] $message\033[0m" | tee -a "$LOG_FILE"
}

# Check if script is already running
check_lock() {
    if [ -f "$LOCK_FILE" ]; then
        local pid=$(cat "$LOCK_FILE" 2>/dev/null || echo "")
        if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
            log "INFO" "Watchdog is already running (PID: $pid)"
            exit 0
        else
            log "WARN" "Stale lock file found, removing..."
            rm -f "$LOCK_FILE"
        fi
    fi
    
    echo $$ > "$LOCK_FILE"
    trap "rm -f '$LOCK_FILE'" EXIT
}

# Check service health
check_service_health() {
    local name=$1
    local url=$2
    local timeout=10
    
    local response=$(curl -s -f -m "$timeout" "$url" 2>/dev/null || echo "FAILED")
    
    if [ "$response" = "FAILED" ]; then
        log "ERROR" "$name is DOWN - $url"
        return 1
    else
        log "SUCCESS" "$name is UP - $url"
        return 0
    fi
}

# Check if processes are running
check_processes() {
    local processes=("ssh-ws-server.js" "auth-server.js" "simple-proxy.js")
    local all_running=0
    
    for process in "${processes[@]}"; do
        if pgrep -f "$process" >/dev/null 2>&1; then
            log "SUCCESS" "Process $process is running"
        else
            log "ERROR" "Process $process is NOT running"
            all_running=1
        fi
    done
    
    return $all_running
}

# Main health check
main_health_check() {
    log "INFO" "Starting health check..."
    
    local all_healthy=0
    
    # Check processes
    if ! check_processes; then
        all_healthy=1
    fi
    
    # Check service endpoints
    for name in "${!ENDPOINTS[@]}"; do
        if ! check_service_health "$name" "${ENDPOINTS[$name]}"; then
            all_healthy=1
        fi
    done
    
    # Check disk space
    local disk_usage=$(df "$SCRIPT_DIR" | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt 90 ]; then
        log "WARN" "Disk usage is high: ${disk_usage}%"
        all_healthy=1
    else
        log "INFO" "Disk usage OK: ${disk_usage}%"
    fi
    
    # Check memory usage
    local memory_usage=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100}')
    if [ "$memory_usage" -gt 90 ]; then
        log "WARN" "Memory usage is high: ${memory_usage}%"
    else
        log "INFO" "Memory usage OK: ${memory_usage}%"
    fi
    
    return $all_healthy
}

# Restart services if needed
restart_services() {
    if [ "$RESTART_ON_FAILURE" = "--restart-on-failure" ]; then
        log "WARN" "Attempting to restart services..."
        
        # Kill existing processes
        pkill -f "ssh-ws-server.js" 2>/dev/null || true
        pkill -f "auth-server.js" 2>/dev/null || true
        pkill -f "simple-proxy.js" 2>/dev/null || true
        
        sleep 5
        
        # Start main script
        cd "$SCRIPT_DIR"
        if [ -x "$MAIN_SCRIPT" ]; then
            log "INFO" "Starting main script: $MAIN_SCRIPT"
            nohup "$MAIN_SCRIPT" --production > /dev/null 2>&1 &
            sleep 10
            
            # Check if restart was successful
            if main_health_check; then
                log "SUCCESS" "Services restarted successfully"
                return 0
            else
                log "ERROR" "Failed to restart services"
                return 1
            fi
        else
            log "ERROR" "Main script not found or not executable: $MAIN_SCRIPT"
            return 1
        fi
    else
        log "INFO" "Restart not enabled. Use --restart-on-failure to enable automatic restart"
        return 1
    fi
}

# Main execution
main() {
    check_lock
    
    log "INFO" "Watchdog started (PID: $$)"
    
    if main_health_check; then
        log "SUCCESS" "All services are healthy"
        exit 0
    else
        log "ERROR" "Some services are unhealthy"
        
        if restart_services; then
            log "SUCCESS" "Recovery successful"
            exit 0
        else
            log "ERROR" "Recovery failed"
            exit 1
        fi
    fi
}

# Run main function
main "$@"
