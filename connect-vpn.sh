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

# Function to detect authentication method for a config file
detect_auth_method() {
    local config_file="$1"
    if grep -q "WEB_AUTH\|auth.*web" "$config_file" 2>/dev/null; then
        echo "SAML/WEB_AUTH"
    elif grep -q "auth-user-pass" "$config_file" 2>/dev/null; then
        echo "Username/Password"
    else
        echo "Certificate-based"
    fi
}

# Function to connect a single VPN
connect_vpn() {
    local config_file="$1"
    local config_name="$2"
    local auth_method=$(detect_auth_method "$config_file")
    local connected=0

    echo "🔗 Connecting VPN: $config_name"
    echo "   📁 Config: $config_file"
    echo "   🔐 Auth: $auth_method"
    echo ""

    if [[ "$auth_method" == "SAML/WEB_AUTH" ]]; then
        if command -v openvpn3 >/dev/null 2>&1; then
            # Check if config is already imported
            if ! openvpn3 configs-list 2>/dev/null | grep -q "$config_name"; then
                echo "   📁 Importing VPN configuration as '$config_name'..."
                openvpn3 config-import --config "$config_file" --persistent --name "$config_name"
                echo "   ✅ Configuration imported"
            else
                echo "   📁 Config '$config_name' already imported"
            fi

            # Check if session is already running
            if openvpn3 sessions-list 2>/dev/null | grep -q "$config_name"; then
                echo "   🔗 Session '$config_name' already running"
                connected=1
            else
                echo "   🚀 Starting VPN session..."
                echo "      ⚠️  A browser window may open for SAML authentication."
                openvpn3 session-start --config "$config_name"
                # Wait for user to complete SAML login
                echo "   ⏳ Waiting for SAML authentication to complete..."
                for i in {1..30}; do
                    sleep 2
                    if openvpn3 sessions-list 2>/dev/null | grep -q "$config_name"; then
                        connected=1
                        break
                    fi
                done
                if [[ $connected -eq 1 ]]; then
                    echo "   ✅ VPN session established for $config_name!"
                else
                    echo "   ❌ VPN session not established for $config_name. Please check browser and complete login."
                fi
            fi
        else
            echo "   ❌ OpenVPN 3 required for SAML authentication"
            return 1
        fi
    else
        echo "   🔑 Standard authentication - using OpenVPN"
        if command -v openvpn >/dev/null 2>&1; then
            # Check if already running (by tun interface)
            if ip addr show | grep -q "tun"; then
                echo "   🔗 VPN already running for $config_name (tun interface present)"
                connected=1
            else
                echo "   🚀 Starting VPN with standard OpenVPN..."
                if [[ "$auth_method" == "Username/Password" ]]; then
                    # Prompt for credentials file if not present
                    if ! grep -q '^auth-user-pass ' "$config_file" && ! grep -q '^auth-user-pass$' "$config_file"; then
                        echo "   ⚠️  This config requires username/password. Please provide a credentials file or edit the config."
                        read -p "   Enter path to credentials file (or leave blank to prompt interactively): " cred_file
                        if [[ -n "$cred_file" && -f "$cred_file" ]]; then
                            sudo openvpn --config "$config_file" --auth-user-pass "$cred_file" --daemon --log-append "$config_name.log"
                        else
                            sudo openvpn --config "$config_file" --daemon --log-append "$config_name.log"
                        fi
                    else
                        sudo openvpn --config "$config_file" --daemon --log-append "$config_name.log"
                    fi
                else
                    sudo openvpn --config "$config_file" --daemon --log-append "$config_name.log"
                fi
                # Wait for tun interface
                for i in {1..10}; do
                    sleep 2
                    if ip addr show | grep -q "tun"; then
                        connected=1
                        break
                    fi
                done
                if [[ $connected -eq 1 ]]; then
                    echo "   ✅ VPN connection established for $config_name!"
                else
                    echo "   ❌ VPN connection not established for $config_name. Check logs: $config_name.log"
                fi
            fi
        else
            echo "   ❌ OpenVPN not found"
            return 1
        fi
    fi

    # Record status for summary
    VPN_STATUS["$config_name"]=$connected
    echo ""
}

# Check for OpenVPN 3 installation
if ! command -v openvpn3 >/dev/null 2>&1; then
    echo "� Installing OpenVPN 3 Linux for SAML support..."
    
    # Install required packages
    sudo apt update
    sudo apt install -y apt-transport-https curl
    
    # Add OpenVPN repository key
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
    
    # Add repository and install
    echo "deb [signed-by=/etc/apt/keyrings/openvpn.asc] https://packages.openvpn.net/openvpn3/debian $CODENAME main" | sudo tee /etc/apt/sources.list.d/openvpn3.list
    sudo apt update
    sudo apt install -y openvpn3
    
    if command -v openvpn3 >/dev/null 2>&1; then
        echo "✅ OpenVPN 3 successfully installed!"
    else
        echo "❌ OpenVPN 3 installation failed"
        exit 1
    fi
fi

echo "� Connecting all VPN configurations..."
echo ""

# Connect each VPN configuration
declare -A VPN_STATUS
for i in "${!VPN_CONFIGS_FOUND[@]}"; do
    connect_vpn "${VPN_CONFIGS_FOUND[i]}" "${VPN_CONFIG_NAMES[i]}"
done

# Print summary
echo "==============================="
echo "� VPN Connection Summary:"
for name in "${VPN_CONFIG_NAMES[@]}"; do
    if [[ "${VPN_STATUS[$name]}" -eq 1 ]]; then
        echo "   ✅ $name: Connected"
    else
        echo "   ❌ $name: Not connected"
    fi
done
echo "==============================="

echo ""
echo "🔍 Check connection status:"
echo "   • Web app diagnostics: http://localhost:3000"
echo "   • Backend status: curl http://localhost:3001/system/server-vpn-status"
echo "   • Interface check: ip addr show | grep tun"
