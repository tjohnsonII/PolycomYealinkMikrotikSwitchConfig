#!/bin/bash

# VPN Configuration Setup Helper
# This script helps you set up your .ovpn configuration files

echo "🔧 VPN Configuration Setup Helper"
echo "================================="
echo ""

# Expected locations
WORK_VPN="backend/work.ovpn"
HOME_VPN="backend/home.ovpn"

echo "📋 This script will help you set up your VPN configuration files."
echo "   We need two .ovpn files:"
echo "   • Work VPN: $WORK_VPN"
echo "   • Home VPN: $HOME_VPN"
echo ""

# Check what files exist
echo "🔍 Checking current VPN files..."
echo ""

# Look for any .ovpn files
ovpn_files=$(find . -name "*.ovpn" -type f 2>/dev/null || true)

if [ -n "$ovpn_files" ]; then
    echo "✅ Found existing .ovpn files:"
    echo "$ovpn_files"
else
    echo "❌ No .ovpn files found in the project"
fi

echo ""
echo "📁 Looking for common VPN file locations..."

# Check common locations
common_locations=(
    "~/Downloads"
    "~/Documents"
    "~/Desktop"
    "/tmp"
    "."
)

for location in "${common_locations[@]}"; do
    if [ -d "$location" ]; then
        files=$(find "$location" -maxdepth 1 -name "*.ovpn" 2>/dev/null || true)
        if [ -n "$files" ]; then
            echo "✅ Found .ovpn files in $location:"
            echo "$files"
        fi
    fi
done

echo ""
echo "🔧 Setup Instructions:"
echo "====================="
echo ""
echo "1. 📥 Obtain your VPN configuration files:"
echo "   • Get work.ovpn from your IT department"
echo "   • Get home.ovpn from your home router/VPN provider"
echo ""
echo "2. 📁 Place files in the correct locations:"
echo "   • Copy work VPN config to: $WORK_VPN"
echo "   • Copy home VPN config to: $HOME_VPN"
echo ""
echo "3. 🔐 Set proper permissions:"
echo "   chmod 600 backend/*.ovpn"
echo ""
echo "4. 🚀 Run the VPN manager:"
echo "   ./manage-dual-vpn.sh setup"
echo ""

# Interactive setup
echo "🤔 Would you like me to help you copy files now? (y/n)"
read -r response

if [[ "$response" =~ ^[Yy]$ ]]; then
    echo ""
    echo "📝 Please provide the full path to your work VPN file:"
    read -r work_path
    
    if [ -f "$work_path" ]; then
        echo "📂 Copying work VPN to $WORK_VPN..."
        cp "$work_path" "$WORK_VPN"
        chmod 600 "$WORK_VPN"
        echo "✅ Work VPN copied successfully"
    else
        echo "❌ Work VPN file not found: $work_path"
    fi
    
    echo ""
    echo "📝 Please provide the full path to your home VPN file:"
    read -r home_path
    
    if [ -f "$home_path" ]; then
        echo "📂 Copying home VPN to $HOME_VPN..."
        cp "$home_path" "$HOME_VPN"
        chmod 600 "$HOME_VPN"
        echo "✅ Home VPN copied successfully"
    else
        echo "❌ Home VPN file not found: $home_path"
    fi
    
    echo ""
    echo "🔍 Verifying setup..."
    if [ -f "$WORK_VPN" ] && [ -f "$HOME_VPN" ]; then
        echo "✅ Both VPN files are now in place!"
        echo "🚀 You can now run: ./manage-dual-vpn.sh setup"
    else
        echo "❌ Some files are still missing. Please check the paths and try again."
    fi
else
    echo ""
    echo "💡 Manual setup commands:"
    echo "   cp /path/to/your/work.ovpn $WORK_VPN"
    echo "   cp /path/to/your/home.ovpn $HOME_VPN"
    echo "   chmod 600 backend/*.ovpn"
    echo "   ./manage-dual-vpn.sh setup"
fi

echo ""
echo "📋 Next Steps:"
echo "1. Ensure both .ovpn files are in place"
echo "2. Run: ./manage-dual-vpn.sh setup"
echo "3. Run: ./manage-dual-vpn.sh start"
echo "4. Check status: ./manage-dual-vpn.sh status"
