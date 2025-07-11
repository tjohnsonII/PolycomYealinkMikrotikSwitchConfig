#!/bin/bash

# Stop script for 123hostedtools.com webapp
# This script stops all services related to the webapp

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo "🛑 Stopping 123hostedtools.com webapp services..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to stop processes by name pattern
stop_process() {
  local process_pattern=$1
  local service_name=$2
  
  echo -e "${BLUE}🔄 Stopping $service_name...${NC}"
  
  local pids=$(pgrep -f "$process_pattern" || true)
  if [ -n "$pids" ]; then
    echo "$pids" | xargs kill -TERM 2>/dev/null || true
    sleep 2
    
    # Check if processes are still running and force kill if needed
    local remaining_pids=$(pgrep -f "$process_pattern" || true)
    if [ -n "$remaining_pids" ]; then
      echo -e "${YELLOW}⚠️  Force killing $service_name...${NC}"
      echo "$remaining_pids" | xargs kill -KILL 2>/dev/null || true
    fi
    
    echo -e "${GREEN}✅ $service_name stopped${NC}"
  else
    echo -e "${YELLOW}⚠️  $service_name not running${NC}"
  fi
}

# Stop services
stop_process "simple-proxy-123hostedtools.js" "HTTPS Proxy"
stop_process "auth-server.js" "Auth Server"
stop_process "ssh-ws-server.js" "SSH WebSocket Server"

echo ""
echo -e "${GREEN}🎉 All services stopped successfully!${NC}"
echo ""
echo -e "${BLUE}📋 To restart services: ./start-123hostedtools.sh${NC}"
