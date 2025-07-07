# Dedicated PBX Troubleshooting Server Setup Guide

## Overview

This guide explains how to set up your web server as a dedicated PBX troubleshooting station that maintains a persistent VPN connection to your work network. This allows the diagnostic page to reach PBX servers directly, enabling remote troubleshooting from anywhere.

## Architecture

```
Internet Users → Web Server (with VPN) → Work Network → PBX Servers
     ↑                ↑                       ↑              ↑
  Any Device      Your Server            VPN Gateway    69.39.69.102
  (Browser)    (Linux + VPN Client)    (terminal.123.net)    (etc.)
```

## Benefits

1. **Always Available**: Server maintains persistent VPN connection
2. **Remote Access**: Users can troubleshoot from anywhere via web browser
3. **No Client VPN**: End users don't need VPN clients or credentials
4. **Real Testing**: Diagnostics can actually reach PBX servers
5. **Professional Setup**: Dedicated troubleshooting infrastructure

## Setup Instructions

### Step 1: Check Your VPN Configuration

Your VPN config (`backend/tjohnson-work.ovpn`) uses **SAML authentication**, which requires a GUI-based VPN client.

```bash
# Check what VPN clients are available
./check-vpn-clients.sh
```

### Step 2: Install Compatible VPN Client

**Option A: NetworkManager (Recommended for servers with GUI)**
```bash
# You already have this installed!
sudo apt install network-manager-openvpn-gnome
```

**Option B: OpenVPN Connect (Best for automation)**
```bash
# Add OpenVPN repository
sudo apt update
sudo apt install apt-transport-https
sudo wget https://swupdate.openvpn.net/repos/openvpn-repo-pkg-key.pub
sudo apt-key add openvpn-repo-pkg-key.pub
sudo wget -O /etc/apt/sources.list.d/openvpn3.list \
  https://swupdate.openvpn.net/community/openvpn3/repos/openvpn3-ubuntu.list

# Install OpenVPN Connect
sudo apt update
sudo apt install openvpn3
```

### Step 3: Configure VPN Connection

**Using NetworkManager (GUI):**
1. Open network settings
2. Add VPN connection
3. Import `backend/tjohnson-work.ovpn`
4. Enable "Automatically connect"
5. Connect and complete SAML authentication

**Using OpenVPN Connect (CLI):**
```bash
# Import config
openvpn3 config-import --config backend/tjohnson-work.ovpn

# Start session (will prompt for SAML auth)
openvpn3 session-start --config backend/tjohnson-work.ovpn

# Enable auto-start (optional)
openvpn3 config-manage --config backend/tjohnson-work.ovpn --persist-tun
```

### Step 4: Enable Persistent VPN Monitoring

```bash
# Run setup script
./setup-persistent-vpn.sh
```

This configures the startup script to monitor your VPN connection and provide status information.

### Step 5: Start the Application

```bash
# Start all services including VPN monitoring
./start-app.sh
```

The startup script will:
- Start all web services (frontend, backend, auth)
- Monitor VPN connection status
- Display VPN information in startup output
- Automatically detect if PBX servers are reachable

## Usage

### For You (Server Admin)
1. Connect VPN manually through your preferred client
2. Start web application: `./start-app.sh`
3. Monitor VPN status in startup output
4. Check diagnostic page to verify PBX connectivity

### For End Users
1. Visit your server's web interface: `http://your-server:3000`
2. Log in with their credentials
3. Go to Diagnostic page
4. Run PBX connectivity tests
5. All tests run through server's VPN connection automatically

## Troubleshooting

### VPN Connection Issues
```bash
# Check VPN status
ip route | grep tun
nmcli connection show
openvpn3 sessions-list  # if using OpenVPN Connect

# Restart VPN
# NetworkManager: reconnect through GUI
# OpenVPN Connect: openvpn3 session-start --config backend/tjohnson-work.ovpn
```

### Web Application Issues
```bash
# Check logs
tail -f startup.log
tail -f backend/ssh-ws-server.log

# Restart application
./start-app.sh
```

### PBX Connectivity Issues
1. Verify VPN is connected: `ip route | grep tun`
2. Test from server: `nc -z 69.39.69.102 5060`
3. Check diagnostic page for detailed results
4. Review logs for specific error messages

## Security Considerations

- VPN credentials are handled by the system VPN client
- Web application uses JWT authentication
- All PBX tests run server-side (credentials never leave server)
- Monitor VPN connection logs for authentication issues

## Maintenance

### Daily Operations
- VPN should auto-reconnect on disconnection
- Web application auto-starts on server reboot
- Monitor logs for any connection issues

### Updates
- Keep VPN client updated
- Update web application with: `git pull && npm install`
- Restart services after updates

## Advanced Configuration

### Auto-Start on Boot
Add to `/etc/systemd/system/pbx-diagnostics.service`:
```ini
[Unit]
Description=PBX Diagnostics Web Server
After=network-online.target

[Service]
Type=forking
User=your-username
WorkingDirectory=/path/to/your/app
ExecStart=/path/to/your/app/start-app.sh
Restart=always

[Install]
WantedBy=multi-user.target
```

### Environment Variables
Edit `.env` file for:
- Custom admin credentials
- JWT secrets
- PBX server addresses
- VPN monitoring intervals

## Summary

With this setup, your web server becomes a dedicated PBX troubleshooting station:

1. **Server**: Maintains persistent VPN to work network
2. **Users**: Access diagnostics via web browser from anywhere  
3. **Testing**: Real connectivity tests to PBX servers
4. **No Hassle**: Users don't need VPN clients or credentials

The diagnostic page can now reliably test PBX connectivity, SIP registration, and network issues because the server itself is connected to your work VPN!
