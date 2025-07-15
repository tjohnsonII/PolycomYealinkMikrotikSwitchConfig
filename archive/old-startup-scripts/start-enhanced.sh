#!/bin/bash

# Enhanced Robust Startup Script
# This script handles port conflicts and provides better service management

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
LOG_DIR="$PROJECT_DIR/logs"
PID_DIR="$PROJECT_DIR/pids"

# Create necessary directories
mkdir -p "$LOG_DIR" "$PID_DIR"

# Port configuration
HTTP_PORT=3000
HTTPS_PORT=8443
AUTH_PORT=3002
SSH_WS_PORT=3001
WEBUI_PORT=3099

# Service configuration
declare -A SERVICES=(
    ["auth"]="$AUTH_PORT"
    ["ssh-ws"]="$SSH_WS_PORT"
    ["webui"]="$WEBUI_PORT"
    ["proxy"]="$HTTP_PORT"
)

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_debug() {
    echo -e "${CYAN}[DEBUG]${NC} $1"
}

# Check if port is in use
port_in_use() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Get process info for port
get_port_process() {
    local port=$1
    lsof -Pi :$port -sTCP:LISTEN -F p 2>/dev/null | grep '^p' | cut -c2- | head -1
}

# Kill process on port
kill_port() {
    local port=$1
    local service_name=$2
    
    if port_in_use $port; then
        local pid=$(get_port_process $port)
        if [ -n "$pid" ]; then
            print_warning "Port $port is in use by PID $pid. Attempting to free it..."
            
            # Try graceful shutdown first
            if kill -TERM $pid 2>/dev/null; then
                print_debug "Sent SIGTERM to PID $pid"
                sleep 2
                
                # Check if process is still running
                if kill -0 $pid 2>/dev/null; then
                    print_warning "Process $pid still running, force killing..."
                    kill -KILL $pid 2>/dev/null || true
                    sleep 1
                fi
            fi
            
            # Verify port is free
            if port_in_use $port; then
                print_error "Failed to free port $port"
                return 1
            else
                print_status "Port $port freed successfully"
                return 0
            fi
        fi
    fi
    return 0
}

# Wait for port to be available
wait_for_port_free() {
    local port=$1
    local timeout=${2:-10}
    local count=0
    
    print_debug "Waiting for port $port to be available..."
    
    while [ $count -lt $timeout ]; do
        if ! port_in_use $port; then
            print_debug "Port $port is available"
            return 0
        fi
        sleep 1
        count=$((count + 1))
    done
    
    print_error "Timeout waiting for port $port to be available"
    return 1
}

# Wait for service to be ready
wait_for_service() {
    local port=$1
    local timeout=${2:-30}
    local count=0
    
    print_debug "Waiting for service on port $port to be ready..."
    
    while [ $count -lt $timeout ]; do
        if curl -s -f http://localhost:$port/health >/dev/null 2>&1; then
            print_status "Service on port $port is ready"
            return 0
        fi
        sleep 1
        count=$((count + 1))
    done
    
    print_warning "Service on port $port did not respond to health check within $timeout seconds"
    return 1
}

# Start a service with enhanced error handling
start_service() {
    local service_name=$1
    local script_name=$2
    local port=$3
    local enable_https=${4:-false}
    
    print_status "Starting $service_name service..."
    
    # Check if port is available
    if port_in_use $port; then
        print_warning "Port $port is in use. Attempting to free it..."
        if ! kill_port $port "$service_name"; then
            print_error "Failed to free port $port for $service_name"
            return 1
        fi
    fi
    
    # Wait for port to be available
    if ! wait_for_port_free $port 5; then
        print_error "Port $port is not available for $service_name"
        return 1
    fi
    
    # Set environment variables
    export NODE_ENV=production
    export PORT=$port
    if [ "$enable_https" = "true" ]; then
        export ENABLE_HTTPS=true
        export HTTPS_PORT=$HTTPS_PORT
    fi
    
    # Start the service
    local log_file="$LOG_DIR/$service_name.log"
    local pid_file="$PID_DIR/$service_name.pid"
    
    print_debug "Starting $script_name with PORT=$port"
    
    # Remove old PID file
    rm -f "$pid_file"
    
    # Start service in background
    nohup node "$BACKEND_DIR/$script_name" > "$log_file" 2>&1 &
    local pid=$!
    
    # Save PID
    echo $pid > "$pid_file"
    
    # Wait a moment for service to start
    sleep 2
    
    # Check if process is still running
    if ! kill -0 $pid 2>/dev/null; then
        print_error "$service_name failed to start (PID $pid died)"
        cat "$log_file" | tail -10
        return 1
    fi
    
    # Check if port is now in use
    if ! port_in_use $port; then
        print_error "$service_name started but port $port is not in use"
        cat "$log_file" | tail -10
        return 1
    fi
    
    print_status "$service_name started successfully (PID: $pid, PORT: $port)"
    return 0
}

# Stop a service
stop_service() {
    local service_name=$1
    local pid_file="$PID_DIR/$service_name.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 $pid 2>/dev/null; then
            print_status "Stopping $service_name (PID: $pid)..."
            kill -TERM $pid 2>/dev/null || true
            sleep 2
            
            # Force kill if still running
            if kill -0 $pid 2>/dev/null; then
                print_warning "Force killing $service_name (PID: $pid)"
                kill -KILL $pid 2>/dev/null || true
            fi
        fi
        rm -f "$pid_file"
    fi
}

# Stop all services
stop_all_services() {
    print_status "Stopping all services..."
    
    for service in "${!SERVICES[@]}"; do
        stop_service "$service"
    done
    
    # Also stop any remaining processes on our ports
    for port in "${SERVICES[@]}"; do
        if port_in_use $port; then
            kill_port $port "cleanup"
        fi
    done
    
    print_status "All services stopped"
}

# Check service health
check_service_health() {
    local service_name=$1
    local port=$2
    
    if port_in_use $port; then
        if curl -s -f http://localhost:$port/health >/dev/null 2>&1; then
            print_status "$service_name is healthy on port $port"
            return 0
        else
            print_warning "$service_name is running on port $port but health check failed"
            return 1
        fi
    else
        print_error "$service_name is not running on port $port"
        return 1
    fi
}

# Check all services
check_all_services() {
    print_status "Checking service health..."
    
    local all_healthy=true
    
    for service in "${!SERVICES[@]}"; do
        if ! check_service_health "$service" "${SERVICES[$service]}"; then
            all_healthy=false
        fi
    done
    
    if $all_healthy; then
        print_status "All services are healthy"
        return 0
    else
        print_warning "Some services are unhealthy"
        return 1
    fi
}

# Build the frontend
build_frontend() {
    print_status "Building frontend..."
    
    cd "$PROJECT_DIR"
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_status "Installing dependencies..."
        npm install
    fi
    
    # Build the frontend
    if npm run build; then
        print_status "Frontend built successfully"
        return 0
    else
        print_error "Frontend build failed"
        return 1
    fi
}

# Main startup function
start_all_services() {
    print_status "Starting all services with enhanced port management..."
    
    # Stop any existing services first
    stop_all_services
    
    # Build frontend first
    if ! build_frontend; then
        print_error "Frontend build failed, cannot start services"
        return 1
    fi
    
    # Start services in dependency order
    print_status "Starting backend services..."
    
    # Start authentication service
    if ! start_service "auth" "auth-server-https.js" $AUTH_PORT true; then
        print_error "Failed to start authentication service"
        return 1
    fi
    
    # Start SSH WebSocket service
    if ! start_service "ssh-ws" "ssh-ws-server-https.js" $SSH_WS_PORT true; then
        print_error "Failed to start SSH WebSocket service"
        return 1
    fi
    
    # Start web UI service
    if ! start_service "webui" "webui-server.js" $WEBUI_PORT false; then
        print_error "Failed to start WebUI service"
        return 1
    fi
    
    # Wait for all services to be ready
    print_status "Waiting for services to be ready..."
    
    wait_for_service $AUTH_PORT 30
    wait_for_service $SSH_WS_PORT 30
    wait_for_service $WEBUI_PORT 30
    
    # Start the enhanced proxy
    print_status "Starting enhanced reverse proxy..."
    if ! start_service "proxy" "enhanced-proxy.js" $HTTP_PORT true; then
        print_error "Failed to start enhanced proxy"
        return 1
    fi
    
    # Final health check
    sleep 3
    check_all_services
    
    print_status "🎉 All services started successfully!"
    echo ""
    echo -e "${GREEN}📍 Service URLs:${NC}"
    echo -e "   🌐 Main Application: http://localhost:$HTTP_PORT"
    echo -e "   🔒 HTTPS Application: https://localhost:$HTTPS_PORT"
    echo -e "   🔑 Authentication: https://localhost:$AUTH_PORT"
    echo -e "   📡 SSH WebSocket: https://localhost:$SSH_WS_PORT"
    echo -e "   🖥️  Management Console: http://localhost:$WEBUI_PORT"
    echo ""
    echo -e "${GREEN}🏥 Health Checks:${NC}"
    echo -e "   • Proxy health: http://localhost:$HTTP_PORT/proxy-health"
    echo -e "   • Service status: http://localhost:$HTTP_PORT/proxy-status"
    echo ""
    echo -e "${GREEN}📋 Logs:${NC}"
    echo -e "   • Log directory: $LOG_DIR"
    echo -e "   • PID directory: $PID_DIR"
    echo ""
    
    return 0
}

# Status function
show_status() {
    print_status "Service Status:"
    echo ""
    
    for service in "${!SERVICES[@]}"; do
        local port="${SERVICES[$service]}"
        local pid_file="$PID_DIR/$service.pid"
        
        if [ -f "$pid_file" ]; then
            local pid=$(cat "$pid_file")
            if kill -0 $pid 2>/dev/null; then
                if port_in_use $port; then
                    echo -e "  ✅ $service: Running (PID: $pid, PORT: $port)"
                else
                    echo -e "  ⚠️  $service: Process running but port $port not in use (PID: $pid)"
                fi
            else
                echo -e "  ❌ $service: PID file exists but process not running (stale PID: $pid)"
            fi
        else
            if port_in_use $port; then
                local pid=$(get_port_process $port)
                echo -e "  ⚠️  $service: Port $port in use but no PID file (PID: $pid)"
            else
                echo -e "  ❌ $service: Not running"
            fi
        fi
    done
    
    echo ""
}

# Restart function
restart_service() {
    local service_name=$1
    
    if [ -z "$service_name" ]; then
        print_status "Restarting all services..."
        stop_all_services
        sleep 2
        start_all_services
    else
        if [[ ! " ${!SERVICES[@]} " =~ " ${service_name} " ]]; then
            print_error "Unknown service: $service_name"
            print_status "Available services: ${!SERVICES[@]}"
            return 1
        fi
        
        print_status "Restarting $service_name service..."
        stop_service "$service_name"
        sleep 2
        
        local port="${SERVICES[$service_name]}"
        case $service_name in
            "auth")
                start_service "auth" "auth-server-https.js" $port true
                ;;
            "ssh-ws")
                start_service "ssh-ws" "ssh-ws-server-https.js" $port true
                ;;
            "webui")
                start_service "webui" "webui-server.js" $port false
                ;;
            "proxy")
                start_service "proxy" "enhanced-proxy.js" $port true
                ;;
        esac
    fi
}

# Logs function
show_logs() {
    local service_name=$1
    local lines=${2:-50}
    
    if [ -z "$service_name" ]; then
        print_status "Available log files:"
        ls -la "$LOG_DIR"/*.log 2>/dev/null || echo "No log files found"
        return 0
    fi
    
    local log_file="$LOG_DIR/$service_name.log"
    if [ -f "$log_file" ]; then
        print_status "Last $lines lines of $service_name log:"
        tail -n "$lines" "$log_file"
    else
        print_error "Log file not found: $log_file"
    fi
}

# Cleanup function
cleanup() {
    print_status "Cleaning up..."
    stop_all_services
    rm -rf "$PID_DIR"/*.pid 2>/dev/null || true
    print_status "Cleanup complete"
}

# Signal handlers
trap cleanup EXIT
trap 'print_status "Received SIGTERM"; cleanup; exit 0' TERM
trap 'print_status "Received SIGINT"; cleanup; exit 0' INT

# Main command handler
case "${1:-start}" in
    start)
        start_all_services
        ;;
    stop)
        stop_all_services
        ;;
    restart)
        restart_service "$2"
        ;;
    status)
        show_status
        ;;
    health)
        check_all_services
        ;;
    logs)
        show_logs "$2" "$3"
        ;;
    build)
        build_frontend
        ;;
    cleanup)
        cleanup
        ;;
    *)
        echo "Usage: $0 {start|stop|restart [service]|status|health|logs [service] [lines]|build|cleanup}"
        echo ""
        echo "Services: ${!SERVICES[@]}"
        echo ""
        echo "Examples:"
        echo "  $0 start          # Start all services"
        echo "  $0 stop           # Stop all services"
        echo "  $0 restart        # Restart all services"
        echo "  $0 restart proxy  # Restart only proxy service"
        echo "  $0 status         # Show service status"
        echo "  $0 health         # Check service health"
        echo "  $0 logs proxy     # Show proxy logs"
        echo "  $0 logs proxy 100 # Show last 100 lines of proxy logs"
        echo "  $0 build          # Build frontend only"
        echo "  $0 cleanup        # Stop services and cleanup"
        exit 1
        ;;
esac
