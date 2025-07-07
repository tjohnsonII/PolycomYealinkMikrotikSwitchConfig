#!/bin/bash

#################################################################################
# VPN Connection Helper Script
# 
# This script helps connect the work VPN using the appropriate method
# for SAML authentication.
#################################################################################

set -e

VPN_CONFIG_FILE="backend/tjohnson-work.ovpn"

echo "🔗 Work VPN Connection Helper"
echo "==============================="
echo ""

# Check if config file exists
if [[ ! -f "$VPN_CONFIG_FILE" ]]; then
    echo "❌ VPN config file not found: $VPN_CONFIG_FILE"
    exit 1
fi

# Detect authentication method
auth_method=""
if grep -q "WEB_AUTH\|auth.*web" "$VPN_CONFIG_FILE" 2>/dev/null; then
    auth_method="SAML/WEB_AUTH"
elif grep -q "auth-user-pass" "$VPN_CONFIG_FILE" 2>/dev/null; then
    auth_method="Username/Password"
else
    auth_method="Certificate-based"
fi

echo "🔐 Detected authentication method: $auth_method"
echo "📁 Config file: $VPN_CONFIG_FILE"
echo ""

if [[ "$auth_method" == "SAML/WEB_AUTH" ]]; then
    echo "🌐 SAML authentication requires interactive browser login"
    echo ""
    
    # Check for OpenVPN 3
    if command -v openvpn3 >/dev/null 2>&1; then
        echo "✅ OpenVPN 3 found - using recommended method"
        echo ""
        
        # Check if config is already imported
        if openvpn3 configs-list 2>/dev/null | grep -q "tjohnson-work"; then
            echo "📁 Config already imported"
        else
            echo "📁 Importing VPN configuration..."
            openvpn3 config-import --config "$VPN_CONFIG_FILE" --name "tjohnson-work"
        fi
        
        echo ""
        echo "🚀 Starting VPN connection..."
        echo "   ⚠️  A browser window will open for SAML authentication"
        echo "   Please complete the login process in the browser"
        echo ""
        
        # Start the session
        openvpn3 session-start --config tjohnson-work
        
    else
        echo "❌ OpenVPN 3 not found - please install first"
        echo ""
        echo "📦 Installation steps:"
        echo ""
        echo "1. For Ubuntu/Debian:"
        echo "   curl -fsSL https://packages.openvpn.net/packages-repo.gpg | sudo gpg --dearmor -o /etc/apt/keyrings/openvpn.gpg"
        echo "   echo 'deb [signed-by=/etc/apt/keyrings/openvpn.gpg] https://packages.openvpn.net/openvpn3/debian \$(lsb_release -cs) main' | sudo tee /etc/apt/sources.list.d/openvpn3.list"
        echo "   sudo apt update && sudo apt install openvpn3"
        echo ""
        echo "2. Or visit: https://openvpn.net/client-connect-vpn-for-linux/"
        echo ""
        echo "🖥️  Alternative: Use NetworkManager GUI"
        echo "   1. Open Network Settings"
        echo "   2. VPN → Add VPN → Import from file"
        echo "   3. Select: $VPN_CONFIG_FILE"
        echo "   4. Connect (browser opens for SAML)"
        exit 1
    fi
    
else
    echo "🔑 Standard authentication - using OpenVPN"
    
    if command -v openvpn >/dev/null 2>&1; then
        echo "🚀 Connecting with standard OpenVPN..."
        if [[ "$auth_method" == "Username/Password" ]]; then
            sudo openvpn --config "$VPN_CONFIG_FILE" --auth-user-pass
        else
            sudo openvpn --config "$VPN_CONFIG_FILE"
        fi
    else
        echo "❌ OpenVPN not found - please install: sudo apt install openvpn"
        exit 1
    fi
fi

echo ""
echo "✅ VPN connection process completed"
echo ""
echo "🔍 Check connection status:"
echo "   • Web app diagnostics: http://localhost:3000"
echo "   • Backend status: curl http://localhost:3001/system/server-vpn-status"
echo "   • Interface check: ip addr show | grep tun"
