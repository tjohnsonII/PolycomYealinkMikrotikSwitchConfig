# Production Deployment Guide

## Phone Configuration Generator - Robust Production Setup

This guide will help you deploy the Phone Configuration Generator system with maximum stability and reliability.

## Quick Start

1. **Run the automated setup script:**
   ```bash
   ./setup-production.sh --install-systemd --install-cron
   ```

2. **Start the application:**
   ```bash
   ./start-robust.sh
   ```

That's it! The system is now running with full monitoring and auto-recovery.

## Manual Setup (Advanced)

### 1. Prerequisites

- Node.js 16+ installed
- NPM or Yarn package manager
- Linux system with systemd (for service management)
- `curl`, `lsof`, `netstat` commands available

### 2. Installation Steps

```bash
# 1. Clone and navigate to project
cd /path/to/PolycomYealinkMikrotikSwitchConfig

# 2. Install dependencies
npm install --production

# 3. Build the application
npm run build

# 4. Make scripts executable
chmod +x start-robust.sh watchdog.sh system-monitor.sh maintenance.sh

# 5. Run the setup script
./setup-production.sh --install-systemd --install-cron
```

### 3. Configuration

Edit the `.env` file to customize your installation:

```bash
# Application settings
NODE_ENV=production
PORT=3000

# Authentication
JWT_SECRET=your-secret-here
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=change-this-password

# Monitoring
HEALTH_CHECK_INTERVAL=30
MAX_RESTART_ATTEMPTS=3
```

## Startup Scripts

### start-robust.sh
The main production startup script with the following features:
- ✅ Process cleanup and port management
- ✅ Health checks with auto-restart
- ✅ Service monitoring
- ✅ Comprehensive logging
- ✅ External access support
- ✅ Graceful shutdown handling

### watchdog.sh
Independent service monitoring:
- Checks service health every 5-15 minutes
- Can automatically restart failed services
- Monitors disk space and memory usage
- Provides detailed health reports

### system-monitor.sh
System resource monitoring:
- CPU, memory, and disk usage alerts
- System load monitoring
- Service port checking
- Email alerts (optional)

### maintenance.sh
Automated maintenance tasks:
- Database backups
- Log rotation
- System cleanup
- Configuration backups

## Service Management

### Using Systemd (Recommended)

```bash
# Install service
sudo cp phone-config-generator.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable phone-config-generator

# Control service
sudo systemctl start phone-config-generator
sudo systemctl stop phone-config-generator
sudo systemctl restart phone-config-generator
sudo systemctl status phone-config-generator

# View logs
sudo journalctl -u phone-config-generator -f
```

### Manual Control

```bash
# Start application
./start-robust.sh

# Start in development mode
./start-robust.sh --dev

# Stop application (Ctrl+C or kill process)
```

## Monitoring and Maintenance

### Automated Monitoring (Cron)

The setup script installs these cron jobs:

```bash
# Health checks every 5 minutes
*/5 * * * * cd /path/to/app && ./watchdog.sh

# Restart failed services every 15 minutes
*/15 * * * * cd /path/to/app && ./watchdog.sh --restart-on-failure

# System monitoring every 10 minutes
*/10 * * * * cd /path/to/app && ./system-monitor.sh

# Daily backups at 2 AM
0 2 * * * cd /path/to/app && ./maintenance.sh --backup-only

# Weekly maintenance on Sundays at 3 AM
0 3 * * 0 cd /path/to/app && ./maintenance.sh
```

### Manual Monitoring

```bash
# Check service health
./watchdog.sh

# Check system resources
./system-monitor.sh

# Run maintenance
./maintenance.sh
```

## Network Configuration

### Port Requirements

- **Port 3000**: Main application (HTTP) - **Forward this port only**
- **Port 3001**: SSH WebSocket backend (internal)
- **Port 3002**: Authentication API (internal)

### Router Configuration

**Only forward port 3000** to your server's IP address. The reverse proxy handles all internal routing.

```
External Port 3000 → Internal IP:3000
```

### Access URLs

- **Local**: http://localhost:3000
- **LAN**: http://your-server-ip:3000
- **Internet**: http://your-external-ip:3000

## Security Features

### Application Security
- JWT-based authentication
- Secure password hashing (bcrypt)
- Input validation and sanitization
- CSRF protection
- Secure session management

### System Security
- Non-root user execution
- Restricted file permissions
- Process isolation
- Resource limits
- Systemd sandboxing

### Network Security
- Single port exposure
- Internal API routing
- No direct backend access
- Secure proxy configuration

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Check what's using the port
   lsof -i :3000
   
   # Kill the process
   ./start-robust.sh  # Script handles this automatically
   ```

2. **Services not starting**
   ```bash
   # Check logs
   tail -f startup-robust.log
   
   # Check system resources
   ./system-monitor.sh
   ```

3. **External access not working**
   ```bash
   # Check if port is forwarded
   curl -I http://your-external-ip:3000
   
   # Check firewall
   sudo ufw status
   ```

### Log Files

- `startup-robust.log` - Main application startup
- `watchdog.log` - Health monitoring
- `system-monitor.log` - System resource monitoring
- `maintenance.log` - Backup and maintenance tasks
- `backend/ssh-ws.log` - SSH WebSocket service
- `backend/auth.log` - Authentication service
- `backend/proxy.log` - Reverse proxy service

### Health Check Endpoints

- http://localhost:3000/proxy-health - Proxy health
- http://localhost:3001/health - SSH WebSocket health
- http://localhost:3002/health - Authentication health

## Performance Tuning

### System Resources

```bash
# Recommended minimum requirements
CPU: 2 cores
RAM: 2GB
Disk: 10GB free space
Network: 10Mbps
```

### Node.js Optimization

```bash
# Environment variables for performance
NODE_ENV=production
NODE_OPTIONS="--max-old-space-size=1024"
```

### Process Limits

The systemd service includes resource limits:
- Memory: 2GB max
- File handles: 65536
- Processes: 4096

## Backup and Recovery

### Automated Backups

- User database: Daily at 2 AM
- Configuration files: Weekly
- Application assets: Weekly
- Log rotation: Daily

### Manual Backup

```bash
# Full backup
./maintenance.sh --backup-only

# Restore from backup
cp backups/users_YYYYMMDD_HHMMSS.json backend/users.json
```

## Updates and Maintenance

### Update Application

```bash
# Stop services
sudo systemctl stop phone-config-generator

# Update code
git pull origin main

# Install dependencies
npm install --production

# Build application
npm run build

# Start services
sudo systemctl start phone-config-generator
```

### Regular Maintenance

```bash
# Weekly maintenance (automated via cron)
./maintenance.sh

# Manual cleanup
./maintenance.sh --cleanup-only
```

## Support and Documentation

### Log Analysis

```bash
# Real-time monitoring
tail -f startup-robust.log

# Search for errors
grep -i error *.log

# System status
./watchdog.sh && ./system-monitor.sh
```

### Performance Monitoring

```bash
# System resource usage
htop

# Network connections
netstat -tulpn

# Process monitoring
ps aux | grep node
```

### Getting Help

1. Check the logs first
2. Run the diagnostic scripts
3. Review the configuration files
4. Check system resources
5. Verify network connectivity

## Best Practices

1. **Regular Updates**: Keep Node.js and dependencies updated
2. **Monitor Logs**: Review logs regularly for issues
3. **Backup Strategy**: Test backup restoration procedures
4. **Security**: Change default passwords and keep secrets secure
5. **Resource Monitoring**: Watch CPU, memory, and disk usage
6. **Network Security**: Only expose necessary ports
7. **Documentation**: Keep deployment notes and configurations documented

---

**Note**: This system is designed for production use with automatic monitoring, recovery, and maintenance. The robust startup script and monitoring tools ensure high availability and system stability.
