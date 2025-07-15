#!/bin/bash

#################################################################################
# Enhanced Robust Production Manager - Interactive Menu System
# 
# This script provides a comprehensive management interface for the
# Polycom/Yealink Phone Configuration Generator webapp with:
# - Background service management
# - Real-time health monitoring
# - Interactive troubleshooting tools
# - File system overview
# - Service diagnostics and recovery
# 
# Usage: ./start-robust-menu.sh
#################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Configuration
LOG_FILE="startup-robust.log"
HEALTH_CHECK_INTERVAL=30
MAX_RESTART_ATTEMPTS=3
RESTART_DELAY=5

# Process tracking
SSH_WS_PID=""
AUTH_PID=""
PROXY_PID=""
MONITOR_PID=""

# Domain configuration
DOMAIN="123hostedtools"
DOMAIN_NAME="123hostedtools.com"
USE_HTTPS="true"
PROXY_SCRIPT="backend/simple-proxy-https.js"
PROXY_PORT="8443"
PROXY_HEALTH_URL="https://localhost:8443/proxy-health"

# Service definitions
declare -A SERVICES=(
    ["ssh-ws"]="backend/ssh-ws-server.js:3001:http://localhost:3001/health"
    ["auth"]="backend/auth-server.js:3002:http://localhost:3002/health" 
    ["proxy"]="$PROXY_SCRIPT:$PROXY_PORT:$PROXY_HEALTH_URL"
)

# Major project files
declare -A PROJECT_FILES=(
    ["Frontend Core"]="src/App.tsx src/main.tsx index.html"
    ["Backend Services"]="backend/auth-server.js backend/ssh-ws-server.js backend/simple-proxy-https.js"
    ["Configuration"]="vite.config.ts package.json tsconfig.json .env"
    ["Phone Templates"]="src/assets/OnNetMikrotikConfigTemplate.txt src/assets/OTTMikrotikTemplate.txt"
    ["Switch Templates"]="src/assets/24PortSwithTemplate.txt src/assets/48PortSwitchTemplate.txt"
    ["Components"]="src/components/ConfigContext.tsx src/components/AuthContext.tsx"
    ["Pages"]="src/pages/MikrotikTemplates.tsx src/pages/PhoneConfig.tsx src/pages/Diagnostic.tsx"
    ["Startup Scripts"]="start-robust.sh stop-robust.sh"
    ["SSL/Security"]="ssl/ .gitignore SECURITY.md"
    ["Documentation"]="README.md STARTUP_README.md HTTPS_SETUP.md"
)

#################################################################################
# Utility Functions
#################################################################################

print_header() {
    clear
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                     📱 Phone Config Generator Manager                    ║${NC}"
    echo -e "${CYAN}║                        Enhanced Production Console                       ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════════════╝${NC}"
    echo -e "${WHITE}Domain: ${GREEN}$DOMAIN_NAME${NC} | ${WHITE}Mode: ${GREEN}HTTPS Production${NC} | ${WHITE}Port: ${GREEN}$PROXY_PORT${NC}"
    echo -e "${WHITE}Time: ${GREEN}$(date '+%Y-%m-%d %H:%M:%S')${NC}"
    echo ""
}

log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local color=""
    
    case $level in
        "ERROR") color=$RED ;;
        "WARN")  color=$YELLOW ;;
        "SUCCESS") color=$GREEN ;;
        "INFO")  color=$CYAN ;;
        *) color=$NC ;;
    esac
    
    echo -e "${color}[$timestamp] [$level] $message${NC}" | tee -a "$LOG_FILE"
}

port_in_use() {
    lsof -i :$1 -sTCP:LISTEN -t >/dev/null 2>&1
}

get_service_status() {
    local service_key=$1
    local service_info=${SERVICES[$service_key]}
    local port=$(echo "$service_info" | cut -d':' -f2)
    local health_endpoint=$(echo "$service_info" | cut -d':' -f3)
    
    if port_in_use $port; then
        if curl -s -f --connect-timeout 3 "$health_endpoint" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ HEALTHY${NC}"
        else
            echo -e "${YELLOW}⚠️  RUNNING (Health Check Failed)${NC}"
        fi
    else
        echo -e "${RED}❌ STOPPED${NC}"
    fi
}

#################################################################################
# Service Management Functions
#################################################################################

start_service() {
    local service_key=$1
    local service_info=${SERVICES[$service_key]}
    local script_path=$(echo "$service_info" | cut -d':' -f1)
    local port=$(echo "$service_info" | cut -d':' -f2)
    
    log "INFO" "Starting $service_key service..."
    
    # Kill any existing process on the port
    if port_in_use $port; then
        local pids=$(lsof -i :$port -sTCP:LISTEN -t 2>/dev/null || echo "")
        if [ ! -z "$pids" ]; then
            echo "$pids" | xargs -r kill -TERM 2>/dev/null || true
            sleep 2
        fi
    fi
    
    # Start the service
    if [[ "$service_key" == "proxy" ]]; then
        cd "$(dirname "$script_path")"
        PROXY_PORT=$port nohup node "$(basename "$script_path")" > "${service_key}.log" 2>&1 &
        local pid=$!
        cd - > /dev/null
    else
        cd "$(dirname "$script_path")"
        nohup node "$(basename "$script_path")" > "${service_key}.log" 2>&1 &
        local pid=$!
        cd - > /dev/null
    fi
    
    # Store PID
    case $service_key in
        "ssh-ws") SSH_WS_PID=$pid ;;
        "auth") AUTH_PID=$pid ;;
        "proxy") PROXY_PID=$pid ;;
    esac
    
    log "SUCCESS" "$service_key started (PID: $pid)"
    return 0
}

start_all_services() {
    echo -e "${CYAN}🚀 Starting all services...${NC}"
    echo ""
    
    # Build if needed
    if [ ! -d "dist" ]; then
        echo -e "${YELLOW}📦 Building application...${NC}"
        npm run build
    fi
    
    # Start services
    for service in "ssh-ws" "auth" "proxy"; do
        start_service "$service"
        sleep 2
    done
    
    echo ""
    echo -e "${GREEN}✅ All services started successfully!${NC}"
    sleep 2
}

stop_all_services() {
    echo -e "${YELLOW}🛑 Stopping all services...${NC}"
    
    pkill -f "ssh-ws-server.js" 2>/dev/null || true
    pkill -f "auth-server.js" 2>/dev/null || true
    pkill -f "simple-proxy-https.js" 2>/dev/null || true
    
    sleep 2
    echo -e "${GREEN}✅ All services stopped${NC}"
}

#################################################################################
# Monitoring and Diagnostics
#################################################################################

show_service_status() {
    print_header
    echo -e "${WHITE}═══════════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${WHITE}                              SERVICE STATUS                               ${NC}"
    echo -e "${WHITE}═══════════════════════════════════════════════════════════════════════════${NC}"
    echo ""
    
    printf "%-20s %-10s %-40s %s\n" "SERVICE" "PORT" "ENDPOINT" "STATUS"
    printf "%-20s %-10s %-40s %s\n" "-------" "----" "--------" "------"
    
    for service in "proxy" "auth" "ssh-ws"; do
        local service_info=${SERVICES[$service]}
        local port=$(echo "$service_info" | cut -d':' -f2)
        local health_endpoint=$(echo "$service_info" | cut -d':' -f3)
        local status=$(get_service_status "$service")
        
        printf "%-20s %-10s %-40s %s\n" "$service" "$port" "$health_endpoint" "$status"
    done
    
    echo ""
    echo -e "${WHITE}═══════════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${WHITE}                            NETWORK PORTS                                 ${NC}"
    echo -e "${WHITE}═══════════════════════════════════════════════════════════════════════════${NC}"
    echo ""
    
    netstat -tlnp 2>/dev/null | grep -E "(3001|3002|8443|443)" | while read line; do
        echo "$line"
    done
    
    echo ""
    echo -e "${CYAN}Press any key to continue...${NC}"
    read -n 1
}

run_health_checks() {
    print_header
    echo -e "${WHITE}═══════════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${WHITE}                           HEALTH CHECKS                                  ${NC}"
    echo -e "${WHITE}═══════════════════════════════════════════════════════════════════════════${NC}"
    echo ""
    
    for service in "proxy" "auth" "ssh-ws"; do
        local service_info=${SERVICES[$service]}
        local health_endpoint=$(echo "$service_info" | cut -d':' -f3)
        
        echo -e "${CYAN}Testing $service health endpoint: $health_endpoint${NC}"
        
        if curl -k -s -f --connect-timeout 5 "$health_endpoint" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ $service: HEALTHY${NC}"
            curl -k -s "$health_endpoint" | jq . 2>/dev/null || curl -k -s "$health_endpoint"
        else
            echo -e "${RED}❌ $service: UNHEALTHY${NC}"
        fi
        echo ""
    done
    
    echo -e "${CYAN}Press any key to continue...${NC}"
    read -n 1
}

show_logs() {
    print_header
    echo -e "${WHITE}═══════════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${WHITE}                             SERVICE LOGS                                 ${NC}"
    echo -e "${WHITE}═══════════════════════════════════════════════════════════════════════════${NC}"
    echo ""
    
    echo -e "${CYAN}Select log to view:${NC}"
    echo "1. Startup Log (startup-robust.log)"
    echo "2. SSH WebSocket Log (backend/ssh-ws.log)"
    echo "3. Auth Server Log (backend/auth.log)"
    echo "4. Proxy Log (backend/proxy.log)"
    echo "5. All Recent Logs"
    echo "0. Back to Main Menu"
    echo ""
    
    read -p "Enter choice: " choice
    
    case $choice in
        1) 
            echo -e "${CYAN}=== Startup Log (last 50 lines) ===${NC}"
            tail -50 "$LOG_FILE" 2>/dev/null || echo "Log file not found"
            ;;
        2) 
            echo -e "${CYAN}=== SSH WebSocket Log (last 50 lines) ===${NC}"
            tail -50 backend/ssh-ws.log 2>/dev/null || echo "Log file not found"
            ;;
        3) 
            echo -e "${CYAN}=== Auth Server Log (last 50 lines) ===${NC}"
            tail -50 backend/auth.log 2>/dev/null || echo "Log file not found"
            ;;
        4) 
            echo -e "${CYAN}=== Proxy Log (last 50 lines) ===${NC}"
            tail -50 backend/proxy.log 2>/dev/null || echo "Log file not found"
            ;;
        5) 
            echo -e "${CYAN}=== All Recent Logs ===${NC}"
            echo -e "${YELLOW}--- Startup Log ---${NC}"
            tail -20 "$LOG_FILE" 2>/dev/null || echo "Not found"
            echo -e "${YELLOW}--- SSH WebSocket Log ---${NC}"
            tail -20 backend/ssh-ws.log 2>/dev/null || echo "Not found"
            echo -e "${YELLOW}--- Auth Server Log ---${NC}"
            tail -20 backend/auth.log 2>/dev/null || echo "Not found"
            echo -e "${YELLOW}--- Proxy Log ---${NC}"
            tail -20 backend/proxy.log 2>/dev/null || echo "Not found"
            ;;
        0) return ;;
        *) echo -e "${RED}Invalid choice${NC}" ;;
    esac
    
    echo ""
    echo -e "${CYAN}Press any key to continue...${NC}"
    read -n 1
}

#################################################################################
# File System Overview
#################################################################################

show_project_files() {
    print_header
    echo -e "${WHITE}═══════════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${WHITE}                           PROJECT FILES                                  ${NC}"
    echo -e "${WHITE}═══════════════════════════════════════════════════════════════════════════${NC}"
    echo ""
    
    for category in "${!PROJECT_FILES[@]}"; do
        echo -e "${CYAN}📁 $category:${NC}"
        
        local files=${PROJECT_FILES[$category]}
        for file in $files; do
            if [ -f "$file" ]; then
                local size=$(du -h "$file" 2>/dev/null | cut -f1)
                local modified=$(stat -c %y "$file" 2>/dev/null | cut -d' ' -f1)
                echo -e "   ${GREEN}✅${NC} $file ${YELLOW}($size, $modified)${NC}"
            elif [ -d "$file" ]; then
                local count=$(find "$file" -type f 2>/dev/null | wc -l)
                echo -e "   ${BLUE}📁${NC} $file ${YELLOW}($count files)${NC}"
            else
                echo -e "   ${RED}❌${NC} $file ${RED}(missing)${NC}"
            fi
        done
        echo ""
    done
    
    echo -e "${CYAN}Press any key to continue...${NC}"
    read -n 1
}

#################################################################################
# Troubleshooting Tools
#################################################################################

run_troubleshooting() {
    print_header
    echo -e "${WHITE}═══════════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${WHITE}                        TROUBLESHOOTING TOOLS                            ${NC}"
    echo -e "${WHITE}═══════════════════════════════════════════════════════════════════════════${NC}"
    echo ""
    
    echo -e "${CYAN}Select troubleshooting option:${NC}"
    echo "1. Check Port Conflicts"
    echo "2. Test SSL Certificates"
    echo "3. Verify Dependencies"
    echo "4. Check File Permissions"
    echo "5. Network Connectivity Test"
    echo "6. Process Information"
    echo "7. Fix Common Issues"
    echo "0. Back to Main Menu"
    echo ""
    
    read -p "Enter choice: " choice
    
    case $choice in
        1) check_port_conflicts ;;
        2) test_ssl_certificates ;;
        3) verify_dependencies ;;
        4) check_file_permissions ;;
        5) network_connectivity_test ;;
        6) show_process_info ;;
        7) fix_common_issues ;;
        0) return ;;
        *) echo -e "${RED}Invalid choice${NC}" ;;
    esac
    
    echo ""
    echo -e "${CYAN}Press any key to continue...${NC}"
    read -n 1
}

check_port_conflicts() {
    echo -e "${CYAN}=== Checking Port Conflicts ===${NC}"
    echo ""
    
    for port in 3001 3002 8443 443; do
        if port_in_use $port; then
            local pids=$(lsof -i :$port -sTCP:LISTEN -t 2>/dev/null || echo "")
            echo -e "${YELLOW}⚠️  Port $port is in use by PID: $pids${NC}"
            if [ ! -z "$pids" ]; then
                ps -p $pids -o pid,ppid,cmd 2>/dev/null || echo "Process info not available"
            fi
        else
            echo -e "${GREEN}✅ Port $port is free${NC}"
        fi
        echo ""
    done
}

test_ssl_certificates() {
    echo -e "${CYAN}=== Testing SSL Certificates ===${NC}"
    echo ""
    
    if [ -f "ssl/123hostedtools.com.key" ] && [ -f "ssl/123hostedtools_com.crt" ]; then
        echo -e "${GREEN}✅ SSL files found${NC}"
        
        echo -e "${CYAN}Certificate details:${NC}"
        openssl x509 -in ssl/123hostedtools_com.crt -noout -subject -dates 2>/dev/null || echo "Could not read certificate"
        
        echo -e "${CYAN}Testing certificate/key match:${NC}"
        local cert_hash=$(openssl x509 -in ssl/123hostedtools_com.crt -noout -modulus 2>/dev/null | openssl md5)
        local key_hash=$(openssl rsa -in ssl/123hostedtools.com.key -noout -modulus 2>/dev/null | openssl md5)
        
        if [ "$cert_hash" = "$key_hash" ]; then
            echo -e "${GREEN}✅ Certificate and key match${NC}"
        else
            echo -e "${RED}❌ Certificate and key mismatch${NC}"
        fi
    else
        echo -e "${RED}❌ SSL files not found${NC}"
    fi
}

verify_dependencies() {
    echo -e "${CYAN}=== Verifying Dependencies ===${NC}"
    echo ""
    
    # Check Node.js
    if command -v node >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Node.js: $(node --version)${NC}"
    else
        echo -e "${RED}❌ Node.js not found${NC}"
    fi
    
    # Check npm
    if command -v npm >/dev/null 2>&1; then
        echo -e "${GREEN}✅ npm: $(npm --version)${NC}"
    else
        echo -e "${RED}❌ npm not found${NC}"
    fi
    
    # Check package.json
    if [ -f "package.json" ]; then
        echo -e "${GREEN}✅ package.json found${NC}"
        echo -e "${CYAN}Checking node_modules...${NC}"
        if [ -d "node_modules" ]; then
            echo -e "${GREEN}✅ node_modules directory exists${NC}"
        else
            echo -e "${RED}❌ node_modules not found - run 'npm install'${NC}"
        fi
    else
        echo -e "${RED}❌ package.json not found${NC}"
    fi
    
    # Check build directory
    if [ -d "dist" ]; then
        echo -e "${GREEN}✅ Build directory (dist) exists${NC}"
    else
        echo -e "${RED}❌ Build directory not found - run 'npm run build'${NC}"
    fi
}

check_file_permissions() {
    echo -e "${CYAN}=== Checking File Permissions ===${NC}"
    echo ""
    
    for file in "start-robust.sh" "backend/auth-server.js" "backend/ssh-ws-server.js" "backend/simple-proxy-https.js"; do
        if [ -f "$file" ]; then
            local perms=$(stat -c %a "$file" 2>/dev/null)
            echo -e "${GREEN}✅${NC} $file: $perms"
        else
            echo -e "${RED}❌${NC} $file: not found"
        fi
    done
}

network_connectivity_test() {
    echo -e "${CYAN}=== Network Connectivity Test ===${NC}"
    echo ""
    
    # Test localhost connections
    for port in 3001 3002 8443; do
        if curl -s --connect-timeout 3 "http://localhost:$port" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ localhost:$port - HTTP reachable${NC}"
        elif curl -k -s --connect-timeout 3 "https://localhost:$port" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ localhost:$port - HTTPS reachable${NC}"
        else
            echo -e "${RED}❌ localhost:$port - not reachable${NC}"
        fi
    done
    
    # Test external connectivity
    echo ""
    echo -e "${CYAN}Testing external connectivity...${NC}"
    if curl -s --connect-timeout 5 "https://google.com" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Internet connectivity working${NC}"
    else
        echo -e "${RED}❌ Internet connectivity issues${NC}"
    fi
}

show_process_info() {
    echo -e "${CYAN}=== Process Information ===${NC}"
    echo ""
    
    echo -e "${CYAN}Node.js processes:${NC}"
    ps aux | grep node | grep -v grep | head -10
    
    echo ""
    echo -e "${CYAN}Memory usage:${NC}"
    free -h
    
    echo ""
    echo -e "${CYAN}Disk usage:${NC}"
    df -h . | head -2
}

fix_common_issues() {
    echo -e "${CYAN}=== Fixing Common Issues ===${NC}"
    echo ""
    
    echo -e "${YELLOW}1. Killing any conflicting processes...${NC}"
    pkill -f "node.*server" 2>/dev/null || true
    
    echo -e "${YELLOW}2. Clearing any stuck ports...${NC}"
    for port in 3001 3002 8443; do
        if port_in_use $port; then
            local pids=$(lsof -i :$port -sTCP:LISTEN -t 2>/dev/null || echo "")
            if [ ! -z "$pids" ]; then
                echo "$pids" | xargs -r kill -9 2>/dev/null || true
            fi
        fi
    done
    
    echo -e "${YELLOW}3. Checking and fixing file permissions...${NC}"
    chmod +x *.sh 2>/dev/null || true
    
    echo -e "${YELLOW}4. Clearing old log files...${NC}"
    rm -f backend/*.log 2>/dev/null || true
    
    echo -e "${GREEN}✅ Common issues fixed${NC}"
}

#################################################################################
# Main Menu
#################################################################################

show_main_menu() {
    print_header
    
    echo -e "${WHITE}═══════════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${WHITE}                              MAIN MENU                                   ${NC}"
    echo -e "${WHITE}═══════════════════════════════════════════════════════════════════════════${NC}"
    echo ""
    
    echo -e "${CYAN}📊 MONITORING & STATUS${NC}"
    echo "   1. Show Service Status"
    echo "   2. Run Health Checks"
    echo "   3. View Service Logs"
    echo ""
    
    echo -e "${CYAN}⚙️  SERVICE MANAGEMENT${NC}"
    echo "   4. Start All Services"
    echo "   5. Stop All Services"
    echo "   6. Restart All Services"
    echo ""
    
    echo -e "${CYAN}📁 PROJECT OVERVIEW${NC}"
    echo "   7. Show Project Files"
    echo "   8. Build Application"
    echo ""
    
    echo -e "${CYAN}🔧 TROUBLESHOOTING${NC}"
    echo "   9. Troubleshooting Tools"
    echo "   10. View URLs & Access Info"
    echo ""
    
    echo -e "${CYAN}🚪 EXIT${NC}"
    echo "   0. Exit (Keep Services Running)"
    echo "   00. Exit and Stop All Services"
    echo ""
    
    echo -e "${WHITE}═══════════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${WHITE}Current Services Status:${NC}"
    printf "   Proxy (8443): %s | Auth (3002): %s | SSH-WS (3001): %s\n" \
        "$(get_service_status 'proxy')" \
        "$(get_service_status 'auth')" \
        "$(get_service_status 'ssh-ws')"
    echo ""
    
    read -p "Enter your choice: " choice
    
    case $choice in
        1) show_service_status ;;
        2) run_health_checks ;;
        3) show_logs ;;
        4) start_all_services ;;
        5) stop_all_services ;;
        6) 
            stop_all_services
            sleep 2
            start_all_services
            ;;
        7) show_project_files ;;
        8) 
            echo -e "${CYAN}Building application...${NC}"
            npm run build
            echo -e "${GREEN}✅ Build complete${NC}"
            sleep 2
            ;;
        9) run_troubleshooting ;;
        10) show_access_info ;;
        0) 
            echo -e "${GREEN}Exiting - Services continue running in background${NC}"
            exit 0
            ;;
        00) 
            echo -e "${YELLOW}Stopping all services and exiting...${NC}"
            stop_all_services
            exit 0
            ;;
        *) 
            echo -e "${RED}Invalid choice. Please try again.${NC}"
            sleep 1
            ;;
    esac
}

show_access_info() {
    print_header
    echo -e "${WHITE}═══════════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${WHITE}                          ACCESS INFORMATION                              ${NC}"
    echo -e "${WHITE}═══════════════════════════════════════════════════════════════════════════${NC}"
    echo ""
    
    echo -e "${CYAN}🌐 Web Access URLs:${NC}"
    echo -e "   External: ${GREEN}https://123hostedtools.com:8443${NC}"
    echo -e "   Local:    ${GREEN}https://localhost:8443${NC}"
    echo -e "   LAN:      ${GREEN}https://$(hostname -I | awk '{print $1}'):8443${NC}"
    echo ""
    
    echo -e "${CYAN}🔍 Health Check Endpoints:${NC}"
    echo -e "   Proxy:     ${GREEN}https://localhost:8443/proxy-health${NC}"
    echo -e "   Auth:      ${GREEN}https://localhost:8443/api/auth/health${NC}"
    echo -e "   SSH-WS:    ${GREEN}https://localhost:8443/api/health${NC}"
    echo ""
    
    echo -e "${CYAN}🔐 Authentication:${NC}"
    echo -e "   Admin:     ${GREEN}admin / 123NetAdmin2024!${NC}"
    echo -e "   User:      ${GREEN}tjohnson / Joshua3412@${NC}"
    echo ""
    
    echo -e "${CYAN}📊 Diagnostic Page:${NC}"
    echo -e "   URL:       ${GREEN}https://localhost:8443/diagnostic${NC}"
    echo ""
    
    echo -e "${CYAN}Press any key to continue...${NC}"
    read -n 1
}

#################################################################################
# Main Execution
#################################################################################

main() {
    # Check if services are already running, if not start them
    local services_running=true
    
    for service in "proxy" "auth" "ssh-ws"; do
        local service_info=${SERVICES[$service]}
        local port=$(echo "$service_info" | cut -d':' -f2)
        if ! port_in_use $port; then
            services_running=false
            break
        fi
    done
    
    if [ "$services_running" = false ]; then
        echo -e "${YELLOW}Services not running. Starting all services...${NC}"
        start_all_services
    else
        echo -e "${GREEN}Services already running. Entering management mode...${NC}"
        sleep 2
    fi
    
    # Main menu loop
    while true; do
        show_main_menu
    done
}

# Graceful shutdown
cleanup() {
    echo -e "\n${YELLOW}Received interrupt signal...${NC}"
    echo -e "${CYAN}Services will continue running in background${NC}"
    echo -e "${GREEN}Use './start-robust-menu.sh' to return to management console${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start the main program
main "$@"
