# Port Forwarding Guide for 123hostedtools.com

## Current Service Architecture

### Primary Services (Running on 0.0.0.0 - All Interfaces)

| Port | Service | Description | External Access Required |
|------|---------|-------------|-------------------------|
| **443** | HTTPS Proxy | Main entry point - serves the web app via HTTPS | ✅ **REQUIRED** |
| 3000 | Vite Dev Server | Development server for the React app | ❌ Internal only |
| 3001 | SSH WebSocket Server | Backend API, VPN management, diagnostics | ❌ Internal only |
| 3002 | Auth Server | Authentication and user management | ❌ Internal only |
| 3099 | Management Console | Web-based admin interface | ❌ Internal only (LAN) |
| 8080 | Dev Server | Additional development server | ❌ Internal only |

### System Services (localhost only)

| Port | Service | Description | External Access Required |
|------|---------|-------------|-------------------------|
| 22 | SSH | System SSH access | ⚠️ Optional (admin access) |
| 53 | DNS | System DNS resolution | ❌ No |
| 631 | CUPS | Print server | ❌ No |
| 3350 | XRDP Session Manager | Remote desktop | ❌ No |
| 3389 | XRDP | Remote desktop protocol | ⚠️ Optional (admin access) |

## Required Port Forwarding

### Minimum Required (Production)
```
External Port 443 → Internal IP:443 (HTTPS Proxy)
```

### Optional Administrative Access
```
External Port 22 → Internal IP:22 (SSH)
External Port 3389 → Internal IP:3389 (RDP)
```

## Network Configuration
- **Server LAN IP:** 192.168.1.60
- **Gateway:** 192.168.1.1
- **Public IP:** 67.149.139.23
- **Domains:** 
  - timsablab.ddns.net → 67.149.139.23
  - 123hostedtools.com → 67.149.139.23

## How It Works

1. **Port 443 (HTTPS Proxy)** - This is the ONLY port that needs to be forwarded for public access
   - Serves the main web application over HTTPS
   - Uses 123hostedtools.com SSL certificates
   - Proxies API calls to internal services
   - Handles static file serving
   - Routes everything through a single secure entry point

2. **Internal Service Architecture**
   - Port 3000: Vite dev server (React app)
   - Port 3001: SSH WebSocket server (backend APIs)
   - Port 3002: Auth server (authentication)
   - Port 3099: Management console (LAN admin interface)

3. **Security Model**
   - Only port 443 is exposed to the internet
   - All other services are internal-only
   - HTTPS proxy handles all external requests
   - Management console accessible only on LAN

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

## Router Configuration

### Typical Router Setup
```
Port Forwarding Rules:
- External Port: 443
- Internal IP: 192.168.1.60 (or your server's IP)
- Internal Port: 443
- Protocol: TCP
```

### DNS Configuration (Namecheap)
**ISSUE IDENTIFIED:** You have conflicting DNS records that need to be fixed:

**Current problematic setup:**
- A Record: @ → 67.149.139.23 ✅ (correct)
- A Record: www → 67.149.139.23 ✅ (correct)  
- URL Redirect: @ → http://www.123hostedtools.com/ ❌ (REMOVE THIS)

**Required fix:**
1. **Remove the URL Redirect Record** for @ (root domain)
2. **Keep only the A records:**
   - A Record: @ → 67.149.139.23
   - A Record: www → 67.149.139.23

**Why this fixes the issue:**
- The URL redirect is causing DNS resolution conflicts
- It's redirecting HTTPS requests to HTTP, breaking SSL
- Only A records should point to your IP address

## Testing External Access

### From Outside Your Network
```bash
# Test HTTPS access
curl -I https://123hostedtools.com

# Test with specific port (if router uses different external port)
curl -I https://123hostedtools.com:8443
```

### From Inside Your Network
```bash
# Test local access
curl -k -I https://192.168.1.60:443
curl -k -I https://localhost:443
```

## Current Status

✅ **HTTPS Proxy (443)** - Running and serving content  
✅ **SSL Certificates** - 123hostedtools.com certs installed  
✅ **Internal Services** - All backend services running  
✅ **LAN Management** - Management console accessible at http://192.168.1.60:3099  
✅ **Port Forwarding** - Direct IP access works: https://67.149.139.23:443/  
✅ **DNS Fixed** - Domain access works: https://123hostedtools.com/  
✅ **External Access** - Both https://123hostedtools.com and https://www.123hostedtools.com working  

## Firewall Considerations

### Ubuntu UFW (if enabled)
```bash
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp  # Optional for SSH
sudo ufw allow 3389/tcp  # Optional for RDP
```

### Router Firewall
- Ensure port 443 is open for inbound connections
- Consider blocking all other ports from external access

## Troubleshooting

### If External Access Fails
1. **DNS Issue (URGENT):** Remove the URL Redirect Record for @ in Namecheap
2. Check router port forwarding is configured
3. Verify external IP with `curl ifconfig.me`
4. Test internal access first: `curl -k -I https://localhost:443`
5. Check DNS resolution: `nslookup 123hostedtools.com`
6. Verify SSL certificate: `openssl s_client -connect 123hostedtools.com:443`

### DNS Troubleshooting Steps
```bash
# Test direct IP access (should work)
curl -k -I https://67.149.139.23:443/

# Test domain after DNS fix (should work after removing redirect)
curl -k -I https://123hostedtools.com/

# Check DNS propagation
nslookup 123hostedtools.com
```

### Check Service Status
```bash
# Check all services
netstat -tlnp | grep -E "(443|3000|3001|3002|3099)"

# Check HTTPS proxy logs
sudo journalctl -f -u simple-proxy-https-robust
```

## Security Notes

- Only port 443 should be forwarded for public access
- Management console (3099) should remain LAN-only
- Consider using VPN for administrative access instead of exposing SSH/RDP
- Regular security updates and monitoring recommended

## Next Steps

1. **Configure port forwarding** in your router
2. **Test production startup:** `sudo ./start-robust.sh`
3. **Verify external access:** Visit https://123hostedtools.com
4. **Check SSL certificate:** Ensure no browser warnings

## URGENT DNS Fix Required ✅ COMPLETED

**Problem:** Your Namecheap DNS had conflicting records causing connection failures.

**Solution:** ✅ **FIXED** - URL Redirect Record has been removed from Namecheap

**Current Status:**
- ✅ https://123hostedtools.com → Working perfectly
- ✅ https://www.123hostedtools.com → Working perfectly  
- ✅ SSL certificates → Valid and trusted
- ✅ All API endpoints → Accessible and functioning

**DNS propagation:** Some DNS servers may still cache the old records for a few hours, but the fix is working.
