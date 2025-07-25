#!/bin/bash

#################################################################################
# Production Startup Script for Phone Config Generator
# 
# This script provides a comprehensive production startup with monitoring,
# health checks, and integration with the management console.
#
# Usage: 
#   ./start-production.sh [options]
#   ./start-production.sh --help
#################################################################################

set -e

# Default configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$SCRIPT_DIR"
LOG_DIR="$APP_ROOT/logs"
PID_DIR="$APP_ROOT/pids"
CONFIG_FILE="$APP_ROOT/.env.production"
LOCK_FILE="$PID_DIR/production.lock"
HEALTH_CHECK_INTERVAL=30
MAX_STARTUP_TIME=120
USE_SYSTEMD=false
DAEMON_MODE=false
VERBOSE=false

# Create directories
mkdir -p "$LOG_DIR" "$PID_DIR"

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
    local log_file="$LOG_DIR/production-startup.log"
    
    case $level in
        "ERROR") 
            echo -e "${RED}[${timestamp}] ❌ $message${NC}" 
            echo "[${timestamp}] ERROR: $message" >> "$log_file"
            ;;
        "SUCCESS") 
            echo -e "${GREEN}[${timestamp}] ✅ $message${NC}" 
            echo "[${timestamp}] SUCCESS: $message" >> "$log_file"
            ;;
        "WARN") 
            echo -e "${YELLOW}[${timestamp}] ⚠️  $message${NC}" 
            echo "[${timestamp}] WARN: $message" >> "$log_file"
            ;;
        "INFO") 
            echo -e "${BLUE}[${timestamp}] ℹ️  $message${NC}" 
            echo "[${timestamp}] INFO: $message" >> "$log_file"
            ;;
        "DEBUG") 
            [ "$VERBOSE" = true ] && echo -e "${PURPLE}[${timestamp}] 🔍 $message${NC}" 
            echo "[${timestamp}] DEBUG: $message" >> "$log_file"
            ;;
        "STEP") 
            echo -e "${CYAN}[${timestamp}] 🔧 $message${NC}" 
            echo "[${timestamp}] STEP: $message" >> "$log_file"
            ;;
    esac
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --systemd)
            USE_SYSTEMD=true
            shift
            ;;
        --daemon)
            DAEMON_MODE=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --config)
            CONFIG_FILE="$2"
            shift 2
            ;;
        --help)
            echo "Production Startup Script for Phone Config Generator"
            echo ""
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --systemd         Use systemd services instead of direct process management"
            echo "  --daemon          Run in daemon mode (background)"
            echo "  --verbose         Enable verbose logging"
            echo "  --config FILE     Use custom configuration file"
            echo "  --help            Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                    # Start with default settings"
            echo "  $0 --systemd          # Use systemd services"
            echo "  $0 --daemon           # Run in background"
            echo "  $0 --verbose          # Enable verbose output"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Load configuration
load_config() {
    if [ -f "$CONFIG_FILE" ]; then
        log "INFO" "Loading configuration from $CONFIG_FILE"
        # Load environment variables from .env file safely
        while IFS='=' read -r key value; do
            # Skip comments and empty lines
            if [[ $key =~ ^[[:space:]]*# ]] || [[ -z "$key" ]]; then
                continue
            fi
            # Export valid environment variables
            if [[ $key =~ ^[a-zA-Z_][a-zA-Z0-9_]*$ ]]; then
                export "$key"="$value"
            fi
        done < "$CONFIG_FILE"
        log "SUCCESS" "Configuration loaded"
    else
        log "WARN" "Configuration file not found: $CONFIG_FILE"
        log "INFO" "Using default configuration"
    fi
}

# Check if already running
check_running() {
    if [ -f "$LOCK_FILE" ]; then
        local pid=$(cat "$LOCK_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            log "ERROR" "Production services are already running (PID: $pid)"
            log "INFO" "To stop services, run: ./stop-production.sh"
            exit 1
        else
            log "WARN" "Stale lock file found, removing"
            rm -f "$LOCK_FILE"
        fi
    fi
}

# Create lock file
create_lock() {
    echo $$ > "$LOCK_FILE"
    log "DEBUG" "Created lock file: $LOCK_FILE"
}

# Remove lock file
remove_lock() {
    rm -f "$LOCK_FILE"
    log "DEBUG" "Removed lock file"
}

# Cleanup function
cleanup() {
    log "INFO" "Cleaning up..."
    remove_lock
    exit 0
}

# Set up signal handlers
trap cleanup TERM INT EXIT

# Pre-flight checks
preflight_checks() {
    log "STEP" "Performing pre-flight checks..."
    
    # Check Node.js
    if ! command -v node > /dev/null; then
        log "ERROR" "Node.js not found. Please install Node.js 18 or higher."
        exit 1
    fi
    
    local node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$node_version" -lt 18 ]; then
        log "ERROR" "Node.js version $node_version is too old. Please install Node.js 18 or higher."
        exit 1
    fi
    
    log "SUCCESS" "Node.js $(node --version) is available"
    
    # Check npm
    if ! command -v npm > /dev/null; then
        log "ERROR" "npm not found. Please install npm."
        exit 1
    fi
    
    log "SUCCESS" "npm $(npm --version) is available"
    
    # Check if build exists
    if [ ! -d "$APP_ROOT/dist" ]; then
        log "WARN" "Build directory not found, building application..."
        npm run build
    fi
    
    # Check SSL certificates
    local ssl_key="${SSL_KEY_PATH:-$APP_ROOT/ssl/123hostedtools.com.key}"
    local ssl_cert="${SSL_CERT_PATH:-$APP_ROOT/ssl/123hostedtools_com.crt}"
    
    if [ ! -f "$ssl_key" ] || [ ! -f "$ssl_cert" ]; then
        log "WARN" "SSL certificates not found, HTTPS proxy may not work"
    else
        log "SUCCESS" "SSL certificates found"
    fi
    
    # Check ports
    local ports=(3000 3001 3099 3443)
    for port in "${ports[@]}"; do
        if netstat -ln | grep -q ":$port "; then
            log "ERROR" "Port $port is already in use"
            exit 1
        fi
    done
    
    log "SUCCESS" "All required ports are available"
    
    # Check system resources
    local free_memory=$(free -m | awk 'NR==2{print $7}')
    if [ "$free_memory" -lt 512 ]; then
        log "WARN" "Low free memory: ${free_memory}MB"
    fi
    
    local disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt 80 ]; then
        log "WARN" "High disk usage: ${disk_usage}%"
    fi
    
    log "SUCCESS" "Pre-flight checks completed"
}

# Start with systemd
start_systemd() {
    log "STEP" "Starting services with systemd..."
    
    # Check if systemd services are installed
    if ! systemctl --user list-unit-files | grep -q "phone-config-generator.target"; then
        log "INFO" "Installing systemd services..."
        if [ -f "$APP_ROOT/install-systemd-services.sh" ]; then
            "$APP_ROOT/install-systemd-services.sh"
        else
            log "ERROR" "SystemD services not installed. Run install-systemd-services.sh first."
            exit 1
        fi
    fi
    
    # Start services
    systemctl --user start phone-config-generator.target
    systemctl --user start phone-config-health-check.timer
    
    log "SUCCESS" "SystemD services started"
}

# Start services directly
start_direct() {
    log "STEP" "Starting services directly..."
    
    # Start SSH WebSocket Server
    log "INFO" "Starting SSH WebSocket Server..."
    nohup node "$APP_ROOT/backend/ssh-ws-server.js" > "$LOG_DIR/ssh-ws.log" 2>&1 &
    echo $! > "$PID_DIR/ssh-ws.pid"
    
    # Wait for service to start
    sleep 3
    if ! ps -p $(cat "$PID_DIR/ssh-ws.pid") > /dev/null; then
        log "ERROR" "SSH WebSocket Server failed to start"
        exit 1
    fi
    log "SUCCESS" "SSH WebSocket Server started (PID: $(cat "$PID_DIR/ssh-ws.pid"))"
    
    # Start Authentication Server
    log "INFO" "Starting Authentication Server..."
    nohup node "$APP_ROOT/backend/auth-server.js" > "$LOG_DIR/auth.log" 2>&1 &
    echo $! > "$PID_DIR/auth.pid"
    
    sleep 3
    if ! ps -p $(cat "$PID_DIR/auth.pid") > /dev/null; then
        log "ERROR" "Authentication Server failed to start"
        exit 1
    fi
    log "SUCCESS" "Authentication Server started (PID: $(cat "$PID_DIR/auth.pid"))"
    
    # Start Management Console
    log "INFO" "Starting Management Console..."
    nohup node "$APP_ROOT/backend/management-server.js" --allow-lan > "$LOG_DIR/management.log" 2>&1 &
    echo $! > "$PID_DIR/management.pid"
    
    sleep 3
    if ! ps -p $(cat "$PID_DIR/management.pid") > /dev/null; then
        log "ERROR" "Management Console failed to start"
        exit 1
    fi
    log "SUCCESS" "Management Console started (PID: $(cat "$PID_DIR/management.pid"))"
    
    # Start Main Application
    log "INFO" "Starting Main Application..."
    nohup node -e "
        const express = require('express');
        const https = require('https');
        const fs = require('fs');
        const path = require('path');
        
        const app = express();
        app.use(express.static('dist'));
        app.get('*', (req, res) => {
            res.sendFile(path.join(__dirname, 'dist', 'index.html'));
        });
        
        const sslKeyPath = process.env.SSL_KEY_PATH || './ssl/123hostedtools.com.key';
        const sslCertPath = process.env.SSL_CERT_PATH || './ssl/123hostedtools_com.crt';
        
        if (fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)) {
            const options = {
                key: fs.readFileSync(sslKeyPath),
                cert: fs.readFileSync(sslCertPath)
            };
            https.createServer(options, app).listen(3443, () => {
                console.log('HTTPS Server running on port 3443');
            });
        } else {
            console.log('SSL certificates not found, starting HTTP server');
            app.listen(3080, () => {
                console.log('HTTP Server running on port 3080');
            });
        }
    " > "$LOG_DIR/webapp.log" 2>&1 &
    echo $! > "$PID_DIR/webapp.pid"
    
    sleep 3
    if ! ps -p $(cat "$PID_DIR/webapp.pid") > /dev/null; then
        log "ERROR" "Main Application failed to start"
        exit 1
    fi
    log "SUCCESS" "Main Application started (PID: $(cat "$PID_DIR/webapp.pid"))"
    
    # Start HTTPS Proxy (if SSL certificates are available)
    local ssl_key="${SSL_KEY_PATH:-$APP_ROOT/ssl/123hostedtools.com.key}"
    local ssl_cert="${SSL_CERT_PATH:-$APP_ROOT/ssl/123hostedtools_com.crt}"
    
    if [ -f "$ssl_key" ] && [ -f "$ssl_cert" ]; then
        log "INFO" "Starting HTTPS Proxy..."
        if [ -f "$APP_ROOT/backend/simple-proxy-https-robust.js" ]; then
            nohup node "$APP_ROOT/backend/simple-proxy-https-robust.js" > "$LOG_DIR/proxy.log" 2>&1 &
            echo $! > "$PID_DIR/proxy.pid"
            
            sleep 3
            if ! ps -p $(cat "$PID_DIR/proxy.pid") > /dev/null; then
                log "WARN" "HTTPS Proxy failed to start (this may require root privileges)"
            else
                log "SUCCESS" "HTTPS Proxy started (PID: $(cat "$PID_DIR/proxy.pid"))"
            fi
        else
            log "WARN" "HTTPS Proxy script not found"
        fi
    else
        log "WARN" "SSL certificates not found, skipping HTTPS proxy"
    fi
    
    log "SUCCESS" "All services started successfully"
}

# Wait for services to be ready
wait_for_services() {
    log "STEP" "Waiting for services to be ready..."
    
    local endpoints=(
        "http://localhost:3000/health"
        "http://localhost:3001/health"
        "http://localhost:3099/health"
    )
    
    local max_wait=$MAX_STARTUP_TIME
    local wait_time=0
    
    while [ $wait_time -lt $max_wait ]; do
        local all_ready=true
        
        for endpoint in "${endpoints[@]}"; do
            if ! curl -s -f "$endpoint" > /dev/null 2>&1; then
                all_ready=false
                break
            fi
        done
        
        if [ "$all_ready" = true ]; then
            log "SUCCESS" "All services are ready"
            return 0
        fi
        
        sleep 2
        wait_time=$((wait_time + 2))
        
        if [ $((wait_time % 10)) -eq 0 ]; then
            log "INFO" "Still waiting for services... (${wait_time}s/${max_wait}s)"
        fi
    done
    
    log "ERROR" "Services failed to become ready within ${max_wait} seconds"
    return 1
}

# Health check
health_check() {
    log "STEP" "Performing health check..."
    
    local endpoints=(
        "http://localhost:3000/health"
        "http://localhost:3001/health"
        "http://localhost:3099/health"
        "https://localhost:3443"
    )
    
    local all_healthy=true
    
    for endpoint in "${endpoints[@]}"; do
        if curl -k -s -f "$endpoint" > /dev/null 2>&1; then
            log "SUCCESS" "$endpoint is responding"
        else
            log "ERROR" "$endpoint is not responding"
            all_healthy=false
        fi
    done
    
    if [ "$all_healthy" = true ]; then
        log "SUCCESS" "All health checks passed"
        return 0
    else
        log "ERROR" "Some health checks failed"
        return 1
    fi
}

# Monitor services
monitor_services() {
    if [ "$DAEMON_MODE" = true ]; then
        log "INFO" "Running in daemon mode, monitoring services..."
        
        while true; do
            if [ "$USE_SYSTEMD" = true ]; then
                # Check systemd services
                if ! systemctl --user is-active --quiet phone-config-generator.target; then
                    log "ERROR" "SystemD services are not running"
                    break
                fi
            else
                # Check direct processes
                local services=("ssh-ws" "auth" "management" "webapp")
                for service in "${services[@]}"; do
                    local pid_file="$PID_DIR/$service.pid"
                    if [ -f "$pid_file" ]; then
                        local pid=$(cat "$pid_file")
                        if ! ps -p "$pid" > /dev/null 2>&1; then
                            log "ERROR" "Service $service (PID: $pid) is not running"
                            break 2
                        fi
                    fi
                done
            fi
            
            sleep $HEALTH_CHECK_INTERVAL
        done
        
        log "ERROR" "Service monitoring detected a failure"
        exit 1
    fi
}

# Display status
show_status() {
    log "INFO" "Production Services Status"
    echo "=========================="
    
    if [ "$USE_SYSTEMD" = true ]; then
        # SystemD status
        local services=("ssh-ws" "auth" "management" "webapp")
        for service in "${services[@]}"; do
            local status=$(systemctl --user is-active "phone-config-$service.service" 2>/dev/null || echo "inactive")
            if [ "$status" = "active" ]; then
                echo -e "✅ ${GREEN}$service${NC} - $status"
            else
                echo -e "❌ ${RED}$service${NC} - $status"
            fi
        done
    else
        # Direct process status
        local services=("ssh-ws" "auth" "management" "webapp" "proxy")
        for service in "${services[@]}"; do
            local pid_file="$PID_DIR/$service.pid"
            if [ -f "$pid_file" ]; then
                local pid=$(cat "$pid_file")
                if ps -p "$pid" > /dev/null 2>&1; then
                    echo -e "✅ ${GREEN}$service${NC} - Running (PID: $pid)"
                else
                    echo -e "❌ ${RED}$service${NC} - Not running"
                fi
            else
                echo -e "❌ ${RED}$service${NC} - Not started"
            fi
        done
    fi
    
    echo ""
    echo "Access URLs:"
    echo "============"
    echo "• Main Application: https://localhost:3443"
    echo "• Management Console: http://localhost:3099"
    echo "• Auth Server: http://localhost:3001"
    echo "• SSH WebSocket: http://localhost:3000"
    
    if [ -n "${DOMAIN:-}" ]; then
        echo "• Public URL: https://${DOMAIN}"
    fi
}

# Main startup function
main() {
    log "INFO" "🚀 Starting Phone Config Generator (Production Mode)"
    log "INFO" "=================================================="
    
    # Load configuration
    load_config
    
    # Check if already running
    check_running
    
    # Create lock file
    create_lock
    
    # Pre-flight checks
    preflight_checks
    
    # Start services
    if [ "$USE_SYSTEMD" = true ]; then
        start_systemd
    else
        start_direct
    fi
    
    # Wait for services to be ready
    wait_for_services
    
    # Health check
    health_check
    
    # Show status
    show_status
    
    log "SUCCESS" "🎉 Phone Config Generator started successfully!"
    log "INFO" "=============================================="
    log "INFO" "Management Console: http://localhost:3099"
    log "INFO" "Main Application: https://localhost:3443"
    log "INFO" "Log files: $LOG_DIR/"
    log "INFO" "PID files: $PID_DIR/"
    log "INFO" ""
    log "INFO" "To stop services: ./stop-production.sh"
    log "INFO" "To check status: ./status-production.sh"
    log "INFO" "To view logs: tail -f $LOG_DIR/*.log"
    
    # Monitor services if in daemon mode
    monitor_services
}

# Run main function
main "$@"
