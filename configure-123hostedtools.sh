#!/bin/bash

# Script to configure webapp for 123hostedtools.com domain

echo "🔧 Configuring webapp for 123hostedtools.com domain..."

# Check if we have the required certificate files
if [ ! -f "ssl/123hostedtools_com_new.crt" ]; then
    echo "❌ Certificate file not found: ssl/123hostedtools_com_new.crt"
    exit 1
fi

if [ ! -f "ssl/123hostedtools_com.ca-bundle" ]; then
    echo "❌ CA bundle file not found: ssl/123hostedtools_com.ca-bundle"
    exit 1
fi

# Check if we have a private key
if [ ! -f "ssl/123hostedtools_com.key" ]; then
    echo "⚠️  Private key not found: ssl/123hostedtools_com.key"
    echo "Please provide the private key file that was used to generate the CSR"
    echo "The key should be saved as: ssl/123hostedtools_com.key"
    exit 1
fi

# Create the combined certificate chain
echo "📄 Creating certificate chain..."
cat ssl/123hostedtools_com_new.crt ssl/123hostedtools_com.ca-bundle > ssl/123hostedtools_com_chain.crt

# Verify the certificate
echo "🔍 Verifying certificate..."
openssl x509 -in ssl/123hostedtools_com_new.crt -text -noout | grep "Subject:"
openssl x509 -in ssl/123hostedtools_com_new.crt -text -noout | grep "DNS:"

# Update the HTTPS proxy configuration
echo "🔄 Updating HTTPS proxy configuration..."

# Check if we have an existing HTTPS proxy configuration
if [ -f "backend/simple-proxy-https.js" ]; then
    echo "📝 Updating existing HTTPS proxy configuration..."
    
    # Create a backup
    cp backend/simple-proxy-https.js backend/simple-proxy-https.js.backup
    
    # Update the certificate paths in the HTTPS proxy
    sed -i "s|ssl/.*\.crt|ssl/123hostedtools_com_chain.crt|g" backend/simple-proxy-https.js
    sed -i "s|ssl/.*\.key|ssl/123hostedtools_com.key|g" backend/simple-proxy-https.js
    
    echo "✅ HTTPS proxy configuration updated"
else
    echo "⚠️  No existing HTTPS proxy configuration found"
    echo "Please create backend/simple-proxy-https.js with the new certificate paths"
fi

# Update environment variables
echo "🔧 Updating environment variables..."
if [ -f ".env" ]; then
    # Update domain in .env file
    sed -i "s|DOMAIN=.*|DOMAIN=123hostedtools.com|g" .env
    sed -i "s|HTTPS_CERT=.*|HTTPS_CERT=ssl/123hostedtools_com_chain.crt|g" .env
    sed -i "s|HTTPS_KEY=.*|HTTPS_KEY=ssl/123hostedtools_com.key|g" .env
    echo "✅ Environment variables updated"
else
    echo "⚠️  No .env file found. Creating one..."
    cat > .env << EOF
DOMAIN=123hostedtools.com
HTTPS_CERT=ssl/123hostedtools_com_chain.crt
HTTPS_KEY=ssl/123hostedtools_com.key
PORT=3000
AUTH_PORT=3002
SSH_WS_PORT=3001
HTTPS_PORT=443
EOF
    echo "✅ .env file created"
fi

echo "🎉 Configuration complete!"
echo ""
echo "📋 Next steps:"
echo "1. Make sure you have the private key file: ssl/123hostedtools_com.key"
echo "2. Update DNS to point 123hostedtools.com to your server IP"
echo "3. Test the configuration with: npm run start:https"
echo "4. Access your webapp at: https://123hostedtools.com"
echo ""
echo "🔐 Certificate details:"
openssl x509 -in ssl/123hostedtools_com_new.crt -text -noout | grep -A 2 "Subject:"
openssl x509 -in ssl/123hostedtools_com_new.crt -text -noout | grep -A 2 "Not After"
