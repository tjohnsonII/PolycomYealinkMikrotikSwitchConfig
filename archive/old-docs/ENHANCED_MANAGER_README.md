# Enhanced Robust Production Manager

## 📱 Interactive Management Console for Phone Config Generator

This enhanced system provides a comprehensive management interface for the Polycom/Yealink Phone Configuration Generator webapp with real-time monitoring, troubleshooting, and service management.

## 🚀 Quick Start

### Launch the Enhanced Manager
```bash
./launch-manager.sh
```

### Or run directly
```bash
./start-robust-menu.sh
```

## ✨ Features

### 📊 **Real-Time Monitoring**
- Live service status display
- Health check monitoring
- Port usage tracking
- Process information

### ⚙️ **Service Management**
- Start/Stop/Restart all services
- Individual service control
- Background operation
- Automatic recovery

### 🔧 **Troubleshooting Tools**
- Port conflict detection
- SSL certificate validation
- Dependency verification
- Network connectivity tests
- Common issue resolution

### 📁 **Project Overview**
- Complete file system mapping
- Component organization
- File status and sizes
- Missing file detection

### 📋 **Interactive Menu System**
```
═══════════════════════════════════════════════════════════════════════════
                              MAIN MENU                                   
═══════════════════════════════════════════════════════════════════════════

📊 MONITORING & STATUS
   1. Show Service Status
   2. Run Health Checks
   3. View Service Logs

⚙️  SERVICE MANAGEMENT
   4. Start All Services
   5. Stop All Services
   6. Restart All Services

📁 PROJECT OVERVIEW
   7. Show Project Files
   8. Build Application

🔧 TROUBLESHOOTING
   9. Troubleshooting Tools
   10. View URLs & Access Info

🚪 EXIT
   0. Exit (Keep Services Running)
   00. Exit and Stop All Services
```

## 🛠 How It Works

### **Background Services**
The system automatically starts and manages these services:
- **SSH WebSocket Server** (port 3001) - VPN/SSH functionality
- **Authentication Server** (port 3002) - User management
- **HTTPS Proxy Server** (port 8443) - Frontend + API routing

### **Interactive Console**
While services run in the background, you get an interactive menu to:
- Monitor service health in real-time
- View logs and troubleshoot issues
- Access project files and documentation
- Manage services without downtime

### **Service Status Display**
```
Current Services Status:
   Proxy (8443): ✅ HEALTHY | Auth (3002): ✅ HEALTHY | SSH-WS (3001): ✅ HEALTHY
```

## 📋 Menu Options Explained

### 1. **Show Service Status**
- Real-time service health
- Port usage information
- Network port listings
- Process details

### 2. **Run Health Checks**
- Tests all health endpoints
- JSON response validation
- Connection testing
- Response time monitoring

### 3. **View Service Logs**
- Startup logs
- Individual service logs
- Error tracking
- Recent activity

### 4-6. **Service Management**
- Start/Stop/Restart services
- Background operation
- Process management
- Port cleanup

### 7. **Show Project Files**
Organized file listing:
- **Frontend Core**: App.tsx, main.tsx, index.html
- **Backend Services**: auth-server.js, ssh-ws-server.js, proxy
- **Configuration**: vite.config.ts, package.json
- **Templates**: Mikrotik, Switch configurations
- **Components**: React components
- **Security**: SSL certificates, security files

### 8. **Build Application**
- Runs `npm run build`
- Creates production dist/
- Validates build success

### 9. **Troubleshooting Tools**
- **Port Conflicts**: Detect and resolve
- **SSL Certificate**: Validation and testing
- **Dependencies**: Node.js, npm, packages
- **File Permissions**: Check and fix
- **Network Tests**: Connectivity validation
- **Process Info**: Memory, CPU usage
- **Fix Common Issues**: Automated repairs

### 10. **URLs & Access Info**
- Web access URLs
- Health check endpoints
- Authentication credentials
- Diagnostic page links

## 🔒 Security Features

- SSL certificate validation
- Authentication system integration
- Secure file permissions
- Process isolation
- Network security checks

## 🌐 Access Information

### **Web Access**
- **External**: https://123hostedtools.com:8443
- **Local**: https://localhost:8443
- **LAN**: https://[YOUR-IP]:8443

### **Health Endpoints**
- **Proxy**: https://localhost:8443/proxy-health
- **Auth**: https://localhost:8443/api/auth/health
- **SSH-WS**: https://localhost:8443/api/health

### **Authentication**
- **Admin**: admin / 123NetAdmin2024!
- **User**: tjohnson / Joshua3412@

## 📝 Usage Examples

### Start and Monitor
```bash
# Launch the manager
./launch-manager.sh

# Services auto-start in background
# Interactive menu appears
# Choose option 1 to see status
```

### Troubleshoot Issues
```bash
# In the menu, choose option 9
# Select troubleshooting tool
# Follow guided diagnostics
```

### Exit Safely
```bash
# Option 0: Exit menu, keep services running
# Option 00: Exit and stop all services
```

## 🔄 Background Operation

The enhanced system is designed to:
- **Start services automatically** when launched
- **Keep services running** when you exit the menu
- **Allow re-entry** to the management console anytime
- **Provide continuous monitoring** and recovery
- **Handle interruptions gracefully**

## 📊 Real-Time Features

- **Live Status Updates**: Service health updates in real-time
- **Color-coded Output**: Green (healthy), Yellow (warning), Red (error)
- **Progress Indicators**: Visual feedback for operations
- **Timestamp Logging**: All activities are timestamped
- **Resource Monitoring**: CPU, memory, disk usage

## 🛡️ Error Handling

- **Graceful Degradation**: Services continue if management console exits
- **Automatic Recovery**: Failed services are restarted
- **Conflict Resolution**: Port conflicts are detected and resolved
- **Dependency Checking**: Missing files and packages are identified
- **Network Resilience**: Connection failures are handled gracefully

This enhanced system transforms the simple startup script into a full production management console while maintaining the robust, reliable service operation you need for your phone configuration generator webapp.
