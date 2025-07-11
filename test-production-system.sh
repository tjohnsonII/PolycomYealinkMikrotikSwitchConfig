#!/bin/bash

#################################################################################
# Production System Test Script
# 
# This script performs comprehensive tests to verify all components of the
# Polycom/Yealink/Mikrotik Configuration Generator are working correctly.
#################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "ERROR") echo -e "${RED}[${timestamp}] ❌ $message${NC}" ;;
        "SUCCESS") echo -e "${GREEN}[${timestamp}] ✅ $message${NC}" ;;
        "WARN") echo -e "${YELLOW}[${timestamp}] ⚠️  $message${NC}" ;;
        "INFO") echo -e "${BLUE}[${timestamp}] ℹ️  $message${NC}" ;;
        "TEST") echo -e "${BLUE}[${timestamp}] 🧪 $message${NC}" ;;
    esac
}

# Test function wrapper
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    log "TEST" "Running test: $test_name"
    
    if eval "$test_command"; then
        log "SUCCESS" "Test passed: $test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        log "ERROR" "Test failed: $test_name"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Individual test functions
test_management_console() {
    local response=$(curl -s -m 5 http://localhost:3099/api/dashboard)
    if [[ -n "$response" ]] && echo "$response" | grep -q "services"; then
        return 0
    else
        return 1
    fi
}

test_main_website() {
    local response=$(curl -s -k -m 5 https://localhost:8443)
    if [[ -n "$response" ]] && echo "$response" | grep -q "123.NET"; then
        return 0
    else
        return 1
    fi
}

test_auth_server() {
    local response=$(curl -s -m 5 http://localhost:3002/health)
    if [[ -n "$response" ]] && echo "$response" | grep -q "healthy"; then
        return 0
    else
        return 1
    fi
}

test_ssh_ws_server() {
    local response=$(curl -s -m 5 http://localhost:3001/health)
    if [[ -n "$response" ]] && echo "$response" | grep -q "healthy"; then
        return 0
    else
        return 1
    fi
}

test_lan_access() {
    local local_ip=$(hostname -I | awk '{print $1}')
    local response=$(curl -s -m 5 "http://$local_ip:3099/api/dashboard")
    if [[ -n "$response" ]] && echo "$response" | grep -q "services"; then
        return 0
    else
        return 1
    fi
}

test_ssl_certificates() {
    if [[ -f "ssl/123hostedtools_com.crt" ]] && [[ -f "ssl/123hostedtools.com.key" ]]; then
        # Test certificate validity
        if openssl x509 -in ssl/123hostedtools_com.crt -text -noout > /dev/null 2>&1; then
            return 0
        else
            return 1
        fi
    else
        return 1
    fi
}

test_file_permissions() {
    local files_to_check=(
        "start-robust.sh"
        "stop-robust.sh"
        "launch-webui.sh"
        "start-robust-menu.sh"
    )
    
    for file in "${files_to_check[@]}"; do
        if [[ ! -x "$file" ]]; then
            return 1
        fi
    done
    return 0
}

test_node_modules() {
    if [[ -d "node_modules" ]] && [[ -f "package.json" ]]; then
        return 0
    else
        return 1
    fi
}

test_built_application() {
    if [[ -d "dist" ]] && [[ -f "dist/index.html" ]]; then
        return 0
    else
        return 1
    fi
}

test_service_processes() {
    local required_processes=(
        "simple-proxy-https.js"
        "auth-server.js"
        "ssh-ws-server.js"
        "management-server.js"
    )
    
    for process in "${required_processes[@]}"; do
        if ! pgrep -f "$process" > /dev/null 2>&1; then
            return 1
        fi
    done
    return 0
}

# Main test execution
echo "🧪 Production System Test Suite"
echo "==============================="
echo ""

# System information
log "INFO" "System: $(uname -s) $(uname -r)"
log "INFO" "Node.js: $(node --version 2>/dev/null || echo 'Not installed')"
log "INFO" "NPM: $(npm --version 2>/dev/null || echo 'Not installed')"
log "INFO" "Project: $(pwd)"
echo ""

# Run tests
run_test "Service processes are running" "test_service_processes"
run_test "Management console is accessible" "test_management_console"
run_test "Main website is accessible" "test_main_website"
run_test "Authentication server is healthy" "test_auth_server"
run_test "SSH WebSocket server is healthy" "test_ssh_ws_server"
run_test "LAN access is working" "test_lan_access"
run_test "SSL certificates are valid" "test_ssl_certificates"
run_test "Script file permissions are correct" "test_file_permissions"
run_test "Node modules are installed" "test_node_modules"
run_test "Application is built" "test_built_application"

# Test summary
echo ""
echo "📊 Test Summary"
echo "==============="
echo "Total tests: $TESTS_TOTAL"
echo "Passed: $TESTS_PASSED"
echo "Failed: $TESTS_FAILED"
echo ""

if [[ $TESTS_FAILED -eq 0 ]]; then
    log "SUCCESS" "All tests passed! System is production ready. 🎉"
    exit 0
else
    log "ERROR" "$TESTS_FAILED test(s) failed. System may need attention."
    exit 1
fi
