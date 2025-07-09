#!/bin/bash

# HTTPS-enabled startup script for Polycom/Yealink Configuration App
# This script starts all services with SSL/TLS encryption

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

# Check if running as root (not recommended for development)
check_permissions() {
    if [[ $EUID -eq 0 ]]; then
        warn "Running as root is not recommended for development"
        warn "Consider running as a regular user"
    fi
}

# Check for required dependencies
check_dependencies() {
    log "Checking dependencies..."
    
    local missing_deps=()
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        missing_deps+=("node")
    else
        local node_version=$(node --version | sed 's/v//')
        local required_version="18.0.0"
        if ! printf '%s\n%s\n' "$required_version" "$node_version" | sort -V -C; then
            warn "Node.js version $node_version found, but $required_version or higher is recommended"
        else
            info "Node.js version: $node_version ✓"
        fi
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        missing_deps+=("npm")
    else
        info "npm version: $(npm --version) ✓"
    fi
    
    # Check OpenSSL
    if ! command -v openssl &> /dev/null; then
        missing_deps+=("openssl")
    else
        info "OpenSSL version: $(openssl version) ✓"
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        error "Missing required dependencies: ${missing_deps[*]}"
        error "Please install them before continuing"
        exit 1
    fi
}

# Check and create SSL certificates
check_ssl_certificates() {
    log "Checking SSL certificates..."
    
    if [[ ! -d "ssl" ]]; then
        warn "SSL directory not found, creating..."
        mkdir -p ssl
    fi
    
    if [[ ! -f "ssl/private-key.pem" ]] || [[ ! -f "ssl/certificate.pem" ]]; then
        warn "SSL certificates not found, generating self-signed certificates..."
        
        # Generate self-signed certificate
        openssl req -x509 -newkey rsa:4096 \
            -keyout ssl/private-key.pem \
            -out ssl/certificate.pem \
            -days 365 -nodes \
            -subj "/C=US/ST=Virginia/L=Richmond/O=TimsAbLab/CN=timsablab.com" \
            -addext "subjectAltName=DNS:timsablab.com,DNS:timsablab.ddn.net,DNS:localhost,IP:127.0.0.1"
        
        if [[ $? -eq 0 ]]; then
            log "SSL certificates generated successfully"
            warn "Using self-signed certificates - browsers will show security warnings"
            warn "For production, use certificates from a trusted CA"
        else
            error "Failed to generate SSL certificates"
            exit 1
        fi
    else
        log "SSL certificates found ✓"
        
        # Check certificate validity
        if openssl x509 -checkend 86400 -noout -in ssl/certificate.pem >/dev/null; then
            info "SSL certificate is valid for at least 24 hours"
        else
            warn "SSL certificate expires within 24 hours - consider renewal"
        fi
    fi
    
    # Set proper permissions
    chmod 600 ssl/private-key.pem
    chmod 644 ssl/certificate.pem
}

# Check if ports are available
check_ports() {
    log "Checking port availability..."
    
    local ports=(3000 3001 3002)
    local busy_ports=()
    
    for port in "${ports[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            busy_ports+=($port)
        fi
    done
    
    if [ ${#busy_ports[@]} -ne 0 ]; then
        warn "The following ports are already in use: ${busy_ports[*]}"
        warn "This might cause conflicts. Consider stopping other services or changing ports."
    else
        log "All required ports are available ✓"
    fi
}

# Install dependencies
install_dependencies() {
    if [[ ! -d "node_modules" ]] || [[ "package.json" -nt "node_modules" ]]; then
        log "Installing/updating dependencies..."
        npm install
        if [[ $? -ne 0 ]]; then
            error "Failed to install dependencies"
            exit 1
        fi
        log "Dependencies installed successfully ✓"
    else
        info "Dependencies are up to date ✓"
    fi
}

# Build the application
build_application() {
    log "Building application..."
    npm run build
    if [[ $? -ne 0 ]]; then
        error "Build failed"
        exit 1
    fi
    log "Application built successfully ✓"
}

# Create log directory
setup_logging() {
    if [[ ! -d "logs" ]]; then
        mkdir -p logs
        log "Created logs directory"
    fi
}

# Stop any existing processes
cleanup_processes() {
    log "Cleaning up existing processes..."
    
    # Kill processes on our ports
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
    
    sleep 2
}

# Start HTTPS services
start_services() {
    log "Starting HTTPS services..."
    
    # Start authentication server
    info "Starting HTTPS authentication server on port 3002..."
    nohup node backend/auth-server-https.js > logs/auth-server.log 2>&1 &
    AUTH_PID=$!
    echo $AUTH_PID > logs/auth-server.pid
    
    # Wait a moment for auth server to start
    sleep 3
    
    # Check if auth server started successfully
    if ! kill -0 $AUTH_PID 2>/dev/null; then
        error "Authentication server failed to start"
        cat logs/auth-server.log
        exit 1
    fi
    log "Authentication server started (PID: $AUTH_PID) ✓"
    
    # Start SSH WebSocket server
    info "Starting HTTPS SSH WebSocket server on port 3001..."
    nohup node backend/ssh-ws-server-https.js > logs/ssh-ws-server.log 2>&1 &
    SSH_PID=$!
    echo $SSH_PID > logs/ssh-ws-server.pid
    
    # Wait a moment for SSH server to start
    sleep 3
    
    # Check if SSH server started successfully
    if ! kill -0 $SSH_PID 2>/dev/null; then
        error "SSH WebSocket server failed to start"
        cat logs/ssh-ws-server.log
        exit 1
    fi
    log "SSH WebSocket server started (PID: $SSH_PID) ✓"
    
    # Start frontend (Vite with HTTPS)
    info "Starting HTTPS frontend server on port 3000..."
    nohup npm run dev > logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > logs/frontend.pid
    
    # Wait for frontend to start
    sleep 5
    
    # Check if frontend started successfully
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        error "Frontend server failed to start"
        cat logs/frontend.log
        exit 1
    fi
    log "Frontend server started (PID: $FRONTEND_PID) ✓"
}

# Health check
health_check() {
    log "Performing health checks..."
    
    local max_attempts=10
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        info "Health check attempt $attempt/$max_attempts"
        
        # Check auth server
        if curl -k -s https://localhost:3002/health > /dev/null 2>&1; then
            log "Auth server health check passed ✓"
        else
            warn "Auth server health check failed"
        fi
        
        # Check SSH WebSocket server
        if curl -k -s https://localhost:3001/health > /dev/null 2>&1; then
            log "SSH WebSocket server health check passed ✓"
        else
            warn "SSH WebSocket server health check failed"
        fi
        
        # Check frontend (might take longer to start)
        if curl -k -s https://localhost:3000 > /dev/null 2>&1; then
            log "Frontend server health check passed ✓"
            break
        else
            warn "Frontend server not ready yet..."
            if [[ $attempt -eq $max_attempts ]]; then
                warn "Frontend health check failed after $max_attempts attempts"
            fi
        fi
        
        sleep 3
        ((attempt++))
    done
}

# Display status and access information
show_status() {
    echo ""
    log "🔒 HTTPS-enabled services started successfully!"
    echo ""
    echo -e "${GREEN}┌─────────────────────────────────────────────────────────────┐${NC}"
    echo -e "${GREEN}│                    🔒 HTTPS SERVICE STATUS                  │${NC}"
    echo -e "${GREEN}├─────────────────────────────────────────────────────────────┤${NC}"
    echo -e "${GREEN}│ Frontend (Vite):     https://timsablab.com:3000            │${NC}"
    echo -e "${GREEN}│ Frontend (Local):    https://localhost:3000                │${NC}"
    echo -e "${GREEN}│ Auth Server:         https://timsablab.com:3002            │${NC}"
    echo -e "${GREEN}│ SSH WebSocket:       wss://timsablab.com:3001              │${NC}"
    echo -e "${GREEN}│                                                             │${NC}"
    echo -e "${GREEN}│ SSL Certificates:    self-signed (development)             │${NC}"
    echo -e "${GREEN}│ Logs Directory:      ./logs/                               │${NC}"
    echo -e "${GREEN}└─────────────────────────────────────────────────────────────┘${NC}"
    echo ""
    warn "Browser Security Notice:"
    echo "  - You'll see SSL warnings due to self-signed certificates"
    echo "  - Click 'Advanced' → 'Proceed to site' to continue"
    echo "  - For production, use certificates from a trusted CA"
    echo ""
    info "To stop all services: ./stop-https-services.sh"
    info "To view logs: tail -f logs/*.log"
}

# Graceful shutdown handler
cleanup() {
    echo ""
    warn "Shutting down services..."
    
    if [[ -n "$FRONTEND_PID" ]] && kill -0 $FRONTEND_PID 2>/dev/null; then
        info "Stopping frontend server..."
        kill -TERM $FRONTEND_PID 2>/dev/null || true
    fi
    
    if [[ -n "$SSH_PID" ]] && kill -0 $SSH_PID 2>/dev/null; then
        info "Stopping SSH WebSocket server..."
        kill -TERM $SSH_PID 2>/dev/null || true
    fi
    
    if [[ -n "$AUTH_PID" ]] && kill -0 $AUTH_PID 2>/dev/null; then
        info "Stopping authentication server..."
        kill -TERM $AUTH_PID 2>/dev/null || true
    fi
    
    # Wait for graceful shutdown
    sleep 3
    
    log "Services stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Main execution
main() {
    log "🔒 Starting HTTPS-enabled Polycom/Yealink Configuration App..."
    
    check_permissions
    check_dependencies
    check_ssl_certificates
    check_ports
    install_dependencies
    build_application
    setup_logging
    cleanup_processes
    start_services
    health_check
    show_status
    
    # Keep script running to handle signals
    log "All services started. Press Ctrl+C to stop all services."
    wait
}

# Run main function
main "$@"
