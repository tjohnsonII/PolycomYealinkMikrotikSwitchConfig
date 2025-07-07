#!/bin/bash

#################################################################################
# Unified Startup Script for Complete Application Stack
# 
# This script starts all necessary backend and frontend services for the
# Polycom/Yealink Phone Configuration Generator with Authentication.
# 
# Services started:
# 1. SSH WebSocket backend server (port 3001) - for terminal/SSH functionality
# 2. Authentication server (port 3002) - for user management and auth
# 3. Main Vite development server (port 3000) - frontend application
# 
# What this script does:
# - Checks system requirements (Node.js, npm)
# - Installs/updates dependencies
# - Manages port availability and cleanup
# - Starts all services in correct order
# - Provides graceful shutdown when terminated (Ctrl+C)
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

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -i :$1 -sTCP:LISTEN -t >/dev/null 2>&1
}

# Function to kill process using a port
kill_port() {
    local port=$1
    local service_name=$2
    
    if port_in_use $port; then
        PID=$(lsof -i :$port -sTCP:LISTEN -t)
        echo "⚠️  Port $port is in use by process $PID ($service_name). Killing it..."
        if kill -9 $PID 2>/dev/null; then
            echo "✅ Process $PID terminated successfully"
            sleep 2  # Give it time to clean up
        else
            echo "❌ Failed to kill process $PID"
            return 1
        fi
    else
        echo "✅ Port $port is free for $service_name"
    fi
}

# Cleanup function for graceful shutdown
cleanup() {
    echo ""
    echo "🛑 Shutting down all services..."
    
    # Kill SSH WebSocket backend if running
    if [ ! -z "$SSH_WS_PID" ] && kill -0 $SSH_WS_PID 2>/dev/null; then
        echo "   Stopping SSH WebSocket backend..."
        kill $SSH_WS_PID 2>/dev/null
    fi
    
    # Kill authentication server if running
    if [ ! -z "$AUTH_PID" ] && kill -0 $AUTH_PID 2>/dev/null; then
        echo "   Stopping authentication server..."
        kill $AUTH_PID 2>/dev/null
    fi
    
    # Kill Vite dev server if running
    if [ ! -z "$VITE_PID" ] && kill -0 $VITE_PID 2>/dev/null; then
        echo "   Stopping Vite development server..."
        kill $VITE_PID 2>/dev/null
    fi
    
    # Additional cleanup - kill any remaining processes by name
    pkill -f "ssh-ws-server.js" 2>/dev/null || true
    pkill -f "auth-server.js" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    
    echo "✅ All services stopped successfully"
    exit
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
# STEP 8: Start Vite Development Server
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
# STEP 9: Display Status and Wait
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
