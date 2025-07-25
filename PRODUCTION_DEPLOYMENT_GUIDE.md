# Phone Config Generator - Production Deployment Guide

## Overview

This guide covers deploying the Phone Config Generator application on an Ubuntu server for production use. The deployment includes comprehensive monitoring, automatic startup, SSL certificates, and robust service management.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Preparation](#server-preparation)
3. [Deployment Methods](#deployment-methods)
4. [Environment Configuration](#environment-configuration)
5. [Service Management](#service-management)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Security Considerations](#security-considerations)
8. [Troubleshooting](#troubleshooting)
9. [Backup & Recovery](#backup--recovery)
10. [Scaling Considerations](#scaling-considerations)

## Prerequisites

### Server Requirements

- **Operating System**: Ubuntu 20.04 LTS, 22.04 LTS, or 24.04 LTS
- **RAM**: Minimum 2GB, Recommended 4GB+
- **CPU**: 2 cores minimum, 4 cores recommended
- **Storage**: 20GB minimum, 50GB+ recommended
- **Network**: Static IP address with internet access

### Domain & DNS

- Domain name (e.g., `123hostedtools.com`)
- DNS A record pointing to your server's public IP
- SSL certificate (Let's Encrypt or custom)

### Network Configuration

- Port forwarding for ports 80, 443, 3099 (management)
- Firewall rules configured appropriately
- Router/ISP configuration for hosting

## Server Preparation

### 1. Update System

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential
```

### 2. Install Node.js

```bash
# Install Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should be v20.x
npm --version   # Should be 9.x+
```

### 3. Install Additional Dependencies

```bash
# Install OpenVPN3 for VPN functionality
sudo apt install -y openvpn openvpn3

# Install system monitoring tools
sudo apt install -y htop iotop nethogs fail2ban

# Install reverse proxy (optional)
sudo apt install -y nginx

# Install process management
sudo apt install -y supervisor
```

### 4. Create Application User

```bash
# Create dedicated user for the application
sudo adduser --system --group --home /opt/phone-config phoneconfig
sudo usermod -aG sudo phoneconfig  # Optional: if admin access needed
```

## Deployment Methods

### Method 1: Direct Deployment (Recommended)

#### Step 1: Clone Repository

```bash
# Clone to application directory
sudo mkdir -p /opt/phone-config
cd /opt/phone-config
sudo git clone https://github.com/your-username/phone-config-generator.git .
sudo chown -R phoneconfig:phoneconfig /opt/phone-config
```

#### Step 2: Install Dependencies

```bash
# Switch to application user
sudo -u phoneconfig bash
cd /opt/phone-config

# Install Node.js dependencies
npm install

# Build the application
npm run build
```

#### Step 3: Configure Environment

```bash
# Copy and customize environment file
cp .env.production.example .env.production
nano .env.production
```

Edit `.env.production` with your specific settings:

```env
# Domain Configuration
DOMAIN=123hostedtools.com
FULL_DOMAIN=123hostedtools.com

# SSL Configuration
SSL_CERT_PATH=./ssl/123hostedtools_com.crt
SSL_KEY_PATH=./ssl/123hostedtools.com.key

# Security
JWT_SECRET=your-super-secret-jwt-key-here
SESSION_SECRET=your-super-secret-session-key-here

# Network
WEBUI_ALLOW_LAN=true
WEBUI_LAN_ALLOWED_IPS=192.168.1.0/24,10.0.0.0/8

# Logging
LOG_LEVEL=info
LOG_PATH=./logs
```

#### Step 4: SSL Certificates

```bash
# Create SSL directory
mkdir -p /opt/phone-config/ssl

# Option A: Let's Encrypt (Recommended)
sudo apt install -y certbot
sudo certbot certonly --standalone -d 123hostedtools.com
sudo cp /etc/letsencrypt/live/123hostedtools.com/fullchain.pem /opt/phone-config/ssl/123hostedtools_com.crt
sudo cp /etc/letsencrypt/live/123hostedtools.com/privkey.pem /opt/phone-config/ssl/123hostedtools.com.key

# Option B: Custom certificates
# Copy your certificates to /opt/phone-config/ssl/

# Set proper permissions
sudo chown -R phoneconfig:phoneconfig /opt/phone-config/ssl
sudo chmod 600 /opt/phone-config/ssl/*.key
```

#### Step 5: Install SystemD Services

```bash
# Install systemd services
sudo -u phoneconfig ./install-systemd-services.sh

# Enable services for auto-start
sudo -u phoneconfig systemctl --user enable phone-config-generator.target
```

#### Step 6: Start Services

```bash
# Start all services
sudo -u phoneconfig ./start-production.sh

# Check status
sudo -u phoneconfig ./status-production.sh
```

### Method 2: Docker Deployment

#### Step 1: Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### Step 2: Configure Docker Environment

```bash
# Copy environment file
cp .env.production.example .env.production
nano .env.production
```

#### Step 3: Deploy with Docker Compose

```bash
# Basic deployment
docker-compose up -d

# Production deployment with monitoring
docker-compose --profile monitoring up -d

# With nginx reverse proxy
docker-compose --profile nginx up -d
```

### Method 3: Automated Deployment Script

```bash
# Make deployment script executable
chmod +x deploy-production.sh

# Run automated deployment
sudo ./deploy-production.sh --domain 123hostedtools.com --email admin@123hostedtools.com

# Check deployment status
sudo systemctl status phone-config-generator-*
```

## Environment Configuration

### Critical Environment Variables

```env
# Application Settings
NODE_ENV=production
APP_NAME=phone-config-generator

# Network Ports
PORT=3443
HTTPS_PORT=443
SSH_WS_PORT=3000
AUTH_PORT=3001
MANAGEMENT_PORT=3099

# Domain & SSL
DOMAIN=123hostedtools.com
SSL_CERT_PATH=./ssl/123hostedtools_com.crt
SSL_KEY_PATH=./ssl/123hostedtools.com.key

# Security
JWT_SECRET=your-super-secret-jwt-key-here
SESSION_SECRET=your-super-secret-session-key-here
BCRYPT_ROUNDS=12

# VPN Configuration
WEBUI_ALLOW_LAN=true
WEBUI_LAN_ALLOWED_IPS=192.168.1.0/24,10.0.0.0/8
OPENVPN3_ENABLED=true

# Database
DATABASE_PATH=./data/production.db

# Logging
LOG_LEVEL=info
LOG_PATH=./logs
```

## Service Management

### SystemD Services

The application creates the following systemd services:

- `phone-config-ssh-ws.service` - SSH WebSocket server
- `phone-config-auth.service` - Authentication server
- `phone-config-management.service` - Management console
- `phone-config-webapp.service` - Main web application
- `phone-config-generator.target` - Service group

### Service Commands

```bash
# Start all services
sudo -u phoneconfig systemctl --user start phone-config-generator.target

# Stop all services
sudo -u phoneconfig systemctl --user stop phone-config-generator.target

# Check status
sudo -u phoneconfig systemctl --user status phone-config-generator.target

# View logs
sudo -u phoneconfig journalctl --user -u phone-config-* -f

# Enable auto-start
sudo -u phoneconfig systemctl --user enable phone-config-generator.target
```

### Management Scripts

```bash
# Start production services
./start-production.sh

# Stop production services
./stop-production.sh

# Check service status
./status-production.sh

# Continuous monitoring
./status-production.sh --continuous

# Service management
./production-service-manager.sh start
./production-service-manager.sh status
./production-service-manager.sh logs
```

## Monitoring & Maintenance

### Health Checks

The application includes comprehensive health monitoring:

```bash
# Manual health check
curl http://localhost:3001/health
curl http://localhost:3099/health

# Automated health check
./status-production.sh --detailed
```

### Log Management

```bash
# View all logs
tail -f logs/*.log

# View specific service logs
tail -f logs/auth.log
tail -f logs/management.log

# Log rotation is configured automatically
```

### Performance Monitoring

```bash
# System resources
./status-production.sh --detailed

# Process monitoring
htop
iotop
nethogs

# Network monitoring
netstat -tlnp
ss -tlnp
```

### Backup Strategy

```bash
# Manual backup
./stop-production.sh --backup

# Automated backup script
crontab -e
# Add: 0 2 * * * /opt/phone-config/backup-production.sh
```

## Security Considerations

### Firewall Configuration

```bash
# Configure UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH
sudo ufw allow ssh

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow management (private networks only)
sudo ufw allow from 192.168.1.0/24 to any port 3099
sudo ufw allow from 10.0.0.0/8 to any port 3099
sudo ufw allow from 172.16.0.0/12 to any port 3099

# Enable firewall
sudo ufw enable
```

### SSL/TLS Configuration

```bash
# Strong SSL configuration
# Edit /etc/nginx/sites-available/phone-config (if using nginx)
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
```

### User Permissions

```bash
# Minimal permissions for application user
sudo usermod -L phoneconfig  # Lock password
sudo chmod 750 /opt/phone-config
sudo chown -R phoneconfig:phoneconfig /opt/phone-config
```

## Troubleshooting

### Common Issues

#### Services Not Starting

```bash
# Check logs
sudo -u phoneconfig journalctl --user -u phone-config-* --no-pager

# Check port conflicts
sudo netstat -tlnp | grep -E "(3000|3001|3099|3443|443)"

# Check file permissions
ls -la /opt/phone-config/
```

#### SSL Certificate Issues

```bash
# Verify certificates
openssl x509 -in /opt/phone-config/ssl/123hostedtools_com.crt -text -noout

# Check certificate validity
openssl x509 -in /opt/phone-config/ssl/123hostedtools_com.crt -checkend 86400
```

#### VPN Connection Issues

```bash
# Check OpenVPN3 installation
openvpn3 --help

# Check VPN logs
tail -f logs/ssh-ws.log | grep -i vpn
```

### Diagnostic Commands

```bash
# Comprehensive system check
./status-production.sh --detailed

# Network connectivity test
curl -k https://localhost:3443
curl http://localhost:3099/health

# Service process check
ps aux | grep -E "(node|npm)"
```

## Backup & Recovery

### Backup Strategy

```bash
# Create backup directory
mkdir -p /opt/phone-config/backups

# Backup script
#!/bin/bash
BACKUP_DIR="/opt/phone-config/backups"
DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/phone-config-backup-$DATE.tar.gz"

# Stop services
./stop-production.sh

# Create backup
tar -czf "$BACKUP_FILE" \
    --exclude="node_modules" \
    --exclude="dist" \
    --exclude="*.log" \
    --exclude="backups" \
    /opt/phone-config

# Start services
./start-production.sh

echo "Backup created: $BACKUP_FILE"
```

### Recovery Procedure

```bash
# Stop services
./stop-production.sh

# Restore from backup
cd /opt/phone-config
tar -xzf backups/phone-config-backup-YYYYMMDD-HHMMSS.tar.gz --strip-components=2

# Rebuild application
npm install
npm run build

# Start services
./start-production.sh
```

## Scaling Considerations

### Horizontal Scaling

```bash
# Load balancer configuration (nginx)
upstream phone_config_backend {
    server 127.0.0.1:3443;
    server 127.0.0.1:3444;  # Additional instance
}

# Docker Swarm
docker swarm init
docker stack deploy -c docker-compose.yml phone-config
```

### Vertical Scaling

```bash
# Increase resource limits in systemd services
sudo systemctl edit --user phone-config-webapp.service

[Service]
MemoryMax=2G
CPUQuota=150%
```

### Database Scaling

```bash
# PostgreSQL instead of SQLite
DATABASE_TYPE=postgresql
DATABASE_URL=postgresql://user:password@localhost:5432/phone_config
```

## Production Checklist

### Pre-deployment

- [ ] Domain name configured and DNS pointing to server
- [ ] SSL certificates obtained and installed
- [ ] Firewall rules configured
- [ ] Server resources adequate
- [ ] Backup strategy in place

### Deployment

- [ ] Application deployed and built
- [ ] Environment variables configured
- [ ] SystemD services installed and enabled
- [ ] Services started and running
- [ ] Health checks passing

### Post-deployment

- [ ] Access URLs working
- [ ] Management console accessible
- [ ] VPN functionality tested
- [ ] Monitoring configured
- [ ] Log rotation configured
- [ ] Auto-start enabled

### Maintenance

- [ ] Regular backups scheduled
- [ ] SSL certificate renewal automated
- [ ] Security updates applied
- [ ] Performance monitoring active
- [ ] Log monitoring configured

## Support & Resources

### Log Files

- Application logs: `/opt/phone-config/logs/`
- System logs: `journalctl --user -u phone-config-*`
- Nginx logs: `/var/log/nginx/`

### Configuration Files

- Application config: `/opt/phone-config/.env.production`
- SystemD services: `~/.config/systemd/user/phone-config-*.service`
- SSL certificates: `/opt/phone-config/ssl/`

### Management URLs

- Main Application: `https://123hostedtools.com`
- Management Console: `http://192.168.1.x:3099`
- Health Check: `http://localhost:3001/health`

This comprehensive deployment guide ensures your Phone Config Generator application is production-ready with proper monitoring, security, and maintenance procedures. The application will be stable, secure, and scalable for your production environment.
