#!/bin/bash

# Script Selection Helper
# This script helps users choose the right start script for their needs

echo "🚀 Polycom/Yealink Configuration Generator"
echo "   Which startup script would you like to use?"
echo ""
echo "1. 🌟 Production Ready (RECOMMENDED)"
echo "   Command: npm run start"
echo "   Uses: start-robust.sh"
echo "   Best for: Production deployments, maximum reliability"
echo ""
echo "2. 🔒 HTTPS Development"
echo "   Command: npm run start-https"
echo "   Uses: start-https.sh"
echo "   Best for: Development with SSL/TLS"
echo ""
echo "3. 🔧 Full Development"
echo "   Command: npm run start-full"
echo "   Uses: start-app.sh"
echo "   Best for: Development with VPN features"
echo ""
echo "4. 🌐 Domain Production (timsablab.ddns.net)"
echo "   Command: ./start-timsablab.sh"
echo "   Uses: start-timsablab.sh"
echo "   Best for: Production on timsablab.ddns.net"
echo ""
echo "5. 📱 Simple Development"
echo "   Command: ./start-auth-app.sh"
echo "   Uses: start-auth-app.sh"
echo "   Best for: Minimal development without VPN"
echo ""
echo "📖 For detailed information, see START_SCRIPTS_GUIDE.md"
echo ""
echo "💡 Quick start: npm run start"
echo ""

read -p "Would you like to start with the recommended script? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Starting with npm run start..."
    npm run start
else
    echo "📋 Choose your preferred script from the options above."
fi
