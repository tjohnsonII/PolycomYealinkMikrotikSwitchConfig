#!/bin/bash
# Start script for local development with localhost API URLs

# Load local environment variables
if [ -f ".env.local" ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Local Development Environment${NC}"
echo -e "${YELLOW}Using localhost API URLs for local development${NC}"

# Function to kill processes on script exit
cleanup() {
    echo -e "\n${YELLOW}Cleaning up processes...${NC}"
    
    # Kill all background processes
    if [ ! -z "$PROXY_PID" ]; then
        kill $PROXY_PID 2>/dev/null || true
    fi
    if [ ! -z "$AUTH_PID" ]; then
        kill $AUTH_PID 2>/dev/null || true
    fi
    if [ ! -z "$SSH_WS_PID" ]; then
        kill $SSH_WS_PID 2>/dev/null || true
    fi
    if [ ! -z "$VITE_PID" ]; then
        kill $VITE_PID 2>/dev/null || true
    fi
    
    # Kill any remaining processes on the ports
    pkill -f "node.*simple-proxy.js" 2>/dev/null || true
    pkill -f "node.*auth-server.js" 2>/dev/null || true
    pkill -f "node.*ssh-ws-server.js" 2>/dev/null || true
    pkill -f "vite.*--config.*local" 2>/dev/null || true
    
    echo -e "${GREEN}✅ Cleanup completed${NC}"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Check if SSL certificates exist
if [ ! -f "ssl/certificate.pem" ] || [ ! -f "ssl/private-key.pem" ]; then
    echo -e "${YELLOW}⚠️  SSL certificates not found. Generating self-signed certificates...${NC}"
    ./setup-ssl.sh
fi

# Start the proxy server
echo -e "${GREEN}🌐 Starting Proxy Server on port 443...${NC}"
cd backend
sudo node simple-proxy.js &
PROXY_PID=$!
cd ..

# Wait for proxy to start
sleep 2

# Start the auth server
echo -e "${GREEN}🔒 Starting Auth Server on port 3002...${NC}"
cd backend
node auth-server.js &
AUTH_PID=$!
cd ..

# Wait for auth server to start
sleep 2

# Start the SSH WebSocket server
echo -e "${GREEN}🔌 Starting SSH WebSocket Server on port 3001...${NC}"
cd backend
node ssh-ws-server.js &
SSH_WS_PID=$!
cd ..

# Wait for SSH WebSocket server to start
sleep 2

# Start the Vite development server with local config
echo -e "${GREEN}⚡ Starting Vite Dev Server on port 3000 (local config)...${NC}"
npm run dev -- --config vite.config.local.ts &
VITE_PID=$!

# Wait for Vite to start
sleep 3

echo -e "${GREEN}✅ All services started successfully!${NC}"
echo -e "${BLUE}🌍 Application available at:${NC}"
echo -e "  • Local HTTPS: ${GREEN}https://localhost:3000${NC}"
echo -e "  • Network HTTPS: ${GREEN}https://0.0.0.0:3000${NC}"
echo -e ""
echo -e "${YELLOW}📊 Service Status:${NC}"
echo -e "  • Proxy Server: ${GREEN}Port 443${NC} (PID: $PROXY_PID)"
echo -e "  • Auth Server: ${GREEN}Port 3002${NC} (PID: $AUTH_PID)"
echo -e "  • SSH WebSocket: ${GREEN}Port 3001${NC} (PID: $SSH_WS_PID)"
echo -e "  • Vite Dev Server: ${GREEN}Port 3000${NC} (PID: $VITE_PID)"
echo -e ""
echo -e "${BLUE}🔧 Using Local Development Configuration:${NC}"
echo -e "  • API Base URL: ${GREEN}https://localhost:3001${NC}"
echo -e "  • WebSocket URL: ${GREEN}wss://localhost:3001${NC}"
echo -e "  • Auth URL: ${GREEN}https://localhost:3002${NC}"
echo -e ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"

# Wait for all background processes
wait
