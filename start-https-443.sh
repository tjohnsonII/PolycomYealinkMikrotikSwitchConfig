#!/bin/bash

# Production HTTPS Start Script for timsablab.ddns.net
# Uses No-IP trusted certificates on port 443

echo "🚀 Starting Production HTTPS with No-IP Certificates"
echo "=================================================="

# Check if running as root (required for port 443)
if [ "$EUID" -ne 0 ]; then
    echo "❌ Error: This script must be run as root to use port 443"
    echo "   Please run: sudo ./start-https-443.sh"
    exit 1
fi

# Set environment variables
export NODE_ENV=production
export PROXY_PORT=443
export AUTH_PORT=3002
export SSH_WS_PORT=3001

# Function to stop services
stop_services() {
    echo "🛑 Stopping existing services..."
    pkill -f "simple-proxy" || true
    pkill -f "auth-server" || true
    pkill -f "ssh-ws-server" || true
    sleep 2
    echo "✅ Services stopped"
}

# Function to start services
start_services() {
    echo "🚀 Starting production HTTPS services..."
    
    # Start backend services
    cd backend
    echo "🔧 Starting SSH WebSocket server..."
    nohup node ssh-ws-server.js > ssh-ws-server.log 2>&1 &
    sleep 1
    
    echo "🔐 Starting authentication server..."
    nohup node auth-server.js > auth-server.log 2>&1 &
    sleep 1
    
    echo "🔒 Starting HTTPS reverse proxy on port 443..."
    nohup node simple-proxy-https.js > simple-proxy-https.log 2>&1 &
    sleep 2
    cd ..
    
    echo "✅ All services started!"
}

# Function to check health
check_health() {
    echo "🏥 Checking service health..."
    
    if pgrep -f "simple-proxy-https" > /dev/null; then
        echo "✅ HTTPS reverse proxy is running"
    else
        echo "❌ HTTPS reverse proxy is not running"
    fi
    
    if pgrep -f "auth-server" > /dev/null; then
        echo "✅ Authentication server is running"
    else
        echo "❌ Authentication server is not running"
    fi
    
    if pgrep -f "ssh-ws-server" > /dev/null; then
        echo "✅ SSH WebSocket server is running"
    else
        echo "❌ SSH WebSocket server is not running"
    fi
    
    echo ""
    echo "🌐 Service URLs:"
    echo "   • Main HTTPS App: https://timsablab.ddns.net"
    echo "   • Local HTTPS:    https://localhost"
    echo "   • Health Check:   https://localhost/proxy-health"
    echo ""
    echo "🔒 SSL Certificate: timsablab.ddns.net (No-IP Trusted)"
    echo "📋 Admin Login: admin / 123NetAdmin2024!"
    echo "👤 User Login: tjohnson / Joshua3412@"
}

# Main execution
main() {
    # Check if SSL certificates exist
    if [ ! -f "ssl/timsablab_ddns_net.crt" ] || [ ! -f "ssl/PrivateKey.key" ]; then
        echo "❌ SSL certificates not found!"
        echo "   Please ensure the following files exist:"
        echo "   • ssl/timsablab_ddns_net.crt"
        echo "   • ssl/PrivateKey.key"
        echo "   • ssl/DigiCertCA.crt"
        echo "   • ssl/TrustedRoot.crt"
        exit 1
    fi
    
    # Check if build exists
    if [ ! -d "dist" ]; then
        echo "🏗️  Building production bundle..."
        npm run build
        if [ $? -ne 0 ]; then
            echo "❌ Build failed. Please check your code."
            exit 1
        fi
    fi
    
    # Stop existing services
    stop_services
    
    # Start new services
    start_services
    
    # Check health
    check_health
    
    echo ""
    echo "🎉 Production HTTPS is now running on port 443!"
    echo "   Access your app at: https://timsablab.ddns.net"
    echo "   Local access: https://localhost"
    echo ""
    echo "🔒 Features:"
    echo "   • Trusted No-IP SSL certificate (no browser warnings)"
    echo "   • Full authentication system"
    echo "   • Mikrotik OTT config generator"
    echo "   • VPN diagnostics and reference"
    echo "   • Switch templates and configuration"
    echo ""
    echo "📋 To monitor logs:"
    echo "   • Proxy:  tail -f backend/simple-proxy-https.log"
    echo "   • Auth:   tail -f backend/auth-server.log"
    echo "   • SSH:    tail -f backend/ssh-ws-server.log"
    echo ""
    echo "🛑 To stop services: sudo pkill -f 'simple-proxy\\|auth-server\\|ssh-ws-server'"
}

# Handle script arguments
case "${1:-}" in
    --stop)
        stop_services
        exit 0
        ;;
    --status)
        check_health
        exit 0
        ;;
    --help)
        echo "Usage: sudo $0 [--stop|--status|--help]"
        echo "  --stop    Stop all services"
        echo "  --status  Check service status"
        echo "  --help    Show this help"
        exit 0
        ;;
esac

# Run main function
main
