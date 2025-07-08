#!/bin/bash

#################################################################################
# System Health Monitor and Alerting Script
# 
# This script monitors system resources and sends alerts when thresholds are exceeded.
# It can be run via cron to provide continuous monitoring.
# 
# Usage: ./system-monitor.sh [--email user@example.com]
#################################################################################

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$SCRIPT_DIR/system-monitor.log"
EMAIL_RECIPIENT=${2:-""}
ALERT_EMAIL=${1:-""}

# Thresholds
CPU_THRESHOLD=80
MEMORY_THRESHOLD=80
DISK_THRESHOLD=85
LOAD_THRESHOLD=5.0

# Logging function
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

# Send alert function
send_alert() {
    local subject=$1
    local message=$2
    
    log "ALERT" "$subject: $message"
    
    if [ -n "$EMAIL_RECIPIENT" ] && command -v mail >/dev/null 2>&1; then
        echo "$message" | mail -s "$subject" "$EMAIL_RECIPIENT"
        log "INFO" "Alert sent to $EMAIL_RECIPIENT"
    fi
}

# Check CPU usage
check_cpu() {
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
    local cpu_int=$(printf "%.0f" "$cpu_usage")
    
    if [ "$cpu_int" -gt "$CPU_THRESHOLD" ]; then
        send_alert "HIGH CPU USAGE" "CPU usage is ${cpu_usage}% (threshold: ${CPU_THRESHOLD}%)"
        return 1
    else
        log "INFO" "CPU usage OK: ${cpu_usage}%"
        return 0
    fi
}

# Check memory usage
check_memory() {
    local memory_info=$(free | grep Mem)
    local total=$(echo "$memory_info" | awk '{print $2}')
    local used=$(echo "$memory_info" | awk '{print $3}')
    local percentage=$(awk "BEGIN {printf \"%.0f\", $used/$total * 100}")
    
    if [ "$percentage" -gt "$MEMORY_THRESHOLD" ]; then
        send_alert "HIGH MEMORY USAGE" "Memory usage is ${percentage}% (threshold: ${MEMORY_THRESHOLD}%)"
        return 1
    else
        log "INFO" "Memory usage OK: ${percentage}%"
        return 0
    fi
}

# Check disk usage
check_disk() {
    local disk_usage=$(df "$SCRIPT_DIR" | tail -1 | awk '{print $5}' | sed 's/%//')
    
    if [ "$disk_usage" -gt "$DISK_THRESHOLD" ]; then
        send_alert "HIGH DISK USAGE" "Disk usage is ${disk_usage}% (threshold: ${DISK_THRESHOLD}%)"
        return 1
    else
        log "INFO" "Disk usage OK: ${disk_usage}%"
        return 0
    fi
}

# Check system load
check_load() {
    local load_1min=$(uptime | awk -F'load average:' '{print $2}' | cut -d, -f1 | xargs)
    local load_comparison=$(awk -v load_val="$load_1min" -v threshold="$LOAD_THRESHOLD" 'BEGIN {print (load_val > threshold) ? 1 : 0}')
    
    if [ "$load_comparison" -eq 1 ]; then
        send_alert "HIGH SYSTEM LOAD" "System load is $load_1min (threshold: $LOAD_THRESHOLD)"
        return 1
    else
        log "INFO" "System load OK: $load_1min"
        return 0
    fi
}

# Check service ports
check_service_ports() {
    local ports=(3000 3001 3002)
    local all_healthy=0
    
    for port in "${ports[@]}"; do
        if lsof -i :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            log "INFO" "Port $port is active"
        else
            log "ERROR" "Port $port is not active"
            send_alert "SERVICE DOWN" "Service on port $port is not responding"
            all_healthy=1
        fi
    done
    
    return $all_healthy
}

# Check log file sizes
check_log_sizes() {
    local log_threshold=100  # MB
    local large_logs=()
    
    # Check various log files
    for log in "startup-robust.log" "watchdog.log" "system-monitor.log" "backend/ssh-ws.log" "backend/auth.log" "backend/proxy.log"; do
        if [ -f "$log" ]; then
            local size=$(du -m "$log" | cut -f1)
            if [ "$size" -gt "$log_threshold" ]; then
                large_logs+=("$log ($size MB)")
            fi
        fi
    done
    
    if [ ${#large_logs[@]} -gt 0 ]; then
        local message="Large log files detected: ${large_logs[*]}"
        send_alert "LARGE LOG FILES" "$message"
        log "WARN" "$message"
        return 1
    else
        log "INFO" "Log file sizes OK"
        return 0
    fi
}

# Main monitoring function
main() {
    log "INFO" "Starting system health check..."
    
    local issues=0
    
    # Run all checks
    check_cpu || ((issues++))
    check_memory || ((issues++))
    check_disk || ((issues++))
    check_load || ((issues++))
    check_service_ports || ((issues++))
    check_log_sizes || ((issues++))
    
    if [ "$issues" -eq 0 ]; then
        log "SUCCESS" "All system checks passed"
    else
        log "WARN" "System health check completed with $issues issues"
    fi
    
    # Log system info
    log "INFO" "Uptime: $(uptime)"
    log "INFO" "Processes: $(ps aux | wc -l)"
    log "INFO" "Network connections: $(netstat -an | wc -l)"
    
    return $issues
}

# Handle command line arguments
if [ "$#" -eq 2 ] && [ "$1" = "--email" ]; then
    EMAIL_RECIPIENT="$2"
    log "INFO" "Email alerts enabled for: $EMAIL_RECIPIENT"
fi

# Run main function
main
