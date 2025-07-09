#!/bin/bash

#################################################################################
# HTTPS SSL Certificate Management Script
# 
# This script helps generate and manage SSL certificates for the application
# Supports both Let's Encrypt and self-signed certificates
#################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN1="timsablab.com"
DOMAIN2="timsablab.ddn.net"
SSL_DIR="./ssl"
CERT_VALIDITY_DAYS=365

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        return 0
    else
        return 1
    fi
}

# Function to generate self-signed certificates
generate_self_signed() {
    print_status "Generating self-signed SSL certificates..."
    
    # Create SSL directory if it doesn't exist
    mkdir -p "$SSL_DIR"
    
    # Generate private key
    openssl genrsa -out "$SSL_DIR/private-key.pem" 4096
    
    # Generate certificate signing request
    openssl req -new -key "$SSL_DIR/private-key.pem" -out "$SSL_DIR/cert.csr" -subj "/C=US/ST=Lab/L=Lab/O=123Net/CN=$DOMAIN1"
    
    # Generate certificate with SAN (Subject Alternative Names)
    cat > "$SSL_DIR/cert.conf" << EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
C = US
ST = Lab
L = Lab
O = 123Net
CN = $DOMAIN1

[v3_req]
keyUsage = critical, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = $DOMAIN1
DNS.2 = $DOMAIN2
DNS.3 = localhost
IP.1 = 127.0.0.1
EOF
    
    # Generate the certificate
    openssl x509 -req -in "$SSL_DIR/cert.csr" -signkey "$SSL_DIR/private-key.pem" -out "$SSL_DIR/certificate.pem" -days $CERT_VALIDITY_DAYS -extensions v3_req -extfile "$SSL_DIR/cert.conf"
    
    # Set appropriate permissions
    chmod 600 "$SSL_DIR/private-key.pem"
    chmod 644 "$SSL_DIR/certificate.pem"
    
    # Cleanup
    rm "$SSL_DIR/cert.csr" "$SSL_DIR/cert.conf"
    
    print_success "Self-signed certificates generated successfully!"
    print_warning "Note: Self-signed certificates will show browser warnings"
    print_status "Certificates saved to: $SSL_DIR/"
}

# Function to install Let's Encrypt certificates
install_letsencrypt() {
    if ! check_root; then
        print_error "Let's Encrypt installation requires root privileges"
        print_status "Please run: sudo $0 --letsencrypt"
        exit 1
    fi
    
    print_status "Installing Let's Encrypt certificates..."
    
    # Check if certbot is installed
    if ! command -v certbot &> /dev/null; then
        print_status "Installing certbot..."
        apt-get update
        apt-get install -y certbot
    fi
    
    # Stop any services that might be using port 80
    print_status "Temporarily stopping web services..."
    systemctl stop nginx 2>/dev/null || true
    systemctl stop apache2 2>/dev/null || true
    
    # Generate certificates
    certbot certonly --standalone \
        -d "$DOMAIN1" \
        -d "$DOMAIN2" \
        --agree-tos \
        --non-interactive \
        --email "admin@$DOMAIN1"
    
    print_success "Let's Encrypt certificates installed successfully!"
    print_status "Certificates location: /etc/letsencrypt/live/$DOMAIN1/"
    
    # Set up auto-renewal
    if ! crontab -l 2>/dev/null | grep -q certbot; then
        print_status "Setting up automatic certificate renewal..."
        (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
        print_success "Auto-renewal configured (runs daily at noon)"
    fi
}

# Function to check certificate status
check_certificates() {
    print_status "Checking SSL certificates..."
    
    # Check Let's Encrypt certificates
    LETSENCRYPT_PATH="/etc/letsencrypt/live/$DOMAIN1"
    if [[ -f "$LETSENCRYPT_PATH/fullchain.pem" && -f "$LETSENCRYPT_PATH/privkey.pem" ]]; then
        print_success "Let's Encrypt certificates found"
        
        # Check expiry
        EXPIRY=$(openssl x509 -enddate -noout -in "$LETSENCRYPT_PATH/fullchain.pem" | cut -d= -f2)
        print_status "Expires: $EXPIRY"
        
        # Check if expiring soon (within 30 days)
        if openssl x509 -checkend 2592000 -noout -in "$LETSENCRYPT_PATH/fullchain.pem" > /dev/null; then
            print_success "Certificate is valid for more than 30 days"
        else
            print_warning "Certificate expires within 30 days - consider renewal"
        fi
        return 0
    fi
    
    # Check self-signed certificates
    if [[ -f "$SSL_DIR/certificate.pem" && -f "$SSL_DIR/private-key.pem" ]]; then
        print_success "Self-signed certificates found"
        
        # Check expiry
        EXPIRY=$(openssl x509 -enddate -noout -in "$SSL_DIR/certificate.pem" | cut -d= -f2)
        print_status "Expires: $EXPIRY"
        return 0
    fi
    
    print_error "No SSL certificates found!"
    return 1
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "SSL Certificate Management Script"
    echo ""
    echo "Options:"
    echo "  --self-signed     Generate self-signed certificates"
    echo "  --letsencrypt     Install Let's Encrypt certificates (requires root)"
    echo "  --check           Check current certificate status"
    echo "  --help            Show this help message"
    echo ""
    echo "Domains configured: $DOMAIN1, $DOMAIN2"
}

# Main script logic
case "${1:-}" in
    --self-signed)
        generate_self_signed
        ;;
    --letsencrypt)
        install_letsencrypt
        ;;
    --check)
        check_certificates
        ;;
    --help)
        show_usage
        ;;
    *)
        show_usage
        echo ""
        print_status "Choose an option:"
        echo "1. Generate self-signed certificates (for development/testing)"
        echo "2. Install Let's Encrypt certificates (for production)"
        echo "3. Check current certificates"
        echo ""
        read -p "Enter choice [1-3]: " choice
        case $choice in
            1) generate_self_signed ;;
            2) install_letsencrypt ;;
            3) check_certificates ;;
            *) print_error "Invalid choice" ;;
        esac
        ;;
esac
