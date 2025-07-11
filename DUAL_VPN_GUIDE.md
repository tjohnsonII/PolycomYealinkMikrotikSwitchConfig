# Dual VPN Setup Guide for Ubuntu Server

## Overview

Your Ubuntu server can connect to both **Work VPN** (SAML authentication) and **Home VPN** (certificate authentication) simultaneously.

## Quick Setup

### 1. Install and Configure Dual VPN:
```bash
sudo ./setup-dual-vpn.sh --install
```

This will:
- Install OpenVPN and dependencies
- Configure both work and home VPN connections
- Create systemd services for automatic startup
- Set up management tools

### 2. Start VPN Connections:

**Start both VPNs:**
```bash
sudo vpn-manager start-both
```

**Start individual VPNs:**
```bash
sudo vpn-manager start-work   # Work VPN only
sudo vpn-manager start-home   # Home VPN only
```

### 3. SAML Authentication (Work VPN):

Since your work VPN uses SAML authentication:
```bash
work-vpn-auth  # Shows authentication instructions
```

Steps for SAML login:
1. Start work VPN: `sudo vpn-manager start-work`
2. Monitor logs: `sudo vpn-manager logs`
3. Look for authentication URL in logs
4. Open URL in browser and complete SAML login
5. VPN connects automatically after successful auth

## Management Commands

### VPN Control:
```bash
sudo vpn-manager start-both     # Start both VPNs
sudo vpn-manager stop-both      # Stop both VPNs
sudo vpn-manager start-work     # Work VPN only
sudo vpn-manager start-home     # Home VPN only
sudo vpn-manager status         # Check connection status
sudo vpn-manager logs           # View recent logs
```

### Status Checking:
```bash
./check-vpn-status.sh          # JSON status output
sudo systemctl status openvpn-work
sudo systemctl status openvpn-home
```

## Web Application Integration

The VPN status is integrated into your web application:

### API Endpoints:
- `GET /api/vpn/status` - Dual VPN status
- `POST /api/vpn/dual/start` - Start VPN (work/home/both)
- `POST /api/vpn/dual/stop` - Stop VPN (work/home/both)
- `GET /api/vpn/dual/logs` - Get VPN logs

### Web Interface:
- VPN status visible in Diagnostic tab
- Start/stop VPN connections from web interface
- View connection logs and status

## Configuration Files

### VPN Configs:
- **Work VPN**: `/etc/openvpn/client/work.conf` (from backend/work.ovpn)
- **Home VPN**: `/etc/openvpn/client/home.conf` (from backend/home.ovpn)

### Services:
- **Work VPN Service**: `openvpn-work.service`
- **Home VPN Service**: `openvpn-home.service`

### Logs:
- **Work VPN**: `/var/log/openvpn/work-vpn.log`
- **Home VPN**: `/var/log/openvpn/home-vpn.log`

## Authentication Types

### Work VPN (SAML):
- **Method**: SAML/Web authentication
- **Process**: Browser-based login required
- **Server**: timsablab.ddns.net:1194
- **Auth**: Interactive web authentication

### Home VPN (Certificate):
- **Method**: Certificate-based authentication
- **Process**: Automatic connection
- **Certs**: Embedded in configuration file
- **Auth**: Client certificate (automatic)

## Network Routing

The system is configured for dual VPN with proper routing:

- **Work VPN**: Route metric 100 (higher priority)
- **Home VPN**: Route metric 200 (lower priority)
- **DNS**: Work traffic uses 8.8.8.8, Home uses 192.168.1.1

## Troubleshooting

### Check VPN Status:
```bash
sudo vpn-manager status
ip route | grep tun
sudo systemctl status openvpn-work openvpn-home
```

### View Logs:
```bash
sudo vpn-manager logs
sudo journalctl -u openvpn-work -f
sudo journalctl -u openvpn-home -f
```

### Restart VPNs:
```bash
sudo vpn-manager stop-both
sudo vpn-manager start-both
```

### SAML Authentication Issues:
1. Check work VPN logs for authentication URL
2. Ensure you can access the authentication server
3. Complete SAML login in browser
4. Monitor logs for connection success

## Security Notes

- VPN configurations contain sensitive data and are excluded from git
- Private keys are stored securely in `/etc/openvpn/client/`
- Services run with appropriate permissions
- SAML authentication provides enterprise-grade security

## Auto-Startup

To enable VPNs to start automatically on boot:
```bash
sudo systemctl enable openvpn-work
sudo systemctl enable openvpn-home
```

## Integration with Production App

The dual VPN system is fully integrated with your Mikrotik Config Generator:
- Status monitoring in web interface
- API endpoints for remote management
- Diagnostic tools for troubleshooting
- Logging integration for monitoring

Your server will maintain connections to both networks simultaneously, allowing access to work resources via SAML-authenticated VPN and home network resources via certificate-based VPN.
