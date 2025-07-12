#!/bin/bash

#################################################################################
# OpenVPN3 SAML Connection Script
# 
# This script handles OpenVPN3 connections with SAML authentication support
#################################################################################

set -e

# Configuration
WORK_CONFIG="/home/tim2/v3_PYMSC/PolycomYealinkMikrotikSwitchConfig/backend/work.ovpn"
HOME_CONFIG="/home/tim2/v3_PYMSC/PolycomYealinkMikrotikSwitchConfig/backend/home.ovpn"
LOG_FILE="/home/tim2/v3_PYMSC/PolycomYealinkMikrotikSwitchConfig/backend/vpn-connection.log"

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
    
    echo -e "${timestamp} [${level}] ${message}" | tee -a "$LOG_FILE"
    
    case $level in
        "ERROR") echo -e "${RED}[${timestamp}] ❌ $message${NC}" ;;
        "SUCCESS") echo -e "${GREEN}[${timestamp}] ✅ $message${NC}" ;;
        "WARN") echo -e "${YELLOW}[${timestamp}] ⚠️  $message${NC}" ;;
        "INFO") echo -e "${BLUE}[${timestamp}] ℹ️  $message${NC}" ;;
    esac
}

# Check if OpenVPN3 is installed
check_openvpn3() {
    if ! command -v openvpn3 &> /dev/null; then
        log "ERROR" "OpenVPN3 is not installed. Installing..."
        
        # Install OpenVPN3
        if command -v apt &> /dev/null; then
            sudo apt update
            sudo apt install -y openvpn3
        elif command -v yum &> /dev/null; then
            sudo yum install -y openvpn3
        else
            log "ERROR" "Cannot install OpenVPN3. Please install manually."
            return 1
        fi
        
        log "SUCCESS" "OpenVPN3 installed successfully"
    else
        log "INFO" "OpenVPN3 is already installed"
    fi
}

# Import VPN configuration
import_config() {
    local config_file="$1"
    local config_name="$2"
    
    if [[ ! -f "$config_file" ]]; then
        log "ERROR" "Configuration file not found: $config_file"
        return 1
    fi
    
    log "INFO" "Importing configuration: $config_name"
    
    # Remove existing configuration if it exists
    if openvpn3 configs-list | grep -q "$config_name"; then
        log "INFO" "Removing existing configuration: $config_name"
        openvpn3 config-remove --config "$config_name" 2>/dev/null || true
    fi
    
    # Import new configuration
    if openvpn3 config-import --config "$config_file" --name "$config_name" --persistent; then
        log "SUCCESS" "Configuration imported successfully: $config_name"
        return 0
    else
        log "ERROR" "Failed to import configuration: $config_name"
        return 1
    fi
}

# Connect to VPN
connect_vpn() {
    local config_name="$1"
    local use_saml="${2:-false}"
    
    log "INFO" "Connecting to VPN: $config_name"
    
    # Check if already connected
    if openvpn3 sessions-list | grep -q "$config_name"; then
        log "WARN" "Already connected to $config_name. Disconnecting first..."
        disconnect_vpn "$config_name"
    fi
    
    # Start VPN session
    if [[ "$use_saml" == "true" ]]; then
        log "INFO" "Starting SAML authentication for $config_name"
        log "INFO" "A browser window should open for authentication"
        
        # For SAML, we need to handle the web authentication
        openvpn3 session-start --config "$config_name" 2>&1 | while IFS= read -r line; do
            echo "$line" | tee -a "$LOG_FILE"
            
            # Check for SAML authentication URL
            if echo "$line" | grep -q "https://"; then
                local auth_url=$(echo "$line" | grep -o 'https://[^[:space:]]*')
                log "INFO" "SAML Authentication URL: $auth_url"
                
                # Try to open browser
                if command -v xdg-open &> /dev/null; then
                    xdg-open "$auth_url" 2>/dev/null &
                elif command -v open &> /dev/null; then
                    open "$auth_url" 2>/dev/null &
                else
                    log "INFO" "Please open this URL in your browser: $auth_url"
                fi
            fi
        done
    else
        # Regular connection
        if openvpn3 session-start --config "$config_name"; then
            log "SUCCESS" "VPN connection established: $config_name"
            return 0
        else
            log "ERROR" "Failed to connect to VPN: $config_name"
            return 1
        fi
    fi
}

# Disconnect from VPN
disconnect_vpn() {
    local config_name="$1"
    
    log "INFO" "Disconnecting from VPN: $config_name"
    
    # Get session info
    local session_path=$(openvpn3 sessions-list | grep "$config_name" | awk '{print $1}' | head -1)
    
    if [[ -n "$session_path" ]]; then
        if openvpn3 session-manage --session-path "$session_path" --disconnect; then
            log "SUCCESS" "VPN disconnected: $config_name"
            return 0
        else
            log "ERROR" "Failed to disconnect VPN: $config_name"
            return 1
        fi
    else
        log "INFO" "No active session found for: $config_name"
        return 0
    fi
}

# Check VPN status
check_status() {
    log "INFO" "Checking VPN status..."
    
    if openvpn3 sessions-list | grep -q "Session"; then
        log "INFO" "Active VPN sessions:"
        openvpn3 sessions-list | tee -a "$LOG_FILE"
        return 0
    else
        log "INFO" "No active VPN sessions"
        return 1
    fi
}

# Test connectivity
test_connectivity() {
    local config_name="$1"
    
    log "INFO" "Testing connectivity for: $config_name"
    
    # Test basic connectivity
    if ping -c 3 8.8.8.8 > /dev/null 2>&1; then
        log "SUCCESS" "Internet connectivity: OK"
    else
        log "ERROR" "Internet connectivity: FAILED"
        return 1
    fi
    
    # Test VPN-specific connectivity
    if [[ "$config_name" == "work" ]]; then
        # Test work-specific endpoints
        if ping -c 3 timsablab.ddns.net > /dev/null 2>&1; then
            log "SUCCESS" "Work VPN server connectivity: OK"
        else
            log "WARN" "Work VPN server connectivity: FAILED"
        fi
    fi
    
    # Show network interfaces
    log "INFO" "Network interfaces:"
    ip -o link show | grep -E "(tun|tap)" | tee -a "$LOG_FILE"
    
    # Show VPN routes
    log "INFO" "VPN routes:"
    ip route show | grep -E "(tun|tap)" | tee -a "$LOG_FILE"
}

# Main function
main() {
    local action="${1:-help}"
    local config_name="${2:-work}"
    local use_saml="${3:-false}"
    
    log "INFO" "Starting OpenVPN3 SAML Connection Script"
    log "INFO" "Action: $action, Config: $config_name, SAML: $use_saml"
    
    case "$action" in
        "install")
            check_openvpn3
            ;;
        "import")
            check_openvpn3
            if [[ "$config_name" == "work" ]]; then
                import_config "$WORK_CONFIG" "work"
            elif [[ "$config_name" == "home" ]]; then
                import_config "$HOME_CONFIG" "home"
            else
                log "ERROR" "Unknown config: $config_name"
                exit 1
            fi
            ;;
        "connect")
            check_openvpn3
            connect_vpn "$config_name" "$use_saml"
            ;;
        "disconnect")
            disconnect_vpn "$config_name"
            ;;
        "status")
            check_status
            ;;
        "test")
            test_connectivity "$config_name"
            ;;
        "full-connect")
            check_openvpn3
            if [[ "$config_name" == "work" ]]; then
                import_config "$WORK_CONFIG" "work"
                connect_vpn "work" "true"
            elif [[ "$config_name" == "home" ]]; then
                import_config "$HOME_CONFIG" "home"
                connect_vpn "home" "false"
            fi
            test_connectivity "$config_name"
            ;;
        "help"|*)
            echo "OpenVPN3 SAML Connection Script"
            echo ""
            echo "Usage: $0 [ACTION] [CONFIG] [SAML]"
            echo ""
            echo "Actions:"
            echo "  install       Install OpenVPN3"
            echo "  import        Import VPN configuration"
            echo "  connect       Connect to VPN"
            echo "  disconnect    Disconnect from VPN"
            echo "  status        Check VPN status"
            echo "  test          Test connectivity"
            echo "  full-connect  Import config and connect (recommended)"
            echo ""
            echo "Config:"
            echo "  work          Work VPN configuration"
            echo "  home          Home VPN configuration"
            echo ""
            echo "SAML:"
            echo "  true          Use SAML authentication"
            echo "  false         Use regular authentication"
            echo ""
            echo "Examples:"
            echo "  $0 full-connect work true   # Connect to work VPN with SAML"
            echo "  $0 connect home false       # Connect to home VPN"
            echo "  $0 status                   # Check connection status"
            echo "  $0 disconnect work          # Disconnect work VPN"
            ;;
    esac
}

# Run main function
main "$@"
