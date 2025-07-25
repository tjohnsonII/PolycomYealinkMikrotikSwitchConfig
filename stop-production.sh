#!/bin/bash

#################################################################################
# Production Stop Script for Phone Config Generator
# 
# This script safely stops all production services with proper cleanup
# and optional backup creation.
#################################################################################

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$SCRIPT_DIR"
LOG_DIR="$APP_ROOT/logs"
PID_DIR="$APP_ROOT/pids"
LOCK_FILE="$PID_DIR/production.lock"
BACKUP_ON_STOP=false
FORCE_STOP=false
USE_SYSTEMD=false
VERBOSE=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
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
        "DEBUG") [ "$VERBOSE" = true ] && echo -e "${BLUE}[${timestamp}] 🔍 $message${NC}" ;;
    esac
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --systemd)
            USE_SYSTEMD=true
            shift
            ;;
        --backup)
            BACKUP_ON_STOP=true
            shift
            ;;
        --force)
            FORCE_STOP=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --help)
            echo "Production Stop Script for Phone Config Generator"
            echo ""
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --systemd         Stop systemd services"
            echo "  --backup          Create backup before stopping"
            echo "  --force           Force stop (kill processes)"
            echo "  --verbose         Enable verbose logging"
            echo "  --help            Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                    # Stop services gracefully"
            echo "  $0 --systemd          # Stop systemd services"
            echo "  $0 --force            # Force stop all processes"
            echo "  $0 --backup           # Create backup before stopping"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Check if services are running
check_running() {
    if [ "$USE_SYSTEMD" = true ]; then
        # Check systemd services
        if ! systemctl --user is-active --quiet phone-config-generator.target 2>/dev/null; then
            log "INFO" "SystemD services are not running"
            return 1
        fi
    else
        # Check lock file
        if [ ! -f "$LOCK_FILE" ]; then
            log "INFO" "No lock file found, services may not be running"
            return 1
        fi
    fi
    return 0
}

# Create backup
create_backup() {
    if [ "$BACKUP_ON_STOP" = true ]; then
        log "INFO" "Creating backup before stopping..."
        
        local backup_dir="$APP_ROOT/backups"
        mkdir -p "$backup_dir"
        
        local backup_file="$backup_dir/production-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
        
        tar -czf "$backup_file" \
            --exclude="node_modules" \
            --exclude="dist" \
            --exclude="*.log" \
            --exclude="*.pid" \
            --exclude="backups" \
            "$APP_ROOT"
        
        log "SUCCESS" "Backup created: $backup_file"
    fi
}

# Stop systemd services
stop_systemd() {
    log "INFO" "Stopping systemd services..."
    
    # Stop services
    systemctl --user stop phone-config-generator.target 2>/dev/null || true
    systemctl --user stop phone-config-health-check.timer 2>/dev/null || true
    
    # Wait for services to stop
    local max_wait=30
    local wait_time=0
    
    while [ $wait_time -lt $max_wait ]; do
        if ! systemctl --user is-active --quiet phone-config-generator.target 2>/dev/null; then
            log "SUCCESS" "SystemD services stopped"
            return 0
        fi
        sleep 1
        wait_time=$((wait_time + 1))
    done
    
    log "WARN" "SystemD services did not stop within ${max_wait} seconds"
    
    if [ "$FORCE_STOP" = true ]; then
        log "INFO" "Force stopping systemd services..."
        systemctl --user kill phone-config-generator.target 2>/dev/null || true
        log "SUCCESS" "SystemD services force stopped"
    fi
}

# Stop direct processes
stop_direct() {
    log "INFO" "Stopping direct processes..."
    
    local services=("proxy" "webapp" "management" "auth" "ssh-ws")
    local stopped_services=()
    
    # Stop services in reverse order
    for service in "${services[@]}"; do
        local pid_file="$PID_DIR/$service.pid"
        
        if [ -f "$pid_file" ]; then
            local pid=$(cat "$pid_file")
            
            if ps -p "$pid" > /dev/null 2>&1; then
                log "INFO" "Stopping $service (PID: $pid)..."
                
                # Try graceful shutdown first
                kill -TERM "$pid" 2>/dev/null || true
                
                # Wait for process to stop
                local max_wait=15
                local wait_time=0
                
                while [ $wait_time -lt $max_wait ]; do
                    if ! ps -p "$pid" > /dev/null 2>&1; then
                        log "SUCCESS" "$service stopped gracefully"
                        stopped_services+=("$service")
                        break
                    fi
                    sleep 1
                    wait_time=$((wait_time + 1))
                done
                
                # Force kill if still running
                if ps -p "$pid" > /dev/null 2>&1; then
                    if [ "$FORCE_STOP" = true ]; then
                        log "WARN" "$service did not stop gracefully, force killing..."
                        kill -KILL "$pid" 2>/dev/null || true
                        log "SUCCESS" "$service force stopped"
                        stopped_services+=("$service")
                    else
                        log "ERROR" "$service did not stop gracefully (use --force to kill)"
                    fi
                fi
            else
                log "DEBUG" "$service was not running"
            fi
            
            # Remove PID file
            rm -f "$pid_file"
        else
            log "DEBUG" "No PID file found for $service"
        fi
    done
    
    if [ ${#stopped_services[@]} -gt 0 ]; then
        log "SUCCESS" "Stopped services: ${stopped_services[*]}"
    fi
}

# Clean up resources
cleanup() {
    log "INFO" "Cleaning up resources..."
    
    # Remove lock file
    if [ -f "$LOCK_FILE" ]; then
        rm -f "$LOCK_FILE"
        log "DEBUG" "Removed lock file"
    fi
    
    # Clean up PID files
    if [ -d "$PID_DIR" ]; then
        find "$PID_DIR" -name "*.pid" -type f -delete 2>/dev/null || true
        log "DEBUG" "Cleaned up PID files"
    fi
    
    # Check for any remaining processes
    local remaining_processes=$(ps aux | grep -E "(ssh-ws-server|auth-server|management-server|simple-proxy)" | grep -v grep | wc -l)
    
    if [ "$remaining_processes" -gt 0 ]; then
        log "WARN" "Found $remaining_processes remaining processes"
        
        if [ "$FORCE_STOP" = true ]; then
            log "INFO" "Force stopping remaining processes..."
            pkill -f "ssh-ws-server" 2>/dev/null || true
            pkill -f "auth-server" 2>/dev/null || true
            pkill -f "management-server" 2>/dev/null || true
            pkill -f "simple-proxy" 2>/dev/null || true
            log "SUCCESS" "Remaining processes stopped"
        else
            log "INFO" "Use --force to stop remaining processes"
        fi
    fi
    
    log "SUCCESS" "Cleanup completed"
}

# Verify services are stopped
verify_stopped() {
    log "INFO" "Verifying services are stopped..."
    
    local ports=(3000 3001 3099 3443 443)
    local active_ports=()
    
    for port in "${ports[@]}"; do
        if netstat -ln 2>/dev/null | grep -q ":$port "; then
            active_ports+=("$port")
        fi
    done
    
    if [ ${#active_ports[@]} -gt 0 ]; then
        log "WARN" "Some ports are still active: ${active_ports[*]}"
        
        if [ "$FORCE_STOP" = true ]; then
            log "INFO" "Force closing active ports..."
            for port in "${active_ports[@]}"; do
                local pid=$(netstat -tlnp 2>/dev/null | grep ":$port " | awk '{print $7}' | cut -d'/' -f1)
                if [ -n "$pid" ] && [ "$pid" != "-" ]; then
                    kill -KILL "$pid" 2>/dev/null || true
                    log "DEBUG" "Killed process $pid on port $port"
                fi
            done
        fi
    else
        log "SUCCESS" "All ports are free"
    fi
    
    # Check systemd services
    if [ "$USE_SYSTEMD" = true ]; then
        local services=("ssh-ws" "auth" "management" "webapp")
        local active_services=()
        
        for service in "${services[@]}"; do
            if systemctl --user is-active --quiet "phone-config-$service.service" 2>/dev/null; then
                active_services+=("$service")
            fi
        done
        
        if [ ${#active_services[@]} -gt 0 ]; then
            log "WARN" "Some systemd services are still active: ${active_services[*]}"
        else
            log "SUCCESS" "All systemd services are stopped"
        fi
    fi
}

# Main stop function
main() {
    log "INFO" "🛑 Stopping Phone Config Generator (Production Mode)"
    log "INFO" "=============================================="
    
    # Auto-detect if using systemd
    if [ "$USE_SYSTEMD" = false ] && systemctl --user is-active --quiet phone-config-generator.target 2>/dev/null; then
        log "INFO" "Detected systemd services, using systemd mode"
        USE_SYSTEMD=true
    fi
    
    # Check if services are running
    if ! check_running; then
        log "SUCCESS" "Services are not running"
        exit 0
    fi
    
    # Create backup if requested
    create_backup
    
    # Stop services
    if [ "$USE_SYSTEMD" = true ]; then
        stop_systemd
    else
        stop_direct
    fi
    
    # Clean up resources
    cleanup
    
    # Verify services are stopped
    verify_stopped
    
    log "SUCCESS" "🎉 Phone Config Generator stopped successfully!"
    log "INFO" "==========================================="
    log "INFO" "All services have been stopped"
    log "INFO" "Log files preserved in: $LOG_DIR/"
    
    if [ "$BACKUP_ON_STOP" = true ]; then
        log "INFO" "Backup created in: $APP_ROOT/backups/"
    fi
    
    log "INFO" ""
    log "INFO" "To start services again: ./start-production.sh"
    log "INFO" "To check status: ./status-production.sh"
}

# Run main function
main "$@"
