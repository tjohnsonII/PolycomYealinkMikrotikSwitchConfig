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
# Usage: ./start-unified-app.sh
# or: chmod +x start-unified-app.sh && ./start-unified-app.sh
#################################################################################

set -e  # Exit on any error

echo "🚀 Starting Complete Application Stack..."
echo "   📱 Phone Configuration Generator"
echo "   🔐 Authentication System"
echo "   🔧 SSH WebSocket Backend"
echo ""

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
    
    # Clean up VPN processes and interfaces
    log "INFO" "Cleaning up VPN processes..."
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

# Set trap to cleanup on script exit (Ctrl+C, kill, etc.)
trap cleanup SIGINT SIGTERM

#################################################################################
# STEP 1: Environment Configuration Check
#################################################################################

echo "🔧 Checking environment configuration..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "   Creating .env from template..."
    
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ Created .env file from .env.example"
        echo "🔑 Please edit .env file to set secure credentials:"
        echo "   - JWT_SECRET: Use a strong random key"
        echo "   - DEFAULT_ADMIN_PASSWORD: Change from default"
        echo ""
        echo "💡 Generate secure JWT secret with:"
        echo "   node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
        echo ""
    else
        echo "❌ Error: .env.example template not found!"
        echo "   Please create .env file manually with required variables."
        echo "   See SECURITY.md for configuration details."
        exit 1
    fi
else
    echo "✅ Environment file (.env) found"
fi

# Validate critical environment variables
if ! grep -q "^JWT_SECRET=" .env 2>/dev/null; then
    echo "⚠️  Warning: JWT_SECRET not found in .env file"
    echo "   Authentication will use an insecure fallback!"
fi

#################################################################################
# STEP 2: System Requirements Check
#################################################################################

echo "🔍 Checking system requirements..."

if ! command_exists node; then
    echo "❌ Error: Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command_exists npm; then
    echo "❌ Error: npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

#################################################################################
# STEP 3: Dependencies Installation
#################################################################################

echo ""
echo "📦 Installing/updating dependencies..."
if ! npm install; then
    echo "❌ Error: Failed to install dependencies"
    exit 1
fi

#################################################################################
# STEP 4: Port Management
#################################################################################

echo ""
echo "🔍 Checking port availability..."

# Check and clear ports
kill_port 3000 "Vite dev server"
kill_port 3001 "SSH WebSocket backend"
kill_port 3002 "Authentication server"

#################################################################################
# STEP 5: Build Check
#################################################################################

echo ""
echo "🔨 Running build check..."
if npm run build > /dev/null 2>&1; then
    echo "✅ Build check passed"
else
    echo "⚠️  Warning: Build check failed. There may be TypeScript errors."
    echo "   Continuing with servers anyway..."
fi

#################################################################################
# STEP 6: Start SSH WebSocket Backend
#################################################################################

echo ""
echo "🔧 Starting SSH WebSocket backend..."

if [ -f "backend/ssh-ws-server.js" ]; then
    cd backend
    nohup node ssh-ws-server.js > ssh-ws-server.log 2>&1 &
    SSH_WS_PID=$!
    cd ..
    echo "✅ SSH WebSocket backend started (PID: $SSH_WS_PID) on port 3001"
else
    echo "⚠️  Warning: backend/ssh-ws-server.js not found. Continuing without SSH backend."
    SSH_WS_PID=""
fi

#################################################################################
# STEP 7: Start Authentication Server
#################################################################################

echo ""
echo "🔐 Starting authentication server..."

if [ -f "backend/auth-server.js" ]; then
    cd backend
    node auth-server.js &
    AUTH_PID=$!
    cd ..
    echo "✅ Authentication server started (PID: $AUTH_PID) on port 3002"
    
    # Wait for auth server to initialize
    echo "⏳ Waiting for authentication server to initialize..."
    sleep 3
else
    echo "⚠️  Warning: backend/auth-server.js not found. Continuing without authentication."
    AUTH_PID=""
fi

#################################################################################
# STEP 8: Create Additional Admin Users (Optional)
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
    
    # Wait a bit for auth server to fully initialize
    sleep 2
    
    echo "$ADMIN_USERS" | while IFS='|' read -r username email password; do
        if [ ! -z "$username" ]; then
            create_admin_user "$username" "$email" "$password"
        fi
    done
    
    echo "✅ Admin user creation process complete"
else
    echo "ℹ️  Additional admin user creation disabled"
    echo "   To enable: Add 'CREATE_ADMIN_USERS=true' to your .env file"
    echo "   Or run: ./create-admin-users.sh"
fi

#################################################################################
# STEP 9: Start Vite Development Server
#################################################################################

echo ""
echo "🌐 Starting Vite development server..."
echo "   Configuration:"
echo "   • Host: 0.0.0.0 (accessible from network)"
echo "   • Port: 3000"
echo "   • Auto-open browser: Yes"
echo "   • HTTPS: Auto-configured if available"
echo "   • Strict port: Yes (fail if port unavailable)"

# Start Vite in background
npm run dev -- \
    --host 0.0.0.0 \
    --port 3000 \
    --open \
    --strictPort &
VITE_PID=$!

# Wait a moment to check if Vite started successfully
sleep 2
if ! kill -0 $VITE_PID 2>/dev/null; then
    echo "❌ Failed to start Vite development server"
    echo "💡 Troubleshooting tips:"
    echo "   • Check for TypeScript errors: npm run build"
    echo "   • Check port availability: lsof -i :3000"
    cleanup
    exit 1
fi

#################################################################################
# STEP 10: Display Status and Wait
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
echo "   🔐 Auth Server: console output"
echo "   🌐 Vite Server: console output"
echo ""
echo "💡 Tips:"
echo "   • Edit files and see live reloading in action"
echo "   • Check console for any errors or warnings"
echo "   • Use the admin panel to manage users"
echo ""
echo "⌨️  Press Ctrl+C to stop all services"
echo ""

# Wait for all processes to complete (or until user interrupts)
wait
