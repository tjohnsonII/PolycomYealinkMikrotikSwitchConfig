# Management Console Testing & Verification Guide

## 🎯 Overview

This document provides a comprehensive testing approach for the web management console and its ability to control the main webapp.

## 🚀 Starting the Management Console

### Method 1: Using the Management-First Startup Script

```bash
# Start management console only (recommended)
./start-management-first.sh

# Start with LAN access enabled
./start-management-first.sh --allow-lan

# Start with verbose output
./start-management-first.sh --verbose
```

### Method 2: Manual Service Start

```bash
# Start backend services manually
cd backend
nohup node ssh-ws-server.js > ssh-ws-server.log 2>&1 &
nohup node auth-server.js > auth-server.log 2>&1 &
nohup node management-server.js --allow-lan > management-server.log 2>&1 &
```

### Method 3: Using the Test Script

```bash
# Run the comprehensive test
./test-management-console.sh
```

## 🔍 Verification Steps

### 1. Service Status Check

**Expected Services:**

- Management Console: `http://localhost:3099` (port 3099)
- SSH WebSocket Server: `http://localhost:3001` (port 3001)
- Authentication Server: `http://localhost:3002` (port 3002)

**Check Commands:**

```bash
# Check listening ports
netstat -tlnp | grep -E "(3001|3002|3099)"

# Check service health
curl -s http://localhost:3099/api/health
curl -s http://localhost:3001/health
curl -s http://localhost:3002/health
```

### 2. Management Console Access

**URLs to Test:**

- Main Dashboard: `http://localhost:3099`
- VPN Management: `http://localhost:3099/vpn-management.html`
- Test Page: `http://localhost:3099/management-console-test.html`

**LAN Access (if enabled):**

- Main Dashboard: `http://192.168.1.60:3099`
- VPN Management: `http://192.168.1.60:3099/vpn-management.html`

### 3. Webapp Control Testing

#### API Endpoints to Test

```bash
# Service status
curl -s http://localhost:3099/api/services/status

# Dashboard data
curl -s http://localhost:3099/api/dashboard

# Build webapp
curl -s -X POST http://localhost:3099/api/webapp/build

# Start webapp
curl -s -X POST http://localhost:3099/api/services/webapp/start

# Stop webapp
curl -s -X POST http://localhost:3099/api/services/webapp/stop

# Restart webapp
curl -s -X POST http://localhost:3099/api/services/webapp/restart
```

#### Web Interface Testing

1. Open `http://localhost:3099`
2. Navigate to "Services" section
3. Test webapp controls:
   - **Build** button - Should trigger `npm run build`
   - **Start** button - Should start the webapp on port 8443
   - **Stop** button - Should stop the webapp process
   - **Restart** button - Should stop and start the webapp

### 4. VPN Management Testing

#### SAML VPN Functionality

1. Open `http://localhost:3099/vpn-management.html`
2. Click "Connect Work VPN (SAML)" button
3. Should trigger OpenVPN3 SAML authentication
4. Browser should open automatically for login

#### API Testing

```bash
# VPN status
curl -s http://localhost:3099/api/vpn/status

# SAML connect (test endpoint availability)
curl -s -X POST http://localhost:3099/api/vpn/saml-connect \
  -H "Content-Type: application/json" \
  -d '{"name": "work"}'
```

### 5. Main Webapp Testing

#### Expected Behavior

- **Before Starting:** No webapp running on ports 5173, 8443, or 443
- **After Starting:** Webapp accessible on configured port
- **SAML VPN Button:** Available in webapp's diagnostic page

#### Test URLs

- Development: `http://localhost:5173`
- Production: `https://localhost:8443`
- Public: `https://123hostedtools.com`

## 🧪 Automated Testing

### Test Script Usage

```bash
# Run comprehensive test
./test-management-console.sh

# Check specific service
curl -s http://localhost:3099/api/health | jq .
```

### Browser Testing

1. Open `http://localhost:3099/management-console-test.html`
2. Click "Check Service Status" button
3. Test webapp control buttons
4. Test VPN management buttons

## 📋 Expected Results

### ✅ Successful Test Results

- All three services (3099, 3001, 3002) are listening
- Management console dashboard loads successfully
- API endpoints return valid JSON responses
- Webapp control buttons trigger appropriate actions
- VPN management interface is accessible
- SAML VPN button works in both interfaces

### ❌ Common Issues

- **Services not starting:** Check Node.js installation and dependencies
- **Port conflicts:** Kill existing processes or use different ports
- **Permission errors:** Ensure proper file permissions
- **Network issues:** Check firewall and network configuration

## 🔧 Troubleshooting

### Service Issues

```bash
# Check service logs
tail -f backend/management-server.log
tail -f backend/ssh-ws-server.log
tail -f backend/auth-server.log

# Check processes
ps aux | grep node

# Kill all Node.js processes
pkill -f "node"
```

### Port Issues

```bash
# Check what's using a port
lsof -i :3099
lsof -i :3001
lsof -i :3002

# Kill process on specific port
kill $(lsof -t -i:3099)
```

## 🎉 Success Criteria

The management console is working correctly if:

1. **✅ Services Running:**
   - Management Console (3099) ✅
   - SSH WebSocket Server (3001) ✅
   - Authentication Server (3002) ✅

2. **✅ Web Interface:**
   - Dashboard accessible ✅
   - Service controls functional ✅
   - Real-time monitoring working ✅

3. **✅ Webapp Control:**
   - Build command executes ✅
   - Start/Stop/Restart commands work ✅
   - Status monitoring accurate ✅

4. **✅ VPN Management:**
   - SAML VPN button functional ✅
   - OpenVPN3 integration working ✅
   - Browser authentication flow ✅

5. **✅ Integration:**
   - Main webapp has SAML button ✅
   - Management console controls webapp ✅
   - All endpoints accessible ✅

## 📱 Quick Test Checklist

- [ ] Run `./start-management-first.sh`
- [ ] Open `http://localhost:3099`
- [ ] Test webapp Start/Stop buttons
- [ ] Open VPN management page
- [ ] Test SAML VPN button
- [ ] Verify main webapp has SAML button
- [ ] Check all services are healthy

## 🌐 Network Access

### Local Access

- `http://localhost:3099` (always available)

### LAN Access

- `http://192.168.1.60:3099` (when --allow-lan is used)
- Configure firewall if needed
- Ensure private network access is enabled

---

**Note:** This testing guide assumes the management console system is properly configured and all dependencies are installed. The management console provides full control over the webapp lifecycle and integrates seamlessly with the VPN management system.
