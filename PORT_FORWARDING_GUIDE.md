# Port Forwarding Guide for Production Deployment

## Summary
✅ **SSL certificates backed up to:** `/home/tim2/Desktop/ssl_backup_20250711_171650`

## Current Network Configuration
- **Server LAN IP:** 192.168.1.60
- **Gateway:** 192.168.1.1
- **Public IP:** 67.149.139.23
- **Domains:** 
  - timsablab.ddns.net → 67.149.139.23
  - 123hostedtools.com → 67.149.139.23

## Port Forwarding Requirements

### For Production (HTTPS)
**YOU ONLY NEED TO FORWARD ONE PORT:**

```
Port 443 (HTTPS) → 192.168.1.60:443
```

**Router Configuration:**
- External Port: 443
- Internal Port: 443  
- Internal IP: 192.168.1.60
- Protocol: TCP

### For Development/Testing (HTTP)
```
Port 3000 (HTTP) → 192.168.1.60:3000
```

## Why Only One Port?

The `start-robust.sh` script starts three services:
1. **SSH WebSocket Server** (port 3001) - Internal only
2. **Authentication Server** (port 3002) - Internal only  
3. **Reverse Proxy** (port 443 or 3000) - **THIS IS THE ONLY PUBLIC PORT**

The reverse proxy handles all external traffic and routes it internally:
- Static files → `dist/` folder
- `/api/auth/*` → Authentication server (port 3002)
- `/api/admin/*` → Authentication server (port 3002)  
- `/api/ssh/*` → SSH WebSocket server (port 3001)

## Testing Your Configuration

### 1. Test Internal Services
```bash
# Check all services are running
sudo ./start-robust.sh

# Test internal connectivity
curl http://localhost:3001/health     # SSH WebSocket
curl http://localhost:3002/api/health # Auth server
curl https://localhost:443/proxy-health # Proxy (if HTTPS)
```

### 2. Test External Access
```bash
# Test from another machine on your network
curl -k https://192.168.1.60:443/proxy-health

# Test from outside (after port forwarding)
curl -k https://123hostedtools.com/proxy-health
```

### 3. Common Issues and Solutions

#### Issue: "Connection refused" from external
- **Solution:** Forward port 443 in your router
- **Check:** `telnet 67.149.139.23 443` from external machine

#### Issue: "Certificate not trusted"
- **Solution:** Use proper SSL certificate (already configured)
- **Check:** Browser shows lock icon for https://123hostedtools.com

#### Issue: Health checks fail
- **Solution:** Check firewall, ensure services started properly
- **Check:** `sudo netstat -tlnp | grep -E ':(443|3001|3002)'`

## Router Configuration Steps

### Generic Router Steps:
1. Log into your router (usually https://192.168.1.1)
2. Navigate to "Port Forwarding" or "Virtual Server"
3. Add new rule:
   - Service Name: "Web Server HTTPS"
   - External Port: 443
   - Internal Port: 443
   - Internal IP: 192.168.1.60
   - Protocol: TCP
4. Save and apply changes

### Verification Commands:
```bash
# Check if port 443 is listening
sudo netstat -tlnp | grep :443

# Check if external port is open (from external machine)
nmap -p 443 67.149.139.23

# Test full connectivity
curl -k https://123hostedtools.com/
```

## Security Notes

- Only port 443 is exposed to the internet
- Internal services (3001, 3002) remain protected
- SSL encryption protects all external traffic
- Authentication required for admin functions

## Next Steps

1. **Configure port forwarding** in your router
2. **Test production startup:** `sudo ./start-robust.sh`
3. **Verify external access:** Visit https://123hostedtools.com
4. **Check SSL certificate:** Ensure no browser warnings
