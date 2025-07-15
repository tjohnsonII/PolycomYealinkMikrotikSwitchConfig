# Webapp Startup Guide

## Quick Start

### For 123hostedtools.com (default)
```bash
sudo ./start-robust.sh
```

### For timsablab.ddns.net
```bash
sudo ./start-robust.sh --domain=timsablab
```

### For HTTP only (development)
```bash
./start-robust.sh --http --dev
```

## Available Commands

| Command | Description |
|---------|-------------|
| `sudo ./start-robust.sh` | Start with 123hostedtools.com HTTPS (default) |
| `sudo ./start-robust.sh --domain=timsablab` | Start with timsablab.ddns.net |
| `sudo ./start-robust.sh --domain=123hostedtools` | Start with 123hostedtools.com |
| `./start-robust.sh --http` | Use HTTP instead of HTTPS (no sudo needed) |
| `./start-robust.sh --dev` | Development mode |
| `./start-robust.sh --verbose` | Verbose logging |
| `./start-robust.sh --help` | Show all options |
| `./stop-robust.sh` | Stop all services |

## What Gets Started

1. **SSH WebSocket Server** (port 3001) - VPN/SSH functionality
2. **Authentication Server** (port 3002) - User management 
3. **Reverse Proxy** (port 443/3000) - Frontend + API routing

## Important Notes

- **HTTPS mode requires sudo** because it binds to port 443
- **HTTP mode** runs on port 3000 and doesn't require sudo
- The script automatically detects which SSL certificates to use based on domain

## SSL Certificates

- **123hostedtools.com**: Uses `ssl/123hostedtools.com.key` and `ssl/123hostedtools_com.crt`
- **timsablab.ddns.net**: Uses `ssl/PrivateKey.key` and `ssl/timsablab_ddns_net.crt`

## Monitoring & Health Checks

The robust script includes:
- Automatic health monitoring every 30 seconds
- Auto-restart on service failure (max 3 attempts)
- Comprehensive logging
- Graceful shutdown handling

## Old Scripts

All previous start scripts have been moved to `archive/old-start-scripts/` for reference.
