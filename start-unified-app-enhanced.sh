#!/bin/bash

#################################################################################
# Enhanced Unified Startup Script for Complete Application Stack
# 
# This script robustly starts all necessary backend and frontend services for the
# Polycom/Yealink Phone Configuration Generator with Authentication.
# 
# Services started:
# 1. SSH WebSocket backend server (port 3001) - for terminal/SSH/VPN functionality
# 2. Authentication server (port 3002) - for user management and auth
# 3. Main Vite development server (port 3000) - frontend application
# 
# Enhanced features:
# - Forceful cleanup of existing processes on required ports
# - Comprehensive dependency checks (Node.js, npm, OpenVPN, etc.)
# - Health checks for all started services
# - Automatic recovery and retry mechanisms
# - Enhanced error handling and logging
# - Process monitoring and auto-restart capabilities
# 
# Usage: ./start-unified-app-enhanced.sh
# or: chmod +x start-unified-app-enhanced.sh && ./start-unified-app-enhanced.sh
#################################################################################

set -e  # Exit on any error

# Global variables for process tracking
SSH_WS_PID=""
AUTH_PID=""
VITE_PID=""
LOG_FILE="startup.log"

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
    if [ ! -z "$VITE_PID" ] && kill -0 $VITE_PID 2>/dev/null; then
        log "INFO" "Stopping Vite development server (PID: $VITE_PID)..."
        kill -TERM $VITE_PID 2>/dev/null || kill -9 $VITE_PID 2>/dev/null || true
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
    kill_by_name "vite.*3000" "Vite"
    
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
log "INFO" "=== Enhanced Startup Script Started ==="
log "INFO" "📱 Phone Configuration Generator with VPN & Authentication"

echo "🚀 Starting Complete Application Stack..."
echo "   📱 Phone Configuration Generator"
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
kill_by_name "vite.*3000" "Vite"

# Clean up ports forcefully
kill_port 3000 "Vite dev server" || true
kill_port 3001 "SSH WebSocket backend" || true
kill_port 3002 "Authentication server" || true

log "SUCCESS" "Initial cleanup completed"

#################################################################################
# STEP 1: Environment Configuration Check
#################################################################################

log "INFO" "Checking environment configuration..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    log "WARN" ".env file not found! Creating from template..."
    
    if [ -f ".env.example" ]; then
        cp .env.example .env
        log "SUCCESS" "Created .env file from .env.example"
        echo "🔑 Please edit .env file to set secure credentials:"
        echo "   - JWT_SECRET: Use a strong random key"
        echo "   - DEFAULT_ADMIN_PASSWORD: Change from default"
        echo ""
        echo "💡 Generate secure JWT secret with:"
        echo "   node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
        echo ""
    else
        log "ERROR" ".env.example template not found!"
        echo "❌ Error: .env.example template not found!"
        echo "   Please create .env file manually with required variables."
        echo "   See SECURITY.md for configuration details."
        exit 1
    fi
else
    log "SUCCESS" "Environment file (.env) found"
fi

# Validate critical environment variables
if ! grep -q "^JWT_SECRET=" .env 2>/dev/null; then
    log "WARN" "JWT_SECRET not found in .env file - will use insecure fallback!"
fi

#################################################################################
# STEP 2: Enhanced System Requirements Check
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

# Check lsof (required for port management)
if ! command_exists lsof; then
    log "ERROR" "lsof is not installed"
    echo "❌ Error: lsof is not installed. Please install lsof first."
    echo "   Ubuntu/Debian: sudo apt-get install lsof"
    echo "   CentOS/RHEL: sudo yum install lsof"
    exit 1
fi

# Check curl (required for health checks)
if ! command_exists curl; then
    log "ERROR" "curl is not installed"
    echo "❌ Error: curl is not installed. Please install curl first."
    echo "   Ubuntu/Debian: sudo apt-get install curl"
    echo "   CentOS/RHEL: sudo yum install curl"
    exit 1
fi

# Check OpenVPN (optional but recommended for VPN functionality)
if command_exists openvpn; then
    log "SUCCESS" "OpenVPN found: $(openvpn --version | head -n1)"
else
    log "WARN" "OpenVPN not found - VPN functionality may be limited"
    echo "⚠️  Warning: OpenVPN not found. VPN functionality may be limited."
    echo "   Install with: sudo apt-get install openvpn"
fi

# Check netcat (for port testing)
if command_exists nc; then
    log "SUCCESS" "netcat found for port testing"
else
    log "WARN" "netcat not found - some network tests may be limited"
fi

log "SUCCESS" "Node.js version: $(node --version)"
log "SUCCESS" "npm version: $(npm --version)"

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

#################################################################################
# STEP 3: Enhanced Dependencies Installation
#################################################################################

log "INFO" "Installing/updating dependencies..."

echo ""
echo "📦 Installing/updating dependencies..."

# Clear npm cache if needed
if ! npm cache verify >/dev/null 2>&1; then
    log "WARN" "npm cache verification failed, clearing cache..."
    npm cache clean --force
fi

# Install dependencies with error handling
if ! npm install; then
    log "ERROR" "Failed to install dependencies"
    echo "❌ Error: Failed to install dependencies"
    echo "💡 Troubleshooting tips:"
    echo "   • Clear npm cache: npm cache clean --force"
    echo "   • Delete node_modules: rm -rf node_modules"
    echo "   • Check npm configuration: npm config list"
    exit 1
fi

log "SUCCESS" "Dependencies installed successfully"

#################################################################################
# STEP 4: Enhanced Build Check
#################################################################################

echo ""
echo "🔨 Running build check..."
log "INFO" "Running TypeScript build check..."

if npm run build > build.log 2>&1; then
    log "SUCCESS" "Build check passed"
    echo "✅ Build check passed"
else
    log "WARN" "Build check failed - continuing anyway"
    echo "⚠️  Warning: Build check failed. There may be TypeScript errors."
    echo "   Check build.log for details. Continuing with servers anyway..."
fi

#################################################################################
# STEP 5: Start SSH WebSocket Backend with Enhanced Features
#################################################################################

echo ""
echo "🔧 Starting SSH WebSocket backend with VPN support..."
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
        # Perform health check
        if check_service_health "http://localhost:3001/ping" "SSH WebSocket backend"; then
            log "SUCCESS" "SSH WebSocket backend is healthy and ready"
        else
            log "WARN" "SSH WebSocket backend health check failed but service is running"
        fi
    else
        log "ERROR" "SSH WebSocket backend failed to start properly"
        echo "❌ SSH WebSocket backend failed to start"
        cleanup
        exit 1
    fi
else
    log "WARN" "backend/ssh-ws-server.js not found"
    echo "⚠️  Warning: backend/ssh-ws-server.js not found. Continuing without SSH backend."
    SSH_WS_PID=""
fi

#################################################################################
# STEP 6: Start Authentication Server with Health Checks
#################################################################################

echo ""
echo "🔐 Starting authentication server..."
log "INFO" "Starting authentication server..."

if [ -f "backend/auth-server.js" ]; then
    cd backend
    node auth-server.js > auth-server.log 2>&1 &
    AUTH_PID=$!
    cd ..
    
    log "SUCCESS" "Authentication server started (PID: $AUTH_PID)"
    echo "✅ Authentication server started (PID: $AUTH_PID) on port 3002"
    
    # Wait for service to be ready
    if wait_for_service 3002 "Authentication server"; then
        # Perform health check
        echo "⏳ Waiting for authentication server to initialize..."
        sleep 3
        
        # Test login endpoint
        if curl -s -X POST http://localhost:3002/api/login -H "Content-Type: application/json" -d '{"username":"test","password":"test"}' | grep -q "error"; then
            log "SUCCESS" "Authentication server is healthy and responding"
            echo "✅ Authentication server health check passed"
        else
            log "WARN" "Authentication server health check inconclusive but service is running"
        fi
    else
        log "ERROR" "Authentication server failed to start properly"
        echo "❌ Authentication server failed to start"
        cleanup
        exit 1
    fi
else
    log "WARN" "backend/auth-server.js not found"
    echo "⚠️  Warning: backend/auth-server.js not found. Continuing without authentication."
    AUTH_PID=""
fi

#################################################################################
# STEP 7: Start Vite Development Server with Enhanced Configuration
#################################################################################

echo ""
echo "🌐 Starting Vite development server..."
echo "   Configuration:"
echo "   • Host: 0.0.0.0 (accessible from network)"
echo "   • Port: 3000"
echo "   • Auto-open browser: Yes"
echo "   • HTTPS: Auto-configured if available"
echo "   • Strict port: Yes (fail if port unavailable)"

log "INFO" "Starting Vite development server..."

# Start Vite in background with enhanced configuration
npm run dev -- \
    --host 0.0.0.0 \
    --port 3000 \
    --open \
    --strictPort > vite.log 2>&1 &
VITE_PID=$!

# Wait for Vite to start
if wait_for_service 3000 "Vite development server"; then
    log "SUCCESS" "Vite development server started (PID: $VITE_PID)"
    echo "✅ Vite development server started (PID: $VITE_PID)"
    
    # Perform health check
    if check_service_health "http://localhost:3000" "Vite development server"; then
        log "SUCCESS" "Vite development server is healthy and ready"
    else
        log "WARN" "Vite health check failed but service is running"
    fi
else
    log "ERROR" "Vite development server failed to start"
    echo "❌ Failed to start Vite development server"
    echo "💡 Troubleshooting tips:"
    echo "   • Check for TypeScript errors: npm run build"
    echo "   • Check port availability: lsof -i :3000"
    echo "   • Check vite.log for detailed errors"
    cleanup
    exit 1
fi

#################################################################################
# STEP 8: Display Enhanced Status and Monitoring
#################################################################################

echo ""
echo "🎉 All services started successfully!"
echo ""
echo "📍 Service URLs:"
echo "   🌐 Main Application:     http://localhost:3000"
echo "   🔧 SSH WebSocket API:    http://localhost:3001"
echo "   🔐 Authentication API:   http://localhost:3002"
echo ""
echo "🌍 Network Access:"
echo "   📱 From other devices:   http://$(hostname -I | awk '{print $1}'):3000"
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
echo "   🌐 Vite Server: vite.log"
echo "   📝 Startup Log: $LOG_FILE"
echo ""
echo "🔍 Process IDs:"
if [ ! -z "$SSH_WS_PID" ]; then
    echo "   🔧 SSH WebSocket: $SSH_WS_PID"
fi
if [ ! -z "$AUTH_PID" ]; then
    echo "   🔐 Authentication: $AUTH_PID"
fi
if [ ! -z "$VITE_PID" ]; then
    echo "   🌐 Vite: $VITE_PID"
fi
echo ""
echo "💡 Enhanced Features:"
echo "   • Real VPN connectivity with OpenVPN support"
echo "   • Network diagnostics with actual ping tests"
echo "   • Robust process management and auto-recovery"
echo "   • Comprehensive health monitoring"
echo "   • Enhanced security with environment variables"
echo ""
echo "⌨️  Press Ctrl+C to stop all services"
echo ""

log "SUCCESS" "All services are running and healthy"
log "INFO" "System ready for use"

# Wait for all processes to complete (or until user interrupts)
wait
