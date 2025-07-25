#!/bin/bash

#################################################################################
# Production Deployment Script for Phone Configuration Generator
# 
# This script sets up a complete production environment on Ubuntu Server
# with all dependencies, services, and security configurations.
#
# Usage: 
#   sudo ./deploy-production.sh
#   sudo ./deploy-production.sh --domain your-domain.com
#   sudo ./deploy-production.sh --help
#################################################################################

set -e  # Exit on any error

# Default configuration
APP_NAME="phone-config-generator"
APP_USER="phoneconfig"
APP_GROUP="phoneconfig"
APP_ROOT="/opt/${APP_NAME}"
DOMAIN=""
EMAIL=""
ENVIRONMENT="production"
INSTALL_CERTBOT=true
INSTALL_OPENVPN3=true
SETUP_FIREWALL=true
SETUP_MONITORING=true

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "ERROR") echo -e "${RED}[${timestamp}] ❌ $message${NC}" ;;
        "SUCCESS") echo -e "${GREEN}[${timestamp}] ✅ $message${NC}" ;;
        "WARN") echo -e "${YELLOW}[${timestamp}] ⚠️  $message${NC}" ;;
        "INFO") echo -e "${BLUE}[${timestamp}] ℹ️  $message${NC}" ;;
        "DEBUG") echo -e "${PURPLE}[${timestamp}] 🔍 $message${NC}" ;;
        "STEP") echo -e "${CYAN}[${timestamp}] 🔧 $message${NC}" ;;
    esac
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --domain)
            DOMAIN="$2"
            shift 2
            ;;
        --email)
            EMAIL="$2"
            shift 2
            ;;
        --no-certbot)
            INSTALL_CERTBOT=false
            shift
            ;;
        --no-openvpn3)
            INSTALL_OPENVPN3=false
            shift
            ;;
        --no-firewall)
            SETUP_FIREWALL=false
            shift
            ;;
        --no-monitoring)
            SETUP_MONITORING=false
            shift
            ;;
        --help)
            echo "Production Deployment Script"
            echo ""
            echo "Usage: sudo $0 [options]"
            echo ""
            echo "Options:"
            echo "  --domain DOMAIN     Set the domain name for SSL certificates"
            echo "  --email EMAIL       Set email for Let's Encrypt notifications"
            echo "  --no-certbot        Skip Let's Encrypt installation"
            echo "  --no-openvpn3       Skip OpenVPN3 installation"
            echo "  --no-firewall       Skip firewall configuration"
            echo "  --no-monitoring     Skip monitoring setup"
            echo "  --help              Show this help message"
            echo ""
            echo "Example:"
            echo "  sudo $0 --domain 123hostedtools.com --email admin@123hostedtools.com"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    log "ERROR" "This script must be run as root (use sudo)"
    exit 1
fi

# Detect Ubuntu version
UBUNTU_VERSION=$(lsb_release -rs)
log "INFO" "Detected Ubuntu $UBUNTU_VERSION"

if [[ ! "$UBUNTU_VERSION" =~ ^(20\.04|22\.04|24\.04) ]]; then
    log "WARN" "This script is tested on Ubuntu 20.04/22.04/24.04 LTS"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install a package if not already installed
install_package() {
    local package=$1
    if ! dpkg -l | grep -q "^ii  $package "; then
        log "STEP" "Installing $package..."
        apt-get install -y "$package"
    else
        log "INFO" "$package is already installed"
    fi
}

# Update system packages
update_system() {
    log "STEP" "Updating system packages..."
    apt-get update
    apt-get upgrade -y
    apt-get autoremove -y
}

# Install system dependencies
install_dependencies() {
    log "STEP" "Installing system dependencies..."
    
    # Essential packages
    local packages=(
        "curl"
        "wget"
        "git"
        "build-essential"
        "software-properties-common"
        "apt-transport-https"
        "ca-certificates"
        "gnupg"
        "lsb-release"
        "ufw"
        "fail2ban"
        "htop"
        "tree"
        "jq"
        "unzip"
        "supervisor"
        "nginx"
        "logrotate"
    )
    
    for package in "${packages[@]}"; do
        install_package "$package"
    done
}

# Install Node.js
install_nodejs() {
    log "STEP" "Installing Node.js..."
    
    if command_exists node; then
        local node_version=$(node --version)
        log "INFO" "Node.js $node_version is already installed"
        
        # Check if version is suitable
        local major_version=$(echo "$node_version" | cut -d'.' -f1 | sed 's/v//')
        if [ "$major_version" -lt 18 ]; then
            log "WARN" "Node.js version is too old. Installing newer version..."
        else
            return 0
        fi
    fi
    
    # Install Node.js 20.x LTS
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    install_package "nodejs"
    
    # Verify installation
    log "SUCCESS" "Node.js $(node --version) installed"
    log "SUCCESS" "npm $(npm --version) installed"
}

# Install OpenVPN3 (for SAML VPN functionality)
install_openvpn3() {
    if [ "$INSTALL_OPENVPN3" != true ]; then
        log "INFO" "Skipping OpenVPN3 installation"
        return 0
    fi
    
    log "STEP" "Installing OpenVPN3..."
    
    if command_exists openvpn3; then
        log "INFO" "OpenVPN3 is already installed"
        return 0
    fi
    
    # Add OpenVPN3 repository
    wget -O - https://swupdate.openvpn.net/repos/openvpn-repo-pkg-key.pub | apt-key add -
    echo "deb http://build.openvpn.net/debian/openvpn3/$(lsb_release -cs) $(lsb_release -cs) main" > /etc/apt/sources.list.d/openvpn3.list
    
    apt-get update
    install_package "openvpn3"
    
    log "SUCCESS" "OpenVPN3 installed successfully"
}

# Create application user and directories
setup_user_and_directories() {
    log "STEP" "Setting up application user and directories..."
    
    # Create application user
    if ! id "$APP_USER" &>/dev/null; then
        useradd --system --shell /bin/bash --home "$APP_ROOT" --create-home "$APP_USER"
        log "SUCCESS" "Created user: $APP_USER"
    else
        log "INFO" "User $APP_USER already exists"
    fi
    
    # Create directory structure
    local directories=(
        "$APP_ROOT/app"
        "$APP_ROOT/data"
        "$APP_ROOT/logs"
        "$APP_ROOT/ssl"
        "$APP_ROOT/config"
        "$APP_ROOT/backup"
        "$APP_ROOT/scripts"
        "/var/log/$APP_NAME"
    )
    
    for dir in "${directories[@]}"; do
        mkdir -p "$dir"
        chown "$APP_USER:$APP_GROUP" "$dir"
        log "INFO" "Created directory: $dir"
    done
    
    # Set up log rotation
    cat > "/etc/logrotate.d/$APP_NAME" << EOF
/var/log/$APP_NAME/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    copytruncate
    su $APP_USER $APP_GROUP
}
EOF
    
    log "SUCCESS" "User and directory structure created"
}

# Deploy application
deploy_application() {
    log "STEP" "Deploying application..."
    
    # Get current directory (where this script is run from)
    local source_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    
    # Copy application files
    log "INFO" "Copying application files..."
    rsync -av --exclude='.git' --exclude='node_modules' --exclude='dist' --exclude='*.log' \
          "$source_dir/" "$APP_ROOT/app/"
    
    # Set ownership
    chown -R "$APP_USER:$APP_GROUP" "$APP_ROOT/app"
    
    # Install dependencies
    log "INFO" "Installing Node.js dependencies..."
    cd "$APP_ROOT/app"
    sudo -u "$APP_USER" npm install --production
    
    # Build application
    log "INFO" "Building application..."
    sudo -u "$APP_USER" npm run build
    
    log "SUCCESS" "Application deployed successfully"
}

# Create environment configuration
create_environment_config() {
    log "STEP" "Creating environment configuration..."
    
    local env_file="$APP_ROOT/config/.env.production"
    
    cat > "$env_file" << EOF
# Production Environment Configuration
NODE_ENV=production
PORT=8443
HTTPS_PORT=443

# Application Configuration
APP_NAME=$APP_NAME
APP_ROOT=$APP_ROOT
APP_USER=$APP_USER

# Domain Configuration
DOMAIN=${DOMAIN:-localhost}
EMAIL=${EMAIL:-admin@localhost}

# SSL Configuration
SSL_CERT_PATH=$APP_ROOT/ssl/cert.pem
SSL_KEY_PATH=$APP_ROOT/ssl/key.pem

# Database Configuration (if needed)
# DATABASE_URL=

# VPN Configuration
WEBUI_ALLOW_LAN=true

# Logging Configuration
LOG_LEVEL=info
LOG_PATH=/var/log/$APP_NAME

# Security Configuration
SESSION_SECRET=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)

# Monitoring Configuration
ENABLE_MONITORING=true
HEALTH_CHECK_INTERVAL=30

# Backup Configuration
BACKUP_PATH=$APP_ROOT/backup
BACKUP_RETENTION_DAYS=30
EOF
    
    chown "$APP_USER:$APP_GROUP" "$env_file"
    chmod 600 "$env_file"
    
    log "SUCCESS" "Environment configuration created"
}

# Install SSL certificates
install_ssl_certificates() {
    log "STEP" "Setting up SSL certificates..."
    
    if [ -z "$DOMAIN" ]; then
        log "INFO" "No domain specified, creating self-signed certificate"
        create_self_signed_certificate
        return 0
    fi
    
    if [ "$INSTALL_CERTBOT" = true ]; then
        install_letsencrypt_certificate
    else
        log "INFO" "Skipping Let's Encrypt installation"
        create_self_signed_certificate
    fi
}

# Create self-signed certificate
create_self_signed_certificate() {
    log "INFO" "Creating self-signed SSL certificate..."
    
    local ssl_dir="$APP_ROOT/ssl"
    local domain=${DOMAIN:-localhost}
    
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$ssl_dir/key.pem" \
        -out "$ssl_dir/cert.pem" \
        -subj "/C=US/ST=State/L=City/O=Organization/OU=OrgUnit/CN=$domain"
    
    chown "$APP_USER:$APP_GROUP" "$ssl_dir"/*.pem
    chmod 600 "$ssl_dir"/*.pem
    
    log "SUCCESS" "Self-signed certificate created"
}

# Install Let's Encrypt certificate
install_letsencrypt_certificate() {
    log "INFO" "Installing Let's Encrypt certificate..."
    
    if [ "$INSTALL_CERTBOT" != true ]; then
        return 0
    fi
    
    # Install certbot
    install_package "certbot"
    
    # Stop nginx temporarily
    systemctl stop nginx 2>/dev/null || true
    
    # Get certificate
    if [ -n "$EMAIL" ]; then
        certbot certonly --standalone -d "$DOMAIN" --email "$EMAIL" --agree-tos --non-interactive
    else
        certbot certonly --standalone -d "$DOMAIN" --register-unsafely-without-email --agree-tos --non-interactive
    fi
    
    # Copy certificates to application directory
    local ssl_dir="$APP_ROOT/ssl"
    cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$ssl_dir/cert.pem"
    cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$ssl_dir/key.pem"
    
    chown "$APP_USER:$APP_GROUP" "$ssl_dir"/*.pem
    chmod 600 "$ssl_dir"/*.pem
    
    # Set up automatic renewal
    echo "0 12 * * * /usr/bin/certbot renew --quiet && systemctl reload nginx" | crontab -
    
    log "SUCCESS" "Let's Encrypt certificate installed"
}

# Create systemd services
create_systemd_services() {
    log "STEP" "Creating systemd services..."
    
    # SSH WebSocket Service
    cat > "/etc/systemd/system/$APP_NAME-ssh.service" << EOF
[Unit]
Description=Phone Config Generator - SSH WebSocket Server
After=network.target
Requires=network.target

[Service]
Type=simple
User=$APP_USER
Group=$APP_GROUP
WorkingDirectory=$APP_ROOT/app
Environment=NODE_ENV=production
EnvironmentFile=$APP_ROOT/config/.env.production
ExecStart=/usr/bin/node backend/ssh-ws-server.js
Restart=always
RestartSec=5
StandardOutput=append:/var/log/$APP_NAME/ssh-ws.log
StandardError=append:/var/log/$APP_NAME/ssh-ws.error.log

[Install]
WantedBy=multi-user.target
EOF

    # Authentication Service
    cat > "/etc/systemd/system/$APP_NAME-auth.service" << EOF
[Unit]
Description=Phone Config Generator - Authentication Server
After=network.target
Requires=network.target

[Service]
Type=simple
User=$APP_USER
Group=$APP_GROUP
WorkingDirectory=$APP_ROOT/app
Environment=NODE_ENV=production
EnvironmentFile=$APP_ROOT/config/.env.production
ExecStart=/usr/bin/node backend/auth-server.js
Restart=always
RestartSec=5
StandardOutput=append:/var/log/$APP_NAME/auth.log
StandardError=append:/var/log/$APP_NAME/auth.error.log

[Install]
WantedBy=multi-user.target
EOF

    # Management Console Service
    cat > "/etc/systemd/system/$APP_NAME-mgmt.service" << EOF
[Unit]
Description=Phone Config Generator - Management Console
After=network.target
Requires=network.target

[Service]
Type=simple
User=$APP_USER
Group=$APP_GROUP
WorkingDirectory=$APP_ROOT/app
Environment=NODE_ENV=production
EnvironmentFile=$APP_ROOT/config/.env.production
ExecStart=/usr/bin/node backend/management-server.js --allow-lan
Restart=always
RestartSec=5
StandardOutput=append:/var/log/$APP_NAME/management.log
StandardError=append:/var/log/$APP_NAME/management.error.log

[Install]
WantedBy=multi-user.target
EOF

    # HTTPS Proxy Service
    cat > "/etc/systemd/system/$APP_NAME-proxy.service" << EOF
[Unit]
Description=Phone Config Generator - HTTPS Proxy
After=network.target
Requires=network.target

[Service]
Type=simple
User=root
Group=root
WorkingDirectory=$APP_ROOT/app
Environment=NODE_ENV=production
EnvironmentFile=$APP_ROOT/config/.env.production
ExecStart=/usr/bin/node backend/simple-proxy-https-robust.js
Restart=always
RestartSec=5
StandardOutput=append:/var/log/$APP_NAME/proxy.log
StandardError=append:/var/log/$APP_NAME/proxy.error.log

[Install]
WantedBy=multi-user.target
EOF

    # Main Application Service
    cat > "/etc/systemd/system/$APP_NAME-webapp.service" << EOF
[Unit]
Description=Phone Config Generator - Main Web Application
After=network.target
Requires=network.target

[Service]
Type=simple
User=$APP_USER
Group=$APP_GROUP
WorkingDirectory=$APP_ROOT/app
Environment=NODE_ENV=production
EnvironmentFile=$APP_ROOT/config/.env.production
ExecStart=/usr/bin/node -e "
const { spawn } = require('child_process');
const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.static('dist'));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const options = {
  key: fs.readFileSync(process.env.SSL_KEY_PATH),
  cert: fs.readFileSync(process.env.SSL_CERT_PATH)
};

https.createServer(options, app).listen(8443, () => {
  console.log('Webapp running on https://localhost:8443');
});
"
Restart=always
RestartSec=5
StandardOutput=append:/var/log/$APP_NAME/webapp.log
StandardError=append:/var/log/$APP_NAME/webapp.error.log

[Install]
WantedBy=multi-user.target
EOF

    # Reload systemd
    systemctl daemon-reload
    
    log "SUCCESS" "Systemd services created"
}

# Configure firewall
configure_firewall() {
    if [ "$SETUP_FIREWALL" != true ]; then
        log "INFO" "Skipping firewall configuration"
        return 0
    fi
    
    log "STEP" "Configuring firewall..."
    
    # Reset UFW to defaults
    ufw --force reset
    
    # Set default policies
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow SSH
    ufw allow ssh
    
    # Allow HTTP and HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Allow management console (only from private networks)
    ufw allow from 10.0.0.0/8 to any port 3099
    ufw allow from 172.16.0.0/12 to any port 3099
    ufw allow from 192.168.0.0/16 to any port 3099
    
    # Allow OpenVPN
    ufw allow 1194/udp
    
    # Enable firewall
    ufw --force enable
    
    log "SUCCESS" "Firewall configured"
}

# Setup monitoring
setup_monitoring() {
    if [ "$SETUP_MONITORING" != true ]; then
        log "INFO" "Skipping monitoring setup"
        return 0
    fi
    
    log "STEP" "Setting up monitoring..."
    
    # Create monitoring script
    cat > "$APP_ROOT/scripts/health-check.sh" << 'EOF'
#!/bin/bash

# Health check script for phone config generator
SERVICES=("phone-config-generator-ssh" "phone-config-generator-auth" "phone-config-generator-mgmt" "phone-config-generator-proxy")
LOG_FILE="/var/log/phone-config-generator/health-check.log"

log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

for service in "${SERVICES[@]}"; do
    if ! systemctl is-active --quiet "$service"; then
        log_message "ERROR: $service is not running, attempting restart"
        systemctl restart "$service"
        sleep 5
        if systemctl is-active --quiet "$service"; then
            log_message "SUCCESS: $service restarted successfully"
        else
            log_message "CRITICAL: Failed to restart $service"
        fi
    fi
done

# Check disk space
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    log_message "WARNING: Disk usage is ${DISK_USAGE}%"
fi

# Check memory usage
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.2f", $3*100/$2}')
if (( $(echo "$MEMORY_USAGE > 80" | bc -l) )); then
    log_message "WARNING: Memory usage is ${MEMORY_USAGE}%"
fi
EOF

    chmod +x "$APP_ROOT/scripts/health-check.sh"
    chown "$APP_USER:$APP_GROUP" "$APP_ROOT/scripts/health-check.sh"
    
    # Add cron job for health checks
    echo "*/5 * * * * $APP_ROOT/scripts/health-check.sh" | crontab -u "$APP_USER" -
    
    log "SUCCESS" "Monitoring configured"
}

# Create management scripts
create_management_scripts() {
    log "STEP" "Creating management scripts..."
    
    # Start script
    cat > "$APP_ROOT/scripts/start-production.sh" << EOF
#!/bin/bash
# Start all production services

echo "Starting Phone Config Generator services..."

systemctl start $APP_NAME-ssh
systemctl start $APP_NAME-auth
systemctl start $APP_NAME-mgmt
systemctl start $APP_NAME-proxy
systemctl start $APP_NAME-webapp

echo "All services started. Check status with: systemctl status $APP_NAME-*"
EOF

    # Stop script
    cat > "$APP_ROOT/scripts/stop-production.sh" << EOF
#!/bin/bash
# Stop all production services

echo "Stopping Phone Config Generator services..."

systemctl stop $APP_NAME-webapp
systemctl stop $APP_NAME-proxy
systemctl stop $APP_NAME-mgmt
systemctl stop $APP_NAME-auth
systemctl stop $APP_NAME-ssh

echo "All services stopped."
EOF

    # Status script
    cat > "$APP_ROOT/scripts/status-production.sh" << EOF
#!/bin/bash
# Check status of all production services

echo "Phone Config Generator Service Status:"
echo "======================================"

for service in ssh auth mgmt proxy webapp; do
    status=\$(systemctl is-active $APP_NAME-\$service 2>/dev/null || echo "inactive")
    if [ "\$status" = "active" ]; then
        echo "✅ \$service: \$status"
    else
        echo "❌ \$service: \$status"
    fi
done

echo ""
echo "System Resources:"
echo "=================="
echo "Disk Usage: \$(df -h / | awk 'NR==2 {print \$5}')"
echo "Memory Usage: \$(free -h | awk 'NR==2{printf \"%.1f/%.1fGB (%.2f%%)\", \$3/1024,\$2/1024,\$3*100/\$2}')"
echo "Load Average: \$(uptime | awk -F'load average:' '{print \$2}')"
EOF

    # Update script
    cat > "$APP_ROOT/scripts/update-production.sh" << EOF
#!/bin/bash
# Update the production application

echo "Updating Phone Config Generator..."

# Stop services
./stop-production.sh

# Backup current version
cp -r $APP_ROOT/app $APP_ROOT/backup/app-\$(date +%Y%m%d-%H%M%S)

# Pull latest code (adjust as needed)
cd $APP_ROOT/app
git pull origin main

# Install dependencies and build
sudo -u $APP_USER npm install --production
sudo -u $APP_USER npm run build

# Start services
./start-production.sh

echo "Update completed."
EOF

    # Make scripts executable
    chmod +x "$APP_ROOT/scripts"/*.sh
    chown "$APP_USER:$APP_GROUP" "$APP_ROOT/scripts"/*.sh
    
    log "SUCCESS" "Management scripts created"
}

# Enable and start services
enable_and_start_services() {
    log "STEP" "Enabling and starting services..."
    
    local services=("ssh" "auth" "mgmt" "proxy" "webapp")
    
    for service in "${services[@]}"; do
        local service_name="$APP_NAME-$service"
        
        # Enable service
        systemctl enable "$service_name"
        
        # Start service
        systemctl start "$service_name"
        
        # Check status
        if systemctl is-active --quiet "$service_name"; then
            log "SUCCESS" "$service_name started successfully"
        else
            log "ERROR" "$service_name failed to start"
            systemctl status "$service_name" --no-pager -l
        fi
    done
}

# Verify deployment
verify_deployment() {
    log "STEP" "Verifying deployment..."
    
    # Test endpoints
    local endpoints=(
        "https://localhost:443"
        "https://localhost:8443"
        "http://localhost:3099"
        "http://localhost:3001/health"
        "http://localhost:3002/health"
    )
    
    for endpoint in "${endpoints[@]}"; do
        if curl -k -s -f "$endpoint" > /dev/null 2>&1; then
            log "SUCCESS" "$endpoint is responding"
        else
            log "WARN" "$endpoint is not responding"
        fi
    done
    
    # Check service status
    log "INFO" "Service status:"
    systemctl status "$APP_NAME-*" --no-pager -l | grep -E "(Active|Main PID)"
}

# Main deployment function
main() {
    log "INFO" "🚀 Starting Production Deployment"
    log "INFO" "==============================="
    log "INFO" "Application: $APP_NAME"
    log "INFO" "User: $APP_USER"
    log "INFO" "Root: $APP_ROOT"
    log "INFO" "Domain: ${DOMAIN:-'localhost (self-signed)'}"
    log "INFO" "Email: ${EMAIL:-'not provided'}"
    log "INFO" ""
    
    # Confirm deployment
    read -p "Continue with production deployment? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "INFO" "Deployment cancelled"
        exit 0
    fi
    
    # Execute deployment steps
    update_system
    install_dependencies
    install_nodejs
    install_openvpn3
    setup_user_and_directories
    deploy_application
    create_environment_config
    install_ssl_certificates
    create_systemd_services
    configure_firewall
    setup_monitoring
    create_management_scripts
    enable_and_start_services
    verify_deployment
    
    # Final summary
    log "SUCCESS" "🎉 Production Deployment Complete!"
    log "INFO" "=================================="
    log "INFO" "Application Access:"
    if [ -n "$DOMAIN" ]; then
        log "INFO" "  • Main App: https://$DOMAIN"
        log "INFO" "  • Management: http://$DOMAIN:3099"
    else
        log "INFO" "  • Main App: https://localhost:8443"
        log "INFO" "  • Management: http://localhost:3099"
    fi
    log "INFO" ""
    log "INFO" "Management Commands:"
    log "INFO" "  • Start: $APP_ROOT/scripts/start-production.sh"
    log "INFO" "  • Stop: $APP_ROOT/scripts/stop-production.sh"
    log "INFO" "  • Status: $APP_ROOT/scripts/status-production.sh"
    log "INFO" "  • Update: $APP_ROOT/scripts/update-production.sh"
    log "INFO" ""
    log "INFO" "Systemd Services:"
    log "INFO" "  • systemctl status $APP_NAME-*"
    log "INFO" "  • journalctl -u $APP_NAME-* -f"
    log "INFO" ""
    log "INFO" "Log Files:"
    log "INFO" "  • /var/log/$APP_NAME/"
    log "INFO" ""
    log "INFO" "Configuration:"
    log "INFO" "  • $APP_ROOT/config/.env.production"
    log "INFO" ""
    log "SUCCESS" "Production deployment is ready! 🚀"
}

# Run main function
main "$@"
