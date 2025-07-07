#!/bin/bash

#################################################################################
# VPN Connection Helper Script
# 
# This script             # Now proceed with VPN connection
            echo "📁 Importing VPN configuration as '$VPN_CONFIG_NAME'..."
            openvpn3 config-import --config "$VPN_CONFIG_FILE" --persistent --name "$VPN_CONFIG_NAME"
            echo "✅ Configuration imported and will persist across reboots"
            
            echo ""
            echo "🚀 Starting VPN connection..."
            echo "   ⚠️  A browser window will open for SAML authentication"
            echo "   Please complete the login process in the browser"
            echo ""
            
            # Start the session
            openvpn3 session-start --config "$VPN_CONFIG_NAME"
            
            echo ""
            echo "✅ VPN connection initiated!"
            echo ""
            echo "🔍 Useful commands:"
            echo "   • Check sessions: openvpn3 sessions-list"
            echo "   • View live logs: openvpn3 log --config $VPN_CONFIG_NAME --log-level 6"
            echo "   • Restart session: openvpn3 session-manage --config $VPN_CONFIG_NAME --restart"
            echo "   • Disconnect: openvpn3 session-manage --config $VPN_CONFIG_NAME --disconnect"t the work VPN using the appropriate method
# for SAML authentication.
#################################################################################

set -e

# Multiple config file options
VPN_CONFIG_FILES=(
    "/home/tim2/v3_PYMS/PolycomYealinkMikrotikSwitchConfig/1751289493903.ovpn"  # Work SAML VPN
    "/home/tim2/v3_PYMS/PolycomYealinkMikrotikSwitchConfig/1733619796225.ovpn"  # Home Lab VPN
    "backend/tjohnson-work.ovpn"
    "backend/work-vpn.ovpn"
)

VPN_CONFIGS_FOUND=()
VPN_CONFIG_NAMES=()

echo "🔗 Multi-VPN Connection Helper"
echo "=============================="
echo ""

# Find all available config files
for config in "${VPN_CONFIG_FILES[@]}"; do
    if [[ -f "$config" ]]; then
        VPN_CONFIGS_FOUND+=("$config")
        # Extract a name from the file path
        if [[ "$config" == *"1751289493903.ovpn" ]]; then
            VPN_CONFIG_NAMES+=("work-saml")
        elif [[ "$config" == *"1733619796225.ovpn" ]]; then
            VPN_CONFIG_NAMES+=("home-lab")
        elif [[ "$config" == *"tjohnson-work.ovpn" ]]; then
            VPN_CONFIG_NAMES+=("tjohnson-work")
        else
            VPN_CONFIG_NAMES+=("work-vpn")
        fi
    fi
done

# Check if any config files exist
if [[ ${#VPN_CONFIGS_FOUND[@]} -eq 0 ]]; then
    echo "❌ No VPN config files found! Looked for:"
    for config in "${VPN_CONFIG_FILES[@]}"; do
        echo "   • $config"
    done
    echo ""
    echo "💡 Please place your .ovpn files in one of these locations."
    exit 1
fi

echo "📁 Found ${#VPN_CONFIGS_FOUND[@]} VPN configuration(s):"
for i in "${!VPN_CONFIGS_FOUND[@]}"; do
    echo "   ${VPN_CONFIG_NAMES[i]}: ${VPN_CONFIGS_FOUND[i]}"
done
echo ""

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
        if openvpn3 configs-list 2>/dev/null | grep -q "$VPN_CONFIG_NAME"; then
            echo "📁 Config '$VPN_CONFIG_NAME' already imported"
        else
            echo "📁 Importing VPN configuration as '$VPN_CONFIG_NAME'..."
            openvpn3 config-import --config "$VPN_CONFIG_FILE" --persistent --name "$VPN_CONFIG_NAME"
            echo "✅ Configuration imported and will persist across reboots"
        fi
        
        echo ""
        echo "🚀 Starting VPN session..."
        echo "   ⚠️  A browser window will open for SAML authentication"
        echo "   Please complete the login process in the browser"
        echo ""
        
        # Start the session
        openvpn3 session-start --config "$VPN_CONFIG_NAME"
        
        echo ""
        echo "✅ VPN connection initiated!"
        echo ""
        echo "🔍 Useful commands:"
        echo "   • Check sessions: openvpn3 sessions-list"
        echo "   • View live logs: openvpn3 log --config $VPN_CONFIG_NAME --log-level 6"
        echo "   • Restart session: openvpn3 session-manage --config $VPN_CONFIG_NAME --restart"
        echo "   • Disconnect: openvpn3 session-manage --config $VPN_CONFIG_NAME --disconnect"
        
    else
        echo "❌ OpenVPN 3 not found - installing now..."
        echo ""
        echo "📦 Installing OpenVPN 3 Linux (Official Repository)..."
        echo ""
        
        # Install required packages
        echo "Installing dependencies..."
        sudo apt update
        sudo apt install -y apt-transport-https curl
        
        # Add OpenVPN repository key
        echo "Adding repository key..."
        sudo mkdir -p /etc/apt/keyrings
        curl -sSfL https://packages.openvpn.net/packages-repo.gpg | sudo tee /etc/apt/keyrings/openvpn.asc >/dev/null
        
        # Detect distribution codename
        CODENAME="jammy"  # Default fallback
        if [ -f /etc/lsb-release ]; then
            . /etc/lsb-release
            CODENAME=$DISTRIB_CODENAME
        elif [ -f /etc/os-release ]; then
            . /etc/os-release
            CODENAME=$VERSION_CODENAME
        fi
        
        echo "Using distribution codename: $CODENAME"
        
        # Add repository
        echo "deb [signed-by=/etc/apt/keyrings/openvpn.asc] https://packages.openvpn.net/openvpn3/debian $CODENAME main" | sudo tee /etc/apt/sources.list.d/openvpn3.list
        
        # Install OpenVPN 3
        echo "Installing OpenVPN 3..."
        sudo apt update
        sudo apt install -y openvpn3
        
        # Verify installation
        if command -v openvpn3 >/dev/null 2>&1; then
            echo "✅ OpenVPN 3 successfully installed!"
            echo ""
            
            # Now proceed with VPN connection
            echo "📁 Importing VPN configuration..."
            openvpn3 config-import --config "$VPN_CONFIG_FILE" --name "tjohnson-work"
            
            echo ""
            echo "� Starting VPN connection..."
            echo "   ⚠️  A browser window will open for SAML authentication"
            echo "   Please complete the login process in the browser"
            echo ""
            
            # Start the session
            openvpn3 session-start --config tjohnson-work
        else
            echo "❌ OpenVPN 3 installation failed"
            echo ""
            echo "📦 Manual installation alternatives:"
            echo ""
            echo "🥇 OpenVPN Connect GUI (Download .deb package):"
            echo "   wget https://swupdate.openvpn.net/downloads/connect/openvpn-connect-3.4.9_amd64.deb"
            echo "   sudo dpkg -i openvpn-connect-3.4.9_amd64.deb"
            echo "   sudo apt-get install -f"
            echo ""
            echo "🥈 NetworkManager GUI (if you have desktop):"
            echo "   sudo apt install network-manager-openvpn network-manager-openvpn-gnome"
            echo "   Open Settings → Network → VPN → Add VPN → Import: $VPN_CONFIG_FILE"
            echo ""
            exit 1
        fi
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
