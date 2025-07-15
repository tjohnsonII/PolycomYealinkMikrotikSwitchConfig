#!/bin/bash

#################################################################################
# Production Startup Script - Polycom/Yealink Phone Configuration Generator
# 
# This script builds the React app for production and serves it with a static
# file server that properly handles React Router routes for external access.
# 
# Services started:
# 1. SSH WebSocket backend server (port 3001) - for terminal/SSH/VPN functionality
# 2. Authentication server (port 3002) - for user management and auth
# 3. Static file server (port 3000) - production-built frontend application
# 
# Usage: ./start-production.sh
#################################################################################

set -e  # Exit on any error

# Configuration
LOG_FILE="startup-production.log"
SSH_WS_PID=""
AUTH_PID=""
STATIC_PID=""

# Enhanced logging function
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -i :$1 -sTCP:LISTEN -t >/dev/null 2>&1
}

# Enhanced function to forcefully kill processes using a port
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
            
            # Try graceful shutdown first
            if [ $attempt -eq 1 ]; then
                echo "$pids" | xargs -r kill -TERM 2>/dev/null || true
                sleep 2
            else
                # Force kill if graceful shutdown failed
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

# Function to kill processes by name pattern
kill_by_name() {
    local pattern=$1
    local service_name=$2
    
    log "INFO" "Killing any existing $service_name processes..."
    
    # Kill by process name
    pkill -f "$pattern" 2>/dev/null || true
    sleep 1
    
    # Force kill if still running
    pkill -9 -f "$pattern" 2>/dev/null || true
    sleep 1
    
    log "SUCCESS" "Cleaned up $service_name processes"
}

# Enhanced cleanup function for graceful shutdown
cleanup() {
    log "INFO" "Initiating graceful shutdown of all services..."
    
    # Kill services in reverse order of startup
    if [ ! -z "$STATIC_PID" ] && kill -0 $STATIC_PID 2>/dev/null; then
        log "INFO" "Stopping static file server (PID: $STATIC_PID)..."
        kill -TERM $STATIC_PID 2>/dev/null || kill -9 $STATIC_PID 2>/dev/null || true
    fi
    
    if [ ! -z "$AUTH_PID" ] && kill -0 $AUTH_PID 2>/dev/null; then
        log "INFO" "Stopping authentication server (PID: $AUTH_PID)..."
        kill -TERM $AUTH_PID 2>/dev/null || kill -9 $AUTH_PID 2>/dev/null || true
    fi
    
    if [ ! -z "$SSH_WS_PID" ] && kill -0 $SSH_WS_PID 2>/dev/null; then
        log "INFO" "Stopping SSH WebSocket backend (PID: $SSH_WS_PID)..."
        kill -TERM $SSH_WS_PID 2>/dev/null || kill -9 $SSH_WS_PID 2>/dev/null || true
    fi
    
    # Additional cleanup - forcefully kill any remaining processes
    kill_by_name "ssh-ws-server.js" "SSH WebSocket"
    kill_by_name "auth-server.js" "Authentication"
    kill_by_name "static-server.js" "Static Server"
    
    # Clean up ports
    kill_port 3000 "cleanup" 2>/dev/null || true
    kill_port 3001 "cleanup" 2>/dev/null || true
    kill_port 3002 "cleanup" 2>/dev/null || true
    
    log "SUCCESS" "All services stopped successfully"
    exit 0
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
    
    log "INFO" "Checking health of $service_name at $url..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$url" >/dev/null 2>&1; then
            log "SUCCESS" "$service_name health check passed"
            return 0
        fi
        log "WARN" "$service_name health check failed (attempt $attempt/$max_attempts)"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    log "ERROR" "$service_name health check failed after $max_attempts attempts"
    return 1
}

# Set trap to cleanup on script exit (Ctrl+C, kill, etc.)
trap cleanup SIGINT SIGTERM EXIT

# Initialize log file
log "INFO" "=== Production Startup Script Started ==="
log "INFO" "📱 Phone Configuration Generator - Production Mode"

echo "🚀 Starting Production Application Stack..."
echo "   📱 Phone Configuration Generator (Production Build)"
echo "   🔐 Authentication System"
echo "   🔧 SSH WebSocket Backend with VPN Support"
echo "   📝 Logs: $LOG_FILE"
echo ""

#################################################################################
# STEP 0: Initial Cleanup
#################################################################################

log "INFO" "Performing initial cleanup..."

# Force cleanup any existing processes on our ports
kill_by_name "ssh-ws-server.js" "SSH WebSocket"
kill_by_name "auth-server.js" "Authentication"
kill_by_name "static-server.js" "Static Server"

# Clean up ports forcefully
kill_port 3000 "Static file server" || true
kill_port 3001 "SSH WebSocket backend" || true
kill_port 3002 "Authentication server" || true

log "SUCCESS" "Initial cleanup completed"

#################################################################################
# STEP 1: System Requirements Check
#################################################################################

log "INFO" "Checking system requirements..."

# Check Node.js
if ! command_exists node; then
    log "ERROR" "Node.js is not installed"
    echo "❌ Error: Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check npm
if ! command_exists npm; then
    log "ERROR" "npm is not installed"
    echo "❌ Error: npm is not installed. Please install npm first."
    exit 1
fi

# Check required tools
for tool in lsof curl; do
    if ! command_exists $tool; then
        log "ERROR" "$tool is not installed"
        echo "❌ Error: $tool is not installed. Please install $tool first."
        exit 1
    fi
done

log "SUCCESS" "Node.js version: $(node --version)"
log "SUCCESS" "npm version: $(npm --version)"

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

#################################################################################
# STEP 2: Dependencies Installation
#################################################################################

log "INFO" "Installing/updating dependencies..."

echo ""
echo "📦 Installing/updating dependencies..."

if ! npm install; then
    log "ERROR" "Failed to install dependencies"
    echo "❌ Error: Failed to install dependencies"
    exit 1
fi

log "SUCCESS" "Dependencies installed successfully"

#################################################################################
# STEP 3: Build React Application for Production
#################################################################################

echo ""
echo "🔨 Building React application for production..."
log "INFO" "Building React application for production..."

# Clean previous build
if [ -d "dist" ]; then
    rm -rf dist
    log "INFO" "Cleaned previous build directory"
fi

# Build the application
if npm run build > build.log 2>&1; then
    log "SUCCESS" "Production build completed successfully"
    echo "✅ Production build completed successfully"
    
    # Verify build directory exists
    if [ ! -d "dist" ]; then
        log "ERROR" "Build directory 'dist' not found after build"
        echo "❌ Error: Build directory 'dist' not found after build"
        exit 1
    fi
    
    # Check if index.html exists
    if [ ! -f "dist/index.html" ]; then
        log "ERROR" "index.html not found in build directory"
        echo "❌ Error: index.html not found in build directory"
        exit 1
    fi
    
    log "SUCCESS" "Build verification passed"
    echo "✅ Build verification passed"
else
    log "ERROR" "Production build failed"
    echo "❌ Error: Production build failed. Check build.log for details."
    exit 1
fi

#################################################################################
# STEP 4: Start Backend Services
#################################################################################

echo ""
echo "🔧 Starting SSH WebSocket backend..."
log "INFO" "Starting SSH WebSocket backend..."

if [ -f "backend/ssh-ws-server.js" ]; then
    cd backend
    nohup node ssh-ws-server.js > ssh-ws-server.log 2>&1 &
    SSH_WS_PID=$!
    cd ..
    
    log "SUCCESS" "SSH WebSocket backend started (PID: $SSH_WS_PID)"
    echo "✅ SSH WebSocket backend started (PID: $SSH_WS_PID) on port 3001"
    
    # Wait for service to be ready
    if wait_for_service 3001 "SSH WebSocket backend"; then
        if check_service_health "http://localhost:3001/health" "SSH WebSocket backend"; then
            log "SUCCESS" "SSH WebSocket backend is healthy and ready"
        else
            log "WARN" "SSH WebSocket backend health check failed but service is running"
        fi
    else
        log "ERROR" "SSH WebSocket backend failed to start"
        echo "❌ Failed to start SSH WebSocket backend"
        cleanup
        exit 1
    fi
else
    log "ERROR" "SSH WebSocket backend file not found"
    echo "❌ Error: backend/ssh-ws-server.js not found"
    cleanup
    exit 1
fi

echo ""
echo "🔐 Starting authentication server..."
log "INFO" "Starting authentication server..."

if [ -f "backend/auth-server.js" ]; then
    cd backend
    nohup node auth-server.js > auth-server.log 2>&1 &
    AUTH_PID=$!
    cd ..
    
    log "SUCCESS" "Authentication server started (PID: $AUTH_PID)"
    echo "✅ Authentication server started (PID: $AUTH_PID) on port 3002"
    
    # Wait for service to be ready
    if wait_for_service 3002 "Authentication server"; then
        if check_service_health "http://localhost:3002/health" "Authentication server"; then
            log "SUCCESS" "Authentication server is healthy and ready"
        else
            log "WARN" "Authentication server health check failed but service is running"
        fi
    else
        log "ERROR" "Authentication server failed to start"
        echo "❌ Failed to start authentication server"
        cleanup
        exit 1
    fi
else
    log "ERROR" "Authentication server file not found"
    echo "❌ Error: backend/auth-server.js not found"
    cleanup
    exit 1
fi

#################################################################################
# STEP 5: Start Static File Server
#################################################################################

echo ""
echo "🌐 Starting production static file server..."
log "INFO" "Starting static file server..."

if [ -f "backend/static-server.js" ]; then
    cd backend
    nohup node static-server.js > static-server.log 2>&1 &
    STATIC_PID=$!
    cd ..
    
    log "SUCCESS" "Static file server started (PID: $STATIC_PID)"
    echo "✅ Static file server started (PID: $STATIC_PID) on port 3000"
    
    # Wait for service to be ready
    if wait_for_service 3000 "Static file server"; then
        if check_service_health "http://localhost:3000" "Static file server"; then
            log "SUCCESS" "Static file server is healthy and ready"
        else
            log "WARN" "Static file server health check failed but service is running"
        fi
    else
        log "ERROR" "Static file server failed to start"
        echo "❌ Failed to start static file server"
        cleanup
        exit 1
    fi
else
    log "ERROR" "Static file server not found"
    echo "❌ Error: backend/static-server.js not found"
    cleanup
    exit 1
fi

#################################################################################
# STEP 6: Final Status Report
#################################################################################

echo ""
echo "🎉 Production Application Started Successfully!"
echo ""
echo "📍 Service URLs:"
echo "   🌐 Main Application:     http://localhost:3000"
echo "   🔧 SSH WebSocket API:    http://localhost:3001"
echo "   🔐 Authentication API:   http://localhost:3002"
echo ""
echo "🌍 External Access:"
local_ip=$(hostname -I | awk '{print $1}')
echo "   📱 From other devices:   http://$local_ip:3000"
echo "   🌐 External (if forwarded): http://your-external-ip:3000"
echo ""
echo "👤 Default Admin Credentials:"
# Load from .env file if it exists, otherwise show defaults
if [ -f ".env" ]; then
    ADMIN_USER=$(grep "^DEFAULT_ADMIN_USERNAME=" .env 2>/dev/null | cut -d '=' -f2 || echo "admin")
    ADMIN_PASS=$(grep "^DEFAULT_ADMIN_PASSWORD=" .env 2>/dev/null | cut -d '=' -f2 || echo "admin123")
    echo "   Username: $ADMIN_USER"
    echo "   Password: $ADMIN_PASS"
    echo "   (Loaded from .env file)"
else
    echo "   Username: admin"
    echo "   Password: admin123"
    echo "   ⚠️  Note: Using default values. Create .env file for custom credentials."
fi
echo ""
echo "📁 Log Files:"
echo "   🔧 SSH Backend: backend/ssh-ws-server.log"
echo "   🔐 Auth Server: backend/auth-server.log"
echo "   🌐 Static Server: backend/static-server.log"
echo "   📝 Startup Log: $LOG_FILE"
echo "   🔨 Build Log: build.log"
echo ""
echo "🔍 Process IDs:"
echo "   🔧 SSH WebSocket: $SSH_WS_PID"
echo "   🔐 Authentication: $AUTH_PID"
echo "   🌐 Static Server: $STATIC_PID"
echo ""
echo "✅ Production Features:"
echo "   • Optimized React build with code splitting"
echo "   • Static file serving with proper routing"
echo "   • External access support (LAN and internet)"
echo "   • Robust process management"
echo "   • Health monitoring for all services"
echo ""
echo "🔧 Router Configuration:"
echo "   For external internet access, forward these ports:"
echo "   • Port 3000 → $local_ip:3000 (Main Application)"
echo "   • Port 3001 → $local_ip:3001 (SSH WebSocket API)"
echo "   • Port 3002 → $local_ip:3002 (Authentication API)"
echo ""
echo "⌨️  Press Ctrl+C to stop all services"
echo ""

log "SUCCESS" "Production application is running and healthy"
log "INFO" "System ready for external access"

# Wait for all processes to complete (or until user interrupts)
wait
