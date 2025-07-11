#!/bin/bash

# Dual VPN Manager for Ubuntu Server
# Handles Work VPN (SAML/Web Auth) + Home VPN (Certificate Auth)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"; }
warn() { echo -e "${YELLOW}[$(date +'%H:%M:%S')] WARNING: $1${NC}"; }
error() { echo -e "${RED}[$(date +'%H:%M:%S')] ERROR: $1${NC}"; }

# Configuration
WORK_CONFIG="/etc/openvpn/client/work.conf"
HOME_CONFIG="/etc/openvpn/client/home.conf"
VPN_LOG_DIR="/var/log/openvpn"
CRED_DIR="/etc/openvpn/client/credentials"

# Check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        error "This script must be run as root"
        echo "Please run: sudo $0 $*"
        exit 1
    fi
}

# Install OpenVPN and required packages
install_openvpn() {
    log "Installing OpenVPN and dependencies..."
    
    apt update
    apt install -y openvpn resolvconf openresolv network-manager-openvpn
    
    # Create necessary directories
    mkdir -p /etc/openvpn/client
    mkdir -p "$VPN_LOG_DIR"
    mkdir -p "$CRED_DIR"
    
    # Set proper permissions
    chmod 700 "$CRED_DIR"
    
    log "OpenVPN installation completed"
}

# Setup work VPN configuration (SAML/Web Auth)
setup_work_vpn() {
    log "Setting up Work VPN (SAML Authentication)..."
    
    if [ ! -f "backend/work.ovpn" ]; then
        error "Work VPN config file not found: backend/work.ovpn"
        return 1
    fi
    
    # Copy and modify work config
    cp "backend/work.ovpn" "$WORK_CONFIG"
    
    # Add specific configurations for SAML/Web auth
    cat >> "$WORK_CONFIG" << EOF

# Work VPN specific settings
log $VPN_LOG_DIR/work-vpn.log
log-append
status $VPN_LOG_DIR/work-status.log
writepid /var/run/openvpn/work.pid
daemon work-vpn

# Route configuration for dual VPN
route-metric 100
route-delay 2

# SAML/Web Authentication settings
auth-retry interact
management 127.0.0.1 7505
management-hold
script-security 2

# DNS settings for work network
dhcp-option DNS 8.8.8.8
dhcp-option DNS 8.8.4.4
EOF
    
    log "Work VPN configuration completed"
}

# Setup home VPN configuration (Certificate Auth)
setup_home_vpn() {
    log "Setting up Home VPN (Certificate Authentication)..."
    
    if [ ! -f "backend/home.ovpn" ]; then
        error "Home VPN config file not found: backend/home.ovpn"
        return 1
    fi
    
    # Copy and modify home config
    cp "backend/home.ovpn" "$HOME_CONFIG"
    
    # Add specific configurations for certificate auth
    cat >> "$HOME_CONFIG" << EOF

# Home VPN specific settings
log $VPN_LOG_DIR/home-vpn.log
log-append
status $VPN_LOG_DIR/home-status.log
writepid /var/run/openvpn/home.pid
daemon home-vpn

# Route configuration for dual VPN
route-metric 200
route-delay 4

# Management interface
management 127.0.0.1 7506

# DNS settings for home network
dhcp-option DNS 192.168.1.1
EOF
    
    log "Home VPN configuration completed"
}

# Create systemd service files
setup_systemd_services() {
    log "Creating systemd service files..."
    
    # Work VPN service
    cat > /etc/systemd/system/openvpn-work.service << EOF
[Unit]
Description=Work OpenVPN Client
After=network.target
Wants=network.target

[Service]
Type=notify
ExecStart=/usr/sbin/openvpn --config $WORK_CONFIG
ExecReload=/bin/kill -HUP \$MAINPID
Restart=on-failure
RestartSec=10
User=nobody
Group=nogroup

[Install]
WantedBy=multi-user.target
EOF

    # Home VPN service
    cat > /etc/systemd/system/openvpn-home.service << EOF
[Unit]
Description=Home OpenVPN Client
After=network.target openvpn-work.service
Wants=network.target

[Service]
Type=notify
ExecStart=/usr/sbin/openvpn --config $HOME_CONFIG
ExecReload=/bin/kill -HUP \$MAINPID
Restart=on-failure
RestartSec=10
User=nobody
Group=nogroup

[Install]
WantedBy=multi-user.target
EOF

    # Reload systemd
    systemctl daemon-reload
    
    log "Systemd services created"
}

# Create VPN management script
create_vpn_manager() {
    log "Creating VPN management script..."
    
    cat > /usr/local/bin/vpn-manager << 'EOF'
#!/bin/bash

# VPN Manager Script
case "$1" in
    start-work)
        echo "Starting Work VPN..."
        systemctl start openvpn-work
        ;;
    stop-work)
        echo "Stopping Work VPN..."
        systemctl stop openvpn-work
        ;;
    start-home)
        echo "Starting Home VPN..."
        systemctl start openvpn-home
        ;;
    stop-home)
        echo "Stopping Home VPN..."
        systemctl stop openvpn-home
        ;;
    start-both)
        echo "Starting both VPNs..."
        systemctl start openvpn-work
        sleep 5
        systemctl start openvpn-home
        ;;
    stop-both)
        echo "Stopping both VPNs..."
        systemctl stop openvpn-work
        systemctl stop openvpn-home
        ;;
    status)
        echo "Work VPN Status:"
        systemctl status openvpn-work --no-pager -l
        echo ""
        echo "Home VPN Status:"
        systemctl status openvpn-home --no-pager -l
        echo ""
        echo "Active connections:"
        ip route | grep tun
        ;;
    logs)
        echo "Work VPN logs:"
        tail -20 /var/log/openvpn/work-vpn.log
        echo ""
        echo "Home VPN logs:"
        tail -20 /var/log/openvpn/home-vpn.log
        ;;
    *)
        echo "Usage: $0 {start-work|stop-work|start-home|stop-home|start-both|stop-both|status|logs}"
        exit 1
        ;;
esac
EOF

    chmod +x /usr/local/bin/vpn-manager
    
    log "VPN manager script created at /usr/local/bin/vpn-manager"
}

# Create web authentication helper for SAML
create_saml_helper() {
    log "Creating SAML authentication helper..."
    
    cat > /usr/local/bin/work-vpn-auth << 'EOF'
#!/bin/bash

# Work VPN SAML Authentication Helper
echo "=========================================="
echo "Work VPN SAML Authentication Required"
echo "=========================================="
echo ""
echo "Your work VPN uses SAML authentication."
echo "You'll need to authenticate via web browser."
echo ""
echo "Steps:"
echo "1. Start the work VPN: sudo vpn-manager start-work"
echo "2. Check logs for auth URL: sudo vpn-manager logs"
echo "3. Open the authentication URL in your browser"
echo "4. Complete SAML login process"
echo "5. VPN should connect automatically after auth"
echo ""
echo "Monitor connection: sudo vpn-manager status"
echo ""
EOF

    chmod +x /usr/local/bin/work-vpn-auth
    
    log "SAML helper created at /usr/local/bin/work-vpn-auth"
}

# Main setup function
main() {
    log "Starting Dual VPN Setup..."
    
    check_root
    install_openvpn
    setup_work_vpn
    setup_home_vpn
    setup_systemd_services
    create_vpn_manager
    create_saml_helper
    
    log "✅ Dual VPN setup completed!"
    echo ""
    echo "🚀 Quick Start:"
    echo "  • Start both VPNs: sudo vpn-manager start-both"
    echo "  • Work VPN only:   sudo vpn-manager start-work"
    echo "  • Home VPN only:   sudo vpn-manager start-home"
    echo "  • Check status:    sudo vpn-manager status"
    echo "  • View logs:       sudo vpn-manager logs"
    echo ""
    echo "🔐 SAML Authentication:"
    echo "  • Work VPN uses SAML - run: work-vpn-auth"
    echo "  • You'll need to authenticate via web browser"
    echo ""
    echo "📋 Files created:"
    echo "  • Work VPN config: $WORK_CONFIG"
    echo "  • Home VPN config: $HOME_CONFIG"
    echo "  • VPN manager:     /usr/local/bin/vpn-manager"
    echo "  • SAML helper:     /usr/local/bin/work-vpn-auth"
    echo ""
    echo "⚠️  Note: Work VPN requires web browser authentication"
    echo "   Home VPN uses certificate authentication (automatic)"
}

# Handle command line arguments
case "${1:-}" in
    --install)
        main
        ;;
    --help)
        echo "Dual VPN Setup Script"
        echo ""
        echo "Usage: sudo $0 --install"
        echo ""
        echo "This script sets up both work and home VPN connections:"
        echo "  • Work VPN: SAML/Web authentication"
        echo "  • Home VPN: Certificate authentication"
        echo ""
        echo "The script will:"
        echo "  1. Install OpenVPN and dependencies"
        echo "  2. Configure both VPN connections"
        echo "  3. Create systemd services"
        echo "  4. Create management tools"
        ;;
    *)
        echo "Dual VPN Setup for Ubuntu Server"
        echo "================================="
        echo ""
        echo "This script configures both work and home VPN connections:"
        echo "  • Work VPN: Uses SAML authentication via web browser"
        echo "  • Home VPN: Uses certificate authentication"
        echo ""
        echo "Run: sudo $0 --install"
        echo "Help: sudo $0 --help"
        ;;
esac
