#!/bin/bash

#################################################################################
# Setup Persistent VPN for Dedicated PBX Troubleshooting Server
# 
# This script helps configure the startup script for persistent VPN connection
# which allows the web server to maintain a constant connection to your work VPN,
# enabling PBX diagnostics to work from anywhere.
#################################################################################

echo "🔗 Setting up Persistent VPN for Dedicated Server Mode"
echo ""

# Check if VPN config exists
VPN_CONFIG="backend/tjohnson-work.ovpn"
if [[ ! -f "$VPN_CONFIG" ]]; then
    echo "❌ VPN config file not found: $VPN_CONFIG"
    echo "   Please ensure your VPN configuration file is in the backend directory."
    exit 1
fi

echo "✅ Found VPN config: $VPN_CONFIG"

# Check VPN config type
if grep -q "WEB_AUTH" "$VPN_CONFIG"; then
    echo "🔍 Detected SAML-based authentication in VPN config"
    echo ""
    echo "⚠️  IMPORTANT: Your VPN config uses SAML (web-based) authentication."
    echo "   Standard OpenVPN command-line client cannot handle SAML authentication."
    echo ""
    echo "📋 Recommended approach for dedicated server:"
    echo "   1. Install a GUI VPN client that supports SAML:"
    echo "      • OpenVPN Connect (official): https://openvpn.net/client-connect-vpn-for-linux/"
    echo "      • NetworkManager with OpenVPN plugin: sudo apt install network-manager-openvpn-gnome"
    echo ""
    echo "   2. Import your VPN config through the GUI client"
    echo "   3. Connect manually or set up auto-connect"
    echo "   4. Once connected, the web diagnostics will work through the server's VPN"
    echo ""
    echo "💡 Alternative: Use OpenVPN Connect with auto-connect:"
    echo "   • More reliable for persistent connections"
    echo "   • Handles SAML authentication properly"
    echo "   • Can be configured to auto-reconnect"
    echo ""
    
    read -p "Do you want to enable persistent VPN monitoring anyway? (y/N): " enable_monitoring
    if [[ "$enable_monitoring" =~ ^[Yy]$ ]]; then
        echo "   Note: You'll need to connect VPN manually through GUI client"
    else
        echo "Setup cancelled. Connect VPN manually when needed."
        exit 0
    fi
elif grep -q "auth-user-pass" "$VPN_CONFIG"; then
    echo "🔑 Detected username/password authentication"
    echo ""
    echo "📝 You'll need to create a credentials file:"
    echo "   File: backend/vpn-credentials.txt"
    echo "   Format:"
    echo "     Line 1: your_username"
    echo "     Line 2: your_password"
    echo ""
    
    if [[ ! -f "backend/vpn-credentials.txt" ]]; then
        read -p "Create credentials file now? (y/N): " create_creds
        if [[ "$create_creds" =~ ^[Yy]$ ]]; then
            read -p "Enter VPN username: " vpn_user
            read -s -p "Enter VPN password: " vpn_pass
            echo ""
            
            echo "$vpn_user" > backend/vpn-credentials.txt
            echo "$vpn_pass" >> backend/vpn-credentials.txt
            chmod 600 backend/vpn-credentials.txt
            
            echo "✅ Credentials file created with restricted permissions"
        fi
    else
        echo "✅ Credentials file already exists"
    fi
else
    echo "🔐 Detected certificate-based authentication"
    echo "✅ This should work with persistent VPN mode"
fi

echo ""
echo "🔧 Configuring startup script for persistent VPN..."

# Enable persistent VPN in startup script
if grep -q "ENABLE_PERSISTENT_VPN=false" start-app.sh; then
    sed -i 's/ENABLE_PERSISTENT_VPN=false/ENABLE_PERSISTENT_VPN=true/' start-app.sh
    echo "✅ Enabled persistent VPN in start-app.sh"
else
    echo "✅ Persistent VPN already enabled"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. If using SAML: Connect VPN manually through GUI client first"
echo "   2. Start the application: ./start-app.sh"
echo "   3. Check VPN status in the startup output"
echo "   4. Access diagnostics page to test PBX connectivity"
echo ""
echo "🌐 With persistent VPN, your diagnostics page will be able to:"
echo "   • Reach PBX servers directly through the VPN connection"
echo "   • Test SIP connectivity to hosted PBX systems"
echo "   • Provide reliable troubleshooting for remote users"
echo ""
echo "💡 Remember: The web server maintains the VPN connection,"
echo "   so users can access diagnostics from anywhere!"
