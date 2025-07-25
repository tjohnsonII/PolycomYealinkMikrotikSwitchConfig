#!/bin/bash

# Production HTTPS startup script
# Sets up port forwarding and starts services for external access

set -e

echo "🚀 Starting Production HTTPS for 123hostedtools.com"

# Start all backend services first
echo "📊 Starting backend services..."
systemctl --user start phone-config-ssh-ws.service
systemctl --user start phone-config-auth.service
systemctl --user start phone-config-management.service
systemctl --user start phone-config-webapp.service

# Wait for services to be ready
sleep 5

# Start HTTPS proxy on port 8443 (accessible externally)
echo "🔒 Starting HTTPS proxy..."
PROXY_PORT=8443 nohup node backend/simple-proxy-https-robust.js > logs/proxy-production.log 2>&1 &
PROXY_PID=$!

# Save PID
echo $PROXY_PID > pids/proxy.pid

echo "✅ Production HTTPS Ready!"
echo ""
echo "🌐 External Access URLs:"
echo "   • https://123hostedtools.com:8443"
echo "   • https://67.149.139.23:8443"
echo ""
echo "📊 Management Console (LAN):"
echo "   • http://192.168.1.60:3099"
echo ""
echo "📝 Notes:"
echo "   • Port 8443 is used instead of 443 (no root required)"
echo "   • Configure router port forwarding: 443 → 8443"
echo "   • Or use iptables: sudo iptables -t nat -A PREROUTING -p tcp --dport 443 -j REDIRECT --to-port 8443"
