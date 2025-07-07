#!/bin/bash

#################################################################################
# System Dependency Checker for Phone Configuration App
# 
# This script checks and optionally installs all required dependencies
# for the Polycom/Yealink Configuration Generator application.
#################################################################################

set -e

echo "🔍 Checking system dependencies for Phone Configuration App..."
echo ""

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to get OS info
get_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        echo $ID
    elif type lsb_release >/dev/null 2>&1; then
        lsb_release -si | tr '[:upper:]' '[:lower:]'
    else
        echo "unknown"
    fi
}

# Function to install packages based on OS
install_package() {
    local package=$1
    local os=$(get_os)
    
    echo "Installing $package..."
    
    case $os in
        ubuntu|debian)
            sudo apt-get update && sudo apt-get install -y $package
            ;;
        centos|rhel|fedora)
            if command_exists dnf; then
                sudo dnf install -y $package
            else
                sudo yum install -y $package
            fi
            ;;
        arch)
            sudo pacman -S --noconfirm $package
            ;;
        *)
            echo "❌ Unknown OS. Please install $package manually."
            return 1
            ;;
    esac
}

# Check and install function
check_and_install() {
    local cmd=$1
    local package=$2
    local description=$3
    local required=$4
    
    if command_exists $cmd; then
        echo "✅ $description: $(which $cmd)"
        if [ "$cmd" = "node" ]; then
            echo "   Version: $(node --version)"
        elif [ "$cmd" = "npm" ]; then
            echo "   Version: $(npm --version)"
        elif [ "$cmd" = "openvpn" ]; then
            echo "   Version: $(openvpn --version | head -n1 | cut -d' ' -f1-2)"
        fi
    else
        if [ "$required" = "true" ]; then
            echo "❌ $description: Not found (REQUIRED)"
            read -p "Install $package? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                install_package $package
            else
                echo "   $description is required for the application to work."
                exit 1
            fi
        else
            echo "⚠️  $description: Not found (optional)"
            read -p "Install $package? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                install_package $package
            fi
        fi
    fi
    echo ""
}

echo "1. Essential Dependencies:"
echo "=========================="
check_and_install "node" "nodejs" "Node.js Runtime" "true"
check_and_install "npm" "npm" "Node Package Manager" "true"
check_and_install "curl" "curl" "HTTP Client" "true"
check_and_install "lsof" "lsof" "Port Scanner" "true"

echo "2. Network Tools:"
echo "================="
check_and_install "nc" "netcat" "Network Testing Tool" "false"
check_and_install "ping" "iputils-ping" "Ping Tool" "false"
check_and_install "nslookup" "dnsutils" "DNS Lookup Tool" "false"

echo "3. VPN Support:"
echo "==============="
check_and_install "openvpn" "openvpn" "OpenVPN Client" "false"

echo "4. Development Tools (Optional):"
echo "================================="
check_and_install "git" "git" "Version Control" "false"
check_and_install "code" "code" "VS Code Editor" "false"

echo ""
echo "🔧 Checking Node.js version compatibility..."
if command_exists node; then
    NODE_VERSION=$(node --version | cut -d'v' -f2)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1)
    
    if [ "$NODE_MAJOR" -ge 16 ]; then
        echo "✅ Node.js version $NODE_VERSION is compatible (>=16.0.0)"
    else
        echo "⚠️  Node.js version $NODE_VERSION may be too old (recommend >=16.0.0)"
        echo "   Consider upgrading Node.js for best compatibility."
    fi
fi

echo ""
echo "📦 Checking npm global packages..."
if command_exists npm; then
    if npm list -g --depth=0 typescript >/dev/null 2>&1; then
        echo "✅ TypeScript: $(npm list -g typescript --depth=0 | grep typescript)"
    else
        echo "⚠️  TypeScript: Not installed globally"
        read -p "Install TypeScript globally? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            npm install -g typescript
        fi
    fi
fi

echo ""
echo "🔒 Checking security tools..."
if command_exists ufw; then
    echo "✅ UFW Firewall: Available"
    echo "   Current status: $(sudo ufw status | head -n1)"
else
    echo "⚠️  UFW Firewall: Not available"
fi

echo ""
echo "🎉 Dependency check complete!"
echo ""
echo "📋 Summary:"
echo "==========="
echo "Required tools check: $(command_exists node && command_exists npm && command_exists curl && command_exists lsof && echo "✅ PASSED" || echo "❌ FAILED")"
echo "VPN support: $(command_exists openvpn && echo "✅ Available" || echo "⚠️  Limited")"
echo "Network tools: $(command_exists nc && echo "✅ Full" || echo "⚠️  Basic")"
echo ""

if command_exists node && command_exists npm && command_exists curl && command_exists lsof; then
    echo "🚀 System is ready! You can now run:"
    echo "   ./start-unified-app-enhanced.sh"
else
    echo "❌ Please install missing required dependencies before proceeding."
    exit 1
fi
