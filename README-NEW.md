# Phone Configuration Generator - Simplified Startup System

## Quick Start

### 1. Start the Management Console
```bash
./start.sh
```

This will:
- Clean up any conflicting ports
- Start the web management console on port 3099
- Open your browser to the management interface

### 2. Use the Web Interface

From the management console at `http://localhost:3099`:
- **Start Webapp**: Click "Start" on the webapp service
- **Monitor Services**: Real-time status of all components
- **View Logs**: Check service logs for troubleshooting
- **Stop Services**: Graceful shutdown of components

## Architecture

### New Simplified System
- **Single Entry Point**: `start.sh` only starts the management console
- **Web-Based Control**: All service management through web interface
- **Automatic Cleanup**: Port conflicts resolved automatically
- **Centralized Monitoring**: Real-time status and logs

### Services Managed
- **Authentication Server** (port 3002) - User authentication
- **SSH WebSocket Server** (port 3001) - SSH terminal functionality
- **Enhanced Proxy** (ports 3000/8443) - HTTP/HTTPS reverse proxy
- **Main Web Application** - Complete phone configuration system

## Port Configuration

### Network Setup (hostingFromWork branch)
- **LAN**: 192.168.254.253/24
- **Domain**: 123hostedtools.com
- **Public IP**: 67.149.139.23
- **SSL Certificates**: 123hostedtools.com production certificates

### Port Allocation
- **3099**: Management Console (always running)
- **3000**: Enhanced Proxy (HTTP)
- **8443**: Enhanced Proxy (HTTPS)
- **3001**: SSH WebSocket Service
- **3002**: Authentication Service

## Usage Examples

### Start Management Console
```bash
./start.sh
```

### NPM Scripts
```bash
npm start          # Start management console
npm run management # Same as above
npm run build      # Build the webapp
```

### Manual Service Control (if needed)
```bash
npm run webui      # Start just the management console
npm run proxy      # Start just the enhanced proxy
npm run auth       # Start just the authentication server
npm run ssh        # Start just the SSH WebSocket server
```

## Accessing the Application

### Management Console
- **Local**: http://localhost:3099
- **LAN**: http://192.168.254.253:3099 (if on same network)

### Main Web Application (after starting via web interface)
- **HTTP**: http://localhost:3000
- **HTTPS**: https://localhost:8443
- **Production**: https://123hostedtools.com

## Features

### Web Management Interface
- **Service Control**: Start/stop individual services or entire webapp
- **Real-time Monitoring**: Live status updates and health checks
- **Log Viewing**: Centralized log access for all services
- **Port Management**: Automatic cleanup of conflicting ports
- **System Information**: Resource usage and system status
- **VPN Management**: Control VPN connections for remote access

### Enhanced Proxy
- **HTTP/HTTPS Support**: Automatic SSL termination
- **WebSocket Support**: Real-time terminal connections
- **Load Balancing**: Intelligent routing to backend services
- **Health Checks**: Automatic failover for unhealthy services
- **Security Headers**: CORS, XSS protection, content security

### Service Management
- **Dependency Management**: Services start in correct order
- **Graceful Shutdown**: Proper cleanup on service stop
- **Health Monitoring**: Continuous health checks
- **Auto-restart**: Failed services can be restarted from web interface

## Troubleshooting

### Common Issues

1. **Port Conflicts**
   - The management console automatically cleans up ports
   - If issues persist, restart the management console

2. **Services Won't Start**
   - Check logs in the web interface
   - Verify all dependencies are installed (`npm install`)
   - Ensure build is complete (`npm run build`)

3. **Cannot Access Management Console**
   - Verify port 3099 is not in use by another application
   - Check if management console is running: `lsof -i :3099`

4. **SSL Certificate Issues**
   - Certificates are automatically configured for 123hostedtools.com
   - Check certificate validity in the troubleshooting section

### Getting Help

1. **Web Interface**: Use the built-in troubleshooting tools
2. **Logs**: Check individual service logs through the web interface
3. **Health Checks**: Monitor service health in real-time
4. **System Status**: View resource usage and system information

## Migration from Old System

If you were using the old complex startup system:

1. **All old scripts have been archived** to `archive/old-startup-scripts/`
2. **New workflow**: Just run `./start.sh` and use the web interface
3. **Same functionality**: All features are available through the web interface
4. **Better reliability**: No more port conflicts or startup order issues

## Development

### Project Structure
```
├── start.sh                    # Main startup script
├── backend/
│   ├── management-server.js    # Web management console
│   ├── enhanced-proxy.js       # HTTP/HTTPS proxy
│   ├── auth-server-https.js    # Authentication service
│   └── ssh-ws-server-https.js  # SSH WebSocket service
├── src/                        # React frontend
└── archive/                    # Old scripts (archived)
```

### Adding New Services
1. Define service in `backend/management-server.js`
2. Add health check endpoint
3. Update web interface to include new service
4. Test through management console

This simplified system eliminates the complexity of multiple startup scripts while providing better control and monitoring capabilities through the web interface.
