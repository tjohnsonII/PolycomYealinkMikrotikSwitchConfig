#!/bin/bash

#################################################################################
# Production Status Checker for Phone Config Generator
# 
# This script provides comprehensive status information for all production
# services with health checks, performance metrics, and troubleshooting info.
#################################################################################

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$SCRIPT_DIR"
LOG_DIR="$APP_ROOT/logs"
PID_DIR="$APP_ROOT/pids"
DETAILED=false
CONTINUOUS=false
JSON_OUTPUT=false
HEALTH_CHECK=true

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --detailed)
            DETAILED=true
            shift
            ;;
        --continuous)
            CONTINUOUS=true
            shift
            ;;
        --json)
            JSON_OUTPUT=true
            shift
            ;;
        --no-health)
            HEALTH_CHECK=false
            shift
            ;;
        --help)
            echo "Production Status Checker for Phone Config Generator"
            echo ""
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --detailed        Show detailed information"
            echo "  --continuous      Continuous monitoring (press Ctrl+C to exit)"
            echo "  --json            Output in JSON format"
            echo "  --no-health       Skip health checks"
            echo "  --help            Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                    # Basic status check"
            echo "  $0 --detailed         # Detailed status with metrics"
            echo "  $0 --continuous       # Continuous monitoring"
            echo "  $0 --json             # JSON output"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Logging function
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    if [ "$JSON_OUTPUT" = true ]; then
        return
    fi
    
    case $level in
        "ERROR") echo -e "${RED}[${timestamp}] ❌ $message${NC}" ;;
        "SUCCESS") echo -e "${GREEN}[${timestamp}] ✅ $message${NC}" ;;
        "WARN") echo -e "${YELLOW}[${timestamp}] ⚠️  $message${NC}" ;;
        "INFO") echo -e "${BLUE}[${timestamp}] ℹ️  $message${NC}" ;;
        "DEBUG") echo -e "${PURPLE}[${timestamp}] 🔍 $message${NC}" ;;
    esac
}

# Get service status
get_service_status() {
    local service_name=$1
    local port=$2
    local status_data="{}"
    
    # Check if process is running
    local pid_file="$PID_DIR/$service_name.pid"
    local running=false
    local pid=""
    
    if [ -f "$pid_file" ]; then
        pid=$(cat "$pid_file")
        if ps -p "$pid" > /dev/null 2>&1; then
            running=true
        fi
    fi
    
    # Check systemd service
    local systemd_active=false
    if systemctl --user is-active --quiet "phone-config-$service_name.service" 2>/dev/null; then
        systemd_active=true
    fi
    
    # Check port
    local port_listening=false
    if netstat -ln 2>/dev/null | grep -q ":$port "; then
        port_listening=true
    fi
    
    # Health check
    local health_ok=false
    local health_url="http://localhost:$port/health"
    
    if [ "$HEALTH_CHECK" = true ]; then
        if curl -s -f "$health_url" > /dev/null 2>&1; then
            health_ok=true
        fi
    fi
    
    # Get process info
    local cpu_usage=""
    local memory_usage=""
    local uptime=""
    
    if [ "$running" = true ] && [ -n "$pid" ]; then
        cpu_usage=$(ps -p "$pid" -o pcpu= 2>/dev/null | tr -d ' ' || echo "0")
        memory_usage=$(ps -p "$pid" -o rss= 2>/dev/null | tr -d ' ' || echo "0")
        uptime=$(ps -p "$pid" -o etime= 2>/dev/null | tr -d ' ' || echo "unknown")
    fi
    
    # Create status object
    if [ "$JSON_OUTPUT" = true ]; then
        status_data=$(cat <<EOF
{
    "service": "$service_name",
    "port": $port,
    "running": $running,
    "pid": "$pid",
    "systemd_active": $systemd_active,
    "port_listening": $port_listening,
    "health_ok": $health_ok,
    "cpu_usage": "$cpu_usage",
    "memory_usage": "$memory_usage",
    "uptime": "$uptime"
}
EOF
        )
    else
        # Text output
        local status_icon="❌"
        local status_color="$RED"
        
        if [ "$running" = true ] && [ "$port_listening" = true ]; then
            if [ "$HEALTH_CHECK" = false ] || [ "$health_ok" = true ]; then
                status_icon="✅"
                status_color="$GREEN"
            else
                status_icon="⚠️"
                status_color="$YELLOW"
            fi
        fi
        
        echo -e "$status_icon ${status_color}$service_name${NC} (Port: $port)"
        
        if [ "$DETAILED" = true ]; then
            echo "  • Running: $running"
            echo "  • PID: $pid"
            echo "  • SystemD: $systemd_active"
            echo "  • Port Listening: $port_listening"
            echo "  • Health Check: $health_ok"
            
            if [ "$running" = true ] && [ -n "$pid" ]; then
                echo "  • CPU: ${cpu_usage}%"
                echo "  • Memory: ${memory_usage}KB"
                echo "  • Uptime: $uptime"
            fi
        fi
    fi
    
    echo "$status_data"
}

# Get system metrics
get_system_metrics() {
    local metrics="{}"
    
    # CPU usage
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}' || echo "0")
    
    # Memory usage
    local memory_info=$(free -m | awk 'NR==2{printf "%.1f,%.1f,%.1f", $3,$2,$3*100/$2}')
    local memory_used=$(echo "$memory_info" | cut -d',' -f1)
    local memory_total=$(echo "$memory_info" | cut -d',' -f2)
    local memory_percent=$(echo "$memory_info" | cut -d',' -f3)
    
    # Disk usage
    local disk_info=$(df / | awk 'NR==2{printf "%.1f,%.1f,%s", $3/1024/1024,$2/1024/1024,$5}')
    local disk_used=$(echo "$disk_info" | cut -d',' -f1)
    local disk_total=$(echo "$disk_info" | cut -d',' -f2)
    local disk_percent=$(echo "$disk_info" | cut -d',' -f3)
    
    # Load average
    local load_avg=$(uptime | awk -F'load average:' '{print $2}' | tr -d ' ')
    
    # Network connections
    local connections=$(netstat -an | grep ESTABLISHED | wc -l)
    
    # Processes
    local processes=$(ps aux | wc -l)
    
    if [ "$JSON_OUTPUT" = true ]; then
        metrics=$(cat <<EOF
{
    "cpu_usage": "$cpu_usage",
    "memory": {
        "used": "$memory_used",
        "total": "$memory_total",
        "percent": "$memory_percent"
    },
    "disk": {
        "used": "$disk_used",
        "total": "$disk_total",
        "percent": "$disk_percent"
    },
    "load_average": "$load_avg",
    "connections": $connections,
    "processes": $processes
}
EOF
        )
    else
        echo "System Metrics:"
        echo "==============="
        echo "CPU Usage: ${cpu_usage}%"
        echo "Memory: ${memory_used}GB / ${memory_total}GB (${memory_percent}%)"
        echo "Disk: ${disk_used}GB / ${disk_total}GB (${disk_percent})"
        echo "Load Average: $load_avg"
        echo "Network Connections: $connections"
        echo "Running Processes: $processes"
    fi
    
    echo "$metrics"
}

# Get service logs
get_service_logs() {
    local service_name=$1
    local lines=${2:-10}
    local log_file="$LOG_DIR/$service_name.log"
    
    if [ -f "$log_file" ]; then
        echo "Recent logs for $service_name:"
        echo "$(tail -n "$lines" "$log_file")"
    else
        echo "No logs found for $service_name"
    fi
}

# Get error summary
get_error_summary() {
    local error_count=0
    local recent_errors=()
    
    for service in ssh-ws auth management webapp proxy; do
        local log_file="$LOG_DIR/$service.log"
        if [ -f "$log_file" ]; then
            local service_errors=$(grep -i "error\|exception\|failed" "$log_file" | tail -n 5)
            if [ -n "$service_errors" ]; then
                error_count=$((error_count + 1))
                recent_errors+=("$service: $service_errors")
            fi
        fi
    done
    
    if [ "$JSON_OUTPUT" = true ]; then
        echo "{\"error_count\": $error_count, \"recent_errors\": [$(printf '"%s",' "${recent_errors[@]}" | sed 's/,$//')] }"
    else
        if [ $error_count -gt 0 ]; then
            echo "Recent Errors ($error_count services with errors):"
            echo "================================================="
            for error in "${recent_errors[@]}"; do
                echo "• $error"
            done
        else
            echo "No recent errors found"
        fi
    fi
}

# Main status check
check_status() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local all_services_data=()
    
    if [ "$JSON_OUTPUT" = false ]; then
        echo "Phone Config Generator - Production Status"
        echo "=========================================="
        echo "Timestamp: $timestamp"
        echo ""
    fi
    
    # Check services
    local services=(
        "ssh-ws:3000"
        "auth:3001"
        "management:3099"
        "webapp:3443"
    )
    
    if [ "$JSON_OUTPUT" = false ]; then
        echo "Service Status:"
        echo "==============="
    fi
    
    for service_info in "${services[@]}"; do
        local service_name=$(echo "$service_info" | cut -d':' -f1)
        local port=$(echo "$service_info" | cut -d':' -f2)
        
        local status_data=$(get_service_status "$service_name" "$port")
        
        if [ "$JSON_OUTPUT" = true ]; then
            all_services_data+=("$status_data")
        fi
    done
    
    if [ "$JSON_OUTPUT" = false ]; then
        echo ""
        
        # System metrics
        get_system_metrics
        echo ""
        
        # Access URLs
        echo "Access URLs:"
        echo "============"
        echo "• Main Application: https://localhost:3443"
        echo "• Management Console: http://localhost:3099"
        echo "• Auth Server: http://localhost:3001/health"
        echo "• SSH WebSocket: http://localhost:3000/health"
        echo ""
        
        # Error summary
        if [ "$DETAILED" = true ]; then
            get_error_summary
            echo ""
        fi
        
        # Recent logs
        if [ "$DETAILED" = true ]; then
            echo "Recent Service Logs:"
            echo "==================="
            for service_info in "${services[@]}"; do
                local service_name=$(echo "$service_info" | cut -d':' -f1)
                get_service_logs "$service_name" 3
                echo ""
            done
        fi
    else
        # JSON output
        local system_metrics=$(get_system_metrics)
        local error_summary=$(get_error_summary)
        
        echo "{"
        echo "  \"timestamp\": \"$timestamp\","
        echo "  \"services\": [$(printf '%s,' "${all_services_data[@]}" | sed 's/,$//')], "
        echo "  \"system_metrics\": $system_metrics,"
        echo "  \"error_summary\": $error_summary"
        echo "}"
    fi
}

# Continuous monitoring
continuous_monitoring() {
    if [ "$JSON_OUTPUT" = false ]; then
        echo "Starting continuous monitoring (Press Ctrl+C to exit)..."
        echo "======================================================="
    fi
    
    while true; do
        if [ "$JSON_OUTPUT" = false ]; then
            clear
        fi
        
        check_status
        
        if [ "$JSON_OUTPUT" = false ]; then
            echo ""
            echo "Next update in 10 seconds..."
        fi
        
        sleep 10
    done
}

# Main function
main() {
    if [ "$CONTINUOUS" = true ]; then
        continuous_monitoring
    else
        check_status
    fi
}

# Run main function
main "$@"
