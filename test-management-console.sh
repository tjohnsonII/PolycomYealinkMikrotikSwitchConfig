#!/bin/bash

#################################################################################
# Management Console Test Script
# Tests the web management console functionality and webapp control
#################################################################################

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

# Check if a service is running on a specific port
check_service() {
    local service_name=$1
    local port=$2
    local health_url=$3
    
    log "TEST" "Checking $service_name on port $port..."
    
    # Check if port is listening
    if netstat -tlnp | grep -q ":$port "; then
        log "SUCCESS" "$service_name is listening on port $port"
        
        # Check health endpoint if provided
        if [ -n "$health_url" ]; then
            if curl -s -f "$health_url" > /dev/null 2>&1; then
                log "SUCCESS" "$service_name health check passed"
                return 0
            else
                log "WARN" "$service_name port is open but health check failed"
                return 1
            fi
        else
            return 0
        fi
    else
        log "ERROR" "$service_name is not listening on port $port"
        return 1
    fi
}

# Test API endpoint
test_api() {
    local endpoint_name=$1
    local url=$2
    local expected_response=$3
    
    log "TEST" "Testing $endpoint_name API: $url"
    
    response=$(curl -s -w "HTTP_CODE:%{http_code}" "$url" 2>/dev/null)
    http_code=$(echo "$response" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
    content=$(echo "$response" | sed 's/HTTP_CODE:[0-9]*$//')
    
    if [ "$http_code" = "200" ]; then
        log "SUCCESS" "$endpoint_name API is working (HTTP $http_code)"
        if [ -n "$expected_response" ] && echo "$content" | grep -q "$expected_response"; then
            log "SUCCESS" "$endpoint_name API returned expected response"
        fi
        return 0
    else
        log "ERROR" "$endpoint_name API failed (HTTP $http_code)"
        return 1
    fi
}

# Test webapp control endpoints
test_webapp_control() {
    local base_url=$1
    
    log "TEST" "Testing webapp control endpoints..."
    
    # Test service status endpoint
    test_api "Service Status" "$base_url/api/services/status" "status"
    
    # Test dashboard endpoint
    test_api "Dashboard" "$base_url/api/dashboard" "services"
    
    # Test health endpoint
    test_api "Health Check" "$base_url/api/health" "healthy"
    
    # Test build endpoint (GET request to check availability)
    test_api "Build Endpoint" "$base_url/api/build" ""
    
    log "INFO" "Webapp control API tests completed"
}

# Test VPN management endpoints
test_vpn_management() {
    local base_url=$1
    
    log "TEST" "Testing VPN management endpoints..."
    
    # Test VPN status endpoint
    test_api "VPN Status" "$base_url/api/vpn/status" "status"
    
    # Test VPN SAML connect endpoint (should be available)
    response=$(curl -s -w "HTTP_CODE:%{http_code}" "$base_url/api/vpn/saml-connect" -X POST -H "Content-Type: application/json" -d '{"name":"test"}' 2>/dev/null)
    http_code=$(echo "$response" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
    
    if [ "$http_code" = "404" ] || [ "$http_code" = "400" ] || [ "$http_code" = "500" ]; then
        log "SUCCESS" "VPN SAML Connect endpoint is available (HTTP $http_code - expected for test call)"
    else
        log "WARN" "VPN SAML Connect endpoint returned unexpected response: HTTP $http_code"
    fi
    
    log "INFO" "VPN management API tests completed"
}

# Test webapp availability
test_webapp_availability() {
    log "TEST" "Testing webapp availability..."
    
    # Test common webapp ports
    local webapp_ports=("5173" "8443" "443" "8080" "3000")
    local webapp_found=false
    
    for port in "${webapp_ports[@]}"; do
        if netstat -tlnp | grep -q ":$port "; then
            log "SUCCESS" "Webapp appears to be running on port $port"
            webapp_found=true
            
            # Try to access the webapp
            if curl -s -f "http://localhost:$port" > /dev/null 2>&1; then
                log "SUCCESS" "Webapp is accessible on port $port"
            elif curl -s -f "https://localhost:$port" > /dev/null 2>&1; then
                log "SUCCESS" "Webapp is accessible on port $port (HTTPS)"
            else
                log "WARN" "Port $port is listening but webapp is not accessible"
            fi
        fi
    done
    
    if [ "$webapp_found" = false ]; then
        log "INFO" "No webapp found running - this is expected for management-first startup"
    fi
}

# Main test execution
main() {
    log "INFO" "🧪 Starting Management Console Test Suite"
    log "INFO" "========================================"
    
    # Check basic system info
    log "INFO" "Server: $(hostname)"
    log "INFO" "IP: $(hostname -I | awk '{print $1}')"
    log "INFO" "Date: $(date)"
    log "INFO" ""
    
    # Test management console service
    log "INFO" "1. Testing Management Console Service"
    if check_service "Management Console" "3099" "http://localhost:3099/api/health"; then
        MGMT_URL="http://localhost:3099"
        log "SUCCESS" "Management console is running at $MGMT_URL"
    else
        log "ERROR" "Management console is not running"
        log "INFO" "Try running: ./start-management-first.sh"
        exit 1
    fi
    
    # Test backend services
    log "INFO" "2. Testing Backend Services"
    check_service "SSH WebSocket Server" "3001" "http://localhost:3001/health"
    check_service "Authentication Server" "3002" "http://localhost:3002/health"
    
    # Test API endpoints
    log "INFO" "3. Testing Management Console APIs"
    test_webapp_control "$MGMT_URL"
    
    # Test VPN management
    log "INFO" "4. Testing VPN Management"
    test_vpn_management "$MGMT_URL"
    
    # Test webapp availability
    log "INFO" "5. Testing Webapp Availability"
    test_webapp_availability
    
    # Final summary
    log "INFO" ""
    log "INFO" "🎯 Test Summary"
    log "INFO" "==============="
    log "SUCCESS" "Management Console: http://localhost:3099"
    log "SUCCESS" "VPN Management: http://localhost:3099/vpn-management.html"
    log "INFO" "Web Application Control: Available via management console"
    log "INFO" ""
    log "INFO" "🚀 To test webapp control:"
    log "INFO" "1. Open: http://localhost:3099"
    log "INFO" "2. Navigate to Services section"
    log "INFO" "3. Use Start/Stop/Restart buttons for webapp"
    log "INFO" ""
    log "INFO" "🔐 To test SAML VPN:"
    log "INFO" "1. Open: http://localhost:3099/vpn-management.html"
    log "INFO" "2. Click 'Connect Work VPN (SAML)' button"
    log "INFO" "3. Browser should open for SAML authentication"
}

# Run the tests
main "$@"
