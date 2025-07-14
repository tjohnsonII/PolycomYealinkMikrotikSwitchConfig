# Enhanced Proxy System Documentation

## Overview
This document describes the enhanced proxy system that was created to provide robust HTTP/HTTPS proxy functionality with comprehensive port conflict resolution and service management.

## New Components

### 1. Enhanced Proxy Server (`backend/enhanced-proxy.js`)
- **Purpose**: Robust reverse proxy with advanced error handling and port management
- **Features**:
  - Automatic port conflict detection and resolution
  - Enhanced error handling with retry logic
  - Comprehensive service health checks
  - WebSocket support for SSH connections
  - SSL/TLS termination for HTTPS
  - Static file serving for React frontend
  - Security headers and CORS configuration
  - Graceful shutdown handling

### 2. Enhanced Startup Script (`start-enhanced.sh`)
- **Purpose**: Comprehensive service startup and management
- **Features**:
  - Port conflict detection and automatic resolution
  - Service dependency management
  - Health monitoring and status reporting
  - Graceful service shutdown
  - Automatic frontend building
  - Enhanced logging and PID management

### 3. Port Monitor Utility (`port-monitor.sh`)
- **Purpose**: Port conflict detection and resolution utility
- **Features**:
  - Real-time port status monitoring
  - Interactive conflict resolution
  - Automatic conflict resolution
  - Service identification and management
  - Continuous monitoring mode

## Network Configuration

### Environment: hostingFromWork
- **LAN Network**: 192.168.254.253/24
- **Domain**: 123hostedtools.com
- **Public IP**: 67.149.139.23
- **SSL Certificates**: 123hostedtools.com production certificates

### Port Allocation
- **3000**: Enhanced Proxy (HTTP)
- **8443**: Enhanced Proxy (HTTPS) - Non-privileged port
- **3001**: SSH WebSocket Service
- **3002**: Authentication Service
- **3099**: Management Console

## Service Architecture

```
Client Request → Enhanced Proxy → Backend Services
                ↓
            Static Files (React App)
```

### Routing Rules
- `/api/auth/*` → Authentication Service (port 3002)
- `/api/admin/*` → Authentication Service (port 3002)
- `/api/*` → SSH WebSocket Service (port 3001)
- `/management/*` → Management Console (port 3099)
- `/ws/*` → WebSocket connections (port 3001)
- `/*` → React Frontend (static files)

## Usage

### Starting Services
```bash
# Start all services with enhanced management
./start-enhanced.sh start

# Check service status
./start-enhanced.sh status

# Restart specific service
./start-enhanced.sh restart proxy

# View service logs
./start-enhanced.sh logs proxy
```

### Port Management
```bash
# Check port conflicts
./port-monitor.sh status

# Monitor ports continuously
./port-monitor.sh monitor

# Resolve conflicts interactively
./port-monitor.sh resolve

# Auto-resolve all conflicts
./port-monitor.sh auto
```

### NPM Scripts
```bash
# Start enhanced proxy system
npm run start

# Check port status
npm run port-check

# Monitor ports
npm run port-monitor

# Auto-resolve port conflicts
npm run port-auto
```

## Enhanced Features

### Error Handling
- Automatic retry on connection failures
- Graceful service failover
- Comprehensive error logging
- Health check endpoints

### Port Management
- Automatic port conflict detection
- Graceful process termination
- Service dependency management
- Port availability verification

### Security
- SSL/TLS termination
- Security headers (X-Frame-Options, X-XSS-Protection, etc.)
- CORS configuration
- Request validation

### Monitoring
- Service health checks
- Performance metrics
- Access logging
- Error tracking

## Health Endpoints

### Proxy Health
- **URL**: `http://localhost:3000/proxy-health`
- **Purpose**: Check proxy server health and configuration
- **Response**: JSON with service status and configuration

### Service Status
- **URL**: `http://localhost:3000/proxy-status`
- **Purpose**: Check all backend service health
- **Response**: JSON with individual service health status

## Configuration

### Environment Variables
- `ENABLE_HTTPS`: Enable HTTPS support (default: false)
- `HTTP_PORT`: HTTP port (default: 3000)
- `HTTPS_PORT`: HTTPS port (default: 8443)
- `FORCE_HTTPS`: Force HTTPS redirect (default: false)
- `NODE_ENV`: Environment mode (default: production)

### SSL Configuration
- Certificate: `../ssl/123hostedtools_com.crt`
- Private Key: `../ssl/123hostedtools_private_key.txt`
- CA Bundle: `../ssl/123hostedtools_com.ca-bundle`

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   - Run `./port-monitor.sh auto` to resolve conflicts
   - Or manually kill processes using `./port-monitor.sh resolve`

2. **Service Won't Start**
   - Check logs: `./start-enhanced.sh logs [service]`
   - Verify port availability: `./port-monitor.sh status`
   - Check service dependencies

3. **SSL Certificate Issues**
   - Verify certificate paths in config
   - Check certificate validity
   - Ensure proper file permissions

4. **Frontend Not Loading**
   - Ensure `npm run build` was successful
   - Check if `dist` directory exists
   - Verify static file permissions

### Debugging Commands
```bash
# View all running Node processes
ps aux | grep node

# Check port usage
lsof -i :3000

# Monitor service logs
tail -f logs/proxy.log

# Check service health
curl http://localhost:3000/proxy-health
```

## Differences from Previous System

### Improvements
1. **Enhanced Error Handling**: Better error recovery and user feedback
2. **Robust Port Management**: Automatic conflict detection and resolution
3. **Service Health Monitoring**: Real-time health checks and status reporting
4. **Graceful Shutdown**: Proper cleanup on service termination
5. **Comprehensive Logging**: Better debugging and monitoring capabilities
6. **Security Enhancements**: Additional security headers and validation
7. **Configuration Management**: Centralized configuration with JSON config file

### New Capabilities
- Interactive port conflict resolution
- Service dependency management
- Real-time monitoring and status reporting
- Enhanced SSL/TLS handling
- Automatic service recovery
- Performance metrics collection

## Migration Notes

To migrate from the previous system:
1. Stop existing services: `./start-robust.sh stop`
2. Resolve any port conflicts: `./port-monitor.sh auto`
3. Start enhanced system: `./start-enhanced.sh start`
4. Verify all services are running: `./start-enhanced.sh status`
5. Test functionality: `curl http://localhost:3000/proxy-health`

The enhanced system is backward compatible and provides all the functionality of the previous system with improved reliability and management capabilities.
