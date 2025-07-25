#!/bin/bash

# HTTPS Proxy startup script for production
# Requires sudo privileges to bind to port 443

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🔒 Starting HTTPS Proxy for 123hostedtools.com..."

# Check if already running
if pgrep -f "simple-proxy-https-robust.js" > /dev/null; then
    echo "⚠️  HTTPS Proxy already running"
    exit 0
fi

# Start proxy with elevated privileges
echo "🚀 Starting HTTPS proxy on port 443..."
sudo -E node backend/simple-proxy-https-robust.js > logs/proxy.log 2>&1 &

# Get PID and save it
sleep 2
PROXY_PID=$(pgrep -f "simple-proxy-https-robust.js" | head -1)

if [ -n "$PROXY_PID" ]; then
    echo "$PROXY_PID" > pids/proxy.pid
    echo "✅ HTTPS Proxy started (PID: $PROXY_PID)"
    echo "🌐 Access: https://123hostedtools.com"
    echo "📊 Management: http://192.168.1.60:3099"
else
    echo "❌ Failed to start HTTPS proxy"
    exit 1
fi
