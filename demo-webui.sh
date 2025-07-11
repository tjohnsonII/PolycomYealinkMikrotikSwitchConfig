#!/bin/bash

#################################################################################
# Web Management Console Demo Script
# 
# This script demonstrates the capabilities of the web-based management console
# for the Phone Configuration Generator. It shows how to use the web interface
# for common administrative tasks.
#################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Web console configuration
WEBUI_URL="http://localhost:3099"
WEBUI_PORT="3099"

log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "ERROR") echo -e "${RED}[$timestamp] ERROR: $message${NC}" ;;
        "SUCCESS") echo -e "${GREEN}[$timestamp] SUCCESS: $message${NC}" ;;
        "WARN") echo -e "${YELLOW}[$timestamp] WARN: $message${NC}" ;;
        "INFO") echo -e "${BLUE}[$timestamp] INFO: $message${NC}" ;;
        "DEMO") echo -e "${CYAN}[$timestamp] DEMO: $message${NC}" ;;
    esac
}

# Check if web console is running
check_web_console() {
    local pid=$(pgrep -f "management-server.js" 2>/dev/null || echo "")
    if [[ -n "$pid" ]]; then
        if curl -s "$WEBUI_URL/api/dashboard" > /dev/null 2>&1; then
            return 0
        fi
    fi
    return 1
}

# Start web console if not running
ensure_web_console() {
    if ! check_web_console; then
        log "INFO" "Starting web management console..."
        ./launch-webui.sh --no-open &
        sleep 3
        
        if check_web_console; then
            log "SUCCESS" "Web management console is now running"
        else
            log "ERROR" "Failed to start web management console"
            exit 1
        fi
    else
        log "INFO" "Web management console is already running"
    fi
}

# Demo API calls
demo_api_calls() {
    log "DEMO" "Demonstrating API functionality..."
    
    echo ""
    echo "🔍 Getting service status..."
    curl -s "$WEBUI_URL/api/services/status" | jq '.' 2>/dev/null || curl -s "$WEBUI_URL/api/services/status"
    
    echo ""
    echo "📊 Getting dashboard data..."
    curl -s "$WEBUI_URL/api/dashboard" | jq '.services' 2>/dev/null || echo "Dashboard data retrieved"
    
    echo ""
    echo "📁 Getting file information..."
    curl -s "$WEBUI_URL/api/files" | jq 'keys' 2>/dev/null || echo "File information retrieved"
    
    echo ""
    echo "🏥 Running health checks..."
    curl -s "$WEBUI_URL/api/health-checks" | jq '.' 2>/dev/null || echo "Health checks completed"
}

# Demo terminal commands through API
demo_terminal_commands() {
    log "DEMO" "Demonstrating terminal command execution..."
    
    echo ""
    echo "💻 Example terminal commands that can be executed through web interface:"
    echo ""
    echo "📊 System Information:"
    echo "  • ps aux | grep node     - Show Node.js processes"
    echo "  • netstat -tulpn | grep :3001 - Check service ports"
    echo "  • df -h                  - Disk usage"
    echo "  • free -h                - Memory usage"
    echo "  • uptime                 - System uptime"
    echo ""
    echo "🔧 Project Management:"
    echo "  • git status             - Git repository status"
    echo "  • npm list               - Show installed packages"
    echo "  • ls -la                 - List files"
    echo "  • tail -f backend/auth.log - Follow log files"
    echo ""
    echo "🔒 Security Features:"
    echo "  • Dangerous commands are blocked (rm -rf, sudo, etc.)"
    echo "  • Only localhost access allowed"
    echo "  • Command history and auto-completion"
    echo "  • Real-time output streaming"
}

# Show web console features
demo_web_features() {
    log "DEMO" "Web Management Console Features Overview..."
    
    echo ""
    echo "🌐 Web Interface Features:"
    echo ""
    echo "📊 Dashboard Tab:"
    echo "  • Real-time service status monitoring"
    echo "  • System resource usage (CPU, memory, disk)"
    echo "  • Service health indicators"
    echo "  • Quick service control buttons"
    echo ""
    echo "🔧 Services Tab:"
    echo "  • Start/stop/restart services"
    echo "  • View detailed service information"
    echo "  • Monitor service ports and processes"
    echo "  • Service health checks"
    echo ""
    echo "📜 Logs Tab:"
    echo "  • Real-time log streaming"
    echo "  • Filter logs by service"
    echo "  • Search through log history"
    echo "  • Download logs for analysis"
    echo ""
    echo "📁 Files Tab:"
    echo "  • Browse project file structure"
    echo "  • Check file modification times"
    echo "  • Monitor configuration files"
    echo "  • SSL certificate status"
    echo ""
    echo "🖥️ Terminal Tab:"
    echo "  • Interactive command execution"
    echo "  • Real-time output streaming"
    echo "  • Command history navigation"
    echo "  • Pre-defined quick commands"
    echo "  • Security restrictions for dangerous commands"
    echo ""
    echo "🔧 Troubleshoot Tab:"
    echo "  • Network diagnostics"
    echo "  • SSL certificate validation"
    echo "  • Dependency verification"
    echo "  • System health assessment"
}

# Interactive demo
interactive_demo() {
    log "DEMO" "Interactive Web Console Demo"
    
    echo ""
    echo "🎯 This demo will show you how to use the web management console"
    echo "   for common administrative tasks."
    echo ""
    
    read -p "Press Enter to continue..."
    
    # Ensure web console is running
    ensure_web_console
    
    echo ""
    echo "🌐 Web Console Access:"
    echo "   URL: $WEBUI_URL"
    echo "   Port: $WEBUI_PORT"
    echo "   Security: Localhost only"
    echo ""
    
    read -p "Press Enter to open the web console in your browser..."
    
    # Open browser
    if command -v xdg-open &> /dev/null; then
        xdg-open "$WEBUI_URL" 2>/dev/null &
    elif command -v open &> /dev/null; then
        open "$WEBUI_URL" 2>/dev/null &
    else
        echo "Please open your browser and navigate to: $WEBUI_URL"
    fi
    
    echo ""
    log "INFO" "Web console should now be open in your browser"
    
    read -p "Press Enter to demonstrate API calls..."
    demo_api_calls
    
    echo ""
    read -p "Press Enter to see terminal command examples..."
    demo_terminal_commands
    
    echo ""
    read -p "Press Enter to see all web console features..."
    demo_web_features
    
    echo ""
    log "SUCCESS" "Demo completed!"
    echo ""
    echo "🎉 You can now use the web management console to:"
    echo "   • Monitor all services in real-time"
    echo "   • Execute commands through the web terminal"
    echo "   • View logs and troubleshoot issues"
    echo "   • Manage files and configurations"
    echo "   • Control services remotely"
    echo ""
    echo "📖 For more information, see: WEB_CONSOLE_GUIDE.md"
}

# Show help
show_help() {
    echo "Web Management Console Demo Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --interactive    Run interactive demo"
    echo "  --api-demo       Demonstrate API calls"
    echo "  --features       Show web console features"
    echo "  --status         Check web console status"
    echo "  --help           Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 --interactive # Full interactive demo"
    echo "  $0 --api-demo    # API demonstration only"
    echo "  $0 --features    # Show feature overview"
}

# Main logic
case "${1:---interactive}" in
    "--interactive")
        interactive_demo
        ;;
    "--api-demo")
        ensure_web_console
        demo_api_calls
        ;;
    "--features")
        demo_web_features
        ;;
    "--status")
        if check_web_console; then
            log "SUCCESS" "Web management console is running at $WEBUI_URL"
        else
            log "ERROR" "Web management console is not running"
            exit 1
        fi
        ;;
    "--help")
        show_help
        ;;
    *)
        log "ERROR" "Unknown option: $1"
        show_help
        exit 1
        ;;
esac
