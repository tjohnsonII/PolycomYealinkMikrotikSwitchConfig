#!/usr/bin/env node

/**
 * VPN Server for Remote Connectivity
 * 
 * Priority: 2 (VPN Connectivity)
 * Purpose: Handles all VPN connections, diagnostics, and remote access
 * Port: 3001 (HTTPS)
 * 
 * This server manages VPN connections, network diagnostics, and provides
 * connectivity services for remote PBX access and troubleshooting.
 */

import https from 'https';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { Server } from 'socket.io';
import { createServer } from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execAsync = promisify(exec);

const app = express();
const PORT = 3001;

// SSL certificate paths
const SSL_PATHS = {
  key: path.resolve(__dirname, '../ssl/123hostedtools_private_key.txt'),
  cert: path.resolve(__dirname, '../ssl/123hostedtools_com.crt'),
  ca: path.resolve(__dirname, '../ssl/123hostedtools_com.ca-bundle')
};

console.log('🌐 VPN Server Starting...');
console.log(`📡 Port: ${PORT}`);
console.log(`🔗 Purpose: VPN connectivity and network diagnostics`);

// Load SSL certificates
const sslOptions = {
  key: fs.readFileSync(SSL_PATHS.key),
  cert: fs.readFileSync(SSL_PATHS.cert)
};

if (fs.existsSync(SSL_PATHS.ca)) {
  sslOptions.ca = fs.readFileSync(SSL_PATHS.ca);
  console.log('✅ SSL certificates loaded');
}

// Create HTTPS server
const server = createServer(sslOptions, app);
const io = new Server(server, {
  cors: {
    origin: ["https://123hostedtools.com", "https://localhost:8443", "http://localhost:3000"],
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// VPN configuration
const VPN_CONFIG = {
  configPath: path.join(__dirname, 'tjohnson-work.ovpn'),
  credentialsPath: path.join(__dirname, 'vpn-credentials.txt'),
  statusFile: '/tmp/vpn-status.json'
};

// Active VPN connections
let vpnConnections = {};

//=============================================================================
// VPN Management Functions
//=============================================================================

const getVPNStatus = async () => {
  try {
    const result = await execAsync('openvpn3 sessions-list --json');
    const sessions = JSON.parse(result.stdout || '[]');
    
    return {
      connected: sessions.length > 0,
      sessions: sessions.map(session => ({
        path: session.config_name,
        status: session.status,
        created: session.created,
        device: session.device_name
      })),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('VPN status check failed:', error);
    return {
      connected: false,
      sessions: [],
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

const connectVPN = async (configName = 'work', credentials = null) => {
  try {
    console.log(`🔄 Connecting to VPN: ${configName}`);
    
    // Check if already connected
    const status = await getVPNStatus();
    if (status.connected) {
      return { success: true, message: 'Already connected', status };
    }
    
    // Import config if not already imported
    try {
      await execAsync(`openvpn3 config-import --config ${VPN_CONFIG.configPath} --name ${configName}`);
      console.log('✅ VPN config imported');
    } catch (error) {
      // Config might already exist, continue
      console.log('VPN config already exists, continuing...');
    }
    
    // Start session
    let connectCommand = `openvpn3 session-start --config ${configName}`;
    
    if (credentials && credentials.username && credentials.password) {
      // Create temporary credentials file
      const tempCreds = `/tmp/vpn-creds-${Date.now()}.txt`;
      fs.writeFileSync(tempCreds, `${credentials.username}\n${credentials.password}`);
      connectCommand += ` --auth-file ${tempCreds}`;
      
      // Clean up credentials file after use
      setTimeout(() => {
        fs.unlinkSync(tempCreds);
      }, 5000);
    }
    
    const result = await execAsync(connectCommand);
    
    // Wait for connection to establish
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const newStatus = await getVPNStatus();
    
    return {
      success: true,
      message: 'VPN connection initiated',
      status: newStatus,
      output: result.stdout
    };
  } catch (error) {
    console.error('VPN connection failed:', error);
    return {
      success: false,
      error: error.message,
      stderr: error.stderr
    };
  }
};

const disconnectVPN = async (configName = 'work') => {
  try {
    console.log(`🔄 Disconnecting VPN: ${configName}`);
    
    const result = await execAsync(`openvpn3 session-manage --config ${configName} --disconnect`);
    
    return {
      success: true,
      message: 'VPN disconnected',
      output: result.stdout
    };
  } catch (error) {
    console.error('VPN disconnection failed:', error);
    return {
      success: false,
      error: error.message,
      stderr: error.stderr
    };
  }
};

//=============================================================================
// Network Diagnostics
//=============================================================================

const performNetworkDiagnostic = async (type, target) => {
  try {
    let command;
    let timeout = 30000; // 30 seconds default
    
    switch (type) {
      case 'ping':
        command = `ping -c 4 ${target}`;
        timeout = 10000;
        break;
      case 'traceroute':
        command = `traceroute -m 15 ${target}`;
        timeout = 60000;
        break;
      case 'nslookup':
        command = `nslookup ${target}`;
        timeout = 10000;
        break;
      case 'telnet':
        const [host, port] = target.split(':');
        command = `timeout 5 telnet ${host} ${port || 80}`;
        timeout = 10000;
        break;
      case 'nc':
        const [ncHost, ncPort] = target.split(':');
        command = `nc -zv ${ncHost} ${ncPort || 80}`;
        timeout = 10000;
        break;
      default:
        throw new Error(`Unknown diagnostic type: ${type}`);
    }
    
    const result = await execAsync(command, { timeout });
    
    return {
      success: true,
      type,
      target,
      output: result.stdout,
      error: result.stderr,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      type,
      target,
      error: error.message,
      output: error.stdout || '',
      stderr: error.stderr || '',
      timestamp: new Date().toISOString()
    };
  }
};

//=============================================================================
// API Endpoints
//=============================================================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'VPN Server',
    version: '1.0.0',
    priority: 2,
    timestamp: new Date().toISOString(),
    features: ['VPN management', 'Network diagnostics', 'Remote connectivity']
  });
});

// VPN Status
app.get('/vpn/status', async (req, res) => {
  try {
    const status = await getVPNStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// VPN Connect
app.post('/vpn/connect', async (req, res) => {
  try {
    const { name = 'work', username, password, otp } = req.body;
    
    const credentials = username && password ? { username, password, otp } : null;
    const result = await connectVPN(name, credentials);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// VPN Disconnect
app.post('/vpn/disconnect', async (req, res) => {
  try {
    const { name = 'work' } = req.body;
    const result = await disconnectVPN(name);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Network Diagnostics
app.post('/api/diagnostics/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { target } = req.body;
    
    if (!target) {
      return res.status(400).json({ error: 'Target parameter is required' });
    }
    
    const result = await performNetworkDiagnostic(type, target);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// System information
app.get('/system/info', async (req, res) => {
  try {
    const [uptime, memory, disk, network] = await Promise.all([
      execAsync('uptime'),
      execAsync('free -h'),
      execAsync('df -h'),
      execAsync('ip addr show')
    ]);
    
    res.json({
      uptime: uptime.stdout.trim(),
      memory: memory.stdout.trim(),
      disk: disk.stdout.trim(),
      network: network.stdout.trim(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// VPN logs
app.get('/vpn/logs', async (req, res) => {
  try {
    const result = await execAsync('openvpn3 log --config work --json');
    const logs = JSON.parse(result.stdout || '[]');
    
    res.json({
      logs: logs.slice(-100), // Last 100 log entries
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      logs: [],
      timestamp: new Date().toISOString()
    });
  }
});

//=============================================================================
// WebSocket for Real-time Updates
//=============================================================================

io.on('connection', (socket) => {
  console.log('VPN client connected');
  
  // Send initial VPN status
  getVPNStatus().then(status => {
    socket.emit('vpn-status', status);
  });
  
  // Handle diagnostic requests
  socket.on('run-diagnostic', async (data) => {
    const { type, target, id } = data;
    
    try {
      const result = await performNetworkDiagnostic(type, target);
      socket.emit('diagnostic-result', { id, result });
    } catch (error) {
      socket.emit('diagnostic-result', { 
        id, 
        result: { success: false, error: error.message } 
      });
    }
  });
  
  // Periodic status updates
  const statusInterval = setInterval(async () => {
    const status = await getVPNStatus();
    socket.emit('vpn-status', status);
  }, 10000); // Every 10 seconds
  
  socket.on('disconnect', () => {
    console.log('VPN client disconnected');
    clearInterval(statusInterval);
  });
});

//=============================================================================
// Start Server
//=============================================================================

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ VPN server running on https://0.0.0.0:${PORT}`);
  console.log(`🌐 Features:`);
  console.log(`   • VPN connection management`);
  console.log(`   • Network diagnostics (ping, traceroute, nslookup)`);
  console.log(`   • Real-time status updates`);
  console.log(`   • Remote connectivity testing`);
  console.log(`   • System information`);
  console.log(`🔒 SSL: 123hostedtools.com certificates`);
  console.log(`📊 Priority: 2 (VPN Connectivity)`);
  console.log('');
});

// Graceful shutdown
const shutdown = () => {
  console.log('🛑 VPN server shutting down...');
  server.close();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('SIGUSR2', shutdown);

// Error handling
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
  process.exit(1);
});

console.log('🎉 VPN Server Ready!');
console.log(`🌐 Access: https://localhost:${PORT}`);
console.log(`🔗 Purpose: VPN connectivity and diagnostics`);
console.log('');
