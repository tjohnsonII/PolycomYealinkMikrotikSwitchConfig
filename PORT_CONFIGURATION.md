# Port Configuration - Phone Configuration Generator

## Overview

The Phone Configuration Generator uses a clean, organized port structure with a centralized management system.

## Port Assignments

### Management Console
- **Port 3099** - Web Management Interface (Primary Control)
  - URL: http://localhost:3099
  - Purpose: Central control panel for all services
  - Features: Start/stop services, monitoring, logs, diagnostics

### Application Services
- **Port 3000** - Main Web Application
  - Static file server for the built React application
  - Handles all phone configuration functionality
  - Only accessible when started via management console

- **Port 3001** - SSH WebSocket Server
  - Provides terminal/SSH functionality for the Diagnostic page
  - Handles VPN connection management
  - WebSocket connections for real-time terminal access

- **Port 3002** - Authentication Server
  - Handles user authentication and session management
  - API endpoints for login/logout functionality
  - Session validation for protected routes

## Service Management

### Startup Process
1. Run `./setup.sh` (one-time setup)
2. Run `./setup.sh --check-network` (verify network accessibility)
3. Run `./start.sh` (starts management console only)
4. Use web interface at http://localhost:3099 to control all other services

### Network Verification
The integrated network check (`./setup.sh --check-network`) verifies:
- Management console accessibility on all configured domains
- Service binding and port availability
- Network connectivity across localhost, LAN, and external domains
- Automatic management server startup if not running

### Authentication
The management console requires authentication for security:
- **Login URL**: `http://localhost:3099/login` (or LAN IP)
- **Default Credentials**: admin / admin123
- **Session Management**: 24-hour sessions with secure cookies
- **Multi-Network**: Works across localhost, LAN, and external domains

### Architecture Benefits
- **Centralized Control**: All services managed from one web interface
- **Clean Separation**: Management console separate from application services
- **Port Management**: Automatic port cleanup and conflict resolution
- **Service Monitoring**: Real-time status monitoring and health checks
- **Logging**: Centralized logging with web-based log viewer

## Network Access

### Multi-Domain Hosting
The application is configured for multi-domain hosting and supports access from:

- **Localhost**: http://localhost:3000 (local development)
- **LAN Access**: http://192.168.254.253:3000 (local network)
- **Domain Access**: https://123hostedtools.com:3000 (external domain)

### Management Console Access
- **Localhost**: http://localhost:3099
- **LAN Access**: http://192.168.254.253:3099
- **Domain Access**: https://123hostedtools.com:3099

### Network Configuration
- **Bind Address**: 0.0.0.0 (all interfaces)
- **LAN Access**: Enabled for private IP ranges
- **Allowed Domains**: localhost, 127.0.0.1, 192.168.254.253, 123hostedtools.com

## Security

### Port Binding
- **All services**: Bind to 0.0.0.0 (all interfaces)
- **Management console**: Multi-domain support with IP filtering
- **Application services**: Accessible from LAN and domain
- **Access control**: IP-based filtering for private networks

### Multi-Domain Security
- **Localhost**: Always allowed (127.0.0.1, ::1)
- **LAN Access**: Private IP ranges (10.x.x.x, 172.16-31.x.x, 192.168.x.x)
- **Domain Access**: Specific domain whitelist (123hostedtools.com)
- **Access logging**: All access attempts logged for monitoring

### Service Isolation
- Each service runs in its own process
- Independent logging and monitoring
- Graceful shutdown handling

## Troubleshooting

### Common Issues
1. **Port Already in Use**
   - Management console automatically cleans up conflicting ports
   - Use `lsof -i :PORT` to check what's using a port
   - Restart management console to reset all services

2. **Service Won't Start**
   - Check logs through management console
   - Verify all dependencies are installed (`./setup.sh`)
   - Check port availability

3. **Build Issues**
   - Run `./setup.sh --force-build` to rebuild
   - Check Node.js version (requires 18+)
   - Verify all npm dependencies are installed

### Log Files
- `logs/management.log` - Management console logs
- `logs/webapp.log` - Main application logs
- `logs/ssh.log` - SSH/terminal functionality logs
- `logs/auth.log` - Authentication server logs

## Migration from Old Scripts

### Before (Multiple Scripts)
- `start-production.sh` - Started production services
- `setup-production.sh` - Complex setup process
- `launch-manager.sh` - Manager startup
- Multiple monitoring and maintenance scripts

### After (Simplified)
- `./setup.sh` - One-time setup
- `./start.sh` - Start management console
- Web interface - Control everything else

### Benefits
- **Simplified Workflow**: Only 2 commands needed
- **Centralized Management**: No more script juggling
- **Better Monitoring**: Real-time status and logs
- **Easier Troubleshooting**: All diagnostic tools in one place
- **Cleaner Codebase**: Archived old scripts for reference

## Development vs Production

### Development Mode
- Source maps enabled
- Hot reloading available
- Detailed error messages
- Debug logging enabled

### Production Mode
- Optimized builds
- Compressed assets
- Error logging only
- Performance monitoring

Both modes use the same port structure and management system.
