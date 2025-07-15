#!/bin/bash

# Port Monitor and Conflict Resolution Utility
# This script monitors ports and resolves conflicts

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
PORTS=(3000 3001 3002 3099 8443)
SERVICE_NAMES=(
    "3000:Enhanced Proxy (HTTP)"
    "3001:SSH WebSocket Service"
    "3002:Authentication Service"
    "3099:Management Console"
    "8443:Enhanced Proxy (HTTPS)"
)

print_header() {
    echo -e "${CYAN}================================${NC}"
    echo -e "${CYAN}   Port Monitor & Resolver${NC}"
    echo -e "${CYAN}================================${NC}"
    echo ""
}

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Get detailed port information
get_port_info() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN 2>/dev/null; then
        return 0
    else
        return 1
    fi
}

# Get process name for port
get_process_name() {
    local port=$1
    lsof -Pi :$port -sTCP:LISTEN -F c 2>/dev/null | grep '^c' | cut -c2- | head -1
}

# Get process PID for port
get_process_pid() {
    local port=$1
    lsof -Pi :$port -sTCP:LISTEN -F p 2>/dev/null | grep '^p' | cut -c2- | head -1
}

# Get service name for port
get_service_name() {
    local port=$1
    for service_info in "${SERVICE_NAMES[@]}"; do
        if [[ $service_info == "$port:"* ]]; then
            echo "${service_info#*:}"
            return 0
        fi
    done
    echo "Unknown Service"
}

# Check if port is in use
port_in_use() {
    local port=$1
    lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1
}

# Kill process on port with confirmation
kill_port_interactive() {
    local port=$1
    local service_name=$(get_service_name $port)
    
    if ! port_in_use $port; then
        print_status "Port $port is available"
        return 0
    fi
    
    local pid=$(get_process_pid $port)
    local process_name=$(get_process_name $port)
    
    print_warning "Port $port is in use:"
    echo "  Service: $service_name"
    echo "  Process: $process_name (PID: $pid)"
    echo ""
    
    read -p "Kill this process? (y/N): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Killing process $pid on port $port..."
        
        # Try graceful shutdown first
        if kill -TERM $pid 2>/dev/null; then
            print_status "Sent SIGTERM to PID $pid"
            sleep 2
            
            # Check if process is still running
            if kill -0 $pid 2>/dev/null; then
                print_warning "Process still running, force killing..."
                kill -KILL $pid 2>/dev/null || true
                sleep 1
            fi
        fi
        
        # Verify port is free
        if port_in_use $port; then
            print_error "Failed to free port $port"
            return 1
        else
            print_status "Port $port freed successfully"
            return 0
        fi
    else
        print_status "Skipping port $port"
        return 0
    fi
}

# Kill process on port automatically
kill_port_auto() {
    local port=$1
    
    if ! port_in_use $port; then
        return 0
    fi
    
    local pid=$(get_process_pid $port)
    local process_name=$(get_process_name $port)
    
    print_warning "Auto-killing process on port $port: $process_name (PID: $pid)"
    
    # Try graceful shutdown first
    if kill -TERM $pid 2>/dev/null; then
        sleep 2
        
        # Check if process is still running
        if kill -0 $pid 2>/dev/null; then
            kill -KILL $pid 2>/dev/null || true
            sleep 1
        fi
    fi
    
    # Verify port is free
    if port_in_use $port; then
        print_error "Failed to free port $port"
        return 1
    else
        print_status "Port $port freed successfully"
        return 0
    fi
}

# Show detailed port status
show_port_status() {
    print_header
    
    local conflicts=0
    
    for port in "${PORTS[@]}"; do
        local service_name=$(get_service_name $port)
        
        if port_in_use $port; then
            local pid=$(get_process_pid $port)
            local process_name=$(get_process_name $port)
            
            echo -e "${RED}❌ Port $port${NC} - $service_name"
            echo -e "   Process: $process_name (PID: $pid)"
            echo ""
            conflicts=$((conflicts + 1))
        else
            echo -e "${GREEN}✅ Port $port${NC} - $service_name"
            echo -e "   Status: Available"
            echo ""
        fi
    done
    
    if [ $conflicts -eq 0 ]; then
        print_status "All ports are available! 🎉"
    else
        print_warning "Found $conflicts port conflict(s)"
    fi
    
    return $conflicts
}

# Monitor ports continuously
monitor_ports() {
    print_status "Starting port monitor (press Ctrl+C to stop)..."
    
    while true; do
        clear
        show_port_status
        sleep 5
    done
}

# Resolve all conflicts interactively
resolve_conflicts_interactive() {
    print_header
    print_status "Checking for port conflicts..."
    
    local conflicts=0
    
    for port in "${PORTS[@]}"; do
        if port_in_use $port; then
            conflicts=$((conflicts + 1))
            kill_port_interactive $port
        fi
    done
    
    if [ $conflicts -eq 0 ]; then
        print_status "No port conflicts found!"
    else
        print_status "Port conflict resolution complete"
    fi
}

# Resolve all conflicts automatically
resolve_conflicts_auto() {
    print_header
    print_status "Auto-resolving port conflicts..."
    
    local conflicts=0
    
    for port in "${PORTS[@]}"; do
        if port_in_use $port; then
            conflicts=$((conflicts + 1))
            kill_port_auto $port
        fi
    done
    
    if [ $conflicts -eq 0 ]; then
        print_status "No port conflicts found!"
    else
        print_status "Auto-resolved $conflicts port conflict(s)"
    fi
}

# Show help
show_help() {
    echo "Port Monitor and Conflict Resolution Utility"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  status      Show current port status (default)"
    echo "  monitor     Continuously monitor ports"
    echo "  resolve     Resolve conflicts interactively"
    echo "  auto        Auto-resolve all conflicts"
    echo "  help        Show this help message"
    echo ""
    echo "Monitored ports:"
    for service_info in "${SERVICE_NAMES[@]}"; do
        echo "  ${service_info//:/ - }"
    done
    echo ""
}

# Main command handler
case "${1:-status}" in
    status)
        show_port_status
        exit $?
        ;;
    monitor)
        monitor_ports
        ;;
    resolve)
        resolve_conflicts_interactive
        ;;
    auto)
        resolve_conflicts_auto
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
