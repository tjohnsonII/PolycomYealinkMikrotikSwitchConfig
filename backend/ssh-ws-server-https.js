// Enhanced SSH WebSocket server with HTTPS/WSS support
// Run: node backend/ssh-ws-server-https.js

import { WebSocketServer } from 'ws';
import { Client } from 'ssh2';
import express from 'express';
import cors from 'cors';
import net from 'net';
import https from 'https';
import fs from 'fs';
import os from 'os';
import { exec, spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// ES modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SSL certificate paths
const SSL_PATHS = {
  key: path.resolve(__dirname, '../ssl/private-key.pem'),
  cert: path.resolve(__dirname, '../ssl/certificate.pem')
};

// Create HTTPS server for REST endpoints
const app = express();
app.use(cors({
  origin: ['https://timsablab.com:3000', 'https://timsablab.ddn.net:3000', 'https://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// --- VPN Status API ---
import vpnStatusRouter from './vpn-status.js';
app.use('/system', vpnStatusRouter);

// Store active VPN processes and status
const vpnState = {
  process: null,
  status: 'disconnected',
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
  if (vpnState.logs.length > 100) {
    vpnState.logs = vpnState.logs.slice(-100);
  }
  console.log(logEntry);
}

// Check if SSL certificates exist
function checkSSLCerts() {
  try {
    if (!fs.existsSync(SSL_PATHS.key) || !fs.existsSync(SSL_PATHS.cert)) {
      console.error('🔒 SSL certificates not found! Please generate them first:');
      console.error('mkdir -p ssl');
      console.error('openssl req -x509 -newkey rsa:4096 -keyout ssl/private-key.pem -out ssl/certificate.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=timsablab.com"');
      process.exit(1);
    }
    console.log('🔒 SSL certificates found');
    return true;
  } catch (error) {
    console.error('🔒 Error checking SSL certificates:', error);
    process.exit(1);
  }
}

// Create HTTPS server
function createHTTPSServer() {
  checkSSLCerts();
  
  const options = {
    key: fs.readFileSync(SSL_PATHS.key),
    cert: fs.readFileSync(SSL_PATHS.cert)
  };
  
  return https.createServer(options, app);
}

// Network diagnostic functions
function pingHost(host, timeout = 5000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const command = process.platform === 'win32' ? `ping -n 1 -w ${timeout} ${host}` : `ping -c 1 -W ${Math.ceil(timeout/1000)} ${host}`;
    
    exec(command, (error, stdout) => {
      const duration = Date.now() - startTime;
      
      if (error) {
        resolve({ 
          host, 
          status: 'unreachable', 
          duration, 
          error: error.message 
        });
      } else {
        const success = process.platform === 'win32' 
          ? !stdout.includes('Request timed out') && !stdout.includes('could not find host')
          : stdout.includes('1 received');
        
        resolve({
          host,
          status: success ? 'reachable' : 'unreachable',
          duration,
          output: stdout.trim()
        });
      }
    });
  });
}

function checkPort(host, port, timeout = 5000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const socket = new net.Socket();
    
    const onError = () => {
      socket.destroy();
      resolve({
        host,
        port,
        status: 'closed',
        duration: Date.now() - startTime
      });
    };
    
    socket.setTimeout(timeout);
    socket.on('connect', () => {
      socket.destroy();
      resolve({
        host,
        port,
        status: 'open',
        duration: Date.now() - startTime
      });
    });
    
    socket.on('timeout', onError);
    socket.on('error', onError);
    
    socket.connect(port, host);
  });
}

// VPN Management Functions
async function connectVPN(ovpnContent, username, password) {
  return new Promise((resolve, reject) => {
    try {
      // Disconnect any existing VPN
      if (vpnState.process) {
        vpnState.process.kill();
        vpnState.process = null;
      }
      
      vpnState.status = 'connecting';
      vpnState.logs = [];
      addVpnLog('Starting VPN connection...');
      
      // Create temporary config file
      const configPath = path.join(__dirname, 'temp_vpn_config.ovpn');
      fs.writeFileSync(configPath, ovpnContent);
      vpnState.configPath = configPath;
      
      // Create auth file if credentials provided
      let authFile = null;
      if (username && password) {
        authFile = path.join(__dirname, 'temp_vpn_auth.txt');
        fs.writeFileSync(authFile, `${username}\n${password}`);
      }
      
      // Start OpenVPN process
      const args = ['--config', configPath];
      if (authFile) {
        args.push('--auth-user-pass', authFile);
      }
      
      const vpnProcess = spawn('openvpn', args);
      vpnState.process = vpnProcess;
      
      // Handle process output
      vpnProcess.stdout.on('data', (data) => {
        const message = data.toString().trim();
        addVpnLog(`STDOUT: ${message}`);
        
        if (message.includes('Initialization Sequence Completed')) {
          vpnState.status = 'connected';
          addVpnLog('VPN connection established successfully!');
          
          // Extract interface and IP info
          setTimeout(() => extractVpnInfo(), 2000);
        }
      });
      
      vpnProcess.stderr.on('data', (data) => {
        const message = data.toString().trim();
        addVpnLog(`STDERR: ${message}`);
        
        if (message.includes('AUTH_FAILED') || message.includes('TLS_ERROR')) {
          vpnState.status = 'error';
          addVpnLog('VPN authentication failed!');
        }
      });
      
      vpnProcess.on('close', (code) => {
        addVpnLog(`VPN process exited with code ${code}`);
        if (vpnState.status !== 'error') {
          vpnState.status = 'disconnected';
        }
        vpnState.process = null;
        
        // Cleanup temporary files
        try {
          if (fs.existsSync(configPath)) fs.unlinkSync(configPath);
          if (authFile && fs.existsSync(authFile)) fs.unlinkSync(authFile);
        } catch (err) {
          console.error('Error cleaning up temp files:', err);
        }
      });
      
      vpnProcess.on('error', (error) => {
        addVpnLog(`VPN process error: ${error.message}`);
        vpnState.status = 'error';
        vpnState.process = null;
        reject(error);
      });
      
      // Resolve after process starts
      setTimeout(() => resolve({ status: 'connecting' }), 1000);
      
    } catch (error) {
      addVpnLog(`Error starting VPN: ${error.message}`);
      vpnState.status = 'error';
      reject(error);
    }
  });
}

function disconnectVPN() {
  return new Promise((resolve) => {
    if (vpnState.process) {
      addVpnLog('Disconnecting VPN...');
      vpnState.process.kill('SIGTERM');
      
      setTimeout(() => {
        if (vpnState.process) {
          addVpnLog('Force killing VPN process...');
          vpnState.process.kill('SIGKILL');
        }
        vpnState.status = 'disconnected';
        vpnState.process = null;
        vpnState.interface = null;
        vpnState.ip = null;
        addVpnLog('VPN disconnected');
        resolve({ status: 'disconnected' });
      }, 3000);
    } else {
      vpnState.status = 'disconnected';
      resolve({ status: 'disconnected' });
    }
  });
}

function extractVpnInfo() {
  // Get VPN interface info
  exec('ip route | grep tun', (error, stdout) => {
    if (!error && stdout) {
      const lines = stdout.trim().split('\n');
      for (const line of lines) {
        if (line.includes('tun')) {
          const parts = line.split(' ');
          const tunInterface = parts.find(part => part.startsWith('tun'));
          if (tunInterface) {
            vpnState.interface = tunInterface;
            addVpnLog(`VPN interface: ${tunInterface}`);
            break;
          }
        }
      }
    }
  });
  
  // Get VPN IP
  exec('curl -s ifconfig.me', (error, stdout) => {
    if (!error && stdout) {
      vpnState.ip = stdout.trim();
      addVpnLog(`VPN IP: ${vpnState.ip}`);
    }
  });
}

// REST API Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    ssl: true,
    version: '2.0.0'
  });
});

// Network diagnostics
app.post('/api/ping', async (req, res) => {
  try {
    const { host, timeout = 5000 } = req.body;
    if (!host) {
      return res.status(400).json({ error: 'Host is required' });
    }
    
    const result = await pingHost(host, timeout);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/port-check', async (req, res) => {
  try {
    const { host, port, timeout = 5000 } = req.body;
    if (!host || !port) {
      return res.status(400).json({ error: 'Host and port are required' });
    }
    
    const result = await checkPort(host, parseInt(port), timeout);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// VPN Management Routes
app.post('/api/vpn/connect', async (req, res) => {
  try {
    const { ovpnContent, username, password } = req.body;
    if (!ovpnContent) {
      return res.status(400).json({ error: 'OVPN content is required' });
    }
    
    const result = await connectVPN(ovpnContent, username, password);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/vpn/disconnect', async (req, res) => {
  try {
    const result = await disconnectVPN();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/vpn/status', (req, res) => {
  res.json({
    status: vpnState.status,
    interface: vpnState.interface,
    ip: vpnState.ip,
    logs: vpnState.logs.slice(-20) // Return last 20 log entries
  });
});

app.get('/api/vpn/logs', (req, res) => {
  res.json({ logs: vpnState.logs });
});

// System information
app.get('/api/system/info', (req, res) => {
  res.json({
    platform: os.platform(),
    arch: os.arch(),
    hostname: os.hostname(),
    uptime: os.uptime(),
    loadavg: os.loadavg(),
    totalmem: os.totalmem(),
    freemem: os.freemem(),
    ssl: true,
    timestamp: new Date().toISOString()
  });
});

// Create HTTPS server and WebSocket server
const server = createHTTPSServer();
const wss = new WebSocketServer({ 
  server,
  verifyClient: (info) => {
    // Add origin verification for security
    const origin = info.origin;
    const allowedOrigins = [
      'https://timsablab.com:3000',
      'https://timsablab.ddn.net:3000', 
      'https://localhost:3000'
    ];
    return allowedOrigins.includes(origin) || !origin; // Allow no origin for testing
  }
});

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  console.log('🔒 New WSS connection established');
  
  let sshConnection = null;
  let sshStream = null;
  
  // Handle incoming WebSocket messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'ssh_connect':
          handleSSHConnect(ws, data);
          break;
          
        case 'ssh_input':
          if (sshStream) {
            sshStream.write(data.data);
          }
          break;
          
        case 'ssh_resize':
          if (sshStream) {
            sshStream.setWindow(data.rows, data.cols);
          }
          break;
          
        case 'ssh_disconnect':
          if (sshConnection) {
            sshConnection.end();
          }
          break;
          
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }));
          break;
          
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Invalid message format' 
      }));
    }
  });
  
  // Handle SSH connection
  function handleSSHConnect(ws, data) {
    const { host, port = 22, username, password, privateKey } = data;
    
    if (!host || !username) {
      ws.send(JSON.stringify({ 
        type: 'ssh_error', 
        message: 'Host and username are required' 
      }));
      return;
    }
    
    // Create new SSH connection
    sshConnection = new Client();
    
    const connectOptions = {
      host,
      port,
      username,
      readyTimeout: 30000,
      algorithms: {
        kex: ['diffie-hellman-group-exchange-sha256', 'diffie-hellman-group14-sha256'],
        cipher: ['aes128-ctr', 'aes192-ctr', 'aes256-ctr'],
        hmac: ['hmac-sha2-256', 'hmac-sha2-512', 'hmac-sha1'],
      }
    };
    
    // Add authentication method
    if (privateKey) {
      connectOptions.privateKey = privateKey;
    } else if (password) {
      connectOptions.password = password;
    } else {
      ws.send(JSON.stringify({ 
        type: 'ssh_error', 
        message: 'Password or private key is required' 
      }));
      return;
    }
    
    // SSH connection events
    sshConnection.on('ready', () => {
      ws.send(JSON.stringify({ 
        type: 'ssh_connected',
        message: `Connected to ${host}` 
      }));
      
      // Create shell
      sshConnection.shell({ 
        term: 'xterm-color',
        cols: 80,
        rows: 24 
      }, (err, stream) => {
        if (err) {
          ws.send(JSON.stringify({ 
            type: 'ssh_error', 
            message: `Shell creation failed: ${err.message}` 
          }));
          return;
        }
        
        sshStream = stream;
        
        // Handle shell data
        stream.on('data', (data) => {
          ws.send(JSON.stringify({ 
            type: 'ssh_data', 
            data: data.toString() 
          }));
        });
        
        stream.on('close', () => {
          ws.send(JSON.stringify({ 
            type: 'ssh_disconnected',
            message: 'SSH session ended' 
          }));
        });
        
        // Send initial prompt
        stream.write('clear\n');
      });
    });
    
    sshConnection.on('error', (err) => {
      console.error('SSH connection error:', err);
      ws.send(JSON.stringify({ 
        type: 'ssh_error', 
        message: `Connection failed: ${err.message}` 
      }));
    });
    
    sshConnection.on('close', () => {
      ws.send(JSON.stringify({ 
        type: 'ssh_disconnected',
        message: 'Connection closed' 
      }));
    });
    
    // Connect
    try {
      sshConnection.connect(connectOptions);
    } catch (error) {
      ws.send(JSON.stringify({ 
        type: 'ssh_error', 
        message: `Connection failed: ${error.message}` 
      }));
    }
  }
  
  // WebSocket cleanup
  ws.on('close', () => {
    console.log('🔒 WSS connection closed');
    if (sshConnection) {
      sshConnection.end();
    }
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    if (sshConnection) {
      sshConnection.end();
    }
  });
});

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔒 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('🔒 HTTPS server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🔒 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('🔒 HTTPS server closed');
    process.exit(0);
  });
});

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log('🔒 HTTPS SSH WebSocket server listening on port', PORT);
  console.log('🔒 SSL/TLS enabled with certificates:');
  console.log('🔒   Key:', SSL_PATHS.key);
  console.log('🔒   Cert:', SSL_PATHS.cert);
  console.log('🔒 WebSocket endpoint: wss://timsablab.com:' + PORT);
  console.log('🔒 REST API endpoint: https://timsablab.com:' + PORT);
});
