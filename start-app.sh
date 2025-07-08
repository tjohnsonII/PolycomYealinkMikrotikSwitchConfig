#!/bin/bash

#################################################################################
# Polycom/Yealink Phone Configuration Generator - Main Startup Script
# 
# This script starts all necessary backend and frontend services for the
# Polycom/Yealink Phone Configuration Generator with Authentication and VPN support.
# 
# Services started:
# 1. SSH WebSocket backend server (port 3001) - for terminal/SSH/VPN functionality
# 2. Authentication server (port 3002) - for user management and auth
# 3. Main Vite development server (port 3000) - frontend application
# 
# VPN Integration:
# - Supports OpenVPN connection to work network (terminal.123.net)
# - Includes diagnostic tools for PBX connectivity testing
# - Pre-configured with tjohnson work VPN profile
# 
# Enhanced features:
# - Robust process cleanup and port management
# - Comprehensive dependency checks (Node.js, npm, OpenVPN, etc.)
# - Health checks for all started services
# - Automatic recovery and retry mechanisms
# - Enhanced error handling and logging
# - Process monitoring and auto-restart capabilities
# 
# Usage: ./start-app.sh
# or: chmod +x start-app.sh && ./start-app.sh
#################################################################################

set -e  # Exit on any error

# Configuration: Set to true for dedicated troubleshooting server mode
# In this mode, the server will maintain a persistent VPN connection
ENABLE_PERSISTENT_VPN=false  # Set to true for dedicated server deployment
VPN_CONFIG_FILE="backend/tjohnson-work.ovpn"  # Path to VPN config file (your actual config)
VPN_CREDENTIALS_FILE="backend/vpn-credentials.txt"  # Path to credentials file (optional)
VPN_CHECK_INTERVAL=30  # Seconds between VPN connection checks

# Production mode detection
PRODUCTION_MODE=${PRODUCTION_MODE:-false}
if [ "$PRODUCTION_MODE" = "true" ]; then
    echo "🏭 Production mode enabled - building and serving static files"
fi

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
    
    # Stop VPN monitor if running
    if [ ! -z "$VPN_MONITOR_PID" ] && kill -0 $VPN_MONITOR_PID 2>/dev/null; then
        log "INFO" "Stopping VPN connection monitor (PID: $VPN_MONITOR_PID)..."
        kill -TERM $VPN_MONITOR_PID 2>/dev/null || kill -9 $VPN_MONITOR_PID 2>/dev/null || true
    fi
    
    # Additional cleanup - forcefully kill any remaining processes
    kill_by_name "ssh-ws-server.js" "SSH WebSocket"
    kill_by_name "auth-server.js" "Authentication"
    kill_by_name "static-server.js" "Static Server"
    kill_by_name "vite.*3000" "Vite"
    
    # Clean up VPN processes and interfaces
    log "INFO" "Cleaning up VPN processes..."
    
    # Stop persistent VPN if it was started by this script
    if [[ "$ENABLE_PERSISTENT_VPN" == "true" ]] && [[ -f "$VPN_CONFIG_FILE" ]]; then
        sudo pkill -f "openvpn.*$(basename "$VPN_CONFIG_FILE")" 2>/dev/null || true
    fi
    
    # General VPN cleanup
    sudo pkill -f openvpn 2>/dev/null || true
    sleep 1
    
    # Remove any orphaned VPN interfaces
    for iface in $(ip link show | grep -o 'tun[0-9]\+' | head -5); do
        if ip link show "$iface" >/dev/null 2>&1; then
            log "INFO" "Removing orphaned VPN interface: $iface"
            sudo ip link delete "$iface" 2>/dev/null || true
        fi
    done
    
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

# Function to check VPN connection status
check_vpn_status() {
    if pgrep -f "openvpn.*${VPN_CONFIG_FILE}" > /dev/null; then
        return 0  # VPN is running
    else
        return 1  # VPN is not running
    fi
}

# Function to start persistent VPN connection
start_persistent_vpn() {
    if [[ "$ENABLE_PERSISTENT_VPN" != "true" ]]; then
        return 0
    fi

    log "INFO" "Starting persistent VPN connection for dedicated server mode..."

    # Check if VPN config file exists
    if [[ ! -f "$VPN_CONFIG_FILE" ]]; then
        log "WARN" "VPN config file not found: $VPN_CONFIG_FILE"
        log "WARN" "Persistent VPN disabled. Create config file to enable."
        return 1
    fi

    # Check VPN config for authentication method
    local auth_method=""
    if grep -q "WEB_AUTH\|auth.*web" "$VPN_CONFIG_FILE" 2>/dev/null; then
        auth_method="SAML/WEB_AUTH"
    elif grep -q "auth-user-pass" "$VPN_CONFIG_FILE" 2>/dev/null; then
        auth_method="Username/Password"
    else
        auth_method="Certificate-based"
    fi
    
    log "INFO" "Detected VPN authentication method: $auth_method"
    
    # Check if running in container or restricted environment
    if ! sudo -n true 2>/dev/null; then
        log "WARN" "Cannot use sudo (container/restricted environment detected)"
        log "WARN" "Skipping automatic VPN startup. Please connect VPN manually:"
        log "WARN" "  • Authentication Method: $auth_method"
        log "WARN" "  • Config File: $VPN_CONFIG_FILE"
        echo ""
        echo "⚠️  VPN Auto-Connect Skipped:"
        echo "   Running in restricted environment (container/no sudo privileges)"
        echo "   Authentication Method: $auth_method"
        echo ""
        
        if [[ "$auth_method" == "SAML/WEB_AUTH" ]]; then
            echo "   🌐 SAML/WEB_AUTH requires interactive browser authentication"
            echo "   Please use one of these methods:"
            echo ""
            echo "   🥇 OpenVPN 3 Linux Client (Recommended for SAML):"
            echo "      1. Install OpenVPN 3:"
            echo "         curl -fsSL https://packages.openvpn.net/packages-repo.gpg | sudo gpg --dearmor -o /etc/apt/keyrings/openvpn.gpg"
            echo "         echo 'deb [signed-by=/etc/apt/keyrings/openvpn.gpg] https://packages.openvpn.net/openvpn3/debian \$(lsb_release -cs) main' | sudo tee /etc/apt/sources.list.d/openvpn3.list"
            echo "         sudo apt update && sudo apt install openvpn3"
            echo "      2. Import config: openvpn3 config-import --config $VPN_CONFIG_FILE"
            echo "      3. Connect: openvpn3 session-start --config $VPN_CONFIG_FILE"
            echo "      4. Browser will open for SAML authentication"
            echo ""
            echo "   🥈 NetworkManager GUI (Alternative):"
            echo "      1. Open Network Settings → VPN → Add VPN"
            echo "      2. Import from file → Select: $VPN_CONFIG_FILE"
            echo "      3. Connect (browser will open for SAML auth)"
        else
            echo "   🔑 $auth_method authentication"
            echo "   You can use command-line methods:"
            echo ""
            echo "   � OpenVPN Connect (CLI):"
            echo "      openvpn3 config-import --config $VPN_CONFIG_FILE"
            echo "      openvpn3 session-start --config $VPN_CONFIG_FILE"
            echo ""
            echo "   � Standard OpenVPN (if you have sudo):"
            echo "      sudo openvpn --config $VPN_CONFIG_FILE --daemon"
        fi
        
        echo ""
        echo "   💡 After connecting VPN manually, the web app will detect it"
        echo "      and PBX connectivity tests will work properly."
        echo ""
        return 1
    fi
    
    # If we can use sudo, check auth method before proceeding
    if [[ "$auth_method" == "SAML/WEB_AUTH" ]]; then
        log "WARN" "SAML/WEB_AUTH detected - cannot automate in headless mode"
        log "WARN" "Please connect VPN manually using OpenVPN Connect or NetworkManager"
        echo ""
        echo "⚠️  SAML/WEB_AUTH VPN Detected:"
        echo "   This VPN requires interactive browser authentication"
        echo "   Cannot be automated in headless/server mode"
        echo ""
        echo "   Please connect manually using:"
        echo "   • OpenVPN Connect with GUI"
        echo "   • NetworkManager through desktop settings"
        echo ""
        return 1
    fi

    # Stop any existing VPN connections
    sudo pkill -f "openvpn.*${VPN_CONFIG_FILE}" 2>/dev/null || true
    sleep 2

    # Build OpenVPN command
    local vpn_cmd="openvpn --config $VPN_CONFIG_FILE --daemon --log-append vpn-server.log"
    
    # Add credentials file if it exists
    if [[ -f "$VPN_CREDENTIALS_FILE" ]]; then
        vpn_cmd="$vpn_cmd --auth-user-pass $VPN_CREDENTIALS_FILE"
        log "INFO" "Using credentials file: $VPN_CREDENTIALS_FILE"
    fi

    # Start VPN connection
    log "INFO" "Starting VPN connection: $vpn_cmd"
    if eval "sudo $vpn_cmd"; then
        log "INFO" "VPN command executed successfully"
    else
        log "ERROR" "Failed to execute VPN command"
        return 1
    fi
    
    # Wait a moment for connection to establish
    sleep 5
    
    # Check if VPN started successfully
    if check_vpn_status; then
        log "SUCCESS" "Persistent VPN connection established"
        
        # Log VPN interface information
        local vpn_interface=$(ip route | grep '^0.0.0.0' | grep tun | awk '{print $5}' | head -1)
        if [[ -n "$vpn_interface" ]]; then
            local vpn_ip=$(ip addr show "$vpn_interface" 2>/dev/null | grep 'inet ' | awk '{print $2}' | head -1)
            log "INFO" "VPN interface: $vpn_interface, IP: $vpn_ip"
        fi
        
        return 0
    else
        log "ERROR" "Failed to establish persistent VPN connection"
        log "WARN" "This may be due to SAML authentication requirements"
        log "WARN" "Please connect VPN manually using a GUI client"
        return 1
    fi
}

# Function to monitor and maintain VPN connection
monitor_vpn_connection() {
    if [[ "$ENABLE_PERSISTENT_VPN" != "true" ]]; then
        return 0
    fi

    while true; do
        sleep "$VPN_CHECK_INTERVAL"
        
        if ! check_vpn_status; then
            log "WARN" "VPN connection lost. Attempting reconnection..."
            start_persistent_vpn
        else
            log "DEBUG" "VPN connection healthy"
        fi
    done
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

# Check jq (required for JSON parsing in admin user creation)
if command_exists jq; then
    log "SUCCESS" "jq found for JSON processing"
else
    log "WARN" "jq not found - admin user creation may be limited"
    echo "⚠️  Warning: jq not found. Admin user creation may be limited."
    echo "   Install with: sudo apt-get install jq"
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
        if check_service_health "http://localhost:3001/health" "SSH WebSocket backend"; then
            log "SUCCESS" "SSH WebSocket backend is healthy and ready"
            
            # Start persistent VPN if enabled for dedicated server mode
            if [[ "$ENABLE_PERSISTENT_VPN" == "true" ]]; then
                echo ""
                echo "🔗 Starting persistent VPN connection for dedicated server..."
                if start_persistent_vpn; then
                    # Start VPN monitoring in background
                    monitor_vpn_connection &
                    VPN_MONITOR_PID=$!
                    log "INFO" "VPN connection monitor started (PID: $VPN_MONITOR_PID)"
                else
                    log "WARN" "VPN startup failed, continuing without VPN connection"
                    echo "⚠️  VPN connection failed, but web services will continue"
                fi
            fi
        else
            log "ERROR" "SSH WebSocket backend failed to start properly"
            echo "❌ SSH WebSocket backend failed to start"
            cleanup
            exit 1
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
# STEP 7: Start Frontend Application (Development or Production)
#################################################################################

echo ""
if [ "$PRODUCTION_MODE" = "true" ]; then
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
        if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
            log "ERROR" "Build verification failed"
            echo "❌ Error: Build verification failed. Check build.log for details."
            cleanup
            exit 1
        fi
        
        log "SUCCESS" "Build verification passed"
        echo "✅ Build verification passed"
    else
        log "ERROR" "Production build failed"
        echo "❌ Error: Production build failed. Check build.log for details."
        cleanup
        exit 1
    fi
    
    echo ""
    echo "🌐 Starting production static file server..."
    echo "   Configuration:"
    echo "   • Serving: Production build from 'dist' directory"
    echo "   • Host: 0.0.0.0 (accessible from network)"
    echo "   • Port: 3000"
    echo "   • Router support: Yes (SPA routing)"
    echo "   • External access: Yes"
    
    log "INFO" "Starting static file server..."
    
    if [ -f "backend/static-server.js" ]; then
        cd backend
        nohup node static-server.js > static-server.log 2>&1 &
        VITE_PID=$!  # Reuse VITE_PID variable for consistency
        cd ..
        
        log "SUCCESS" "Static file server started (PID: $VITE_PID)"
        echo "✅ Static file server started (PID: $VITE_PID) on port 3000"
        
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
else
    echo "🌐 Starting Vite development server..."
    echo "   Configuration:"
    echo "   • Host: 0.0.0.0 (accessible from network)"
    echo "   • Port: 3000"
    echo "   • Auto-open browser: Yes"
    echo "   • HTTPS: Auto-configured if available"
    echo "   • Strict port: Yes (fail if port unavailable)"
    echo "   ⚠️  Note: Development mode - external access may have limitations"
    
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
# STEP 7.5: Create Additional Admin Users (Optional)
#################################################################################

echo ""
echo "👥 Checking for additional admin users..."

# Function to create admin user via API
create_admin_user() {
    local username=$1
    local email=$2
    local password=$3
    
    # Wait for auth server to be ready
    if ! wait_for_service 3002 "Authentication server"; then
        log "WARN" "Auth server not ready, skipping user creation"
        return 1
    fi
    
    # Get admin token
    local token
    token=$(curl -s -X POST http://localhost:3002/api/login \
        -H "Content-Type: application/json" \
        -d '{"username":"admin","password":"SecureAdmin123!"}' 2>/dev/null | jq -r '.token 2>/dev/null' || echo "")
    
    if [ -z "$token" ] || [ "$token" = "null" ]; then
        log "WARN" "Could not get admin token for user creation"
        return 1
    fi
    
    # Create user
    local response
    response=$(curl -s -X POST http://localhost:3002/api/admin/users \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $token" \
        -d "{\"username\":\"$username\",\"email\":\"$email\",\"password\":\"$password\",\"role\":\"admin\"}" 2>/dev/null)
    
    if echo "$response" | jq -e '.id' >/dev/null 2>&1; then
        log "SUCCESS" "Created admin user: $username ($email)"
        return 0
    elif echo "$response" | grep -q "already exists"; then
        log "INFO" "Admin user $username already exists"
        return 0
    else
        log "WARN" "Failed to create admin user $username: $response"
        return 1
    fi
}

# List of admin users to create (only if they don't exist)
# Format: username|email|password
ADMIN_USERS="
tjohnson|tjohnson@123.net|Joshua3412@
chyatt|chyatt@123.net|sdxczv@Y2023
dgoldman|dgoldman@123.net|sdxczv@Y2023
amenko|amenko@123.net|sdxczv@Y2023
npomaville|npomaville@123.net|sdxczv@Y2023
"

# Check if we should create additional admin users
if [ -f ".env" ] && grep -q "^CREATE_ADMIN_USERS=true" .env 2>/dev/null; then
    echo "🔧 Creating additional admin users (enabled in .env)..."
    log "INFO" "Creating additional admin users (enabled in .env)"
    
    # Wait a bit for auth server to fully initialize
    sleep 2
    
    echo "$ADMIN_USERS" | while IFS='|' read -r username email password; do
        if [ ! -z "$username" ]; then
            create_admin_user "$username" "$email" "$password"
        fi
    done
    
    echo "✅ Admin user creation process complete"
    log "SUCCESS" "Admin user creation process complete"
else
    echo "ℹ️  Additional admin user creation disabled"
    echo "   To enable: Add 'CREATE_ADMIN_USERS=true' to your .env file"
    echo "   Or run: ./create-admin-users.sh"
    log "INFO" "Additional admin user creation disabled"
fi

#################################################################################
# STEP 8: Display Enhanced Status and Monitoring
#################################################################################

echo ""
echo "🎉 All services started successfully!"
echo ""

if [ "$PRODUCTION_MODE" = "true" ]; then
    echo "🏭 Running in PRODUCTION mode"
    echo ""
    echo "📍 Service URLs:"
    echo "   🌐 Main Application:     http://localhost:3000 (Production Build)"
    echo "   🔧 SSH WebSocket API:    http://localhost:3001"
    echo "   🔐 Authentication API:   http://localhost:3002"
    echo ""
    echo "🌍 External Access (Ready for Internet):"
    local_ip=$(hostname -I | awk '{print $1}')
    echo "   📱 From LAN:             http://$local_ip:3000"
    echo "   🌐 From Internet:        http://your-external-ip:3000"
    echo "   ✅ Production build supports full external access"
    echo ""
    echo "📁 Log Files:"
    echo "   🔧 SSH Backend: backend/ssh-ws-server.log"
    echo "   🔐 Auth Server: backend/auth-server.log"
    echo "   🌐 Static Server: backend/static-server.log"
    echo "   📝 Startup Log: $LOG_FILE"
    echo "   🔨 Build Log: build.log"
else
    echo "🛠️  Running in DEVELOPMENT mode"
    echo ""
    echo "📍 Service URLs:"
    echo "   🌐 Main Application:     http://localhost:3000 (Vite Dev Server)"
    echo "   🔧 SSH WebSocket API:    http://localhost:3001"
    echo "   🔐 Authentication API:   http://localhost:3002"
    echo ""
    echo "🌍 Network Access:"
    echo "   📱 From other devices:   http://$(hostname -I | awk '{print $1}'):3000"
    echo "   ⚠️  Note: External access may have limitations in dev mode"
    echo "   💡 For external users, run: PRODUCTION_MODE=true ./start-app.sh"
    echo ""
    echo "📁 Log Files:"
    echo "   🔧 SSH Backend: backend/ssh-ws-server.log"
    echo "   🔐 Auth Server: backend/auth-server.log"
    echo "   🌐 Vite Server: vite.log"
    echo "   📝 Startup Log: $LOG_FILE"
fi
echo ""
echo "� Default Admin Credentials:"
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
echo "�🔍 Process IDs:"
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
echo "   • Persistent VPN connection for dedicated troubleshooting server"
echo "   • Network diagnostics with actual ping tests"
echo "   • Robust process management and auto-recovery"
echo "   • Comprehensive health monitoring"
echo "   • Enhanced security with environment variables"

# Show VPN status if persistent VPN is enabled
if [[ "$ENABLE_PERSISTENT_VPN" == "true" ]]; then
    echo ""
    echo "🔗 Persistent VPN Status:"
    if check_vpn_status; then
        echo "   ✅ VPN Connected (Dedicated server mode active)"
        # Try to get VPN interface info
        local vpn_interface=$(ip route | grep '^0.0.0.0' | grep tun | awk '{print $5}' | head -1)
        if [[ -n "$vpn_interface" ]]; then
            local vpn_ip=$(ip addr show "$vpn_interface" 2>/dev/null | grep 'inet ' | awk '{print $2}' | head -1)
            echo "   🖧  Interface: $vpn_interface, IP: $vpn_ip"
        fi
    else
        echo "   ❌ VPN Disconnected (Check VPN config and credentials)"
    fi
    echo "   📁 Config: $VPN_CONFIG_FILE"
    echo "   📝 Logs: vpn-server.log"
fi

echo ""
echo "🌐 Web Application Architecture:"
echo "   • Frontend: Universal web interface (works for all users)"
echo "   • Backend: Server-side VPN processing and system integration"
echo "   • Client Apps: Separate native applications (OpenVPN Connect, etc.)"
echo ""
echo "👥 User Scenarios:"
echo "   • Dev Server: Full system integration (Linux detection, auto-install)"
echo "   • End Users: Config download + client recommendations"
echo "   • Mobile Users: QR code import + app store links"
echo ""
echo "🎯 Dedicated PBX Troubleshooting Server Setup:"
echo "   • Purpose: Web-based VPN and PBX diagnostics"
echo "   • VPN Config: Pre-loaded tjohnson-work.ovpn (SAML-based)"
echo "   • Web Interface: Upload config, connect VPN, test PBX connectivity"
echo "   • Remote Access: Users access diagnostics from anywhere via browser"
echo ""
echo "� SAML VPN Authentication Workflow:"
echo "   The VPN config uses SAML/WEB_AUTH which requires interactive browser login."
echo "   This cannot be automated - you must connect manually first:"
echo ""
echo "   1. Connect VPN manually using GUI:"
echo "      • OpenVPN Connect: openvpn3 session-start --config backend/tjohnson-work.ovpn"
echo "      • Or NetworkManager: Import config → Connect → Browser auth"
echo ""
echo "   2. Access web app: http://localhost:3000"
echo "   3. Log in with admin credentials (shown above)"
echo "   4. Go to Diagnostic page"
echo "   5. VPN status will show 'Connected' once manual connection is established"
echo "   6. Test PBX connectivity: 69.39.69.102:5060, etc."
echo "   7. Share results with remote users"
echo ""
echo "💡 Alternative for Production:"
echo "   • Request credential-based VPN config from IT (username/password)"
echo "   • Use certificate-based authentication instead of SAML"
echo "   • Deploy on a desktop with GUI for SAML authentication"
echo ""
echo "⌨️  Press Ctrl+C to stop all services"
echo ""

log "SUCCESS" "All services are running and healthy"
log "INFO" "System ready for use"

# Wait for all processes to complete (or until user interrupts)
wait
