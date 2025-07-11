#!/bin/bash

# Dual VPN Manager for Ubuntu Server
# Manages both Work VPN and Home VPN connections simultaneously

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# VPN Configuration Files (update these paths)
WORK_VPN_CONFIG="backend/work.ovpn"
HOME_VPN_CONFIG="backend/home.ovpn"

# Service names for systemd
WORK_VPN_SERVICE="openvpn-work"
HOME_VPN_SERVICE="openvpn-home"

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

# Function to check if OpenVPN is installed
check_openvpn() {
    log "Checking OpenVPN installation..."
    
    if ! command -v openvpn &> /dev/null; then
        warn "OpenVPN not found. Installing..."
        sudo apt update
        sudo apt install -y openvpn
        log "OpenVPN installed successfully"
    else
        log "OpenVPN is already installed"
    fi
}

# Function to check if configuration files exist
check_config_files() {
    log "Checking VPN configuration files..."
    
    local files_found=true
    
    if [ ! -f "$WORK_VPN_CONFIG" ]; then
        error "Work VPN config not found: $WORK_VPN_CONFIG"
        files_found=false
    else
        log "✅ Work VPN config found: $WORK_VPN_CONFIG"
    fi
    
    if [ ! -f "$HOME_VPN_CONFIG" ]; then
        error "Home VPN config not found: $HOME_VPN_CONFIG"
        files_found=false
    else
        log "✅ Home VPN config found: $HOME_VPN_CONFIG"
    fi
    
    if [ "$files_found" = false ]; then
        warn "Some configuration files are missing. Please ensure you have:"
        echo "  • Work VPN: $WORK_VPN_CONFIG"
        echo "  • Home VPN: $HOME_VPN_CONFIG"
        echo ""
        echo "Place your .ovpn files in the correct locations and run this script again."
        return 1
    fi
    
    return 0
}

# Function to create systemd service files
create_systemd_services() {
    log "Creating systemd service files..."
    
    # Work VPN service
    sudo tee /etc/systemd/system/${WORK_VPN_SERVICE}.service > /dev/null <<EOF
[Unit]
Description=Work OpenVPN connection
After=network.target
Wants=network.target

[Service]
Type=notify
PrivateTmp=true
WorkingDirectory=$(pwd)
ExecStart=/usr/sbin/openvpn --config $(pwd)/$WORK_VPN_CONFIG --daemon --writepid /run/openvpn/${WORK_VPN_SERVICE}.pid --cd $(pwd) --script-security 2
PIDFile=/run/openvpn/${WORK_VPN_SERVICE}.pid
KillMode=mixed
ExecReload=/bin/kill -HUP \$MAINPID
CapabilityBoundingSet=CAP_IPC_LOCK CAP_NET_ADMIN CAP_NET_RAW CAP_SETGID CAP_SETUID CAP_SYS_CHROOT CAP_DAC_OVERRIDE
LimitNPROC=10
DeviceAllow=/dev/null rw
DeviceAllow=/dev/net/tun rw
ProtectSystem=true
ProtectHome=true
RestartSec=5s
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

    # Home VPN service
    sudo tee /etc/systemd/system/${HOME_VPN_SERVICE}.service > /dev/null <<EOF
[Unit]
Description=Home OpenVPN connection
After=network.target
Wants=network.target

[Service]
Type=notify
PrivateTmp=true
WorkingDirectory=$(pwd)
ExecStart=/usr/sbin/openvpn --config $(pwd)/$HOME_VPN_CONFIG --daemon --writepid /run/openvpn/${HOME_VPN_SERVICE}.pid --cd $(pwd) --script-security 2
PIDFile=/run/openvpn/${HOME_VPN_SERVICE}.pid
KillMode=mixed
ExecReload=/bin/kill -HUP \$MAINPID
CapabilityBoundingSet=CAP_IPC_LOCK CAP_NET_ADMIN CAP_NET_RAW CAP_SETGID CAP_SETUID CAP_SYS_CHROOT CAP_DAC_OVERRIDE
LimitNPROC=10
DeviceAllow=/dev/null rw
DeviceAllow=/dev/net/tun rw
ProtectSystem=true
ProtectHome=true
RestartSec=5s
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

    # Create OpenVPN runtime directory
    sudo mkdir -p /run/openvpn
    
    # Reload systemd
    sudo systemctl daemon-reload
    
    log "✅ Systemd services created successfully"
}

# Function to start VPN connections
start_vpns() {
    log "Starting VPN connections..."
    
    # Enable and start Work VPN
    sudo systemctl enable ${WORK_VPN_SERVICE}
    sudo systemctl start ${WORK_VPN_SERVICE}
    
    # Enable and start Home VPN
    sudo systemctl enable ${HOME_VPN_SERVICE}
    sudo systemctl start ${HOME_VPN_SERVICE}
    
    # Wait for connections to establish
    sleep 5
    
    log "✅ VPN connections started"
}

# Function to stop VPN connections
stop_vpns() {
    log "Stopping VPN connections..."
    
    sudo systemctl stop ${WORK_VPN_SERVICE} || true
    sudo systemctl stop ${HOME_VPN_SERVICE} || true
    
    log "✅ VPN connections stopped"
}

# Function to check VPN status
check_vpn_status() {
    log "Checking VPN connection status..."
    
    echo ""
    echo "🔍 VPN Status Summary:"
    echo "====================="
    
    # Check Work VPN
    if sudo systemctl is-active --quiet ${WORK_VPN_SERVICE}; then
        echo -e "Work VPN: ${GREEN}✅ Connected${NC}"
    else
        echo -e "Work VPN: ${RED}❌ Disconnected${NC}"
    fi
    
    # Check Home VPN
    if sudo systemctl is-active --quiet ${HOME_VPN_SERVICE}; then
        echo -e "Home VPN: ${GREEN}✅ Connected${NC}"
    else
        echo -e "Home VPN: ${RED}❌ Disconnected${NC}"
    fi
    
    echo ""
    echo "📊 Network Interfaces:"
    echo "====================="
    ip addr show | grep -E "tun|tap" | head -10
    
    echo ""
    echo "🌐 Routing Table:"
    echo "================="
    ip route | head -10
    
    echo ""
    echo "📋 Service Status:"
    echo "=================="
    sudo systemctl status ${WORK_VPN_SERVICE} --no-pager -l || true
    echo ""
    sudo systemctl status ${HOME_VPN_SERVICE} --no-pager -l || true
}

# Function to show VPN logs
show_logs() {
    log "Showing VPN connection logs..."
    
    echo ""
    echo "📋 Work VPN Logs (last 20 lines):"
    echo "=================================="
    sudo journalctl -u ${WORK_VPN_SERVICE} -n 20 --no-pager || true
    
    echo ""
    echo "📋 Home VPN Logs (last 20 lines):"
    echo "=================================="
    sudo journalctl -u ${HOME_VPN_SERVICE} -n 20 --no-pager || true
}

# Function to restart VPN connections
restart_vpns() {
    log "Restarting VPN connections..."
    
    stop_vpns
    sleep 2
    start_vpns
    sleep 3
    check_vpn_status
}

# Function to setup routing for dual VPN
setup_routing() {
    log "Setting up routing for dual VPN connections..."
    
    # Add routing rules here if needed
    # This depends on your specific network requirements
    
    info "Routing setup completed (customize as needed)"
}

# Function to remove VPN services
remove_services() {
    log "Removing VPN services..."
    
    sudo systemctl stop ${WORK_VPN_SERVICE} || true
    sudo systemctl stop ${HOME_VPN_SERVICE} || true
    sudo systemctl disable ${WORK_VPN_SERVICE} || true
    sudo systemctl disable ${HOME_VPN_SERVICE} || true
    
    sudo rm -f /etc/systemd/system/${WORK_VPN_SERVICE}.service
    sudo rm -f /etc/systemd/system/${HOME_VPN_SERVICE}.service
    
    sudo systemctl daemon-reload
    
    log "✅ VPN services removed"
}

# Function to show usage
show_usage() {
    echo "Ubuntu Server Dual VPN Manager"
    echo "=============================="
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  setup       - Install OpenVPN and setup services"
    echo "  start       - Start both VPN connections"
    echo "  stop        - Stop both VPN connections"
    echo "  restart     - Restart both VPN connections"
    echo "  status      - Check VPN connection status"
    echo "  logs        - Show VPN connection logs"
    echo "  remove      - Remove VPN services"
    echo "  help        - Show this help message"
    echo ""
    echo "Configuration Files:"
    echo "  Work VPN: $WORK_VPN_CONFIG"
    echo "  Home VPN: $HOME_VPN_CONFIG"
    echo ""
    echo "Examples:"
    echo "  $0 setup     # Initial setup"
    echo "  $0 start     # Connect to both VPNs"
    echo "  $0 status    # Check connection status"
}

# Main execution
main() {
    case "${1:-}" in
        "setup")
            log "Setting up dual VPN connections..."
            check_openvpn
            if check_config_files; then
                create_systemd_services
                setup_routing
                log "✅ Setup completed! Use '$0 start' to connect."
            fi
            ;;
        "start")
            if check_config_files; then
                start_vpns
                sleep 3
                check_vpn_status
            fi
            ;;
        "stop")
            stop_vpns
            ;;
        "restart")
            restart_vpns
            ;;
        "status")
            check_vpn_status
            ;;
        "logs")
            show_logs
            ;;
        "remove")
            remove_services
            ;;
        "help"|"--help"|"-h")
            show_usage
            ;;
        *)
            warn "Unknown command: ${1:-}"
            echo ""
            show_usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
