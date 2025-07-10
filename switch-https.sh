#!/bin/bash

# Simple HTTPS Switch Script for Production
# Switches between HTTP (port 3000) and HTTPS (port 8443) modes

echo "🔄 Mikrotik OTT Config Generator - HTTPS Switch"
echo "=============================================="

# Function to stop all services
stop_services() {
    echo "🛑 Stopping all services..."
    pkill -f "simple-proxy" || true
    pkill -f "auth-server" || true
    pkill -f "ssh-ws-server" || true
    sleep 2
    echo "✅ Services stopped"
}

# Function to start HTTP services (current production)
start_http() {
    echo "🌐 Starting HTTP services..."
    cd backend
    nohup node ssh-ws-server.js > ssh-ws-server.log 2>&1 &
    nohup node auth-server.js > auth-server.log 2>&1 &
    nohup node simple-proxy.js > simple-proxy.log 2>&1 &
    cd ..
    sleep 2
    echo "✅ HTTP services started on port 3000"
    echo "🌐 Access at: http://localhost:3000"
}

# Function to start HTTPS services  
start_https() {
    echo "🔒 Starting HTTPS services..."
    cd backend
    nohup node ssh-ws-server.js > ssh-ws-server.log 2>&1 &
    nohup node auth-server.js > auth-server.log 2>&1 &
    PROXY_PORT=8443 nohup node simple-proxy-https.js > simple-proxy-https.log 2>&1 &
    cd ..
    sleep 2        echo "✅ HTTPS services started on port 8443"
        echo "🔒 Access at: https://localhost:8443"
        echo "🌐 External access: https://timsablab.ddns.net:8443"
        echo "✅ Using trusted No-IP SSL certificate (no browser warnings!)"
}

# Function to check service status
check_status() {
    echo "📊 Service Status:"
    if pgrep -f "simple-proxy" > /dev/null; then
        echo "✅ Proxy server is running"
    else
        echo "❌ Proxy server is not running"
    fi
    
    if pgrep -f "auth-server" > /dev/null; then
        echo "✅ Auth server is running"
    else
        echo "❌ Auth server is not running"
    fi
    
    if pgrep -f "ssh-ws-server" > /dev/null; then
        echo "✅ SSH WebSocket server is running"
    else
        echo "❌ SSH WebSocket server is not running"
    fi
}

# Main menu
case "${1:-}" in
    "http")
        stop_services
        start_http
        check_status
        ;;
    "https")
        stop_services
        start_https
        check_status
        ;;
    "stop")
        stop_services
        ;;
    "status")
        check_status
        ;;
    *)
        echo "Usage: $0 {http|https|stop|status}"
        echo ""
        echo "Commands:"
        echo "  http    - Start HTTP services (port 3000)"
        echo "  https   - Start HTTPS services (port 8443)"
        echo "  stop    - Stop all services"
        echo "  status  - Check service status"
        echo ""
        echo "🔒 HTTPS Note: Using trusted No-IP certificate for timsablab.ddns.net"
        echo "📋 No browser warnings - fully trusted SSL!"
        ;;
esac
