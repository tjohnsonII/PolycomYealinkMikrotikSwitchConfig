#!/bin/bash

#################################################################################
# Production Service Manager for Phone Configuration Generator
# 
# This script manages all production services with proper error handling,
# monitoring, and logging. It provides a comprehensive interface for
# production deployment and management.
#
# Usage: 
#   ./production-service-manager.sh [command]
#   ./production-service-manager.sh install     # Install as systemd services
#   ./production-service-manager.sh start       # Start all services
#   ./production-service-manager.sh stop        # Stop all services
#   ./production-service-manager.sh restart     # Restart all services
#   ./production-service-manager.sh status      # Check service status
#   ./production-service-manager.sh logs        # View logs
#   ./production-service-manager.sh monitor     # Real-time monitoring
#   ./production-service-manager.sh health      # Health check
#   ./production-service-manager.sh backup      # Backup configuration
#   ./production-service-manager.sh update      # Update application
#################################################################################

set -e

# Configuration
APP_NAME="phone-config-generator"
APP_USER="$(whoami)"
APP_ROOT="$(pwd)"
LOG_DIR="$APP_ROOT/logs"
BACKUP_DIR="$APP_ROOT/backups"
CONFIG_DIR="$APP_ROOT/config"

# Create directories if they don't exist
mkdir -p "$LOG_DIR" "$BACKUP_DIR" "$CONFIG_DIR"

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
    local log_file="$LOG_DIR/service-manager.log"
    
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
            echo -e "${PURPLE}[${timestamp}] 🔍 $message${NC}" 
            echo "[${timestamp}] DEBUG: $message" >> "$log_file"
            ;;
        "STEP") 
            echo -e "${CYAN}[${timestamp}] 🔧 $message${NC}" 
            echo "[${timestamp}] STEP: $message" >> "$log_file"
            ;;
    esac
}

# Service definitions
declare -A SERVICES=(
    ["ssh-ws"]="backend/ssh-ws-server.js:3000"
    ["auth"]="backend/auth-server.js:3001"
    ["management"]="backend/management-server.js:3099"
    ["proxy-https"]="backend/simple-proxy-https-robust.js:443"
    ["webapp"]="npm run dev:3443"
)

# Service dependencies
declare -A SERVICE_DEPS=(
    ["ssh-ws"]=""
    ["auth"]=""
    ["management"]=""
    ["proxy-https"]="webapp"
    ["webapp"]="ssh-ws auth"
)

# Check if a service is running
is_service_running() {
    local service_name=$1
    local pid_file="$LOG_DIR/${service_name}.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p "$pid" > /dev/null 2>&1; then
            return 0
        else
            rm -f "$pid_file"
        fi
    fi
    return 1
}

# Start a single service
start_service() {
    local service_name=$1
    local service_cmd=${SERVICES[$service_name]}
    
    if is_service_running "$service_name"; then
        log "INFO" "Service $service_name is already running"
        return 0
    fi
    
    log "STEP" "Starting service: $service_name"
    
    # Check dependencies
    local deps=${SERVICE_DEPS[$service_name]}
    if [ -n "$deps" ]; then
        for dep in $deps; do
            if ! is_service_running "$dep"; then
                log "INFO" "Starting dependency: $dep"
                start_service "$dep"
                sleep 2
            fi
        done
    fi
    
    # Start the service
    local log_file="$LOG_DIR/${service_name}.log"
    local pid_file="$LOG_DIR/${service_name}.pid"
    
    if [[ $service_cmd == npm* ]]; then
        # Handle npm commands
        nohup $service_cmd > "$log_file" 2>&1 &
    else
        # Handle node commands
        nohup node $service_cmd > "$log_file" 2>&1 &
    fi
    
    local pid=$!
    echo $pid > "$pid_file"
    
    # Wait a moment and check if service started successfully
    sleep 3
    if is_service_running "$service_name"; then
        log "SUCCESS" "Service $service_name started (PID: $pid)"
        return 0
    else
        log "ERROR" "Service $service_name failed to start"
        return 1
    fi
}

# Stop a single service
stop_service() {
    local service_name=$1
    local pid_file="$LOG_DIR/${service_name}.pid"
    
    if ! is_service_running "$service_name"; then
        log "INFO" "Service $service_name is not running"
        return 0
    fi
    
    log "STEP" "Stopping service: $service_name"
    
    local pid=$(cat "$pid_file")
    kill "$pid" 2>/dev/null || true
    
    # Wait for graceful shutdown
    for i in {1..10}; do
        if ! ps -p "$pid" > /dev/null 2>&1; then
            break
        fi
        sleep 1
    done
    
    # Force kill if still running
    if ps -p "$pid" > /dev/null 2>&1; then
        kill -9 "$pid" 2>/dev/null || true
    fi
    
    rm -f "$pid_file"
    log "SUCCESS" "Service $service_name stopped"
}

# Start all services
start_all_services() {
    log "INFO" "Starting all services..."
    
    local services_order=("ssh-ws" "auth" "management" "webapp" "proxy-https")
    
    for service in "${services_order[@]}"; do
        start_service "$service"
        sleep 2
    done
    
    log "SUCCESS" "All services started"
}

# Stop all services
stop_all_services() {
    log "INFO" "Stopping all services..."
    
    local services_order=("proxy-https" "webapp" "management" "auth" "ssh-ws")
    
    for service in "${services_order[@]}"; do
        stop_service "$service"
    done
    
    log "SUCCESS" "All services stopped"
}

# Restart all services
restart_all_services() {
    log "INFO" "Restarting all services..."
    stop_all_services
    sleep 3
    start_all_services
}

# Check service status
check_service_status() {
    local service_name=$1
    local pid_file="$LOG_DIR/${service_name}.pid"
    
    if is_service_running "$service_name"; then
        local pid=$(cat "$pid_file")
        local mem_usage=$(ps -p "$pid" -o rss= 2>/dev/null | tr -d ' ')
        local cpu_usage=$(ps -p "$pid" -o pcpu= 2>/dev/null | tr -d ' ')
        local uptime=$(ps -p "$pid" -o etime= 2>/dev/null | tr -d ' ')
        
        echo -e "✅ ${GREEN}$service_name${NC} - PID: $pid, Memory: ${mem_usage}KB, CPU: ${cpu_usage}%, Uptime: $uptime"
    else
        echo -e "❌ ${RED}$service_name${NC} - Not running"
    fi
}

# Show status of all services
show_status() {
    log "INFO" "Service Status Dashboard"
    echo "========================="
    
    for service in "${!SERVICES[@]}"; do
        check_service_status "$service"
    done
    
    echo ""
    echo "System Resources:"
    echo "=================="
    echo "Disk Usage: $(df -h / | awk 'NR==2 {print $5}')"
    echo "Memory Usage: $(free -h | awk 'NR==2{printf "%.1f/%.1fGB (%.2f%%)", $3/1024,$2/1024,$3*100/$2}')"
    echo "Load Average: $(uptime | awk -F'load average:' '{print $2}')"
    echo "Active Network Connections: $(netstat -an | grep LISTEN | wc -l)"
}

# View logs
view_logs() {
    local service_name=${1:-"all"}
    
    if [ "$service_name" = "all" ]; then
        log "INFO" "Viewing all service logs (last 50 lines each)"
        for service in "${!SERVICES[@]}"; do
            local log_file="$LOG_DIR/${service}.log"
            if [ -f "$log_file" ]; then
                echo -e "\n${CYAN}=== $service ===${NC}"
                tail -n 50 "$log_file"
            fi
        done
    else
        local log_file="$LOG_DIR/${service_name}.log"
        if [ -f "$log_file" ]; then
            tail -f "$log_file"
        else
            log "ERROR" "Log file not found: $log_file"
        fi
    fi
}

# Real-time monitoring
monitor_services() {
    log "INFO" "Starting real-time monitoring (press Ctrl+C to exit)"
    
    while true; do
        clear
        echo "Phone Config Generator - Real-time Monitor"
        echo "=========================================="
        echo "$(date)"
        echo ""
        
        show_status
        
        echo ""
        echo "Recent Errors:"
        echo "=============="
        for service in "${!SERVICES[@]}"; do
            local log_file="$LOG_DIR/${service}.log"
            if [ -f "$log_file" ]; then
                local errors=$(tail -n 20 "$log_file" | grep -i "error\|failed\|exception" | tail -n 3)
                if [ -n "$errors" ]; then
                    echo -e "${RED}$service:${NC}"
                    echo "$errors" | sed 's/^/  /'
                fi
            fi
        done
        
        sleep 10
    done
}

# Health check
health_check() {
    log "INFO" "Performing health check..."
    
    local all_healthy=true
    
    # Check each service
    for service in "${!SERVICES[@]}"; do
        if ! is_service_running "$service"; then
            log "ERROR" "Service $service is not running"
            all_healthy=false
        fi
    done
    
    # Check critical endpoints
    local endpoints=(
        "http://localhost:3000/health"
        "http://localhost:3001/health"
        "http://localhost:3099/health"
    )
    
    for endpoint in "${endpoints[@]}"; do
        if ! curl -s -f "$endpoint" > /dev/null 2>&1; then
            log "WARN" "Endpoint $endpoint is not responding"
            all_healthy=false
        fi
    done
    
    # Check disk space
    local disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt 80 ]; then
        log "WARN" "Disk usage is ${disk_usage}%"
        all_healthy=false
    fi
    
    # Check memory usage
    local memory_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    if [ "$memory_usage" -gt 80 ]; then
        log "WARN" "Memory usage is ${memory_usage}%"
        all_healthy=false
    fi
    
    if $all_healthy; then
        log "SUCCESS" "All health checks passed"
    else
        log "ERROR" "Some health checks failed"
    fi
    
    return $all_healthy
}

# Auto-heal services
auto_heal() {
    log "INFO" "Running auto-heal..."
    
    for service in "${!SERVICES[@]}"; do
        if ! is_service_running "$service"; then
            log "INFO" "Auto-healing service: $service"
            start_service "$service"
        fi
    done
}

# Backup configuration
backup_config() {
    log "INFO" "Creating configuration backup..."
    
    local backup_file="$BACKUP_DIR/config-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
    
    tar -czf "$backup_file" \
        --exclude="node_modules" \
        --exclude="dist" \
        --exclude="*.log" \
        --exclude="*.pid" \
        "$APP_ROOT"
    
    log "SUCCESS" "Configuration backed up to: $backup_file"
}

# Update application
update_app() {
    log "INFO" "Updating application..."
    
    # Create backup first
    backup_config
    
    # Stop services
    stop_all_services
    
    # Update code (if using git)
    if [ -d ".git" ]; then
        git pull origin main || log "WARN" "Git pull failed"
    fi
    
    # Install dependencies
    npm install
    
    # Build application
    npm run build
    
    # Start services
    start_all_services
    
    log "SUCCESS" "Application updated successfully"
}

# Install as systemd services (user-level)
install_systemd_services() {
    log "INFO" "Installing systemd services..."
    
    local systemd_dir="$HOME/.config/systemd/user"
    mkdir -p "$systemd_dir"
    
    # Create service files
    for service in "${!SERVICES[@]}"; do
        local service_cmd=${SERVICES[$service]}
        local service_file="$systemd_dir/phone-config-$service.service"
        
        cat > "$service_file" << EOF
[Unit]
Description=Phone Config Generator - $service
After=network.target

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$APP_ROOT
Environment=NODE_ENV=production
ExecStart=/bin/bash -c 'cd $APP_ROOT && $service_cmd'
Restart=always
RestartSec=5
StandardOutput=append:$LOG_DIR/$service.log
StandardError=append:$LOG_DIR/$service.error.log

[Install]
WantedBy=default.target
EOF
    done
    
    # Reload systemd and enable services
    systemctl --user daemon-reload
    
    for service in "${!SERVICES[@]}"; do
        systemctl --user enable "phone-config-$service.service"
        log "SUCCESS" "Enabled systemd service: phone-config-$service"
    done
    
    log "SUCCESS" "All systemd services installed and enabled"
}

# Main command dispatcher
main() {
    local command=${1:-"help"}
    
    case $command in
        "install")
            install_systemd_services
            ;;
        "start")
            start_all_services
            ;;
        "stop")
            stop_all_services
            ;;
        "restart")
            restart_all_services
            ;;
        "status")
            show_status
            ;;
        "logs")
            view_logs "$2"
            ;;
        "monitor")
            monitor_services
            ;;
        "health")
            health_check
            ;;
        "heal")
            auto_heal
            ;;
        "backup")
            backup_config
            ;;
        "update")
            update_app
            ;;
        "help"|*)
            echo "Phone Config Generator - Production Service Manager"
            echo "================================================="
            echo ""
            echo "Usage: $0 [command]"
            echo ""
            echo "Commands:"
            echo "  install   - Install as systemd services"
            echo "  start     - Start all services"
            echo "  stop      - Stop all services"
            echo "  restart   - Restart all services"
            echo "  status    - Show service status"
            echo "  logs      - View logs (optionally specify service name)"
            echo "  monitor   - Real-time monitoring"
            echo "  health    - Perform health check"
            echo "  heal      - Auto-heal failed services"
            echo "  backup    - Backup configuration"
            echo "  update    - Update application"
            echo "  help      - Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 start"
            echo "  $0 status"
            echo "  $0 logs ssh-ws"
            echo "  $0 monitor"
            ;;
    esac
}

# Run main function
main "$@"
