# Consolidated Server Architecture

## Overview

The server architecture has been completely reorganized and consolidated from 18+ scattered scripts and multiple overlapping proxy servers into a clear, priority-based system with four main servers.

## Server Hierarchy

### Priority 1: Production & Management (Equal Priority)

#### Production Server (`backend/production-proxy.js`)
- **Purpose**: Production-grade server for 123hostedtools.com domain
- **Port**: 3000 (HTTP) + 8443 (HTTPS)
- **Features**:
  - Full SSL/TLS support with 123hostedtools.com certificates
  - Production-grade security headers
  - HTTP to HTTPS redirect
  - Robust error handling and logging
  - Health monitoring endpoint
  - API routing for backend services

#### Management Server (`backend/management-server.js`)
- **Purpose**: Web-based central control system for all services
- **Port**: 3099 (HTTP only, localhost/LAN access)
- **Features**:
  - Start/stop all services from web interface
  - Automatic port conflict cleanup
  - Real-time service monitoring
  - Log viewing and analysis
  - System diagnostics and troubleshooting
  - VPN management interface

### Priority 2: VPN Connectivity

#### VPN Server (`backend/vpn-server.js`)
- **Purpose**: VPN connections, diagnostics, and remote access
- **Port**: 3001 (HTTPS)
- **Features**:
  - OpenVPN3 integration
  - Network diagnostics (ping, traceroute, nslookup)
  - Real-time VPN status monitoring
  - Connection management
  - WebSocket for real-time updates
  - System information endpoints

### Priority 3: Development

#### Development Server (`backend/dev-server.js`)
- **Purpose**: Development tools, hot reloading, and testing
- **Port**: 3002 (HTTP)
- **Features**:
  - Hot reloading and file watching
  - Build tools and testing integration
  - Linting and code quality checks
  - Real-time development updates
  - Custom script execution
  - Project structure analysis

## Startup System

### Single Entry Point: `start.sh`
- Launches management console on port 3099
- Automatic port cleanup
- Browser auto-open to management interface
- From management interface, you can start/stop all services

### Management Console Control
- **URL**: http://localhost:3099
- **Features**:
  - Service status dashboard
  - Start/stop individual services
  - Start entire webapp (launches production server)
  - Real-time monitoring
  - Log viewing
  - System diagnostics

## Port Allocation

| Service | HTTP | HTTPS | Purpose |
|---------|------|-------|---------|
| Management | 3099 | - | Web management interface |
| Production | 3000 | 8443 | 123hostedtools.com production |
| VPN | - | 3001 | VPN connectivity & diagnostics |
| Development | 3002 | - | Dev tools & hot reloading |

## Key Features

### Central Management
- All services controlled from single web interface
- Automatic port conflict resolution
- Real-time service status monitoring
- Unified logging and diagnostics

### Production Focus
- Production server gets priority
- SSL/TLS with 123hostedtools.com certificates
- Production-grade security headers
- Robust error handling

### Clear Separation
- Production (123hostedtools.com) = Priority 1
- Management (system control) = Priority 1
- VPN (connectivity) = Priority 2
- Development (tools) = Priority 3

## Archived Components

The following old components have been archived to `archive/` directory:
- 18+ startup scripts
- Multiple proxy variants (reverse-proxy.js, simple-proxy-123hostedtools.js, etc.)
- Overlapping auth servers
- Multiple SSH server implementations
- Duplicate static servers

## Migration Benefits

1. **Simplified Management**: Single entry point with web-based control
2. **Clear Priority System**: Production and management are top priority
3. **Reduced Complexity**: From 18+ scripts to 4 focused servers
4. **Better Organization**: Each server has a specific, non-overlapping purpose
5. **Improved Reliability**: Automatic port cleanup and conflict resolution
6. **Enhanced Monitoring**: Real-time status and health checks

## Usage

1. **Start System**: `./start.sh`
2. **Access Management**: http://localhost:3099
3. **Start Production**: Click "Start Webapp" or "Start Production"
4. **Access Application**: https://localhost:8443 or https://123hostedtools.com
5. **Development**: Start development server for tools and hot reloading
6. **VPN**: Start VPN server for remote connectivity

## Service Scripts

| Script | Purpose |
|--------|---------|
| `npm run production` | Start production server |
| `npm run management` | Start management console |
| `npm run vpn` | Start VPN server |
| `npm run development` | Start development server |
| `npm run start` | Start entire system |

The new architecture provides a clean, maintainable system where each server has a specific purpose and priority level, making it easy to understand, manage, and scale.
