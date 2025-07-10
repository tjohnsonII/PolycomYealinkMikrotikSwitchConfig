# Tim's AbLab Domain Configuration Guide

## Domain Setup Complete! 🎉

Your webapp has been configured for **timsablab.ddns.net** (67.149.139.23)

## Quick Start

### 1. Start the HTTPS Server
```bash
# Option 1: Use the custom domain-specific script (Recommended)
./start-timsablab.sh

# Option 2: Use the general HTTPS script
./start-https.sh

# Option 3: Use npm script
npm run start-https
```

### 2. Access Your Application
- **Main URL:** https://timsablab.ddns.net:3000
- **IP Access:** https://67.149.139.23:3000
- **Local:** https://localhost:3000

### 3. Default Login
- **Username:** admin
- **Password:** 123NetAdmin2024!

## Required Port Forwarding

Make sure your router forwards these ports to your server:

| Port | Service | Purpose |
|------|---------|---------|
| 3000 | Frontend | Main web application |
| 3001 | SSH WebSocket | Terminal functionality |
| 3002 | Auth API | Authentication service |
| 443 | HTTPS (Optional) | Standard HTTPS |

## SSL Certificates

The system will automatically generate self-signed certificates for:
- timsablab.ddns.net
- 67.149.139.23
- localhost

**Note:** Browsers will show security warnings for self-signed certificates.

### For Production (Optional)
To get trusted certificates, you can use Let's Encrypt:

```bash
# Install certbot
sudo apt install certbot

# Get certificates (requires port 80 forwarding)
sudo certbot certonly --standalone -d timsablab.ddns.net

# Certificates will be saved to: /etc/letsencrypt/live/timsablab.ddns.net/
```

## Configuration Files Updated

✅ `.env` - Environment variables for your domain  
✅ `start-https.sh` - SSL certificate generation  
✅ `vite.config.https.ts` - Frontend HTTPS config  
✅ `backend/auth-server.js` - CORS settings  
✅ `start-timsablab.sh` - Custom startup script  

## Firewall Configuration

The startup script will automatically configure UFW if available:
- Allow SSH (port 22)
- Allow HTTPS (port 443)
- Allow application ports (3000, 3001, 3002)

## Health Checks

The system includes automatic health monitoring:
- Service restart on failure
- Health endpoint checks
- Automatic recovery

## Features Available

🔐 **Authentication System**
- User registration and login
- Admin approval workflow
- JWT-based authentication

📱 **Phone Configuration**
- Polycom and Yealink phone configs
- Expansion module configuration
- Dynamic templates

🌐 **Network Tools**
- Mikrotik router configurations
- Switch templates with download
- VPN diagnostics

🖥️ **System Tools**
- SSH terminal access
- System diagnostics
- Real-time monitoring

## Troubleshooting

### Check Service Status
```bash
# Check if ports are listening
sudo netstat -tlnp | grep -E "(3000|3001|3002)"

# Check service logs
tail -f logs/auth-server.log
tail -f logs/ssh-ws-server.log
tail -f logs/frontend.log
```

### Restart Services
```bash
# Stop current services
pkill -f "auth-server.js"
pkill -f "ssh-ws-server.js"
pkill -f "vite"

# Restart
./start-timsablab.sh
```

### DNS Issues
Make sure your DDNS is updating correctly:
```bash
# Check DNS resolution
nslookup timsablab.ddns.net

# Should return: 67.149.139.23
```

## Security Notes

- Change default admin password after first login
- Consider setting up Let's Encrypt for trusted certificates
- Ensure firewall is properly configured
- Regularly update the application

---

🚀 **Ready to go!** Your domain-specific configuration is complete.
