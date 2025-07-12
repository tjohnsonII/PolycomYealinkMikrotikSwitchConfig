#!/bin/bash

#################################################################################
# VPN Management Test Script
# 
# This script tests the VPN management functionality in the web console
#################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Test VPN management console
test_vpn_management_console() {
    log "TEST" "Testing VPN management console..."
    
    # Test VPN management page loads
    local response=$(curl -s -m 5 http://localhost:3099/vpn-management.html)
    if [[ -n "$response" ]] && echo "$response" | grep -q "VPN Management Console"; then
        log "SUCCESS" "VPN management page loads correctly"
    else
        log "ERROR" "VPN management page failed to load"
        return 1
    fi
    
    # Test VPN status API
    local status_response=$(curl -s -m 5 http://localhost:3099/api/vpn/status)
    if [[ -n "$status_response" ]] && echo "$status_response" | grep -q "vpn_status"; then
        log "SUCCESS" "VPN status API working"
    else
        log "ERROR" "VPN status API failed"
        return 1
    fi
    
    return 0
}

# Test VPN connection functionality
test_vpn_connection() {
    log "TEST" "Testing VPN connection functionality..."
    
    # Test connect API (should fail without config)
    local connect_response=$(curl -s -X POST http://localhost:3099/api/vpn/connect -H "Content-Type: application/json" -d '{"name": "test"}')
    if [[ -n "$connect_response" ]] && echo "$connect_response" | grep -q "error"; then
        log "SUCCESS" "VPN connect API responds appropriately without config"
    else
        log "ERROR" "VPN connect API not responding correctly"
        return 1
    fi
    
    # Test disconnect API
    local disconnect_response=$(curl -s -X POST http://localhost:3099/api/vpn/disconnect -H "Content-Type: application/json" -d '{}')
    if [[ -n "$disconnect_response" ]]; then
        log "SUCCESS" "VPN disconnect API accessible"
    else
        log "ERROR" "VPN disconnect API failed"
        return 1
    fi
    
    return 0
}

# Test VPN configuration upload
test_vpn_config_upload() {
    log "TEST" "Testing VPN configuration upload..."
    
    # Create a test config
    local test_config='client
dev tun
proto udp
remote test.example.com 1194
resolv-retry infinite
nobind
persist-key
persist-tun
verb 3'
    
    # Test upload API
    local upload_response=$(curl -s -X POST http://localhost:3099/api/vpn/upload-config -H "Content-Type: application/json" -d "{\"name\": \"test\", \"content\": \"$test_config\"}")
    if [[ -n "$upload_response" ]]; then
        log "SUCCESS" "VPN config upload API accessible"
    else
        log "ERROR" "VPN config upload API failed"
        return 1
    fi
    
    return 0
}

# Test VPN system status
test_vpn_system_status() {
    log "TEST" "Testing VPN system status..."
    
    # Check if OpenVPN3 is available
    if command -v openvpn3 &> /dev/null; then
        log "SUCCESS" "OpenVPN3 is installed"
    else
        log "WARN" "OpenVPN3 not found - some features may not work"
    fi
    
    # Check for TUN interface
    if ip link show | grep -q tun; then
        log "SUCCESS" "TUN interface available"
    else
        log "WARN" "No TUN interface found - VPN may not be connected"
    fi
    
    # Check VPN routes
    if ip route show | grep -q tun; then
        log "SUCCESS" "VPN routes configured"
    else
        log "WARN" "No VPN routes found"
    fi
    
    return 0
}

# Test VPN logging
test_vpn_logging() {
    log "TEST" "Testing VPN logging..."
    
    # Test logs API
    local logs_response=$(curl -s -m 5 http://localhost:3099/api/vpn/dual/logs)
    if [[ -n "$logs_response" ]]; then
        log "SUCCESS" "VPN logs API accessible"
    else
        log "ERROR" "VPN logs API failed"
        return 1
    fi
    
    return 0
}

# Test VPN dual connection
test_vpn_dual() {
    log "TEST" "Testing VPN dual connection..."
    
    # Test dual start API
    local dual_start_response=$(curl -s -X POST http://localhost:3099/api/vpn/dual/start -H "Content-Type: application/json" -d '{}')
    if [[ -n "$dual_start_response" ]]; then
        log "SUCCESS" "VPN dual start API accessible"
    else
        log "ERROR" "VPN dual start API failed"
        return 1
    fi
    
    # Test dual stop API
    local dual_stop_response=$(curl -s -X POST http://localhost:3099/api/vpn/dual/stop -H "Content-Type: application/json" -d '{}')
    if [[ -n "$dual_stop_response" ]]; then
        log "SUCCESS" "VPN dual stop API accessible"
    else
        log "ERROR" "VPN dual stop API failed"
        return 1
    fi
    
    return 0
}

# Main test execution
echo "🔐 VPN Management Test Suite"
echo "============================"
echo ""

log "INFO" "Starting VPN management tests..."
echo ""

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

# Run tests
tests=(
    "test_vpn_management_console"
    "test_vpn_connection"
    "test_vpn_config_upload"
    "test_vpn_system_status"
    "test_vpn_logging"
    "test_vpn_dual"
)

for test in "${tests[@]}"; do
    if $test; then
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    echo ""
done

# Summary
echo "📊 VPN Test Summary"
echo "=================="
echo "Total tests: $((TESTS_PASSED + TESTS_FAILED))"
echo "Passed: $TESTS_PASSED"
echo "Failed: $TESTS_FAILED"
echo ""

if [[ $TESTS_FAILED -eq 0 ]]; then
    log "SUCCESS" "All VPN management tests passed! 🎉"
    echo ""
    log "INFO" "VPN Management Console is ready for use:"
    log "INFO" "  • Main Console: http://localhost:3099"
    log "INFO" "  • VPN Management: http://localhost:3099/vpn-management.html"
    log "INFO" "  • LAN Access: http://$(hostname -I | awk '{print $1}'):3099/vpn-management.html"
    echo ""
    exit 0
else
    log "ERROR" "$TESTS_FAILED VPN test(s) failed. Check the console for details."
    exit 1
fi
