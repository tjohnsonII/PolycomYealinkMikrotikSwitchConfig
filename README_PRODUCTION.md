# Phone Config Generator - Production Ready Deployment

## 🚀 Quick Start for Production

This repository contains a production-ready Phone Configuration Generator with comprehensive monitoring, service management, and deployment automation.

### For Ubuntu Server Production Deployment

```bash
# 1. Clone the repository
git clone https://github.com/your-repo/phone-config-generator.git
cd phone-config-generator

# 2. Automated Production Deployment
sudo ./deploy-production.sh --domain 123hostedtools.com --email admin@123hostedtools.com

# 3. Manual Service Management
./start-production.sh        # Start all services
./stop-production.sh         # Stop all services  
./status-production.sh       # Check status
```

### For Docker Deployment

```bash
# 1. Configure environment
cp .env.production.example .env.production
# Edit .env.production with your settings

# 2. Deploy with Docker Compose
docker-compose up -d

# 3. Deploy with monitoring
docker-compose --profile monitoring up -d
```

## 📋 Production Features

### ✅ Service Management

- **SystemD Integration**: Automatic service startup/restart
- **Process Management**: PID-based service tracking
- **Health Monitoring**: Comprehensive health checks
- **Log Management**: Centralized logging with rotation
- **Backup System**: Automated configuration backups

### ✅ Security

- **SSL/TLS**: HTTPS with Let's Encrypt or custom certificates
- **Firewall**: UFW configuration with proper port restrictions
- **Authentication**: JWT-based user authentication
- **VPN Support**: OpenVPN3 integration with SAML/2FA

### ✅ Monitoring

- **Real-time Dashboard**: Web-based management console
- **Health Checks**: HTTP endpoint monitoring
- **System Metrics**: CPU, memory, disk usage tracking
- **Log Aggregation**: Error and warning detection
- **Performance Monitoring**: Response time tracking

### ✅ Deployment Options

- **Direct Deployment**: Native Ubuntu server installation
- **Docker Containers**: Containerized deployment with orchestration
- **Automated Scripts**: One-command production deployment
- **Service Discovery**: Automatic service registration

## 📁 File Structure

```text
phone-config-generator/
├── backend/                           # Backend services
│   ├── auth-server.js                 # Authentication service
│   ├── ssh-ws-server.js               # SSH WebSocket service
│   ├── management-server.js           # Management console
│   ├── simple-proxy-https-robust.js   # HTTPS proxy
│   └── health-check.js                # Health monitoring
├── src/                               # Frontend application
├── ssl/                               # SSL certificates
├── logs/                              # Application logs
├── config/                            # Configuration files
├── monitoring/                        # Monitoring configurations
├── deploy-production.sh               # 🔧 Automated deployment
├── start-production.sh                # 🔧 Start services
├── stop-production.sh                 # 🔧 Stop services
├── status-production.sh               # 🔧 Check status
├── install-systemd-services.sh       # 🔧 Install SystemD services
├── production-service-manager.sh      # 🔧 Service manager
├── docker-compose.yml                 # 🐳 Docker deployment
├── Dockerfile                         # 🐳 Container definition
└── PRODUCTION_DEPLOYMENT_GUIDE.md     # 📖 Complete deployment guide
```

## 🛠️ Service Architecture

### Core Services

| Service | Port | Description | Health Check |
|---------|------|-------------|--------------|
| **SSH WebSocket** | 3000 | Terminal/SSH functionality | `/health` |
| **Authentication** | 3001 | User auth & session management | `/health` |
| **Management Console** | 3099 | Web-based admin interface | `/health` |
| **Main Application** | 3443 | HTTPS web application | `/` |
| **HTTPS Proxy** | 443 | Production HTTPS proxy | `/` |

### Management Console Features

- **Service Control**: Start/stop/restart services
- **VPN Management**: Connect/disconnect VPN with SAML support
- **Diagnostics**: Ping, traceroute, network tests
- **Log Viewer**: Real-time log monitoring
- **System Status**: Resource usage and health metrics

## 🔧 Production Scripts

### Service Management

```bash
# Start all production services
./start-production.sh

# Start with SystemD
./start-production.sh --systemd

# Start in daemon mode
./start-production.sh --daemon

# Stop all services
./stop-production.sh

# Stop with backup
./stop-production.sh --backup

# Force stop
./stop-production.sh --force
```

### Status Monitoring

```bash
# Basic status check
./status-production.sh

# Detailed status with metrics
./status-production.sh --detailed

# Continuous monitoring
./status-production.sh --continuous

# JSON output for monitoring systems
./status-production.sh --json
```

### Health Checks

```bash
# Run health check
node backend/health-check.js

# JSON output
node backend/health-check.js --json

# Continuous monitoring
node backend/health-check.js --continuous
```

### Service Manager

```bash
# Service management interface
./production-service-manager.sh start
./production-service-manager.sh stop
./production-service-manager.sh status
./production-service-manager.sh logs
./production-service-manager.sh monitor
./production-service-manager.sh health
```

## 🔐 Security Configuration

### SSL/TLS Setup

```bash
# Let's Encrypt (recommended)
sudo certbot certonly --standalone -d 123hostedtools.com
sudo cp /etc/letsencrypt/live/123hostedtools.com/* ssl/

# Custom certificates
# Place your certificates in ssl/ directory:
# - 123hostedtools.com.key
# - 123hostedtools_com.crt
# - 123hostedtools_com.ca-bundle
```

### Firewall Configuration

```bash
# Configure UFW firewall
sudo ufw allow 22/tcp          # SSH
sudo ufw allow 80/tcp          # HTTP
sudo ufw allow 443/tcp         # HTTPS
sudo ufw allow from 192.168.1.0/24 to any port 3099  # Management (LAN only)
sudo ufw enable
```

### Environment Variables

```env
# Critical production settings
NODE_ENV=production
DOMAIN=123hostedtools.com
SSL_CERT_PATH=./ssl/123hostedtools_com.crt
SSL_KEY_PATH=./ssl/123hostedtools.com.key
JWT_SECRET=your-super-secret-jwt-key
SESSION_SECRET=your-super-secret-session-key
WEBUI_ALLOW_LAN=true
WEBUI_LAN_ALLOWED_IPS=192.168.1.0/24
```

## 📊 Monitoring & Logging

### Health Monitoring

- **Service Health**: HTTP endpoint monitoring
- **Process Health**: PID-based process monitoring
- **System Health**: CPU, memory, disk usage
- **Network Health**: Port availability and connectivity
- **Log Health**: Error and warning detection

### Log Files

```bash
# Application logs
tail -f logs/ssh-ws.log
tail -f logs/auth.log
tail -f logs/management.log
tail -f logs/webapp.log

# System logs
journalctl --user -u phone-config-* -f

# Health check logs
tail -f logs/health-check.log
```

### Metrics Dashboard

Access the management console at `http://your-lan-ip:3099` for:

- Real-time service status
- System resource monitoring
- Log aggregation
- Service control buttons
- VPN management interface

## 🐳 Docker Deployment

### Basic Deployment

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Advanced Deployment

```bash
# With monitoring stack
docker-compose --profile monitoring up -d

# With Nginx reverse proxy
docker-compose --profile nginx up -d

# With backup service
docker-compose --profile backup up -d
```

### Docker Services

| Service | Description | Port |
|---------|-------------|------|
| **phone-config-app** | Main application | 3443 |
| **redis** | Session storage | 6379 |
| **postgres** | Database | 5432 |
| **nginx** | Reverse proxy | 80, 443 |
| **prometheus** | Metrics collection | 9090 |
| **grafana** | Metrics dashboard | 3000 |

## 🚀 Deployment Guide

### Production Checklist

- [ ] Ubuntu server with adequate resources (2GB RAM, 2 CPU cores)
- [ ] Domain name with DNS pointing to server
- [ ] SSL certificates (Let's Encrypt or custom)
- [ ] Firewall configured
- [ ] Node.js 18+ installed
- [ ] OpenVPN3 installed (for VPN features)

### Deployment Steps

1. **Server Preparation**

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential nodejs npm
```

1. **Application Deployment**

```bash
git clone https://github.com/your-repo/phone-config-generator.git
cd phone-config-generator
npm install
npm run build
```

1. **Configuration**

```bash
cp .env.production.example .env.production
# Edit .env.production with your settings
```

1. **SSL Setup**

```bash
# Let's Encrypt
sudo certbot certonly --standalone -d 123hostedtools.com

# Copy certificates
sudo cp /etc/letsencrypt/live/123hostedtools.com/* ssl/
```

1. **Service Installation**

```bash
./install-systemd-services.sh
```

1. **Start Services**

```bash
./start-production.sh
```

1. **Verify Deployment**

```bash
./status-production.sh
node backend/health-check.js
```

### Automated Deployment

```bash
# One-command deployment
sudo ./deploy-production.sh --domain 123hostedtools.com --email admin@123hostedtools.com
```

## 🛠️ Maintenance

### Regular Tasks

```bash
# Check service status
./status-production.sh

# View logs
./production-service-manager.sh logs

# Create backup
./stop-production.sh --backup

# Update application
git pull origin main
npm install
npm run build
./production-service-manager.sh restart
```

### Troubleshooting

```bash
# Check service logs
journalctl --user -u phone-config-* --no-pager

# Check health
node backend/health-check.js --json

# Check ports
netstat -tlnp | grep -E "(3000|3001|3099|3443|443)"

# Check processes
ps aux | grep node
```

## 🔗 Access URLs

### Production URLs

- **Main Application**: `https://123hostedtools.com`
- **Management Console**: `http://192.168.1.x:3099` (LAN only)
- **Health Check**: `http://localhost:3001/health`
- **API Endpoints**: `https://123hostedtools.com/api/`

### Development URLs

- **Vite Dev Server**: `http://localhost:5173`
- **Local HTTPS**: `https://localhost:3443`
- **Local Management**: `http://localhost:3099`

## 📖 Documentation

- **[Production Deployment Guide](PRODUCTION_DEPLOYMENT_GUIDE.md)** - Complete deployment instructions
- **[Management Console Testing](MANAGEMENT_CONSOLE_TESTING.md)** - Testing procedures
- **[Docker Deployment](docker-compose.yml)** - Container orchestration
- **[SystemD Services](install-systemd-services.sh)** - Service management

## 🤝 Support

For issues or questions:

1. Check the logs: `./production-service-manager.sh logs`
2. Run health check: `node backend/health-check.js`
3. Review the troubleshooting section in the deployment guide
4. Check service status: `./status-production.sh --detailed`

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Ready for Production!** 🚀

This Phone Config Generator is production-ready with comprehensive monitoring, security, and deployment automation. Choose your deployment method and follow the guides above for a stable, secure, and scalable installation.
