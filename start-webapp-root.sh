#!/bin/bash
#
# Start Phone Config Webapp with Root HTTPS Proxy
# This script starts the webapp with HTTPS proxy running on port 443 as root
#

echo "🚀 Starting Phone Config Webapp with Root HTTPS Proxy..."

# Change to project directory
cd "$(dirname "$0")"

# Function to check if a port is in use
check_port() {
    netstat -tlnp 2>/dev/null | grep ":$1 " >/dev/null
}

# Function to start a service
start_service() {
    local name="$1"
    local script="$2"
    local port="$3"
    local use_sudo="$4"
    
    echo "📡 Starting $name on port $port..."
    
    if check_port "$port"; then
        echo "⚠️  Port $port already in use, stopping existing process..."
        # Kill any existing process on this port
        local pid=$(netstat -tlnp 2>/dev/null | grep ":$port " | awk '{print $7}' | cut -d'/' -f1)
        if [ ! -z "$pid" ]; then
            kill "$pid" 2>/dev/null
            sleep 2
        fi
    fi
    
    # Start the service
    if [ "$use_sudo" = "true" ]; then
        (cd backend && sudo nohup node "$script" > "${name}.log" 2>&1 &)
    else
        (cd backend && nohup node "$script" > "${name}.log" 2>&1 &)
    fi
    
    echo "✅ $name started"
}

# Stop any existing services
echo "🛑 Stopping existing services..."
pkill -f "ssh-ws-server.js" 2>/dev/null
pkill -f "auth-server.js" 2>/dev/null
pkill -f "simple-proxy-https.js" 2>/dev/null
pkill -f "management-server.js" 2>/dev/null
sleep 2

# Check if build exists
if [ ! -d "dist" ]; then
    echo "📦 Building webapp..."
    npm run build:dev
    if [ $? -ne 0 ]; then
        echo "❌ Build failed!"
        exit 1
    fi
fi

# Start services
start_service "ssh-ws" "ssh-ws-server.js" "3001" "false"
sleep 2

start_service "auth" "auth-server.js" "3002" "false"
sleep 2

start_service "https-proxy" "simple-proxy-https.js" "443" "true"
sleep 2

start_service "management" "management-server.js --allow-lan" "3099" "false"
sleep 3

# Verify services are running
echo ""
echo "🔍 Checking service status..."

check_service() {
    local name="$1"
    local port="$2"
    local url="$3"
    
    if check_port "$port"; then
        echo "✅ $name is running on port $port"
        if [ ! -z "$url" ]; then
            # Test HTTP endpoint
            if curl -s -k --max-time 5 "$url" >/dev/null 2>&1; then
                echo "   🌐 $name is responding to requests"
            else
                echo "   ⚠️  $name is listening but not responding"
            fi
        fi
    else
        echo "❌ $name is NOT running on port $port"
    fi
}

check_service "SSH WebSocket Server" "3001" "http://localhost:3001/health"
check_service "Auth Server" "3002" "http://localhost:3002/health"
check_service "HTTPS Proxy" "443" "https://localhost/proxy-health"
check_service "Management Console" "3099" "http://localhost:3099"

echo ""
echo "🎉 Webapp startup complete!"
echo ""
echo "📋 Access Information:"
echo "   🌐 Main Webapp (HTTPS): https://localhost"
echo "   🌐 Main Webapp (Local):  https://123hostedtools.com"
echo "   🔧 Management Console:   http://localhost:3099"
echo "   📊 Diagnostics:          http://localhost:3099/diagnostics.html"
echo "   🔐 VPN Management:       http://localhost:3099/vpn-management.html"
echo ""
echo "💡 The webapp is now accessible on standard HTTPS port 443!"
echo "💡 External access: https://YOUR_DOMAIN_OR_IP"
