# Web Management Console Documentation

## Overview

The Phone Configuration Generator now includes a comprehensive web-based management console that provides administrators with a powerful interface for monitoring, troubleshooting, and managing the application remotely through a web browser.

## Features

### 🖥️ **Web-Based Interface**
- Modern, responsive web interface accessible via browser
- Real-time monitoring and updates via WebSocket connection
- Dark theme optimized for system administration
- Mobile-friendly responsive design

### 📊 **Real-Time Service Monitoring**
- Live status monitoring of all services (SSH-WebSocket, Auth, Proxy)
- Service health checks with detailed status information
- Real-time port monitoring and network diagnostics
- Visual service status indicators with color coding

### 🔧 **Service Management**
- Start, stop, and restart services through the web interface
- View detailed service logs in real-time
- Monitor service resource usage and performance
- Automatic service health monitoring with alerts

### 🖥️ **Interactive Terminal**
- **NEW**: Full terminal access through the web interface
- Execute commands safely with security restrictions
- Real-time command output streaming
- Command history and auto-completion
- Quick-access buttons for common commands
- Color-coded output for better readability

### 📁 **File System Management**
- Browse project file structure and status
- View file modification times and sizes
- Monitor configuration files and templates
- SSL certificate management and validation

### 📈 **System Diagnostics**
- System resource monitoring (CPU, memory, disk)
- Network connectivity tests
- Port availability checks
- SSL certificate validation
- Dependency verification

### 🔒 **Security Features**
- **Localhost-only access** for maximum security
- Command execution restrictions for dangerous operations
- Input validation and sanitization
- Session management and monitoring

## Getting Started

### Quick Launch

```bash
# Launch web console and open browser
./launch-webui.sh

# Launch console without opening browser
./launch-webui.sh --no-open

# Check console status
./launch-webui.sh --status

# Stop the console
./launch-webui.sh --stop
```

### Integration with Main Application

The web console is automatically integrated with the main application startup:

```bash
# Start all services including web console
./start-robust.sh

# Start without web console
./start-robust.sh --no-webui
```

## Web Console Interface

### Dashboard Tab
- **Service Status**: Real-time status of all services
- **System Information**: Server details, uptime, resource usage
- **Quick Actions**: Start/stop services, view logs
- **Health Indicators**: Visual status indicators for all components

### Services Tab
- **Service Control**: Individual service management
- **Resource Monitoring**: CPU, memory usage per service
- **Port Status**: Active ports and network listeners
- **Health Checks**: Detailed service health information

### Logs Tab
- **Real-time Logs**: Live log streaming from all services
- **Log Filtering**: Filter logs by service or time range
- **Log Search**: Search through historical logs
- **Log Export**: Download logs for offline analysis

### Files Tab
- **Project Structure**: Browse all project files
- **File Status**: Check file integrity and modification times
- **Configuration Files**: Quick access to key configuration files
- **Template Management**: View and manage phone/switch templates

### Terminal Tab (NEW)
- **Interactive Shell**: Execute commands through web interface
- **Command History**: Navigate through previous commands
- **Quick Commands**: Pre-defined buttons for common tasks
- **Safe Execution**: Dangerous commands are blocked for security
- **Real-time Output**: Live streaming of command output

### Troubleshoot Tab
- **Network Diagnostics**: Test connectivity and port availability
- **SSL Validation**: Check SSL certificate status and validity
- **Dependency Checks**: Verify all required packages are installed
- **System Health**: Overall system health assessment

## Terminal Interface

### Available Commands

The web terminal provides access to common system administration commands:

#### Service Management
```bash
ps aux | grep node          # Show Node.js processes
netstat -tulpn | grep :3001 # Check specific port
systemctl status nginx      # Check nginx status
```

#### System Information
```bash
df -h                       # Disk usage
free -h                     # Memory usage
uptime                      # System uptime
top                         # Process monitor
```

#### Project Management
```bash
git status                  # Git repository status
npm list                    # Show installed packages
ls -la                      # List files
tail -f backend/auth.log    # Follow log files
```

### Security Restrictions

For security, the following commands are blocked:
- `rm -rf` (recursive file deletion)
- `sudo` (privilege escalation)
- `su` (switch user)
- `chmod 777` (dangerous permissions)
- `shutdown` / `reboot` (system control)

### Quick Command Buttons

The terminal includes pre-configured buttons for common tasks:

**Service Monitoring:**
- Show Node processes
- Check service ports
- View package list
- Git status check

**System Information:**
- Disk usage report
- Memory usage report
- System uptime
- File listing

## Configuration

### Port Configuration
- **Default Port**: 3099
- **Access**: localhost only (127.0.0.1)
- **Protocol**: HTTP with WebSocket support

### Security Settings
- **IP Restriction**: Localhost access only
- **Command Filtering**: Dangerous commands blocked
- **Session Management**: Automatic cleanup on disconnect

### Integration Settings
The web console is controlled by the main application settings:

```bash
# In start-robust.sh
ENABLE_WEBUI="true"     # Enable web console
WEBUI_PORT="3099"       # Console port
```

## API Endpoints

The web console provides a REST API for programmatic access:

### Service Management
- `GET /api/services/status` - Get all service statuses
- `POST /api/services/{service}/start` - Start a service
- `POST /api/services/{service}/stop` - Stop a service
- `POST /api/services/{service}/restart` - Restart a service

### System Information
- `GET /api/dashboard` - Get dashboard data
- `GET /api/health-checks` - Run health checks
- `GET /api/files` - Get file system information

### Logs
- `GET /api/logs/{service}` - Get service logs
- `GET /api/logs/{service}?lines=100` - Get specific number of log lines

## WebSocket Events

Real-time functionality is provided through WebSocket connections:

### Client to Server
- `terminal-command` - Execute terminal command
- `service-action` - Control service operations

### Server to Client
- `services-status` - Real-time service status updates
- `terminal-output` - Live terminal command output
- `log-update` - Real-time log updates

## Troubleshooting

### Common Issues

**Web Console Won't Start**
```bash
# Check if port is in use
netstat -tulpn | grep 3099

# Check for missing dependencies
npm list socket.io express

# Install missing dependencies
npm install socket.io express
```

**Terminal Commands Not Working**
```bash
# Check WebSocket connection
# Open browser developer tools and check console

# Verify server is running
curl http://localhost:3099/api/dashboard
```

**Access Denied Error**
```bash
# Ensure you're accessing from localhost
# Try: http://127.0.0.1:3099 instead of http://localhost:3099
```

### Log Files

Web console logs are stored in:
- `webui.log` - Main web console log
- `backend/management-server.log` - Server-side logs

## Integration with Existing Scripts

The web console integrates seamlessly with existing management scripts:

### Start Scripts
- `start-robust.sh` - Includes web console by default
- `start-robust-menu.sh` - Interactive menu includes web console options
- `launch-manager.sh` - Can launch web console alongside terminal menu

### Stop Scripts
- `stop-robust.sh` - Stops web console with other services
- Automatic cleanup on main application shutdown

## Advanced Usage

### Custom Commands

You can add custom quick commands by editing the HTML template:

```html
<button class="btn btn-outline-secondary btn-sm" onclick="insertCommand('your-command')">
    <i class="fas fa-custom"></i> Custom Command
</button>
```

### API Integration

The web console API can be used by other tools:

```bash
# Start a service via API
curl -X POST http://localhost:3099/api/services/auth/start

# Get service status
curl http://localhost:3099/api/services/status
```

## Best Practices

### Security
- Always access via localhost only
- Use the web console for monitoring, not as primary management interface
- Regularly review terminal command history
- Keep the web console updated with security patches

### Performance
- The web console is lightweight but monitor resource usage
- Close unused browser tabs to prevent memory leaks
- Use log filtering to avoid overwhelming the interface

### Maintenance
- Regularly check web console logs for errors
- Update dependencies when new versions are available
- Test web console functionality after system updates

## Future Enhancements

Planned features for future versions:
- **File Editor**: Edit configuration files through web interface
- **Process Manager**: More detailed process monitoring and control
- **Backup Management**: Automated backup and restore functionality
- **User Management**: Multi-user access with role-based permissions
- **Mobile App**: Native mobile app for remote monitoring
- **Alerting**: Email/SMS alerts for service issues

## Support

For issues with the web management console:

1. Check the troubleshooting section above
2. Review log files for error messages
3. Test basic functionality with `./launch-webui.sh --status`
4. Verify all dependencies are installed
5. Check network connectivity and port availability

The web management console represents a significant enhancement to the Phone Configuration Generator's administrative capabilities, providing a modern, user-friendly interface for comprehensive system management.
