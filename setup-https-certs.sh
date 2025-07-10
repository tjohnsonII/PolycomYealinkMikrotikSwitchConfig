#!/bin/bash

# HTTPS Certificate Setup Helper
# This script helps you set up HTTPS with either self-signed or no-ip certificates

echo "🔒 HTTPS Certificate Setup Helper"
echo "================================="
echo ""

# Check what certificates are available
echo "📋 Available certificates:"
ls -la ssl/ | grep -E '\.(crt|pem|key)$'
echo ""

# Check if no-ip certificates exist
if [ -f "ssl/timsablab_ddns_net.crt" ]; then
    echo "✅ No-IP certificate found: ssl/timsablab_ddns_net.crt"
    
    # Check if we have a matching private key
    if [ -f "ssl/timsablab_ddns_net.key" ] || [ -f "ssl/PrivateKey.key" ]; then
        if [ -f "ssl/PrivateKey.key" ]; then
            private_key_file="ssl/PrivateKey.key"
        else
            private_key_file="ssl/timsablab_ddns_net.key"
        fi
        
        echo "✅ No-IP private key found: $private_key_file"
        echo "🔧 Testing certificate/key match..."
        
        # Test if the certificate and key match
        cert_modulus=$(openssl x509 -in ssl/timsablab_ddns_net.crt -noout -modulus | openssl md5)
        key_modulus=$(openssl rsa -in "$private_key_file" -noout -modulus | openssl md5)
        
        if [ "$cert_modulus" = "$key_modulus" ]; then
            echo "✅ Certificate and key match!"
            echo "✅ No-IP HTTPS is ready to use!"
            echo "🚀 Start HTTPS with: ./switch-https.sh https"
            echo "🌐 Or for port 443: sudo ./start-https-443.sh"
        else
            echo "❌ Certificate and key do not match"
            echo "   Certificate modulus: $cert_modulus"
            echo "   Key modulus: $key_modulus"
        fi
    else
        echo "❌ No-IP private key not found"
        echo "   Looking for: ssl/timsablab_ddns_net.key"
        echo ""
        echo "📋 To use no-ip certificates, you need:"
        echo "   1. The certificate: ssl/timsablab_ddns_net.crt (✅ found)"
        echo "   2. The private key: ssl/timsablab_ddns_net.key (❌ missing)"
        echo "   3. The CA certificates: ssl/DigiCertCA.crt and ssl/TrustedRoot.crt"
        echo ""
        echo "💡 The private key should have been generated when you created the CSR for no-ip"
        echo "   Please locate and copy it to: ssl/timsablab_ddns_net.key"
    fi
else
    echo "❌ No-IP certificate not found"
fi

echo ""
echo "🔒 Self-signed certificates:"
if [ -f "ssl/certificate.pem" ] && [ -f "ssl/private-key.pem" ]; then
    echo "✅ Self-signed certificates available"
    echo "   Certificate: ssl/certificate.pem"
    echo "   Private key: ssl/private-key.pem"
    echo "🚀 You can start HTTPS with self-signed certs using existing scripts"
else
    echo "❌ Self-signed certificates not found"
    echo "🔧 Run ./setup-ssl.sh to generate them"
fi

echo ""
echo "📋 Next steps:"
echo "1. If you have the no-ip private key, copy it to: ssl/timsablab_ddns_net.key"
echo "2. Run this script again to verify the setup"
echo "3. Start HTTPS with: ./start-https-production.sh"
echo ""
echo "🔧 For self-signed certificates: ./setup-ssl.sh"
