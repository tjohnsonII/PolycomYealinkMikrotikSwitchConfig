# Start Scripts Guide

This project has multiple startup scripts for different use cases. This guide explains the purpose of each script and when to use them.

## 🚀 Primary Start Scripts (Main Options)

### 1. **start-robust.sh** - RECOMMENDED FOR PRODUCTION ⭐
**Purpose**: Most comprehensive production-ready startup script
- **Use case**: Production deployment with maximum reliability
- **Features**: 
  - Comprehensive health checks
  - Automatic service recovery
  - Process monitoring
  - Graceful shutdown handling
  - External access support via reverse proxy
- **Services**: SSH WebSocket (3001), Auth Server (3002), Reverse Proxy (3000)
- **Command**: `./start-robust.sh` or `npm run start`

### 2. **start-https.sh** - SSL/TLS DEVELOPMENT
**Purpose**: HTTPS-enabled development with SSL certificates
- **Use case**: Development with SSL/TLS encryption
- **Features**: 
  - SSL certificate generation
  - HTTPS on all services
  - Comprehensive dependency checks
  - Health checks
- **Services**: SSH WebSocket (3001), Auth Server (3002), Vite Dev Server (3000)
- **Command**: `./start-https.sh` or `npm run start-https`

### 3. **start-timsablab.sh** - DOMAIN-SPECIFIC PRODUCTION
**Purpose**: Custom startup for timsablab.ddns.net domain
- **Use case**: Production deployment on timsablab.ddns.net
- **Features**: 
  - Domain-specific configuration
  - HTTPS with custom SSL certificates
  - External IP binding (67.149.139.23)
  - CORS configuration for domain
- **Services**: SSH WebSocket (3001), Auth Server (3002), Vite Dev Server (3000)
- **Command**: `./start-timsablab.sh`

### 4. **start-app.sh** - COMPREHENSIVE DEVELOPMENT
**Purpose**: Full-featured development script with VPN support
- **Use case**: Development with all features including VPN
- **Features**: 
  - VPN integration support
  - Comprehensive dependency checks
  - Health checks and auto-recovery
  - Process monitoring
  - Optional persistent VPN mode
- **Services**: SSH WebSocket (3001), Auth Server (3002), Vite Dev Server (3000)
- **Command**: `./start-app.sh` or `npm run start-full`

## 🔧 Specialized Start Scripts

### 5. **start-production.sh** - STATIC BUILD PRODUCTION
**Purpose**: Production with static file serving
- **Use case**: Production deployment with built React app
- **Features**: 
  - Builds React app for production
  - Serves static files
  - Handles React Router routes
- **Services**: SSH WebSocket (3001), Auth Server (3002), Static Server (3000)
- **Command**: `./start-production.sh`

### 6. **start-unified-app.sh** - BASIC UNIFIED
**Purpose**: Basic unified startup with enhanced features
- **Use case**: Simple development with all services
- **Features**: 
  - Forceful cleanup of existing processes
  - Basic health checks
  - Enhanced error handling
- **Services**: SSH WebSocket (3001), Auth Server (3002), Vite Dev Server (3000)
- **Command**: `./start-unified-app.sh`

### 7. **start-unified-app-enhanced.sh** - ENHANCED UNIFIED
**Purpose**: Enhanced version of unified startup
- **Use case**: Development with more robust process management
- **Features**: 
  - Enhanced process monitoring
  - Better error handling
  - Auto-restart capabilities
- **Services**: SSH WebSocket (3001), Auth Server (3002), Vite Dev Server (3000)
- **Command**: `./start-unified-app-enhanced.sh`

### 8. **start-auth-app.sh** - MINIMAL AUTH-ONLY
**Purpose**: Minimal startup with just auth and main app
- **Use case**: Simple development without SSH/VPN features
- **Features**: 
  - Lightweight startup
  - Basic process cleanup
  - Sequential startup (auth first, then app)
- **Services**: Auth Server (3001), Vite Dev Server (3000)
- **Command**: `./start-auth-app.sh`

## 🛠️ Utility Scripts

### Supporting Scripts (Not primary startup scripts)
- **setup-ssl.sh** - SSL certificate setup utility
- **stop-https.sh** - Stop HTTPS services
- **system-monitor.sh** - System monitoring
- **watchdog.sh** - Process monitoring
- **maintenance.sh** - Maintenance tasks
- **check-dependencies.sh** - Dependency verification
- **setup-persistent-vpn.sh** - VPN setup utility

## 📋 Quick Reference

| Use Case | Recommended Script | Command |
|----------|-------------------|---------|
| **Production (Recommended)** | `start-robust.sh` | `npm run start` |
| **HTTPS Development** | `start-https.sh` | `npm run start-https` |
| **timsablab.ddns.net** | `start-timsablab.sh` | `./start-timsablab.sh` |
| **Full Development** | `start-app.sh` | `npm run start-full` |
| **Static Production** | `start-production.sh` | `./start-production.sh` |
| **Simple Development** | `start-auth-app.sh` | `./start-auth-app.sh` |

## 🎯 Recommendations

### For New Users:
1. **Development**: Use `start-https.sh` for local development with SSL
2. **Production**: Use `start-robust.sh` for production deployment

### For Existing Users:
- **If you need VPN features**: Use `start-app.sh`
- **If you need domain-specific setup**: Use `start-timsablab.sh`
- **If you want maximum reliability**: Use `start-robust.sh`

### Package.json Integration:
The following npm scripts are available:
- `npm run start` → `start-robust.sh` (RECOMMENDED)
- `npm run start-https` → `start-https.sh`
- `npm run start-full` → `start-app.sh`
- `npm run start-production` → `start-robust.sh --production`

## 🔍 Port Assignments

All scripts use consistent port assignments:
- **3000**: Main application (Vite dev server or static server)
- **3001**: SSH WebSocket server or Auth Server (varies by script)
- **3002**: Auth Server (when SSH WebSocket is on 3001)

## 📝 Notes

- All scripts include process cleanup and signal handling
- Most scripts include health checks and dependency verification
- HTTPS scripts generate self-signed certificates if needed
- Production scripts include enhanced error handling and monitoring
- VPN-enabled scripts require OpenVPN installation

## 🚦 Getting Started

1. **For most users**: `npm run start` (uses start-robust.sh)
2. **For HTTPS development**: `npm run start-https`
3. **For timsablab.ddns.net**: `./start-timsablab.sh`

Choose the script that best matches your deployment scenario and requirements.
