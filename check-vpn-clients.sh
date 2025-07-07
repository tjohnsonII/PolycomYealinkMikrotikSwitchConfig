#!/bin/bash

#################################################################################
# Check and Install VPN Clients for SAML Authentication
# 
# This script checks for available VPN clients that can handle SAML authentication
# and provides installation instructions for your Linux distribution.
#################################################################################

echo "🔍 Checking for VPN clients that support SAML authentication..."
echo ""

# Function to detect Linux distribution
detect_distro() {
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        echo "$ID"
    elif [[ -f /etc/debian_version ]]; then
        echo "debian"
    elif [[ -f /etc/redhat-release ]]; then
        echo "rhel"
    else
        echo "unknown"
    fi
}

DISTRO=$(detect_distro)
echo "🐧 Detected distribution: $DISTRO"
echo ""

# Check for OpenVPN Connect (official client)
if command -v openvpn3 >/dev/null 2>&1; then
    echo "✅ OpenVPN Connect (OpenVPN 3) is installed"
    openvpn3 version 2>/dev/null || echo "   Version info not available"
else
    echo "❌ OpenVPN Connect (OpenVPN 3) not found"
    echo ""
    echo "📦 Installation instructions for OpenVPN Connect:"
    case "$DISTRO" in
        ubuntu|debian)
            echo "   1. Add OpenVPN repository:"
            echo "      sudo apt update"
            echo "      sudo apt install apt-transport-https"
            echo "      sudo wget https://swupdate.openvpn.net/repos/openvpn-repo-pkg-key.pub"
            echo "      sudo apt-key add openvpn-repo-pkg-key.pub"
            echo "      sudo wget -O /etc/apt/sources.list.d/openvpn3.list https://swupdate.openvpn.net/community/openvpn3/repos/openvpn3-$DISTRO.list"
            echo ""
            echo "   2. Install OpenVPN Connect:"
            echo "      sudo apt update"
            echo "      sudo apt install openvpn3"
            ;;
        fedora|centos|rhel)
            echo "   1. Add OpenVPN repository:"
            echo "      sudo dnf config-manager --add-repo https://swupdate.openvpn.net/community/openvpn3/repos/openvpn3-fedora.repo"
            echo ""
            echo "   2. Install OpenVPN Connect:"
            echo "      sudo dnf install openvpn3"
            ;;
        *)
            echo "   Check https://openvpn.net/client-connect-vpn-for-linux/ for your distribution"
            ;;
    esac
    echo ""
fi

# Check for NetworkManager with OpenVPN plugin
if command -v nmcli >/dev/null 2>&1 && [[ -f /usr/lib/NetworkManager/VPN/nm-openvpn-service.name ]] 2>/dev/null; then
    echo "✅ NetworkManager with OpenVPN plugin is available"
else
    echo "❌ NetworkManager with OpenVPN plugin not found"
    echo ""
    echo "📦 Installation instructions for NetworkManager OpenVPN:"
    case "$DISTRO" in
        ubuntu|debian)
            echo "      sudo apt install network-manager-openvpn network-manager-openvpn-gnome"
            ;;
        fedora|centos|rhel)
            echo "      sudo dnf install NetworkManager-openvpn NetworkManager-openvpn-gnome"
            ;;
        *)
            echo "   Install NetworkManager OpenVPN plugin for your distribution"
            ;;
    esac
    echo ""
fi

# Check for alternative VPN clients
echo "🔄 Checking for alternative VPN clients..."

if command -v openconnect >/dev/null 2>&1; then
    echo "✅ OpenConnect found (for Cisco AnyConnect, but may work with some OpenVPN setups)"
fi

if command -v strongswan >/dev/null 2>&1; then
    echo "✅ StrongSwan found (IPSec VPN client)"
fi

echo ""
echo "💡 Recommended approach for your SAML VPN:"
echo ""
echo "🥇 Option 1: OpenVPN Connect (Most Compatible)"
echo "   • Official OpenVPN client with full SAML support"
echo "   • Best for automated/persistent connections"
echo "   • Command: openvpn3 session-start --config backend/tjohnson-work.ovpn"
echo ""
echo "🥈 Option 2: NetworkManager (GUI Friendly)"
echo "   • Integrates with desktop environment"
echo "   • Good for manual connections"
echo "   • Can be configured for auto-connect"
echo ""
echo "📋 Steps for dedicated server setup:"
echo "   1. Install one of the above clients"
echo "   2. Import your VPN config: backend/tjohnson-work.ovpn"
echo "   3. Connect and authenticate through SAML"
echo "   4. Set up auto-reconnect if available"
echo "   5. Start web application: ./start-app.sh"
echo ""
echo "🌐 Once connected, your web diagnostics will be able to reach PBX servers!"

# Test current network connectivity
echo ""
echo "🌍 Current network status:"
echo "   External IP: $(curl -s ifconfig.me 2>/dev/null || echo 'Unable to determine')"
echo "   DNS servers: $(cat /etc/resolv.conf | grep nameserver | head -2 | awk '{print $2}' | tr '\n' ' ')"

# Check if we can reach any PBX servers
echo ""
echo "🔍 Testing PBX server connectivity (without VPN):"
echo -n "   69.39.69.102: "
if timeout 3 nc -z 69.39.69.102 5060 2>/dev/null; then
    echo "✅ Reachable"
else
    echo "❌ Not reachable (expected without VPN)"
fi
