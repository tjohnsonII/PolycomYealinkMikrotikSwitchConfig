#!/bin/bash

# Production HTTPS Start Script for Mikrotik OTT Config Generator
# Uses No-IP certificates for timsablab.ddns.net

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if SSL certificates exist
check_ssl() {
    if [[ ! -f "ssl/private-key.pem" ]] || [[ ! -f "ssl/certificate.pem" ]]; then
        error "SSL certificates not found!"
        info "Run: ./setup-ssl.sh --self-signed"
        exit 1
    fi
    log "SSL certificates found ✓"
}

# Stop HTTP services
stop_http_services() {
    log "Stopping HTTP services..."
    
    # Stop processes on our ports
    local ports=(3000 3001 3002)
    for port in "${ports[@]}"; do
        local pid=$(lsof -ti:$port 2>/dev/null)
        if [[ -n "$pid" ]]; then
            warn "Stopping process on port $port (PID: $pid)"
            kill -TERM $pid 2>/dev/null || true
            sleep 2
            if kill -0 $pid 2>/dev/null; then
                warn "Force killing process on port $port"
                kill -KILL $pid 2>/dev/null || true
            fi
        fi
    done
    
    sleep 3
    log "HTTP services stopped ✓"
}

# Start HTTPS services
start_https_services() {
    log "Starting HTTPS services..."
    
    # Ensure build is ready
    if [[ ! -d "dist" ]]; then
        log "Building application..."
        npm run build
    fi
    
    # Create logs directory
    mkdir -p logs
    
    # Start HTTPS authentication server
    info "Starting HTTPS authentication server on port 3002..."
    nohup node backend/auth-server-https.js > logs/auth-server-https.log 2>&1 &
    AUTH_PID=$!
    echo $AUTH_PID > logs/auth-server-https.pid
    
    # Wait for auth server to start
    sleep 3
    
    # Start HTTPS SSH WebSocket server
    info "Starting HTTPS SSH WebSocket server on port 3001..."
    nohup node backend/ssh-ws-server-https.js > logs/ssh-ws-server-https.log 2>&1 &
    SSH_PID=$!
    echo $SSH_PID > logs/ssh-ws-server-https.pid
    
    # Wait for SSH server to start
    sleep 3
    
    # Start HTTPS reverse proxy
    info "Starting HTTPS reverse proxy on port 3000..."
    nohup node backend/simple-proxy-https.js > logs/simple-proxy-https.log 2>&1 &
    PROXY_PID=$!
    echo $PROXY_PID > logs/simple-proxy-https.pid
    
    # Wait for proxy to start
    sleep 3
    
    log "HTTPS services started ✓"
}

# Health check
health_check() {
    log "Performing health checks..."
    
    local max_attempts=5
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        info "Health check attempt $attempt/$max_attempts"
        
        # Check main proxy (this is the entry point)
        if curl -k -s https://localhost:3000/proxy-health > /dev/null 2>&1; then
            log "HTTPS proxy health check passed ✓"
            break
        else
            warn "HTTPS proxy not ready yet..."
            if [[ $attempt -eq $max_attempts ]]; then
                error "HTTPS proxy health check failed after $max_attempts attempts"
                return 1
            fi
        fi
        
        sleep 3
        ((attempt++))
    done
    
    return 0
}

# Display status
show_status() {
    echo ""
    log "🔒 HTTPS Production Services Started Successfully!"
    echo ""
    echo -e "${GREEN}┌─────────────────────────────────────────────────────────────┐${NC}"
    echo -e "${GREEN}│                🔒 HTTPS PRODUCTION STATUS                   │${NC}"
    echo -e "${GREEN}├─────────────────────────────────────────────────────────────┤${NC}"
    echo -e "${GREEN}│ Main App:            https://localhost:3000                │${NC}"
    echo -e "${GREEN}│ External Access:     https://timsablab.ddns.net:3000       │${NC}"
    echo -e "${GREEN}│ Auth Server:         https://localhost:3002                │${NC}"
    echo -e "${GREEN}│ SSH WebSocket:       wss://localhost:3001                  │${NC}"
    echo -e "${GREEN}│                                                             │${NC}"
    echo -e "${GREEN}│ SSL Certificates:    Self-signed (production-ready)        │${NC}"
    echo -e "${GREEN}│ Logs Directory:      ./logs/                               │${NC}"
    echo -e "${GREEN}└─────────────────────────────────────────────────────────────┘${NC}"
    echo ""
    warn "Browser Security Notice:"
    echo "  - You'll see SSL warnings due to self-signed certificates"
    echo "  - Click 'Advanced' → 'Proceed to site' to continue"
    echo "  - For production, consider using Let's Encrypt certificates"
    echo ""
    info "To stop HTTPS services, run: ./stop-https.sh"
}

# Main execution
main() {
    log "Switching to HTTPS production services..."
    
    check_ssl
    stop_http_services
    start_https_services
    
    if health_check; then
        show_status
    else
        error "Health check failed. Check logs in ./logs/"
        exit 1
    fi
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [--help]"
        echo ""
        echo "Switch from HTTP to HTTPS production services"
        echo ""
        echo "This script will:"
        echo "  1. Stop all HTTP services (ports 3000, 3001, 3002)"
        echo "  2. Start HTTPS versions of all services"
        echo "  3. Perform health checks"
        echo ""
        echo "Requirements:"
        echo "  - SSL certificates in ./ssl/ directory"
        echo "  - Application built (./dist directory)"
        echo ""
        exit 0
        ;;
    *)
        main
        ;;
esac
