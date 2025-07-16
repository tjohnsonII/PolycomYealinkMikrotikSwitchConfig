#!/bin/bash

#################################################################################
# Multi-Domain Network Configuration
#
# This script helps configure the system for multi-domain hosting:
# - Localhost access (127.0.0.1)
# - LAN access (192.168.254.253)
# - Domain access (123hostedtools.com)
#################################################################################

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
LOCAL_IP="127.0.0.1"
LAN_IP="192.168.254.253"
DOMAIN="123hostedtools.com"
MANAGEMENT_PORT="3099"
APP_PORT="3000"

echo -e "${BLUE}=== Multi-Domain Network Configuration ===${NC}"
echo ""

# Function to test connection
test_connection() {
    local host=$1
    local port=$2
    local description=$3
    
    echo -n "Testing $description ($host:$port)... "
    
    if timeout 5 bash -c "cat < /dev/null > /dev/tcp/$host/$port" 2>/dev/null; then
        echo -e "${GREEN}✓ Available${NC}"
        return 0
    else
        echo -e "${RED}✗ Not accessible${NC}"
        return 1
    fi
}

# Check current network configuration
echo -e "${YELLOW}Current Network Configuration:${NC}"
echo "Local IP: $LOCAL_IP"
echo "LAN IP: $LAN_IP"
echo "Domain: $DOMAIN"
echo ""

# Test if services are running
echo -e "${YELLOW}Testing Service Availability:${NC}"
test_connection "$LOCAL_IP" "$MANAGEMENT_PORT" "Management Console (localhost)"
test_connection "$LAN_IP" "$MANAGEMENT_PORT" "Management Console (LAN)" || echo "  Note: May not be accessible if service not running"
test_connection "$LOCAL_IP" "$APP_PORT" "Main Application (localhost)" || echo "  Note: Start application through management console"
test_connection "$LAN_IP" "$APP_PORT" "Main Application (LAN)" || echo "  Note: Start application through management console"
echo ""

# Check environment configuration
echo -e "${YELLOW}Environment Configuration:${NC}"
if [ -f ".env" ]; then
    echo "✓ .env file exists"
    if grep -q "WEBUI_ALLOW_LAN=true" .env; then
        echo "✓ LAN access enabled"
    else
        echo "⚠ LAN access not explicitly enabled"
    fi
    
    if grep -q "BIND_ADDRESS=0.0.0.0" .env; then
        echo "✓ Bind address set to all interfaces"
    else
        echo "⚠ Bind address not set to all interfaces"
    fi
    
    if grep -q "ALLOWED_DOMAINS" .env; then
        echo "✓ Allowed domains configured"
        echo "  Domains: $(grep ALLOWED_DOMAINS .env | cut -d'=' -f2)"
    else
        echo "⚠ Allowed domains not configured"
    fi
else
    echo "✗ .env file not found"
fi
echo ""

# Network interface information
echo -e "${YELLOW}Network Interface Information:${NC}"
echo "Available IP addresses:"
ip addr show | grep -E 'inet [0-9]' | grep -v '127.0.0.1' | awk '{print "  " $2}' | cut -d'/' -f1
echo ""

# Firewall status
echo -e "${YELLOW}Firewall Status:${NC}"
if command -v ufw >/dev/null 2>&1; then
    echo "UFW Status: $(ufw status | head -1)"
    echo "Relevant rules:"
    ufw status numbered | grep -E "(3000|3001|3002|3099)" || echo "  No specific rules found for application ports"
else
    echo "UFW not installed"
fi
echo ""

# Port status
echo -e "${YELLOW}Port Status:${NC}"
echo "Checking what's listening on application ports:"
netstat -tlnp 2>/dev/null | grep -E ":(3000|3001|3002|3099)" || echo "  No services currently listening on application ports"
echo ""

# Access URLs
echo -e "${YELLOW}Access URLs:${NC}"
echo "Management Console:"
echo "  Local:  http://$LOCAL_IP:$MANAGEMENT_PORT"
echo "  LAN:    http://$LAN_IP:$MANAGEMENT_PORT"
echo "  Domain: https://$DOMAIN:$MANAGEMENT_PORT"
echo ""
echo "Main Application:"
echo "  Local:  http://$LOCAL_IP:$APP_PORT"
echo "  LAN:    http://$LAN_IP:$APP_PORT"
echo "  Domain: https://$DOMAIN:$APP_PORT"
echo ""

# DNS resolution test
echo -e "${YELLOW}DNS Resolution Test:${NC}"
if nslookup "$DOMAIN" >/dev/null 2>&1; then
    echo "✓ $DOMAIN resolves to: $(nslookup $DOMAIN | grep -A1 'Name:' | tail -1 | awk '{print $2}')"
else
    echo "✗ $DOMAIN does not resolve"
fi
echo ""

# Recommendations
echo -e "${YELLOW}Recommendations:${NC}"
if [ ! -f ".env" ]; then
    echo "• Run ./setup.sh to create .env file"
fi

if ! pgrep -f "management-server.js" >/dev/null; then
    echo "• Start management console: ./start.sh"
fi

echo "• Configure router port forwarding for external access:"
echo "  - Forward port $APP_PORT to $LAN_IP:$APP_PORT"
echo "  - Forward port $MANAGEMENT_PORT to $LAN_IP:$MANAGEMENT_PORT"
echo ""
echo "• For HTTPS access, configure SSL certificates"
echo "• Ensure firewall allows connections on ports $APP_PORT, $MANAGEMENT_PORT"
echo ""

echo -e "${GREEN}Multi-domain configuration check complete!${NC}"
echo ""
echo "To start the system:"
echo "  1. ./setup.sh    # One-time setup"
echo "  2. ./start.sh    # Start management console"
echo "  3. Access any URL above to use the application"
echo ""
