# Management-First Startup Guide

## Overview

This system now uses a **management-first approach** where the web management console is your primary control interface.

## Quick Start

### 1. Start Management Console

```bash
# Simple start (localhost only)
./launch-management.sh

# With LAN access (accessible from network)
./launch-management.sh --allow-lan
```

### 2. Access Management Console

- **Local**: http://localhost:3099
- **LAN**: http://YOUR_SERVER_IP:3099 (if --allow-lan enabled)

### 3. Start Web Application

1. Open management console in browser
2. Go to **Dashboard** tab
3. In the **"Main Web Application"** section:
   - Click **"🚀 Start Application"**
   - Wait for build and startup process
   - Monitor status in real-time

## System Architecture

### Management Console (Always Running)
- **Web Management Console** (port 3099) - Your control center
- **SSH WebSocket Server** (port 3001) - Backend services
- **Authentication Server** (port 3002) - User management

### Web Application (On-Demand)
- **Main Web Application** - Started via management console
- **HTTPS Proxy** (port 8443) - Production frontend
- **React Frontend** - Phone configuration generator

## Key Features

### 🎛️ Management Console Features
- **Service Control**: Start/stop/restart any service
- **Real-time Monitoring**: Live status updates
- **Log Viewing**: Real-time log streaming
- **VPN Management**: SAML/2FA VPN connections
- **System Diagnostics**: Health checks and troubleshooting
- **File Management**: Configuration and log files

### 🌐 Web Application Features
- **Phone Configuration Generator**: Polycom/Yealink configs
- **Switch Templates**: Network switch configurations
- **Mikrotik Templates**: Router configurations
- **User Authentication**: Login/register system
- **Diagnostics**: Network connectivity testing

## Usage Workflow

### Daily Operations
1. **Start**: `./launch-management.sh --allow-lan`
2. **Monitor**: Access management console
3. **Control**: Start/stop web app as needed
4. **Troubleshoot**: Use built-in diagnostics

### Development
1. **Start**: `./launch-management.sh`
2. **Build**: Use management console to build/restart
3. **Debug**: View real-time logs
4. **Test**: Use terminal tab for commands

### Production
1. **Start**: `./launch-management.sh --allow-lan`
2. **Deploy**: Build and start web application
3. **Monitor**: Use dashboard for health checks
4. **Maintain**: LAN access for remote management

## Access URLs

### Management Console
- **Local**: http://localhost:3099
- **LAN**: http://YOUR_SERVER_IP:3099

### Web Application (after starting)
- **Production**: https://123hostedtools.com
- **Development**: https://localhost:8443

### Direct Service Access
- **SSH/VPN Backend**: http://localhost:3001
- **Authentication**: http://localhost:3002

## Benefits

### 🎯 Control
- Single point of control for all services
- No need to remember multiple start commands
- Real-time service monitoring

### 🔧 Flexibility
- Start only what you need
- Easy service restart without affecting others
- Web-based control from anywhere on LAN

### 📊 Visibility
- Real-time status monitoring
- Centralized log viewing
- System health diagnostics

### 🛡️ Security
- Management console can be localhost-only
- Optional LAN access when needed
- User authentication for web application

## Troubleshooting

### Management Console Won't Start
```bash
# Check for port conflicts
lsof -i :3099

# Check logs
tail -f backend/management-server.log
```

### Services Won't Start
1. Open management console
2. Go to **Services** tab
3. Check service status and logs
4. Use **Restart** button if needed

### Web Application Issues
1. Check **Dashboard** → **Main Web Application** status
2. View logs in **Logs** tab
3. Try **Build** then **Start** buttons
4. Check **Troubleshoot** tab for diagnostics

## Migration from Old Scripts

### Old Way
```bash
./start-robust.sh  # Started everything at once
```

### New Way
```bash
./launch-management.sh     # Start management console
# Then use web interface to start web application
```

## Advanced Usage

### Custom Configuration
- Edit `backend/management-server.js` for service definitions
- Modify `backend/management-ui/` for UI customization
- Update service scripts in `backend/` directory

### Monitoring
- Use WebSocket connections for real-time updates
- API endpoints available for external monitoring
- Log files available in `backend/` directory

### Integration
- REST API for service control
- WebSocket for real-time updates
- Terminal access for system commands
