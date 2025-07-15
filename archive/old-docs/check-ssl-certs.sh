#!/bin/bash

##############################################################################
# SSL Certificate Configuration Script
# 
# This script helps configure the correct SSL certificates based on the domain
# being used for the application.
#
# Available domains:
# - 123hostedtools.com (production certificates)
# - timsablab.ddns.net (development/testing certificates)
# - localhost (self-signed certificates)
##############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SSL_DIR="$SCRIPT_DIR/ssl"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}🔒 SSL Certificate Configuration${NC}"
    echo "============================================"
}

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

check_cert_files() {
    local domain=$1
    
    case $domain in
        "123hostedtools")
            if [[ -f "$SSL_DIR/123hostedtools_private_key.txt" && -f "$SSL_DIR/123hostedtools_com.crt" ]]; then
                print_status "123hostedtools.com certificates found"
                return 0
            else
                print_error "123hostedtools.com certificates missing"
                echo "  Expected files:"
                echo "  - $SSL_DIR/123hostedtools_private_key.txt"
                echo "  - $SSL_DIR/123hostedtools_com.crt"
                return 1
            fi
            ;;
        "timsablab")
            if [[ -f "$SSL_DIR/timsablab_ddns_net.key" && -f "$SSL_DIR/timsablab_ddns_net.crt" ]]; then
                print_status "timsablab.ddns.net certificates found"
                return 0
            else
                print_error "timsablab.ddns.net certificates missing"
                echo "  Expected files:"
                echo "  - $SSL_DIR/timsablab_ddns_net.key"
                echo "  - $SSL_DIR/timsablab_ddns_net.crt"
                return 1
            fi
            ;;
        "localhost")
            if [[ -f "$SSL_DIR/private-key.pem" && -f "$SSL_DIR/certificate.pem" ]]; then
                print_status "Self-signed certificates found"
                return 0
            else
                print_error "Self-signed certificates missing"
                echo "  Expected files:"
                echo "  - $SSL_DIR/private-key.pem"
                echo "  - $SSL_DIR/certificate.pem"
                return 1
            fi
            ;;
        *)
            print_error "Unknown domain: $domain"
            return 1
            ;;
    esac
}

show_cert_info() {
    echo ""
    echo -e "${BLUE}📋 Available Certificates:${NC}"
    echo ""
    
    # Check 123hostedtools.com
    if [[ -f "$SSL_DIR/123hostedtools_private_key.txt" && -f "$SSL_DIR/123hostedtools_com.crt" ]]; then
        echo -e "${GREEN}✅ 123hostedtools.com${NC}"
        echo "   Key: $SSL_DIR/123hostedtools_private_key.txt"
        echo "   Cert: $SSL_DIR/123hostedtools_com.crt"
        if [[ -f "$SSL_DIR/123hostedtools_com.ca-bundle" ]]; then
            echo "   CA Bundle: $SSL_DIR/123hostedtools_com.ca-bundle"
        fi
    else
        echo -e "${RED}❌ 123hostedtools.com${NC}"
    fi
    
    echo ""
    
    # Check timsablab.ddns.net
    if [[ -f "$SSL_DIR/timsablab_ddns_net.key" && -f "$SSL_DIR/timsablab_ddns_net.crt" ]]; then
        echo -e "${GREEN}✅ timsablab.ddns.net${NC}"
        echo "   Key: $SSL_DIR/timsablab_ddns_net.key"
        echo "   Cert: $SSL_DIR/timsablab_ddns_net.crt"
    else
        echo -e "${RED}❌ timsablab.ddns.net${NC}"
    fi
    
    echo ""
    
    # Check self-signed
    if [[ -f "$SSL_DIR/private-key.pem" && -f "$SSL_DIR/certificate.pem" ]]; then
        echo -e "${GREEN}✅ Self-signed (localhost)${NC}"
        echo "   Key: $SSL_DIR/private-key.pem"
        echo "   Cert: $SSL_DIR/certificate.pem"
    else
        echo -e "${RED}❌ Self-signed (localhost)${NC}"
    fi
    
    echo ""
}

show_usage() {
    echo "Usage: $0 [check|list|help]"
    echo ""
    echo "Commands:"
    echo "  check         Check certificate status for all domains"
    echo "  list          List all available certificates"
    echo "  help          Show this help message"
    echo ""
    echo "Certificate Configuration:"
    echo "  The application automatically uses the correct certificates based on"
    echo "  the domain configuration in the startup scripts."
    echo ""
    echo "  To use different domains:"
    echo "    ./start-robust.sh --domain=123hostedtools    # Uses 123hostedtools.com certs"
    echo "    ./start-robust.sh --domain=timsablab         # Uses timsablab.ddns.net certs"
    echo "    ./start-robust.sh --domain=localhost         # Uses self-signed certs"
}

check_all_certs() {
    print_header
    
    echo -e "${BLUE}Checking certificate status...${NC}"
    echo ""
    
    # Check each domain's certificates
    echo "🔍 123hostedtools.com:"
    check_cert_files "123hostedtools" && echo "" || echo ""
    
    echo "🔍 timsablab.ddns.net:"
    check_cert_files "timsablab" && echo "" || echo ""
    
    echo "🔍 Self-signed (localhost):"
    check_cert_files "localhost" && echo "" || echo ""
    
    echo -e "${BLUE}💡 Current Configuration:${NC}"
    echo "  The application is currently configured for 123hostedtools.com"
    echo "  All HTTPS servers will use the 123hostedtools.com certificates."
    echo ""
}

# Main script logic
case "${1:-check}" in
    "check")
        check_all_certs
        ;;
    "list")
        print_header
        show_cert_info
        ;;
    "help"|"--help"|"-h")
        print_header
        show_usage
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_usage
        exit 1
        ;;
esac
