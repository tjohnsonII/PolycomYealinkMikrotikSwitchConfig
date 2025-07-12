# VPN Management Guide

## Quick Start

### 1. Upload VPN Configuration
1. Click "📁 Upload Config" button
2. Enter a name (e.g., "work", "home")
3. Paste your .ovpn file content
4. Click "Upload"

### 2. Connect to VPN
1. Click "🏢 Connect Work VPN" for quick connection
2. Or click "➕ Connect VPN" for manual connection with credentials
3. Enter username/password if required
4. Click "Connect"

### 3. Monitor Connection
- Check the status overview for real-time connection info
- View detailed system information
- Monitor logs for troubleshooting

## Troubleshooting Common Issues

### VPN Won't Connect
1. **Check Configuration**: Ensure .ovpn file is valid
2. **Verify Credentials**: Username/password may be required
3. **Check Network**: Ensure internet connection is working
4. **View Logs**: Check VPN logs for error messages

### Connection Drops
1. **Check Internet**: Verify stable internet connection
2. **Router Issues**: May need port forwarding
3. **Firewall**: Check if VPN traffic is blocked
4. **Server Issues**: VPN server may be down

### Work VPN Specific Issues
1. **SAML Authentication**: Some corporate VPNs require SAML login
2. **Certificate Issues**: May need to import certificates
3. **Network Policies**: Corporate firewall may block VPN
4. **Two-Factor Authentication**: May require additional verification

## Commands for Manual Troubleshooting

### Check VPN Status
```bash
# OpenVPN3 sessions
openvpn3 sessions-list

# Network interfaces
ip link show

# IP addresses
ip addr show

# Routes
ip route show
```

### Check VPN Processes
```bash
# Check if OpenVPN is running
ps aux | grep openvpn

# Check VPN logs
journalctl -u openvpn-work
journalctl -u openvpn-home
```

### Network Diagnostics
```bash
# Test connectivity
ping 8.8.8.8

# Check DNS
nslookup google.com

# Test specific routes
traceroute your-work-server.com
```

## VPN Configuration Examples

### Basic Work VPN (.ovpn)
```
client
dev tun
proto udp
remote your-vpn-server.com 1194
resolv-retry infinite
nobind
persist-key
persist-tun
ca ca.crt
cert client.crt
key client.key
verb 3
```

### With Authentication
```
client
dev tun
proto udp
remote your-vpn-server.com 1194
resolv-retry infinite
nobind
persist-key
persist-tun
ca ca.crt
auth-user-pass
verb 3
```

## Security Best Practices

1. **Keep Configs Secure**: Don't share .ovpn files
2. **Use Strong Passwords**: For VPN authentication
3. **Regular Updates**: Keep OpenVPN client updated
4. **Monitor Connections**: Check logs regularly
5. **Disconnect When Done**: Don't leave VPN connected unnecessarily

## Getting Help

- Check the logs section for error messages
- Use the terminal for manual commands
- Review system status for network information
- Contact your IT administrator for work VPN issues
