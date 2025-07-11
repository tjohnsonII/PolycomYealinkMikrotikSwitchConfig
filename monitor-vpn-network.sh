#!/bin/bash

# VPN Network Monitor
# Monitors both VPN connections and network routes

echo "🌐 VPN Network Monitor"
echo "====================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to check if VPN interfaces are up
check_vpn_interfaces() {
    echo "🔍 VPN Interface Status:"
    echo "========================"
    
    # Check for tun/tap interfaces
    vpn_interfaces=$(ip link show | grep -E "tun|tap" || true)
    
    if [ -n "$vpn_interfaces" ]; then
        echo -e "${GREEN}✅ VPN interfaces found:${NC}"
        echo "$vpn_interfaces"
    else
        echo -e "${RED}❌ No VPN interfaces found${NC}"
    fi
    echo ""
}

# Function to check IP addresses
check_ip_addresses() {
    echo "📍 IP Address Information:"
    echo "=========================="
    
    # Show all interfaces with IP addresses
    ip addr show | grep -E "inet|interface" | grep -v "127.0.0.1" | while read line; do
        if [[ $line == *"mtu"* ]]; then
            echo -e "${BLUE}$line${NC}"
        else
            echo "  $line"
        fi
    done
    echo ""
}

# Function to check routing table
check_routes() {
    echo "🗺️  Routing Table:"
    echo "=================="
    
    # Show main routes
    ip route show | head -20
    echo ""
}

# Function to test connectivity
test_connectivity() {
    echo "🔗 Connectivity Tests:"
    echo "====================="
    
    # Test targets
    targets=(
        "8.8.8.8:Google DNS"
        "1.1.1.1:Cloudflare DNS"
        "google.com:Google"
        "timsablab.ddns.net:Your Domain"
    )
    
    for target in "${targets[@]}"; do
        ip="${target%%:*}"
        name="${target##*:}"
        
        echo -n "Testing $name ($ip): "
        if ping -c 1 -W 2 "$ip" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Connected${NC}"
        else
            echo -e "${RED}❌ Failed${NC}"
        fi
    done
    echo ""
}

# Function to check DNS resolution
check_dns() {
    echo "🌐 DNS Resolution:"
    echo "=================="
    
    # Test DNS resolution
    domains=("google.com" "timsablab.ddns.net" "github.com")
    
    for domain in "${domains[@]}"; do
        echo -n "Resolving $domain: "
        if nslookup "$domain" >/dev/null 2>&1; then
            ip=$(nslookup "$domain" | grep "Address:" | tail -1 | awk '{print $2}')
            echo -e "${GREEN}✅ $ip${NC}"
        else
            echo -e "${RED}❌ Failed${NC}"
        fi
    done
    echo ""
}

# Function to show VPN service status
check_vpn_services() {
    echo "⚙️  VPN Service Status:"
    echo "======================"
    
    services=("openvpn-work" "openvpn-home")
    
    for service in "${services[@]}"; do
        echo -n "$service: "
        if systemctl is-active --quiet "$service" 2>/dev/null; then
            echo -e "${GREEN}✅ Running${NC}"
        else
            echo -e "${RED}❌ Stopped${NC}"
        fi
    done
    echo ""
}

# Function to show network statistics
show_network_stats() {
    echo "📊 Network Statistics:"
    echo "====================="
    
    # Show interface statistics
    cat /proc/net/dev | grep -E "tun|tap|eth|wlan" | while read line; do
        interface=$(echo "$line" | awk '{print $1}' | sed 's/://')
        rx_bytes=$(echo "$line" | awk '{print $2}')
        tx_bytes=$(echo "$line" | awk '{print $10}')
        
        if [ "$interface" != "Inter-|" ] && [ "$interface" != "face" ]; then
            rx_mb=$((rx_bytes / 1024 / 1024))
            tx_mb=$((tx_bytes / 1024 / 1024))
            echo "$interface: RX ${rx_mb}MB, TX ${tx_mb}MB"
        fi
    done
    echo ""
}

# Function to monitor continuously
monitor_continuous() {
    echo "🔄 Starting continuous monitoring (Ctrl+C to stop)..."
    echo ""
    
    while true; do
        clear
        echo "🌐 VPN Network Monitor - $(date)"
        echo "=================================="
        echo ""
        
        check_vpn_services
        check_vpn_interfaces
        test_connectivity
        
        echo "⏱️  Next update in 30 seconds..."
        sleep 30
    done
}

# Main execution
case "${1:-}" in
    "monitor"|"continuous")
        monitor_continuous
        ;;
    "test")
        test_connectivity
        ;;
    "routes")
        check_routes
        ;;
    "dns")
        check_dns
        ;;
    *)
        # Full status check
        check_vpn_services
        check_vpn_interfaces
        check_ip_addresses
        check_routes
        test_connectivity
        check_dns
        show_network_stats
        
        echo "💡 Usage:"
        echo "   $0           - Full status check"
        echo "   $0 monitor   - Continuous monitoring"
        echo "   $0 test      - Connectivity test only"
        echo "   $0 routes    - Show routing table"
        echo "   $0 dns       - Test DNS resolution"
        ;;
esac
