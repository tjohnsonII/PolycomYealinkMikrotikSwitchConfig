# SSL Certificate Configuration Guide

## 🔒 Certificate Overview

This application supports multiple domains with different SSL certificates. The certificates are automatically selected based on the domain configuration.

## 📁 Certificate Files

### 123hostedtools.com (Production)
- **Private Key**: `ssl/123hostedtools_private_key.txt`
- **Certificate**: `ssl/123hostedtools_com.crt`
- **CA Bundle**: `ssl/123hostedtools_com.ca-bundle` (optional)
- **P7B Format**: `ssl/123hostedtools_com.p7b` (optional)

### timsablab.ddns.net (Development/Testing)
- **Private Key**: `ssl/timsablab_ddns_net.key`
- **Certificate**: `ssl/timsablab_ddns_net.crt`

### Localhost (Self-Signed)
- **Private Key**: `ssl/private-key.pem`
- **Certificate**: `ssl/certificate.pem`

## 🔧 Configuration Files

### Current Configuration (hostingFromWork branch)
All HTTPS servers are configured to use **123hostedtools.com** certificates:

#### Frontend (Vite)
- `vite.config.ts`: Uses 123hostedtools.com certificates
- `vite.config.https.ts`: Fallback hierarchy (Let's Encrypt → 123hostedtools.com → self-signed)

#### Backend Services
- `backend/auth-server-https.js`: Uses 123hostedtools.com certificates
- `backend/ssh-ws-server-https.js`: Uses 123hostedtools.com certificates
- `backend/simple-proxy-https.js`: Uses 123hostedtools.com certificates
- `backend/simple-proxy-https-robust.js`: Uses 123hostedtools.com certificates

## 🚀 Usage

### Starting the Application
```bash
# Use 123hostedtools.com (current configuration)
./start-robust.sh --domain=123hostedtools --https

# Use timsablab.ddns.net (requires timsablab certificates)
./start-robust.sh --domain=timsablab --https

# Use localhost with self-signed certificates
./start-robust.sh --domain=localhost --https
```

### Checking Certificate Status
```bash
# Check all certificate availability
./check-ssl-certs.sh check

# List certificate details
./check-ssl-certs.sh list
```

## 🌐 Access URLs

### 123hostedtools.com Configuration
- **Domain**: `https://123hostedtools.com:3000`
- **Public IP**: `https://67.149.139.23:3000`
- **LAN**: `https://192.168.254.253:3000`

### Service Endpoints
- **Frontend**: Port 3000 (HTTPS)
- **SSH WebSocket**: Port 3001 (HTTPS)
- **Authentication**: Port 3002 (HTTPS)

## 🔄 Certificate Renewal

### For 123hostedtools.com
1. Obtain new certificate files from your SSL provider
2. Replace the files in the `ssl/` directory:
   - `123hostedtools_private_key.txt`
   - `123hostedtools_com.crt`
   - `123hostedtools_com.ca-bundle` (if provided)
3. Restart the application

### For timsablab.ddns.net
1. Add the certificate files to the `ssl/` directory:
   - `timsablab_ddns_net.key`
   - `timsablab_ddns_net.crt`
2. Update configuration to use timsablab domain
3. Restart with `--domain=timsablab`

## ⚠️ Security Notes

1. **Never commit certificate files to git** - they are in `.gitignore`
2. **Protect private key files** - ensure proper file permissions (600)
3. **Regular renewal** - monitor certificate expiration dates
4. **Backup certificates** - keep secure backups of your certificate files

## 🔍 Troubleshooting

### Certificate Not Found Error
```bash
# Check which certificates are available
./check-ssl-certs.sh check

# Verify file permissions
ls -la ssl/
```

### HTTPS Connection Issues
1. Verify certificate files exist and are readable
2. Check that the domain matches the certificate
3. Ensure firewall allows HTTPS ports (443, 3000-3002)
4. Verify DNS resolution for the domain

### Mixed Certificate Issues
- Ensure all services use the same certificate set
- Restart all services after certificate changes
- Clear browser cache if using different certificates

## 📝 Current Status

**Active Configuration**: 123hostedtools.com  
**Branch**: hostingFromWork  
**Network**: 192.168.254.253/24  
**Public IP**: 67.149.139.23  

All HTTPS services are configured to use the 123hostedtools.com certificate files.
