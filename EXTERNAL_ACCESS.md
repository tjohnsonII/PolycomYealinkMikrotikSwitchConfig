# External Access Setup - WORKING! 🎉

## Quick Start for External Users

The application now supports full external access through a reverse proxy solution!

### 1. Start Production Server
```bash
# Build and start all services with reverse proxy
./start-production.sh
```

### 2. Router Configuration
Forward **only port 3000** from your external IP to the server:
- External: `your-router-ip:3000` → Internal: `server-ip:3000`

### 3. Access the Application
- **Local:** http://localhost:3000
- **LAN:** http://192.168.x.x:3000
- **External:** http://your-external-ip:3000

## How It Works

The reverse proxy (`backend/simple-proxy.js`) runs on port 3000 and handles:

- **Frontend:** Serves production React build
- **Auth APIs:** `/api/auth/*` → Authentication server (port 3002)
- **Admin APIs:** `/api/admin/*` → Authentication server (port 3002)
- **Other APIs:** `/api/*` → SSH WebSocket server (port 3001)
- **WebSockets:** `/ws/*` → SSH WebSocket server (port 3001)

## Manual Service Control

```bash
# Start individual services
npm run auth          # Authentication server (port 3002)
cd backend && node ssh-ws-server.js  # SSH WebSocket (port 3001)
npm run proxy         # Reverse proxy (port 3000)

# Development mode (Vite dev server)
./start-app.sh

# Production mode (optimized build)
./start-production.sh
```

## Default Credentials
- Username: `admin`
- Password: `admin123`

## Troubleshooting

1. **Port forwarding:** Only port 3000 needs to be forwarded
2. **Firewall:** Ensure port 3000 is open on the server
3. **Health check:** Test `http://your-ip:3000/proxy-health`
4. **Logs:** Check `backend/*.log` files for errors

## Features Working Externally ✅

- ✅ Login/Authentication
- ✅ Phone Configuration Generator
- ✅ VPN Diagnostics  
- ✅ SSH Terminal Access
- ✅ File Upload/Download
- ✅ All API endpoints
- ✅ WebSocket connections
- ✅ Real-time updates

External access is now fully functional! 🚀
