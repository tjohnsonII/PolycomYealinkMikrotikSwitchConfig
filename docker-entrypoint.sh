#!/bin/sh

# Docker entrypoint script for Phone Config Generator
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] ✅ $1${NC}"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
}

log_warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️ $1${NC}"
}

# Function to wait for a service to be ready
wait_for_service() {
    local service_name=$1
    local port=$2
    local max_wait=30
    local wait_time=0
    
    log "Waiting for $service_name to be ready on port $port..."
    
    while [ $wait_time -lt $max_wait ]; do
        if netstat -ln | grep -q ":$port "; then
            log_success "$service_name is ready"
            return 0
        fi
        sleep 1
        wait_time=$((wait_time + 1))
    done
    
    log_error "$service_name failed to start within $max_wait seconds"
    return 1
}

# Function to start a service in the background
start_service() {
    local service_name=$1
    local command=$2
    local port=$3
    
    log "Starting $service_name..."
    
    # Start the service in the background
    eval "$command" &
    local pid=$!
    
    # Store the PID for later reference
    echo $pid > "/app/logs/${service_name}.pid"
    
    # Wait for the service to be ready
    if wait_for_service "$service_name" "$port"; then
        log_success "$service_name started successfully (PID: $pid)"
        return 0
    else
        log_error "$service_name failed to start"
        return 1
    fi
}

# Initialize application
initialize_app() {
    log "Initializing Phone Config Generator..."
    
    # Create log files
    touch /app/logs/ssh-ws.log
    touch /app/logs/auth.log
    touch /app/logs/management.log
    touch /app/logs/proxy.log
    touch /app/logs/application.log
    
    # Set default environment variables if not provided
    export NODE_ENV=${NODE_ENV:-production}
    export PORT=${PORT:-3443}
    export SSH_WS_PORT=${SSH_WS_PORT:-3000}
    export AUTH_PORT=${AUTH_PORT:-3001}
    export MANAGEMENT_PORT=${MANAGEMENT_PORT:-3099}
    export HTTPS_PORT=${HTTPS_PORT:-443}
    
    # Create default SSL certificates if not provided
    if [ ! -f "/app/ssl/cert.pem" ] || [ ! -f "/app/ssl/key.pem" ]; then
        log_warn "SSL certificates not found, generating self-signed certificates..."
        
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout /app/ssl/key.pem \
            -out /app/ssl/cert.pem \
            -subj "/C=US/ST=State/L=City/O=PhoneConfig/CN=localhost"
        
        log_success "Self-signed certificates generated"
    fi
    
    # Set up VPN directory
    mkdir -p /app/vpn-configs
    
    log_success "Application initialized successfully"
}

# Start all services
start_all_services() {
    log "Starting all services..."
    
    # Start SSH WebSocket Server
    start_service "ssh-ws" "node backend/ssh-ws-server.js > /app/logs/ssh-ws.log 2>&1" "$SSH_WS_PORT"
    
    # Start Authentication Server
    start_service "auth" "node backend/auth-server.js > /app/logs/auth.log 2>&1" "$AUTH_PORT"
    
    # Start Management Console
    start_service "management" "node backend/management-server.js --allow-lan > /app/logs/management.log 2>&1" "$MANAGEMENT_PORT"
    
    # Start HTTPS Proxy (if running as root)
    if [ "$(id -u)" -eq 0 ]; then
        start_service "proxy" "node backend/simple-proxy-https-robust.js > /app/logs/proxy.log 2>&1" "$HTTPS_PORT"
    else
        log_warn "Skipping HTTPS proxy (requires root privileges)"
    fi
    
    # Start main application
    log "Starting main application..."
    exec node -e "
        const express = require('express');
        const https = require('https');
        const fs = require('fs');
        const path = require('path');
        
        const app = express();
        
        // Serve static files
        app.use(express.static('dist'));
        
        // Handle SPA routing
        app.get('*', (req, res) => {
            res.sendFile(path.join(__dirname, 'dist', 'index.html'));
        });
        
        // SSL options
        const options = {
            key: fs.readFileSync('/app/ssl/key.pem'),
            cert: fs.readFileSync('/app/ssl/cert.pem')
        };
        
        // Start HTTPS server
        const server = https.createServer(options, app);
        server.listen(process.env.PORT, () => {
            console.log(\`✅ Phone Config Generator running on https://localhost:\${process.env.PORT}\`);
        });
        
        // Graceful shutdown
        process.on('SIGTERM', () => {
            console.log('📴 Received SIGTERM, shutting down gracefully...');
            server.close(() => {
                console.log('🔴 Server closed');
                process.exit(0);
            });
        });
    "
}

# Graceful shutdown handler
shutdown() {
    log "Shutting down services..."
    
    # Kill all background processes
    for pid_file in /app/logs/*.pid; do
        if [ -f "$pid_file" ]; then
            pid=$(cat "$pid_file")
            if kill -0 "$pid" 2>/dev/null; then
                log "Stopping service with PID $pid"
                kill -TERM "$pid" 2>/dev/null || true
            fi
            rm -f "$pid_file"
        fi
    done
    
    log_success "All services stopped"
    exit 0
}

# Set up signal handlers
trap shutdown TERM INT

# Main execution
main() {
    log "🚀 Starting Phone Config Generator in Docker..."
    
    # Initialize the application
    initialize_app
    
    # Start all services
    start_all_services
    
    # This should not be reached due to exec above
    log_error "Unexpected exit from main function"
    exit 1
}

# Run main function
main "$@"
