# Polycom/Yealink Phone Configuration Generator

## Quick Start

```bash
# Start all services (frontend, backend, auth)
./start-app.sh
```

This will start:
- **Frontend**: http://localhost:3000 (Phone configuration interface)
- **Backend**: http://localhost:3001 (SSH WebSocket + VPN diagnostics)  
- **Auth**: http://localhost:3002 (User authentication API)

## Default Admin Credentials

- **Username**: admin
- **Password**: SecureAdmin123! (or check .env file)

## VPN Integration

The app includes VPN diagnostics for connecting to work networks:
- **Work VPN**: tjohnson@terminal.123.net 
- **Home VPN**: 67.149.139.23:1194
- VPN config auto-loaded on startup if available

## Key Features

- 📱 **Phone Config Generation**: Polycom & Yealink phone provisioning
- 🔐 **User Authentication**: Secure login and admin user management
- 🔧 **VPN Diagnostics**: Connect to work networks for PBX access
- 🌐 **SSH Terminal**: Remote server management through web interface
- 📊 **Network Testing**: Ping, connectivity, and PBX diagnostics

## Admin Users

Pre-configured admin accounts:
- tjohnson@123.net
- chyatt@123.net  
- dgoldman@123.net
- amenko@123.net
- npomaville@123.net

## Troubleshooting

- Check logs: `backend/ssh-ws-server.log` and `startup.log`
- Kill stuck processes: `pkill -f "node.*3000|auth-server|ssh-ws-server"`
- Reset VPN: Upload new config via Diagnostics page

## Archived Scripts

Old startup scripts moved to `archive/` directory to reduce confusion.
