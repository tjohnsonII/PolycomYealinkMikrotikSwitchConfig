// Enhanced SSH WebSocket server with network diagnostics and OpenVPN management (ESM version)
// Run: node backend/ssh-ws-server.js

import { WebSocketServer } from 'ws';
import { Client } from 'ssh2';
import express from 'express';
import cors from 'cors';
import net from 'net';
import http from 'http';
import { exec, spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// ES modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create HTTP server for REST endpoints
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit for .ovpn files

// Store active VPN processes and status
const vpnState = {
  process: null,
  status: 'disconnected', // 'disconnected', 'connecting', 'connected', 'error'
  configPath: null,
  logs: [],
  interface: null,
  ip: null
};

// Add log to VPN state
function addVpnLog(message) {
  const timestamp = new Date().toLocaleTimeString();
  const logEntry = `[${timestamp}] ${message}`;
  vpnState.logs.push(logEntry);
  // Keep only last 100 log entries
  if (vpnState.logs.length > 100) {
    vpnState.logs = vpnState.logs.slice(-100);
  }
  console.log(logEntry);
}

// Network connectivity test endpoint
app.post('/ping', async (req, res) => {
  const { host, port } = req.body;
  
  if (!host || !port) {
    return res.status(400).json({ 
      reachable: false, 
      error: 'Host and port are required' 
    });
  }

  try {
    const isReachable = await testTcpConnection(host, port, 5000);
    
    if (isReachable) {
      res.json({
        reachable: true,
        details: `TCP connection successful to ${host}:${port}`
      });
    } else {
      res.json({
        reachable: false,
        error: `Cannot connect to ${host}:${port}`,
        details: 'Connection timeout or port closed'
      });
    }
  } catch (error) {
    res.json({
      reachable: false,
      error: error.message
    });
  }
});

// TCP connection test function
function testTcpConnection(host, port, timeout = 5000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    
    const timer = setTimeout(() => {
      socket.destroy();
      resolve(false);
    }, timeout);
    
    socket.on('connect', () => {
      clearTimeout(timer);
      socket.destroy();
      resolve(true);
    });
    
    socket.on('error', () => {
      clearTimeout(timer);
      resolve(false);
    });
    
    socket.connect(port, host);
  });
}

// Create HTTP server
const server = http.createServer(app);

// WebSocket server for SSH connections (attached to HTTP server)
const wss = new WebSocketServer({ server, path: '/ssh' });

wss.on('connection', function connection(ws) {
  let sshClient = new Client();
  let shellStream = null;

  ws.send('Welcome to the PBX SSH Terminal!\r\n');

  ws.on('message', function incoming(message) {
    // On first message, expect JSON with SSH credentials
    if (!sshClient._ready) {
      try {
        const { host, username, password } = JSON.parse(message);
        sshClient.on('ready', () => {
          sshClient.shell((err, stream) => {
            if (err) {
              ws.send(`Shell error: ${err.message}\r\n`);
              ws.close();
              return;
            }
            shellStream = stream;
            stream.on('data', (data) => ws.send(data.toString()));
            stream.on('close', () => ws.close());
          });
        }).on('error', err => {
          ws.send(`SSH error: ${err.message}\r\n`);
          ws.close();
        }).connect({ host, username, password });
        sshClient._ready = true;
      } catch (e) {
        ws.send('Invalid credentials format.\r\n');
        ws.close();
      }
      return;
    }
    // Forward terminal input to SSH
    if (shellStream) shellStream.write(message);
  });

  ws.on('close', () => {
    if (sshClient) sshClient.end();
  });
});

// VPN Status endpoint
app.get('/vpn/status', (req, res) => {
  res.json({
    status: vpnState.status,
    interface: vpnState.interface,
    ip: vpnState.ip,
    logs: vpnState.logs.slice(-20), // Return last 20 logs
    hasConfig: !!vpnState.configPath
  });
});

// Upload and save OpenVPN config
app.post('/vpn/upload-config', async (req, res) => {
  try {
    const { filename, content } = req.body;
    
    if (!filename || !content) {
      return res.status(400).json({ error: 'Filename and content are required' });
    }

    // Save config file to backend directory
    const configPath = path.join(__dirname, 'work-vpn.ovpn');
    await fs.writeFile(configPath, content);
    
    vpnState.configPath = configPath;
    addVpnLog(`📁 Config file uploaded: ${filename}`);
    
    res.json({ success: true, message: 'Config file uploaded successfully' });
  } catch (error) {
    addVpnLog(`❌ Config upload failed: ${error.message}`);
    res.status(500).json({ error: 'Failed to save config file' });
  }
});

// Connect to VPN
app.post('/vpn/connect', async (req, res) => {
  try {
    if (vpnState.status === 'connected') {
      return res.status(400).json({ error: 'VPN already connected' });
    }

    if (vpnState.status === 'connecting') {
      return res.status(400).json({ error: 'VPN connection in progress' });
    }

    if (!vpnState.configPath) {
      return res.status(400).json({ error: 'No VPN config file uploaded' });
    }

    vpnState.status = 'connecting';
    vpnState.logs = [];
    addVpnLog('🔄 Initiating VPN connection...');

    // Check if OpenVPN is available
    try {
      await new Promise((resolve, reject) => {
        exec('which openvpn', (error, stdout) => {
          if (error) reject(new Error('OpenVPN not installed'));
          else resolve(stdout);
        });
      });
    } catch (error) {
      vpnState.status = 'error';
      addVpnLog('❌ OpenVPN not found. Please install: sudo apt install openvpn');
      return res.status(500).json({ error: 'OpenVPN not installed' });
    }

    addVpnLog('📡 Connecting to VPN server...');

    // Start OpenVPN process
    vpnState.process = spawn('sudo', ['openvpn', '--config', vpnState.configPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Handle stdout
    vpnState.process.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('OpenVPN stdout:', output);
      
      // Parse OpenVPN output for status updates
      if (output.includes('Initialization Sequence Completed')) {
        vpnState.status = 'connected';
        addVpnLog('✅ VPN connection established successfully!');
        
        // Get VPN interface and IP
        setTimeout(async () => {
          try {
            await updateVpnNetworkInfo();
          } catch (error) {
            addVpnLog(`⚠️ Could not get VPN network info: ${error.message}`);
          }
        }, 2000);
      } else if (output.includes('AUTH: Received control message: AUTH_FAILED')) {
        vpnState.status = 'error';
        addVpnLog('❌ Authentication failed - check credentials');
      } else if (output.includes('TLS Error')) {
        vpnState.status = 'error';
        addVpnLog('❌ TLS connection failed');
      } else if (output.includes('Connecting to')) {
        addVpnLog('🔐 Authenticating credentials...');
      } else if (output.includes('TLS: Initial packet')) {
        addVpnLog('🛡️ Establishing secure tunnel...');
      }
    });

    // Handle stderr
    vpnState.process.stderr.on('data', (data) => {
      const error = data.toString();
      console.error('OpenVPN stderr:', error);
      
      if (error.includes('permission denied') || error.includes('sudo')) {
        addVpnLog('❌ Permission denied - OpenVPN requires sudo privileges');
        vpnState.status = 'error';
      } else if (!error.includes('WARNING')) {
        addVpnLog(`⚠️ ${error.trim()}`);
      }
    });

    // Handle process exit
    vpnState.process.on('exit', (code) => {
      if (vpnState.status === 'connected') {
        addVpnLog('🔌 VPN connection terminated');
      } else {
        addVpnLog(`❌ VPN process exited with code ${code}`);
      }
      vpnState.status = 'disconnected';
      vpnState.process = null;
      vpnState.interface = null;
      vpnState.ip = null;
    });

    // Handle process errors
    vpnState.process.on('error', (error) => {
      addVpnLog(`❌ VPN process error: ${error.message}`);
      vpnState.status = 'error';
      vpnState.process = null;
    });

    res.json({ success: true, message: 'VPN connection initiated' });

  } catch (error) {
    vpnState.status = 'error';
    addVpnLog(`❌ VPN connection failed: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Disconnect VPN
app.post('/vpn/disconnect', (req, res) => {
  try {
    if (vpnState.process) {
      vpnState.process.kill('SIGTERM');
      addVpnLog('🔌 Disconnecting VPN...');
    } else {
      addVpnLog('🔌 VPN already disconnected');
    }
    
    vpnState.status = 'disconnected';
    vpnState.process = null;
    vpnState.interface = null;
    vpnState.ip = null;
    
    res.json({ success: true, message: 'VPN disconnected' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update VPN network information
async function updateVpnNetworkInfo() {
  return new Promise((resolve, reject) => {
    exec('ip route show | grep tun', (error, stdout) => {
      if (error) {
        reject(error);
        return;
      }
      
      const lines = stdout.split('\n');
      for (const line of lines) {
        if (line.includes('tun')) {
          const match = line.match(/dev\s+(tun\d+)/);
          if (match) {
            vpnState.interface = match[1];
            
            // Get IP address for the tun interface
            exec(`ip addr show ${vpnState.interface}`, (error, stdout) => {
              if (!error) {
                const ipMatch = stdout.match(/inet\s+([0-9.]+)/);
                if (ipMatch) {
                  vpnState.ip = ipMatch[1];
                  addVpnLog(`🌐 VPN IP: ${vpnState.ip} (${vpnState.interface})`);
                }
              }
              resolve();
            });
            return;
          }
        }
      }
      reject(new Error('No VPN interface found'));
    });
  });
}

// Start the combined HTTP/WebSocket server
server.listen(3001, () => {
  console.log('SSH WebSocket server with diagnostics running on http://localhost:3001');
  console.log('Available endpoints:');
  console.log('  POST /ping - Network connectivity test');
  console.log('  WS /ssh - SSH terminal connection');
  console.log('  GET /vpn/status - VPN status');
  console.log('  POST /vpn/upload-config - Upload VPN config');
  console.log('  POST /vpn/connect - Connect to VPN');
  console.log('  POST /vpn/disconnect - Disconnect VPN');
});
