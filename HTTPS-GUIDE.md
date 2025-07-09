# HTTPS Configuration Guide

This document explains how to configure and use HTTPS in the Polycom/Yealink Configuration App.

## 🔒 Overview

The application now supports full HTTPS encryption for:
- Frontend web interface (React/Vite)
- Authentication server (JWT-based auth)
- SSH WebSocket server (terminal access)
- All API communications

## 🚀 Quick Start

### Development (Self-Signed Certificates)

1. **Start HTTPS services:**
   ```bash
   npm run start-https
   # or
   ./start-https.sh
   ```

2. **Access the application:**
   - Main App: https://timsablab.com:3000
   - Local Access: https://localhost:3000
   - Auth API: https://timsablab.com:3002
   - SSH WebSocket: wss://timsablab.com:3001

3. **Browser Security Warning:**
   - You'll see SSL warnings due to self-signed certificates
   - Click "Advanced" → "Proceed to site" to continue
   - This is normal for development

4. **Stop services:**
   ```bash
   npm run stop-https
   # or
   ./stop-https.sh
   ```

## 📋 Prerequisites

### Required Software
- Node.js 18+ 
- npm
- OpenSSL
- curl (for health checks)

### System Requirements
- Open ports: 3000, 3001, 3002
- SSL certificate files (auto-generated if missing)

## 🔧 Configuration

### SSL Certificates

#### Self-Signed (Development)
Automatically generated on first run:
```bash
./start-https.sh  # Creates ssl/private-key.pem and ssl/certificate.pem
```

#### Let's Encrypt (Production)
For production with public domain:
```bash
# Install certbot
sudo apt-get install certbot

# Generate certificate
sudo certbot certonly --standalone -d timsablab.com -d timsablab.ddn.net

# Copy to project directory
sudo cp /etc/letsencrypt/live/timsablab.com/privkey.pem ssl/private-key.pem
sudo cp /etc/letsencrypt/live/timsablab.com/fullchain.pem ssl/certificate.pem
sudo chown $USER:$USER ssl/*.pem
chmod 600 ssl/private-key.pem
chmod 644 ssl/certificate.pem
```

### Environment Variables

Create `.env` file in project root:
```bash
# JWT Secret (REQUIRED for production)
JWT_SECRET=your-super-secure-secret-key-here

# Admin credentials
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_EMAIL=admin@company.com
DEFAULT_ADMIN_PASSWORD=change-this-password

# Email settings (optional)
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
ADMIN_EMAIL=admin@company.com

# Server ports (optional)
AUTH_SERVER_PORT=3002
```

## 🏗️ Architecture

### HTTPS Services

1. **Frontend (Port 3000)**
   - Vite dev server with HTTPS
   - React application
   - Automatic HTTPS/WSS protocol detection

2. **Authentication Server (Port 3002)**
   - JWT-based authentication
   - User management
   - Admin dashboard APIs
   - HTTPS-only

3. **SSH WebSocket Server (Port 3001)**
   - Secure WebSocket (WSS) connections
   - SSH terminal access
   - Network diagnostics
   - VPN management

### Security Features

- **TLS 1.2+ encryption** for all communications
- **Secure WebSockets (WSS)** for real-time data
- **HTTPS-only cookies** for authentication
- **CORS protection** with origin validation
- **Security headers** (HSTS, XSS protection, etc.)
- **JWT token validation** for API access

## 📁 File Structure

```
project/
├── ssl/                          # SSL certificates
│   ├── private-key.pem          # Private key
│   └── certificate.pem          # Certificate
├── backend/                      # Backend services
│   ├── auth-server-https.js     # HTTPS auth server
│   ├── ssh-ws-server-https.js   # HTTPS SSH WebSocket server
│   └── ...
├── logs/                         # Service logs
│   ├── auth-server.log          # Auth server logs
│   ├── ssh-ws-server.log        # SSH server logs
│   └── frontend.log             # Frontend logs
├── start-https.sh               # HTTPS startup script
├── stop-https.sh                # Stop script
└── vite.config.ts               # Vite HTTPS config
```

## 🔍 Troubleshooting

### Common Issues

1. **SSL Certificate Errors**
   ```bash
   # Regenerate certificates
   rm -rf ssl/
   ./start-https.sh
   ```

2. **Port Already in Use**
   ```bash
   # Stop conflicting services
   ./stop-https.sh
   # Or manually kill processes
   sudo lsof -ti:3000,3001,3002 | xargs kill -9
   ```

3. **Build Failures**
   ```bash
   # Clean and rebuild
   rm -rf node_modules dist
   npm install
   npm run build
   ```

4. **Browser Won't Connect**
   - Check if services are running: `curl -k https://localhost:3000`
   - Verify ports are open: `netstat -tlnp | grep :300`
   - Check logs: `tail -f logs/*.log`

### Health Checks

```bash
# Check all services
curl -k https://localhost:3000        # Frontend
curl -k https://localhost:3001/health # SSH WebSocket server
curl -k https://localhost:3002/health # Auth server

# Check logs
tail -f logs/auth-server.log
tail -f logs/ssh-ws-server.log
tail -f logs/frontend.log
```

### Browser Certificate Acceptance

For Chrome/Edge:
1. Go to https://localhost:3000
2. Click "Advanced"
3. Click "Proceed to localhost (unsafe)"

For Firefox:
1. Go to https://localhost:3000
2. Click "Advanced"
3. Click "Accept the Risk and Continue"

## 🔒 Production Deployment

### 1. Use Trusted Certificates
Replace self-signed certificates with ones from a trusted CA:
- Let's Encrypt (free)
- Commercial CA (Comodo, DigiCert, etc.)
- Corporate CA

### 2. Reverse Proxy Setup
For production, consider using nginx or Apache as a reverse proxy:

**nginx example:**
```nginx
server {
    listen 443 ssl http2;
    server_name timsablab.com;
    
    ssl_certificate /path/to/certificate.pem;
    ssl_certificate_key /path/to/private-key.pem;
    
    location / {
        proxy_pass https://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api/ {
        proxy_pass https://localhost:3002;
        # ... proxy headers
    }
    
    location /ws/ {
        proxy_pass https://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        # ... other headers
    }
}
```

### 3. Environment Security
- Set strong JWT_SECRET
- Use environment-specific .env files
- Secure file permissions
- Regular certificate renewal

### 4. Monitoring
- Enable log rotation
- Monitor certificate expiration
- Set up health check endpoints
- Configure alerting

## 📚 API Reference

### Authentication Endpoints (Port 3002)
- `POST /api/login` - User login
- `POST /api/register` - User registration
- `GET /api/me` - Get current user
- `GET /api/admin/users` - Get all users (admin)
- `PUT /api/admin/users/{id}/approval` - Approve/deny user (admin)

### SSH WebSocket Endpoints (Port 3001)
- `WSS /` - SSH terminal connection
- `GET /health` - Health check
- `POST /api/ping` - Network ping
- `POST /api/vpn/connect` - VPN connection
- `GET /api/system/info` - System information

## 🤝 Support

For issues or questions:
1. Check logs in `./logs/` directory
2. Verify SSL certificates are valid
3. Ensure all ports are accessible
4. Test with health check endpoints

## 🔄 Migration from HTTP

To migrate from HTTP to HTTPS:
1. Stop existing HTTP services
2. Run `./start-https.sh`
3. Update any hardcoded HTTP URLs
4. Test all functionality
5. Update bookmarks/links to use HTTPS

The application automatically detects the protocol and adjusts API calls accordingly.
