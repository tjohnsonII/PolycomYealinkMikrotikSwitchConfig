# Phone Configuration Generator - Streamlined Setup

## 🚀 Quick Start

### 1. One-Time Setup
```bash
./setup.sh
```

### 2. Start Management Console
```bash
./start.sh
```

### 3. Access Web Interface
Open: http://localhost:3099

## 📊 New Streamlined Architecture

The Phone Configuration Generator now uses a clean, organized structure:

- **Single Management Console**: Web interface at port 3099
- **Centralized Service Control**: Start/stop all services from web UI
- **Automatic Port Management**: No more conflicts or manual cleanup
- **Real-time Monitoring**: Live status, logs, and diagnostics

## 🎛️ Management Console Features

The web interface provides:
- **Service Control**: Start/stop main app, SSH server, auth server
- **Real-time Monitoring**: Live service status and health checks
- **Log Viewing**: Centralized log management and troubleshooting
- **System Diagnostics**: Built-in diagnostic tools and health checks
- **Port Management**: Automatic cleanup and conflict resolution

## 🌐 Multi-Domain Access

The Phone Configuration Generator supports access from multiple domains and networks:

### Access Methods
- **Local Development**: http://localhost:3000
- **LAN Access**: http://192.168.254.253:3000
- **Domain Access**: https://123hostedtools.com:3000

### Management Console
- **Local**: http://localhost:3099
- **LAN**: http://192.168.254.253:3099
- **Domain**: https://123hostedtools.com:3099

### Network Configuration
- **Bind Address**: 0.0.0.0 (all interfaces)
- **LAN Access**: Enabled for private networks
- **Domain Support**: 123hostedtools.com whitelist
- **Security**: IP-based access control with domain filtering

### Testing Network Access
Use the network configuration checker:
```bash
./check-network.sh
```

This will test connectivity to all access methods and provide configuration recommendations.

## 📋 Services Overview

| Service | Port | Purpose |
|---------|------|---------|
| Management Console | 3099 | Primary control interface |
| Main Web App | 3000 | Phone configuration generator |
| SSH WebSocket | 3001 | Terminal/SSH/VPN functionality |
| Authentication | 3002 | User management and sessions |

## 🔧 What's New

### Before (Old System)
- 20+ scripts in root directory
- Multiple startup methods
- Manual port management
- Scattered configuration

### After (Streamlined)
- 2 main scripts: `setup.sh` and `start.sh`
- 1 management interface: Web console
- Automatic port management
- Centralized control

## 📁 Setup and Network Management

### Setup Options
```bash
# Standard setup
./setup.sh

# Force rebuild
./setup.sh --force-build

# Production mode
./setup.sh --production

# Check network accessibility
./setup.sh --check-network

# Show help
./setup.sh --help
```

### Network Check Feature
The integrated network check verifies accessibility across all configured domains:
- **Localhost**: `http://127.0.0.1:3099/`
- **LAN**: `http://192.168.254.253:3099/`
- **Domain**: `http://123hostedtools.com:3099/`

### Authentication
The management console now requires authentication for security:
- **Default Username**: `admin`
- **Default Password**: `admin123`
- **Session Duration**: 24 hours
- **Secure**: Supports LAN access with proper authentication

This replaces the standalone `check-network.sh` script and provides a single entry point for both setup and network validation.

## 📁 Old Scripts

All legacy scripts have been moved to `old-scripts/` for reference. The new system replaces all previous startup methods.

## 🧹 Clean Directory Structure

The root directory now contains only essential files:

```
📁 Root Directory
├── 🚀 setup.sh              # One-time system setup
├── 🚀 start.sh              # Start management console
├── 📖 README.md             # This documentation
├── 📊 PORT_CONFIGURATION.md # Complete port documentation
├── 📋 SETUP_SUMMARY.md      # Streamlined setup summary
├── 🔧 package.json          # Node.js configuration
├── ⚙️ vite.config.ts        # Build configuration
├── 🗂️ src/                  # Source code
├── 🗂️ backend/              # Server components
├── 🗂️ public/               # Static assets
├── 🗂️ dist/                 # Built application
├── 🗂️ logs/                 # Application logs
├── 🗂️ archive/              # Archived old files
└── 🗂️ old-scripts/          # Legacy scripts (archived)
```

## 📚 Documentation

- **README.md** - Main documentation (this file)
- **PORT_CONFIGURATION.md** - Complete port and service documentation
- **SETUP_SUMMARY.md** - Detailed setup and migration information
- **TECHNOLOGY.md** - Technical specifications
- **CONTRIBUTING.md** - Development guidelines

## 🗃️ Archived Files

All old documentation, scripts, and configuration files have been organized into:
- **archive/documentation/** - Legacy documentation files
- **archive/configs/** - Old configuration files
- **archive/logs/** - Historical log files
- **old-scripts/** - Legacy startup and management scripts

## 🔧 Development

For development and contribution information, see:
- **CONTRIBUTING.md** - Development guidelines
- **TECHNOLOGY.md** - Technical stack information
- **.github/** - GitHub workflows and templates

---

**Your Phone Configuration Generator is now clean, organized, and ready to use!**
