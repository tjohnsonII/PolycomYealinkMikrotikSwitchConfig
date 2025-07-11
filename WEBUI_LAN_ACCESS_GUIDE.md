# Web Management Console - LAN Access Guide

## Overview

The Web Management Console can now be accessed from your Local Area Network (LAN) while maintaining security by restricting access to private networks only.

## Security Features

### 🔒 **Default (Localhost Only)**
- Access restricted to `127.0.0.1` (localhost)
- Maximum security for server-only access
- Perfect for SSH-based administration

### 🌐 **LAN Access Mode**
- Access allowed from private IP ranges only:
  - `10.0.0.0/8` (10.x.x.x)
  - `172.16.0.0/12` (172.16.x.x - 172.31.x.x)
  - `192.168.0.0/16` (192.168.x.x)
  - `169.254.0.0/16` (link-local addresses)
- **No public internet access** - blocked by design
- IPv6 private ranges also supported

## How to Enable LAN Access

### Method 1: Using launch-webui.sh

```bash
# Start with LAN access
./launch-webui.sh --allow-lan

# Start with LAN access, no browser
./launch-webui.sh --allow-lan --no-open

# Check current status
./launch-webui.sh --status
```

### Method 2: Using start-robust.sh

```bash
# Start entire system with LAN access for web console
./start-robust.sh --webui-allow-lan

# Or combine with other options
./start-robust.sh --domain=123hostedtools --webui-allow-lan
```

### Method 3: Environment Variable

```bash
# Set environment variable
export WEBUI_ALLOW_LAN=true

# Start management server
node backend/management-server.js
```

### Method 4: Command Line Flag

```bash
# Start directly with flag
node backend/management-server.js --allow-lan
```

## Accessing from LAN

### 🔍 **Find Your Server IP**

```bash
# Get all network interfaces
ip addr show | grep "inet " | grep -v "127.0.0.1"

# Or use hostname command
hostname -I

# Example output:
# 192.168.1.60 (your LAN IP)
# 10.0.30.5 (VPN IP)
```

### 🌐 **Access URLs**

Once you have your server's IP address:

```
http://192.168.1.60:3099  # Replace with your server's IP
http://10.0.30.5:3099     # If using VPN
```

## Network Configuration

### 🛜 **Router/Firewall Settings**

**Port 3099 should be:**
- ✅ **Open** within your LAN
- ❌ **Closed** to the internet (port forwarding NOT recommended)

### 📱 **Device Access**

From any device on your LAN:
- **Laptop/Desktop**: Open browser, go to `http://SERVER_IP:3099`
- **Phone/Tablet**: Same URL in mobile browser
- **Other computers**: Access from anywhere on the network

## Verification

### ✅ **Test LAN Access**

```bash
# From another computer on your network
curl http://192.168.1.60:3099/api/dashboard

# Should return service status JSON
```

### ❌ **Verify Security**

```bash
# Try from public IP (should fail)
curl http://PUBLIC_IP:3099/api/dashboard

# Should return 403 Forbidden
```

## Current Server Configuration

Based on your server setup:

- **Server IP**: `192.168.1.60` (LAN)
- **VPN IP**: `10.0.30.5` (VPN network)
- **Public IP**: `67.149.139.23` (blocked for web console)

### 📍 **Access URLs for Your Network**

```
🖥️  Local access:     http://localhost:3099
🌐  LAN access:       http://192.168.1.60:3099
🔐  VPN access:       http://10.0.30.5:3099
❌  Public access:    BLOCKED (security)
```

## Use Cases

### 👨‍💻 **Remote Administration**
- Monitor webapp from laptop/phone while away from server
- Check service status from anywhere in the house
- Restart services without SSH access

### 👥 **Team Management**
- Multiple team members can access management console
- No need to share SSH credentials
- Everyone can monitor system health

### 📱 **Mobile Management**
- Use phone/tablet to check server status
- Restart services on the go
- View logs from mobile device

## Troubleshooting

### 🔍 **Connection Issues**

**Can't connect from LAN:**
```bash
# Check if server is running
netstat -tulpn | grep 3099

# Check firewall
sudo ufw status | grep 3099

# Test from server itself
curl http://localhost:3099/api/dashboard
```

**Server IP changed:**
```bash
# Get new IP
ip addr show | grep "inet " | grep -v "127.0.0.1"

# Update bookmarks/shortcuts
```

### 🔒 **Security Verification**

**Ensure public access is blocked:**
```bash
# This should fail (403 Forbidden)
curl http://67.149.139.23:3099/api/dashboard
```

**Check allowed IP ranges:**
```bash
# The management console logs show allowed IPs
tail -f webui.log
```

## Best Practices

### 🛡️ **Security**
- **Never** port forward port 3099 to the internet
- Use strong WiFi passwords on your network
- Regularly update the management console
- Monitor access logs for suspicious activity

### 🔧 **Usage**
- Bookmark the LAN URL for easy access
- Use mobile browser for quick checks
- Set up browser shortcuts on all devices
- Keep the management console URL private

### 📊 **Monitoring**
- Check server logs regularly
- Monitor who's accessing the console
- Set up alerts for unauthorized access attempts
- Use the console's built-in security features

## Advanced Configuration

### 🌐 **Custom IP Ranges**

If you need to allow specific IP ranges, you can modify the management server:

```javascript
// In backend/management-server.js
const customRanges = [
    /^10\./,           // Your custom range
    /^172\.20\./,      // Another custom range
];
```

### 🔐 **Additional Security**

Consider adding:
- Basic authentication
- HTTPS for LAN access
- IP whitelisting
- Rate limiting

## Summary

The Web Management Console now provides flexible access options:

- **🔒 Default**: Localhost only (maximum security)
- **🌐 LAN Mode**: Private network access (balanced security & convenience)
- **❌ Public**: Always blocked (security by design)

This gives you the convenience of remote management while maintaining strong security by preventing public internet access.

Perfect for home servers, office networks, and development environments where you need secure remote management capabilities!
