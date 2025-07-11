#!/bin/bash

# Custom startup script for timsablab.ddns.net
# HTTPS-enabled startup for external access

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Domain Configuration
DOMAIN="timsablab.ddns.net"
EXTERNAL_IP="67.149.139.23"

# Logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Banner
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                   Tim's AbLab Phone Config Generator            ║"
echo "║                      HTTPS Production Server                     ║"
echo "║                     Domain: $DOMAIN             ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Load environment variables
if [[ -f .env ]]; then
    log "Loading environment variables from .env"
    export $(cat .env | grep -v '^#' | xargs)
else
    warn ".env file not found, using defaults"
fi

# Cleanup function
cleanup() {
    log "Shutting down services..."
    
    # Kill all background processes started by this script
    jobs -p | xargs -r kill 2>/dev/null || true
    
    # Additional cleanup
    pkill -f "auth-server.js" 2>/dev/null || true
    pkill -f "ssh-ws-server.js" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    
    log "Cleanup completed"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Create necessary directories
log "Creating necessary directories..."
mkdir -p ssl
mkdir -p logs
mkdir -p data

# Check if SSL certificates exist or generate them
check_ssl_certificates() {
    log "Checking SSL certificates..."
    
    if [[ -f "ssl/certificate.pem" && -f "ssl/private-key.pem" ]]; then
        log "SSL certificates found"
        
        # Check if certificates are valid for our domain
        if openssl x509 -in ssl/certificate.pem -text -noout | grep -q "$DOMAIN"; then
            log "Certificates are valid for $DOMAIN"
            return 0
        else
            warn "Certificates don't match domain $DOMAIN, regenerating..."
        fi
    else
        log "SSL certificates not found, generating..."
    fi
    
    # Generate new certificates
    log "Generating SSL certificates for $DOMAIN..."
    openssl req -x509 -newkey rsa:4096 \
        -keyout ssl/private-key.pem \
        -out ssl/certificate.pem \
        -days 365 -nodes \
        -subj "/C=US/ST=Michigan/L=Detroit/O=TimsAbLab/CN=$DOMAIN" \
        -addext "subjectAltName=DNS:$DOMAIN,DNS:localhost,IP:127.0.0.1,IP:$EXTERNAL_IP"
    
    if [[ $? -eq 0 ]]; then
        log "SSL certificates generated successfully"
        warn "Using self-signed certificates - browsers will show security warnings"
        info "For production, consider using Let's Encrypt certificates"
    else
        error "Failed to generate SSL certificates"
        exit 1
    fi
}

# Install dependencies if needed
install_dependencies() {
    log "Checking dependencies..."
    
    if [[ ! -d "node_modules" || ! -f "node_modules/.package-lock.json" ]]; then
        log "Installing Node.js dependencies..."
        npm install
        if [[ $? -ne 0 ]]; then
            error "Failed to install dependencies"
            exit 1
        fi
    else
        log "Dependencies already installed"
    fi
}

# Build the application
build_application() {
    log "Building application for production..."
    
    # Use HTTPS Vite config
    if [[ -f "vite.config.https.ts" ]]; then
        cp vite.config.https.ts vite.config.ts
        log "Using HTTPS Vite configuration"
    fi
    
    npm run build
    if [[ $? -ne 0 ]]; then
        error "Failed to build application"
        exit 1
    fi
    
    log "Application built successfully"
}

# Start services
start_auth_server() {
    log "Starting authentication server on port 3002..."
    cd backend
    node auth-server.js > ../logs/auth-server.log 2>&1 &
    AUTH_SERVER_PID=$!
    cd ..
    
    # Wait for auth server to start
    sleep 3
    if kill -0 $AUTH_SERVER_PID 2>/dev/null; then
        log "Authentication server started (PID: $AUTH_SERVER_PID)"
    else
        error "Failed to start authentication server"
        cat logs/auth-server.log
        exit 1
    fi
}

start_ssh_ws_server() {
    log "Starting SSH WebSocket server on port 3001..."
    cd backend
    node ssh-ws-server.js > ../logs/ssh-ws-server.log 2>&1 &
    SSH_WS_PID=$!
    cd ..
    
    # Wait for SSH WS server to start
    sleep 3
    if kill -0 $SSH_WS_PID 2>/dev/null; then
        log "SSH WebSocket server started (PID: $SSH_WS_PID)"
    else
        error "Failed to start SSH WebSocket server"
        cat logs/ssh-ws-server.log
        exit 1
    fi
}

start_frontend() {
    log "Starting HTTPS frontend server on port 3000..."
    npm run preview -- --host 0.0.0.0 --port 3000 > logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    
    # Wait for frontend to start
    sleep 5
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        log "Frontend server started (PID: $FRONTEND_PID)"
    else
        error "Failed to start frontend server"
        cat logs/frontend.log
        exit 1
    fi
}

# Health checks
check_services() {
    log "Performing health checks..."
    
    local all_healthy=true
    
    # Check auth server
    if curl -k -s https://localhost:3002/health > /dev/null 2>&1; then
        log "✓ Auth server is healthy"
    else
        warn "✗ Auth server health check failed"
        all_healthy=false
    fi
    
    # Check SSH WebSocket server
    if curl -k -s https://localhost:3001/health > /dev/null 2>&1; then
        log "✓ SSH WebSocket server is healthy"
    else
        warn "✗ SSH WebSocket server health check failed"
        all_healthy=false
    fi
    
    # Check frontend
    if curl -k -s https://localhost:3000 > /dev/null 2>&1; then
        log "✓ Frontend server is healthy"
    else
        warn "✗ Frontend server health check failed"
        all_healthy=false
    fi
    
    if [[ "$all_healthy" == "true" ]]; then
        log "All services are healthy!"
    else
        warn "Some services failed health checks"
    fi
}

# Configure firewall (if ufw is available)
configure_firewall() {
    if command -v ufw >/dev/null 2>&1; then
        log "Configuring firewall rules..."
        
        # Allow SSH
        sudo ufw allow 22/tcp >/dev/null 2>&1 || true
        
        # Allow HTTPS ports
        sudo ufw allow 443/tcp >/dev/null 2>&1 || true
        sudo ufw allow 3000/tcp >/dev/null 2>&1 || true
        sudo ufw allow 3001/tcp >/dev/null 2>&1 || true
        sudo ufw allow 3002/tcp >/dev/null 2>&1 || true
        
        log "Firewall rules configured"
    else
        info "UFW not available, skipping firewall configuration"
    fi
}

# Main execution
main() {
    log "Starting Tim's AbLab Phone Config Generator for $DOMAIN"
    
    # Setup
    check_ssl_certificates
    install_dependencies
    build_application
    configure_firewall
    
    # Start services
    start_auth_server
    start_ssh_ws_server
    start_frontend
    
    # Health checks
    sleep 5
    check_services
    
    # Success message
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║                        🚀 STARTUP COMPLETE! 🚀                   ║"
    echo "╠══════════════════════════════════════════════════════════════════╣"
    echo "║                                                                  ║"
    echo "║ 🌐 Access URLs:                                                  ║"
    echo "║                                                                  ║"
    echo "║ 📱 Main App:         https://$DOMAIN:3000           ║"
    echo "║ 🔐 External Access:  https://$EXTERNAL_IP:3000       ║"
    echo "║ 🖥️  Local Access:     https://localhost:3000                     ║"
    echo "║                                                                  ║"
    echo "║ 🔧 API Endpoints:                                                ║"
    echo "║   • Auth API:        https://$DOMAIN:3002           ║"
    echo "║   • SSH WebSocket:   wss://$DOMAIN:3001             ║"
    echo "║                                                                  ║"
    echo "║ 📋 Admin Login:      admin / 123NetAdmin2024!                    ║"
    echo "║                                                                  ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    info "Press Ctrl+C to stop all services"
    
    # Keep script running
    while true; do
        sleep 10
        
        # Check if any service died
        if ! kill -0 $AUTH_SERVER_PID 2>/dev/null; then
            error "Auth server died, restarting..."
            start_auth_server
        fi
        
        if ! kill -0 $SSH_WS_PID 2>/dev/null; then
            error "SSH WebSocket server died, restarting..."
            start_ssh_ws_server
        fi
        
        if ! kill -0 $FRONTEND_PID 2>/dev/null; then
            error "Frontend server died, restarting..."
            start_frontend
        fi
    done
}

# Run main function
main
