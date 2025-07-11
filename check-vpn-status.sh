#!/bin/bash

# VPN Status Checker for Web Application
# Returns JSON status of both work and home VPN connections

# Function to check if VPN is connected
check_vpn_status() {
    local vpn_name="$1"
    local service_name="openvpn-$vpn_name"
    
    # Check systemd service status
    if systemctl is-active "$service_name" >/dev/null 2>&1; then
        local status="connected"
    else
        local status="disconnected"
    fi
    
    # Get connection info
    local interface=$(ip route | grep "tun.*$vpn_name" | head -1 | awk '{print $3}' 2>/dev/null || echo "none")
    local ip_info=""
    
    if [ "$interface" != "none" ] && [ -n "$interface" ]; then
        ip_info=$(ip addr show "$interface" 2>/dev/null | grep "inet " | awk '{print $2}' | head -1 || echo "unknown")
    fi
    
    # Get last log entry
    local last_log=""
    if [ -f "/var/log/openvpn/${vpn_name}-vpn.log" ]; then
        last_log=$(tail -1 "/var/log/openvpn/${vpn_name}-vpn.log" 2>/dev/null | cut -c1-100 || echo "No logs")
    fi
    
    # Output JSON for this VPN
    cat << EOF
    "$vpn_name": {
        "status": "$status",
        "interface": "$interface",
        "ip": "$ip_info",
        "service": "$service_name",
        "last_log": "$last_log",
        "timestamp": "$(date -Iseconds)"
    }
EOF
}

# Check if OpenVPN is installed
if ! command -v openvpn >/dev/null 2>&1; then
    cat << EOF
{
    "vpn_status": "not_configured",
    "error": "OpenVPN not installed",
    "message": "Run setup-dual-vpn.sh --install to configure VPN",
    "timestamp": "$(date -Iseconds)"
}
EOF
    exit 0
fi

# Generate combined JSON status
cat << EOF
{
    "vpn_status": "configured",
    "connections": {
$(check_vpn_status "work"),
$(check_vpn_status "home")
    },
    "system_info": {
        "hostname": "$(hostname)",
        "uptime": "$(uptime -p)",
        "routes": "$(ip route | grep tun | wc -l)",
        "timestamp": "$(date -Iseconds)"
    }
}
EOF
