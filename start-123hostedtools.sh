#!/bin/bash

# Start script for 123hostedtools.com domain
# This script starts the webapp with HTTPS support for 123hostedtools.com

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo "🚀 Starting 123hostedtools.com webapp..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if port is in use
check_port() {
  local port=$1
  if netstat -tuln | grep -q ":$port "; then
    echo -e "${YELLOW}⚠️  Port $port is already in use${NC}"
    return 1
  fi
  return 0
}

# Function to start a background process
start_service() {
  local service_name=$1
  local command=$2
  local log_file=$3
  local port=$4
  
  if [ -n "$port" ] && ! check_port "$port"; then
    echo -e "${RED}❌ Cannot start $service_name - port $port is in use${NC}"
    return 1
  fi
  
  echo -e "${BLUE}🔄 Starting $service_name...${NC}"
  nohup $command > "$log_file" 2>&1 &
  local pid=$!
  
  # Wait a moment and check if process is still running
  sleep 2
  if kill -0 "$pid" 2>/dev/null; then
    echo -e "${GREEN}✅ $service_name started (PID: $pid)${NC}"
    return 0
  else
    echo -e "${RED}❌ $service_name failed to start${NC}"
    return 1
  fi
}

# Check if SSL certificates exist
SSL_KEY="ssl/123hostedtools.com.key"
SSL_CERT="ssl/123hostedtools.com.crt"
SSL_CA="ssl/123hostedtools_com.ca-bundle"

if [ ! -f "$SSL_KEY" ]; then
  echo -e "${RED}❌ SSL private key not found: $SSL_KEY${NC}"
  echo -e "${YELLOW}📋 Please ensure you have the matching certificate for your CSR${NC}"
  exit 1
fi

if [ ! -f "$SSL_CERT" ]; then
  echo -e "${RED}❌ SSL certificate not found: $SSL_CERT${NC}"
  echo -e "${YELLOW}📋 Please place the certificate that matches your CSR at: $SSL_CERT${NC}"
  exit 1
fi

echo -e "${GREEN}✅ SSL certificates found${NC}"

# Build the project
echo -e "${BLUE}🔨 Building project...${NC}"
if npm run build; then
  echo -e "${GREEN}✅ Build completed${NC}"
else
  echo -e "${RED}❌ Build failed${NC}"
  exit 1
fi

# Create logs directory
mkdir -p logs

# Start services
echo -e "${BLUE}🚀 Starting services for 123hostedtools.com...${NC}"

# Start SSH WebSocket Server (port 3001)
start_service "SSH WebSocket Server" "node backend/ssh-ws-server.js" "logs/ssh-ws-server.log" 3001

# Start Auth Server (port 3002)
start_service "Auth Server" "node backend/auth-server.js" "logs/auth-server.log" 3002

# Start HTTPS Proxy (port 443 and 3000)
start_service "HTTPS Proxy" "node backend/simple-proxy-123hostedtools.js" "logs/https-proxy.log" 443

echo ""
echo -e "${GREEN}🎉 All services started successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Service Status:${NC}"
echo -e "   • SSH WebSocket Server: http://localhost:3001"
echo -e "   • Auth Server: http://localhost:3002"
echo -e "   • HTTPS Proxy: https://123hostedtools.com"
echo ""
echo -e "${BLUE}📋 Access URLs:${NC}"
echo -e "   • Local: https://localhost"
echo -e "   • Domain: https://123hostedtools.com"
echo -e "   • HTTP (redirects): http://123hostedtools.com"
echo ""
echo -e "${BLUE}📋 Log Files:${NC}"
echo -e "   • SSH WebSocket: logs/ssh-ws-server.log"
echo -e "   • Auth Server: logs/auth-server.log"
echo -e "   • HTTPS Proxy: logs/https-proxy.log"
echo ""
echo -e "${YELLOW}💡 Note: Make sure your DNS points 123hostedtools.com to this server${NC}"
echo -e "${YELLOW}💡 Note: Ensure firewall allows ports 80 and 443${NC}"
echo ""
echo -e "${GREEN}🔧 To stop services: ./stop-123hostedtools.sh${NC}"
echo -e "${GREEN}📊 To view logs: tail -f logs/*.log${NC}"
