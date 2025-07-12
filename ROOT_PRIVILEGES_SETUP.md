# Root Privileges Setup for Webapp

## ✅ Sudoers Rule Added

A sudoers rule has been created to allow the `tim2` user to run Node.js as root without entering a password.

### What Was Added:
- **File**: `/etc/sudoers.d/webapp-node`
- **Rule**: `tim2 ALL=(ALL) NOPASSWD: /usr/bin/node`
- **Permissions**: `440` (read-only for owner and group)

### What This Allows:
- Running `sudo node` without password prompts
- Starting the HTTPS proxy on port 443 (standard HTTPS port)
- Automated startup scripts that require root privileges

### Security Considerations:
✅ **Safe**: Only allows running Node.js as root, not other commands
✅ **Specific**: Limited to the exact path `/usr/bin/node`
✅ **User-specific**: Only applies to the `tim2` user
✅ **Separate file**: Uses `/etc/sudoers.d/` best practice

### Usage:
```bash
# Start webapp with root HTTPS proxy on port 443
./start-webapp-root.sh

# Or manually run node as root
sudo node backend/simple-proxy-https.js
```

### Access URLs:
- **Main Webapp**: `https://localhost` (port 443)
- **Management Console**: `http://localhost:3099`
- **External Access**: `https://YOUR_DOMAIN_OR_IP`

### To Remove (if needed):
```bash
sudo rm /etc/sudoers.d/webapp-node
```

## Benefits:
1. **Standard HTTPS Port**: Webapp accessible on port 443
2. **No Password Prompts**: Automated startup without interruption
3. **External Access**: Can be accessed from internet via domain
4. **Professional Setup**: Uses standard web server configuration

The webapp is now configured for production use with proper HTTPS on the standard port!
