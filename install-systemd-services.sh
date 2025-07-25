#!/bin/bash

#################################################################################
# SystemD Service Installer for Phone Config Generator
# 
# This script creates and installs systemd services for production deployment
# with proper dependencies, restart policies, and monitoring.
#################################################################################

set -e

# Configuration
APP_NAME="phone-config-generator"
APP_USER="$(whoami)"
APP_ROOT="$(pwd)"
SERVICE_DIR="$HOME/.config/systemd/user"

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

# Create systemd user directory
mkdir -p "$SERVICE_DIR"

# Create SSH WebSocket Service
create_ssh_ws_service() {
    log "Creating SSH WebSocket service..."
    
    cat > "$SERVICE_DIR/phone-config-ssh-ws.service" << EOF
[Unit]
Description=Phone Config Generator - SSH WebSocket Server
After=network.target
Wants=network.target

[Service]
Type=simple
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$APP_ROOT
Environment=NODE_ENV=production
Environment=PORT=3000
EnvironmentFile=-$APP_ROOT/.env.production
ExecStart=/usr/bin/node $APP_ROOT/backend/ssh-ws-server.js
ExecReload=/bin/kill -HUP \$MAINPID
Restart=always
RestartSec=5
StartLimitBurst=3
StartLimitInterval=60
StandardOutput=append:$APP_ROOT/logs/ssh-ws.log
StandardError=append:$APP_ROOT/logs/ssh-ws.error.log
SyslogIdentifier=phone-config-ssh-ws

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=$APP_ROOT/logs $APP_ROOT/data $APP_ROOT/uploads
ProtectHome=true
RemoveIPC=true

# Resource limits
LimitNOFILE=65536
LimitNPROC=4096
MemoryMax=512M
CPUQuota=50%

[Install]
WantedBy=default.target
EOF

    log_success "SSH WebSocket service created"
}

# Create Authentication Service
create_auth_service() {
    log "Creating Authentication service..."
    
    cat > "$SERVICE_DIR/phone-config-auth.service" << EOF
[Unit]
Description=Phone Config Generator - Authentication Server
After=network.target
Wants=network.target

[Service]
Type=simple
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$APP_ROOT
Environment=NODE_ENV=production
Environment=PORT=3001
EnvironmentFile=-$APP_ROOT/.env.production
ExecStart=/usr/bin/node $APP_ROOT/backend/auth-server.js
ExecReload=/bin/kill -HUP \$MAINPID
Restart=always
RestartSec=5
StartLimitBurst=3
StartLimitInterval=60
StandardOutput=append:$APP_ROOT/logs/auth.log
StandardError=append:$APP_ROOT/logs/auth.error.log
SyslogIdentifier=phone-config-auth

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=$APP_ROOT/logs $APP_ROOT/data
ProtectHome=true
RemoveIPC=true

# Resource limits
LimitNOFILE=65536
LimitNPROC=4096
MemoryMax=256M
CPUQuota=25%

[Install]
WantedBy=default.target
EOF

    log_success "Authentication service created"
}

# Create Management Console Service
create_management_service() {
    log "Creating Management Console service..."
    
    cat > "$SERVICE_DIR/phone-config-management.service" << EOF
[Unit]
Description=Phone Config Generator - Management Console
After=network.target
Wants=network.target

[Service]
Type=simple
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$APP_ROOT
Environment=NODE_ENV=production
Environment=PORT=3099
Environment=WEBUI_ALLOW_LAN=true
EnvironmentFile=-$APP_ROOT/.env.production
ExecStart=/usr/bin/node $APP_ROOT/backend/management-server.js --allow-lan
ExecReload=/bin/kill -HUP \$MAINPID
Restart=always
RestartSec=5
StartLimitBurst=3
StartLimitInterval=60
StandardOutput=append:$APP_ROOT/logs/management.log
StandardError=append:$APP_ROOT/logs/management.error.log
SyslogIdentifier=phone-config-management

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=$APP_ROOT/logs $APP_ROOT/data $APP_ROOT/uploads
ProtectHome=true
RemoveIPC=true

# Resource limits
LimitNOFILE=65536
LimitNPROC=4096
MemoryMax=512M
CPUQuota=50%

[Install]
WantedBy=default.target
EOF

    log_success "Management Console service created"
}

# Create Main Application Service
create_webapp_service() {
    log "Creating Main Application service..."
    
    cat > "$SERVICE_DIR/phone-config-webapp.service" << EOF
[Unit]
Description=Phone Config Generator - Main Web Application
After=network.target phone-config-ssh-ws.service phone-config-auth.service
Wants=network.target
Requires=phone-config-ssh-ws.service phone-config-auth.service

[Service]
Type=simple
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$APP_ROOT
Environment=NODE_ENV=production
Environment=PORT=3443
EnvironmentFile=-$APP_ROOT/.env.production
ExecStart=/usr/bin/node -e "
const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.static('dist'));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const sslKeyPath = process.env.SSL_KEY_PATH || './ssl/123hostedtools.com.key';
const sslCertPath = process.env.SSL_CERT_PATH || './ssl/123hostedtools_com.crt';

if (fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)) {
  const options = {
    key: fs.readFileSync(sslKeyPath),
    cert: fs.readFileSync(sslCertPath)
  };
  https.createServer(options, app).listen(process.env.PORT || 3443, () => {
    console.log(\`HTTPS Server running on port \${process.env.PORT || 3443}\`);
  });
} else {
  console.log('SSL certificates not found, starting HTTP server');
  app.listen(process.env.PORT || 3080, () => {
    console.log(\`HTTP Server running on port \${process.env.PORT || 3080}\`);
  });
}
"
ExecReload=/bin/kill -HUP \$MAINPID
Restart=always
RestartSec=5
StartLimitBurst=3
StartLimitInterval=60
StandardOutput=append:$APP_ROOT/logs/webapp.log
StandardError=append:$APP_ROOT/logs/webapp.error.log
SyslogIdentifier=phone-config-webapp

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=$APP_ROOT/logs
ProtectHome=true
RemoveIPC=true

# Resource limits
LimitNOFILE=65536
LimitNPROC=4096
MemoryMax=1G
CPUQuota=75%

[Install]
WantedBy=default.target
EOF

    log_success "Main Application service created"
}

# Create Health Check Service
create_health_check_service() {
    log "Creating Health Check service..."
    
    cat > "$SERVICE_DIR/phone-config-health-check.service" << EOF
[Unit]
Description=Phone Config Generator - Health Check
After=phone-config-webapp.service
Wants=phone-config-webapp.service

[Service]
Type=oneshot
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$APP_ROOT
ExecStart=/bin/bash -c '
services=("ssh-ws" "auth" "management" "webapp")
all_healthy=true

for service in "\${services[@]}"; do
    if ! systemctl --user is-active --quiet "phone-config-\$service.service"; then
        echo "Service \$service is not running"
        all_healthy=false
    fi
done

endpoints=("http://localhost:3000/health" "http://localhost:3001/health" "http://localhost:3099/health")
for endpoint in "\${endpoints[@]}"; do
    if ! curl -s -f "\$endpoint" > /dev/null; then
        echo "Endpoint \$endpoint is not responding"
        all_healthy=false
    fi
done

if [ "\$all_healthy" = true ]; then
    echo "All services are healthy"
    exit 0
else
    echo "Some services are unhealthy"
    exit 1
fi
'
StandardOutput=append:$APP_ROOT/logs/health-check.log
StandardError=append:$APP_ROOT/logs/health-check.error.log
SyslogIdentifier=phone-config-health-check

[Install]
WantedBy=default.target
EOF

    # Create timer for health check
    cat > "$SERVICE_DIR/phone-config-health-check.timer" << EOF
[Unit]
Description=Phone Config Generator - Health Check Timer
Requires=phone-config-health-check.service

[Timer]
OnBootSec=5min
OnUnitActiveSec=5min
Unit=phone-config-health-check.service

[Install]
WantedBy=timers.target
EOF

    log_success "Health Check service and timer created"
}

# Create target for all services
create_target() {
    log "Creating systemd target..."
    
    cat > "$SERVICE_DIR/phone-config-generator.target" << EOF
[Unit]
Description=Phone Config Generator - All Services
Requires=phone-config-ssh-ws.service phone-config-auth.service phone-config-management.service phone-config-webapp.service
After=phone-config-ssh-ws.service phone-config-auth.service phone-config-management.service phone-config-webapp.service

[Install]
WantedBy=default.target
EOF

    log_success "Systemd target created"
}

# Install all services
install_services() {
    log "Installing systemd services..."
    
    # Create log directory
    mkdir -p "$APP_ROOT/logs"
    
    # Create services
    create_ssh_ws_service
    create_auth_service
    create_management_service
    create_webapp_service
    create_health_check_service
    create_target
    
    # Reload systemd
    systemctl --user daemon-reload
    
    # Enable services
    local services=(
        "phone-config-ssh-ws.service"
        "phone-config-auth.service"
        "phone-config-management.service"
        "phone-config-webapp.service"
        "phone-config-health-check.service"
        "phone-config-health-check.timer"
        "phone-config-generator.target"
    )
    
    for service in "${services[@]}"; do
        systemctl --user enable "$service"
        log_success "Enabled $service"
    done
    
    log_success "All systemd services installed and enabled"
}

# Start all services
start_services() {
    log "Starting all services..."
    
    # Start the target (which will start all required services)
    systemctl --user start phone-config-generator.target
    
    # Start the timer
    systemctl --user start phone-config-health-check.timer
    
    log_success "All services started"
}

# Check service status
check_status() {
    log "Checking service status..."
    
    local services=(
        "phone-config-ssh-ws.service"
        "phone-config-auth.service"
        "phone-config-management.service"
        "phone-config-webapp.service"
    )
    
    for service in "${services[@]}"; do
        local status=$(systemctl --user is-active "$service" 2>/dev/null || echo "inactive")
        if [ "$status" = "active" ]; then
            log_success "$service: $status"
        else
            log_error "$service: $status"
        fi
    done
}

# Create management script
create_management_script() {
    log "Creating management script..."
    
    cat > "$APP_ROOT/manage-services.sh" << 'EOF'
#!/bin/bash

# Phone Config Generator Service Management Script

case "$1" in
    start)
        echo "Starting Phone Config Generator services..."
        systemctl --user start phone-config-generator.target
        systemctl --user start phone-config-health-check.timer
        echo "Services started"
        ;;
    stop)
        echo "Stopping Phone Config Generator services..."
        systemctl --user stop phone-config-generator.target
        systemctl --user stop phone-config-health-check.timer
        echo "Services stopped"
        ;;
    restart)
        echo "Restarting Phone Config Generator services..."
        systemctl --user restart phone-config-generator.target
        systemctl --user restart phone-config-health-check.timer
        echo "Services restarted"
        ;;
    status)
        echo "Phone Config Generator Service Status:"
        echo "====================================="
        for service in ssh-ws auth management webapp; do
            status=$(systemctl --user is-active "phone-config-$service.service" 2>/dev/null || echo "inactive")
            if [ "$status" = "active" ]; then
                echo "✅ $service: $status"
            else
                echo "❌ $service: $status"
            fi
        done
        ;;
    logs)
        service=${2:-all}
        if [ "$service" = "all" ]; then
            journalctl --user -u "phone-config-*" -f
        else
            journalctl --user -u "phone-config-$service.service" -f
        fi
        ;;
    enable)
        echo "Enabling Phone Config Generator services for auto-start..."
        systemctl --user enable phone-config-generator.target
        systemctl --user enable phone-config-health-check.timer
        echo "Services enabled"
        ;;
    disable)
        echo "Disabling Phone Config Generator services..."
        systemctl --user disable phone-config-generator.target
        systemctl --user disable phone-config-health-check.timer
        echo "Services disabled"
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs|enable|disable}"
        echo ""
        echo "Commands:"
        echo "  start    - Start all services"
        echo "  stop     - Stop all services"
        echo "  restart  - Restart all services"
        echo "  status   - Show service status"
        echo "  logs     - Show logs (optionally specify service name)"
        echo "  enable   - Enable services for auto-start"
        echo "  disable  - Disable auto-start"
        echo ""
        echo "Examples:"
        echo "  $0 start"
        echo "  $0 status"
        echo "  $0 logs ssh-ws"
        exit 1
        ;;
esac
EOF

    chmod +x "$APP_ROOT/manage-services.sh"
    log_success "Management script created: $APP_ROOT/manage-services.sh"
}

# Main installation function
main() {
    log "🚀 Installing Phone Config Generator SystemD Services"
    log "====================================================="
    
    # Check if systemd is available
    if ! command -v systemctl > /dev/null; then
        log_error "systemctl not found. SystemD is required."
        exit 1
    fi
    
    # Check if running as user (not root)
    if [ "$EUID" -eq 0 ]; then
        log_error "Please run as regular user (not root) for user-level services"
        exit 1
    fi
    
    # Install services
    install_services
    
    # Create management script
    create_management_script
    
    # Start services
    start_services
    
    # Check status
    sleep 5
    check_status
    
    log_success "🎉 SystemD Services Installation Complete!"
    log "======================================================"
    log "Management Commands:"
    log "  • Start:   ./manage-services.sh start"
    log "  • Stop:    ./manage-services.sh stop"
    log "  • Status:  ./manage-services.sh status"
    log "  • Logs:    ./manage-services.sh logs"
    log ""
    log "SystemD Commands:"
    log "  • Status:  systemctl --user status phone-config-generator.target"
    log "  • Logs:    journalctl --user -u phone-config-* -f"
    log ""
    log "Services are now running and enabled for auto-start!"
}

# Run main function
main "$@"
