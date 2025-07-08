#!/bin/bash

#################################################################################
# Robust Production Startup Script - Polycom/Yealink Phone Configuration Generator
# 
# This script provides a reliable way to start all services with proper error
# handling, health checks, and automatic recovery mechanisms.
# 
# Services started:
# 1. SSH WebSocket backend server (port 3001) - VPN/SSH functionality
# 2. Authentication server (port 3002) - User management and auth
# 3. Reverse proxy server (port 3000) - Production frontend + API routing
# 
# Features:
# - Comprehensive health checks
# - Automatic service recovery
# - Process monitoring
# - Graceful shutdown handling
# - External access support via reverse proxy
# 
# Usage: ./start-robust.sh [--production|--dev]
#################################################################################

set -e  # Exit on any error

# Configuration
PRODUCTION_MODE=${1:-"--production"}  # Default to production mode
LOG_FILE="startup-robust.log"
HEALTH_CHECK_INTERVAL=30  # Seconds between health checks
MAX_RESTART_ATTEMPTS=3
RESTART_DELAY=5  # Seconds to wait before restart

# Process tracking
SSH_WS_PID=""
AUTH_PID=""
PROXY_PID=""
MONITOR_PID=""

# Service definitions
declare -A SERVICES=(
    ["ssh-ws"]="backend/ssh-ws-server.js:3001:/health"
    ["auth"]="backend/auth-server.js:3002:/health" 
    ["proxy"]="backend/simple-proxy.js:3000:/proxy-health"
)

# Enhanced logging function with log levels
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local color=""
    
    case $level in
        "ERROR") color="\033[0;31m" ;;    # Red
        "WARN")  color="\033[0;33m" ;;    # Yellow  
        "SUCCESS") color="\033[0;32m" ;;  # Green
        "INFO")  color="\033[0;36m" ;;    # Cyan
        *) color="\033[0m" ;;             # Default
    esac
    
    echo -e "${color}[$timestamp] [$level] $message\033[0m" | tee -a "$LOG_FILE"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -i :$1 -sTCP:LISTEN -t >/dev/null 2>&1
}

# Enhanced function to kill processes using a port
kill_port() {
    local port=$1
    local service_name=$2
    local max_attempts=3
    local attempt=1
    
    log "INFO" "Checking port $port for $service_name..."
    
    while [ $attempt -le $max_attempts ] && port_in_use $port; do
        local pids=$(lsof -i :$port -sTCP:LISTEN -t 2>/dev/null || echo "")
        
        if [ ! -z "$pids" ]; then
            log "WARN" "Port $port is in use by process(es): $pids (attempt $attempt/$max_attempts)"
            
            if [ $attempt -eq 1 ]; then
                echo "$pids" | xargs -r kill -TERM 2>/dev/null || true
                sleep 2
            else
                echo "$pids" | xargs -r kill -9 2>/dev/null || true
                sleep 1
            fi
        fi
        
        attempt=$((attempt + 1))
    done
    
    if port_in_use $port; then
        log "ERROR" "Failed to free port $port after $max_attempts attempts"
        return 1
    else
        log "SUCCESS" "Port $port is free for $service_name"
        return 0
    fi
}

# Function to kill processes by pattern
kill_by_pattern() {
    local pattern=$1
    local service_name=$2
    
    log "INFO" "Stopping any existing $service_name processes..."
    
    pkill -f "$pattern" 2>/dev/null || true
    sleep 2
    pkill -9 -f "$pattern" 2>/dev/null || true
    sleep 1
    
    log "SUCCESS" "Cleaned up $service_name processes"
}

# Function to wait for service to start
wait_for_service() {
    local port=$1
    local service_name=$2
    local max_wait=30
    local wait_time=0
    
    log "INFO" "Waiting for $service_name to start on port $port..."
    
    while [ $wait_time -lt $max_wait ]; do
        if port_in_use $port; then
            log "SUCCESS" "$service_name is ready on port $port"
            return 0
        fi
        sleep 1
        wait_time=$((wait_time + 1))
    done
    
    log "ERROR" "$service_name failed to start on port $port within $max_wait seconds"
    return 1
}

# Function to check service health
check_service_health() {
    local url=$1
    local service_name=$2
    local max_attempts=5
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f --connect-timeout 5 "$url" >/dev/null 2>&1; then
            log "SUCCESS" "$service_name health check passed"
            return 0
        fi
        sleep 2
        attempt=$((attempt + 1))
    done
    
    log "ERROR" "$service_name health check failed after $max_attempts attempts"
    return 1
}

# Function to start a service
start_service() {
    local service_key=$1
    local service_info=${SERVICES[$service_key]}
    local script_path=$(echo "$service_info" | cut -d':' -f1)
    local port=$(echo "$service_info" | cut -d':' -f2)
    local health_endpoint=$(echo "$service_info" | cut -d':' -f3)
    
    log "INFO" "Starting $service_key service..."
    
    # Kill any existing process on the port
    kill_port $port "$service_key" || return 1
    
    # Start the service
    cd "$(dirname "$script_path")"
    nohup node "$(basename "$script_path")" > "${service_key}.log" 2>&1 &
    local pid=$!
    cd - > /dev/null
    
    # Store PID based on service type
    case $service_key in
        "ssh-ws") SSH_WS_PID=$pid ;;
        "auth") AUTH_PID=$pid ;;
        "proxy") PROXY_PID=$pid ;;
    esac
    
    log "SUCCESS" "$service_key started (PID: $pid)"
    
    # Wait for service to be ready
    if wait_for_service $port "$service_key"; then
        # Perform health check
        local health_url="http://localhost:$port$health_endpoint"
        if check_service_health "$health_url" "$service_key"; then
            log "SUCCESS" "$service_key is healthy and ready"
            return 0
        else
            log "WARN" "$service_key health check failed but service is running"
            return 0  # Continue anyway
        fi
    else
        log "ERROR" "$service_key failed to start properly"
        return 1
    fi
}

# Function to restart a service
restart_service() {
    local service_key=$1
    local attempts=0
    
    while [ $attempts -lt $MAX_RESTART_ATTEMPTS ]; do
        attempts=$((attempts + 1))
        log "WARN" "Restarting $service_key (attempt $attempts/$MAX_RESTART_ATTEMPTS)..."
        
        if start_service "$service_key"; then
            log "SUCCESS" "$service_key restarted successfully"
            return 0
        fi
        
        if [ $attempts -lt $MAX_RESTART_ATTEMPTS ]; then
            log "WARN" "Restart attempt $attempts failed, waiting ${RESTART_DELAY}s before retry..."
            sleep $RESTART_DELAY
        fi
    done
    
    log "ERROR" "Failed to restart $service_key after $MAX_RESTART_ATTEMPTS attempts"
    return 1
}

# Function to monitor services
monitor_services() {
    log "INFO" "Starting service monitoring (interval: ${HEALTH_CHECK_INTERVAL}s)"
    
    while true; do
        sleep $HEALTH_CHECK_INTERVAL
        
        for service_key in "${!SERVICES[@]}"; do
            local service_info=${SERVICES[$service_key]}
            local port=$(echo "$service_info" | cut -d':' -f2)
            local health_endpoint=$(echo "$service_info" | cut -d':' -f3)
            local health_url="http://localhost:$port$health_endpoint"
            
            if ! port_in_use $port; then
                log "ERROR" "$service_key is not running on port $port"
                restart_service "$service_key" || {
                    log "ERROR" "Failed to restart $service_key, stopping monitoring"
                    return 1
                }
            elif ! curl -s -f --connect-timeout 5 "$health_url" >/dev/null 2>&1; then
                log "WARN" "$service_key health check failed"
                restart_service "$service_key" || {
                    log "ERROR" "Failed to restart $service_key, stopping monitoring"
                    return 1
                }
            else
                log "INFO" "$service_key is healthy"
            fi
        done
    done
}

# Enhanced cleanup function
cleanup() {
    log "INFO" "Initiating graceful shutdown of all services..."
    
    # Stop monitoring
    if [ ! -z "$MONITOR_PID" ] && kill -0 $MONITOR_PID 2>/dev/null; then
        log "INFO" "Stopping service monitor (PID: $MONITOR_PID)..."
        kill -TERM $MONITOR_PID 2>/dev/null || true
    fi
    
    # Stop services in reverse order
    local pids=("$PROXY_PID" "$AUTH_PID" "$SSH_WS_PID")
    local names=("Reverse Proxy" "Authentication" "SSH WebSocket")
    
    for i in "${!pids[@]}"; do
        local pid="${pids[$i]}"
        local name="${names[$i]}"
        
        if [ ! -z "$pid" ] && kill -0 $pid 2>/dev/null; then
            log "INFO" "Stopping $name (PID: $pid)..."
            kill -TERM $pid 2>/dev/null || kill -9 $pid 2>/dev/null || true
        fi
    done
    
    # Clean up by process pattern
    kill_by_pattern "simple-proxy.js" "Reverse Proxy"
    kill_by_pattern "auth-server.js" "Authentication"
    kill_by_pattern "ssh-ws-server.js" "SSH WebSocket"
    
    # Clean up ports
    kill_port 3000 "cleanup" 2>/dev/null || true
    kill_port 3001 "cleanup" 2>/dev/null || true
    kill_port 3002 "cleanup" 2>/dev/null || true
    
    log "SUCCESS" "All services stopped successfully"
    exit 0
}

# Set trap for graceful shutdown
trap cleanup SIGINT SIGTERM EXIT

# Initialize
log "INFO" "=== Robust Production Startup Script Started ==="
log "INFO" "📱 Phone Configuration Generator - Production Mode with Reverse Proxy"

echo "🚀 Starting Robust Production Application Stack..."
echo "   📱 Phone Configuration Generator (Production Build)"
echo "   🔐 Authentication System (port 3002)"
echo "   🔧 SSH WebSocket Backend (port 3001)"
echo "   🌐 Reverse Proxy Server (port 3000)"
echo "   📊 Service Monitoring (every ${HEALTH_CHECK_INTERVAL}s)"
echo "   📝 Logs: $LOG_FILE"
echo ""

#################################################################################
# STEP 1: System Requirements and Cleanup
#################################################################################

log "INFO" "Performing initial cleanup and requirements check..."

# Check required tools
for tool in node npm curl lsof; do
    if ! command_exists $tool; then
        log "ERROR" "$tool is not installed"
        echo "❌ Error: $tool is not installed. Please install it first."
        exit 1
    fi
done

log "SUCCESS" "Node.js version: $(node --version)"
log "SUCCESS" "npm version: $(npm --version)"

# Initial cleanup
kill_by_pattern "simple-proxy.js" "Reverse Proxy"
kill_by_pattern "auth-server.js" "Authentication"  
kill_by_pattern "ssh-ws-server.js" "SSH WebSocket"

kill_port 3000 "Initial cleanup" || true
kill_port 3001 "Initial cleanup" || true
kill_port 3002 "Initial cleanup" || true

log "SUCCESS" "Initial cleanup completed"

#################################################################################
# STEP 2: Dependencies and Build
#################################################################################

log "INFO" "Installing dependencies and building application..."

if ! npm install; then
    log "ERROR" "Failed to install dependencies"
    exit 1
fi

log "SUCCESS" "Dependencies installed"

# Build for production
if [ "$PRODUCTION_MODE" = "--production" ]; then
    log "INFO" "Building React application for production..."
    
    if [ -d "dist" ]; then
        rm -rf dist
        log "INFO" "Cleaned previous build"
    fi
    
    if npm run build > build.log 2>&1; then
        log "SUCCESS" "Production build completed"
        
        if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
            log "ERROR" "Build verification failed"
            exit 1
        fi
    else
        log "ERROR" "Production build failed"
        exit 1
    fi
fi

#################################################################################
# STEP 3: Start Services in Order
#################################################################################

echo ""
echo "🔧 Starting backend services..."

# Start SSH WebSocket backend
if ! start_service "ssh-ws"; then
    log "ERROR" "Failed to start SSH WebSocket service"
    exit 1
fi

# Start Authentication server  
if ! start_service "auth"; then
    log "ERROR" "Failed to start Authentication service"
    exit 1
fi

# Start Reverse Proxy (frontend + API routing)
echo ""
echo "🌐 Starting reverse proxy server..."

if ! start_service "proxy"; then
    log "ERROR" "Failed to start Reverse Proxy service"
    exit 1
fi

#################################################################################
# STEP 4: Start Service Monitoring
#################################################################################

echo ""
echo "📊 Starting service monitoring..."

monitor_services &
MONITOR_PID=$!

log "SUCCESS" "Service monitoring started (PID: $MONITOR_PID)"

#################################################################################
# STEP 5: Final Status Report
#################################################################################

echo ""
echo "🎉 All services started successfully!"
echo ""
echo "📍 Service URLs:"
echo "   🌐 Main Application:     http://localhost:3000"
echo "   🔧 SSH WebSocket API:    http://localhost:3001 (internal)"
echo "   🔐 Authentication API:   http://localhost:3002 (internal)"
echo ""
echo "🌍 External Access:"
local_ip=$(hostname -I | awk '{print $1}')
echo "   📱 From LAN:             http://$local_ip:3000"
echo "   🌐 From Internet:        http://your-external-ip:3000"
echo "   ✅ All API calls routed through port 3000 (reverse proxy)"
echo ""
echo "👤 Default Admin Credentials:"
if [ -f ".env" ]; then
    ADMIN_USER=$(grep "^DEFAULT_ADMIN_USERNAME=" .env 2>/dev/null | cut -d '=' -f2 || echo "admin")
    ADMIN_PASS=$(grep "^DEFAULT_ADMIN_PASSWORD=" .env 2>/dev/null | cut -d '=' -f2 || echo "admin123")
    echo "   Username: $ADMIN_USER"
    echo "   Password: $ADMIN_PASS"
    echo "   (Loaded from .env file)"
else
    echo "   Username: admin"
    echo "   Password: admin123"
fi
echo ""
echo "📁 Log Files:"
echo "   🔧 SSH Backend: backend/ssh-ws.log"
echo "   🔐 Auth Server: backend/auth.log"
echo "   🌐 Reverse Proxy: backend/proxy.log"
echo "   📝 Startup Log: $LOG_FILE"
echo ""
echo "🔍 Process IDs:"
echo "   🔧 SSH WebSocket: $SSH_WS_PID"
echo "   🔐 Authentication: $AUTH_PID"
echo "   🌐 Reverse Proxy: $PROXY_PID"
echo "   📊 Monitor: $MONITOR_PID"
echo ""
echo "✨ Production Features:"
echo "   • Automatic service health monitoring"
echo "   • Automatic restart on failure (max $MAX_RESTART_ATTEMPTS attempts)"
echo "   • Reverse proxy for single-port external access"
echo "   • Production-optimized React build"
echo "   • Comprehensive logging and error handling"
echo ""
echo "🔧 Router Configuration:"
echo "   Only forward port 3000 to $local_ip:3000"
echo "   All API calls are routed internally by the reverse proxy"
echo ""
echo "⌨️  Press Ctrl+C to stop all services"
echo ""

log "SUCCESS" "Production application is running with monitoring"
log "INFO" "System ready for external access"

# Wait for monitoring to complete (or until interrupted)
wait $MONITOR_PID
