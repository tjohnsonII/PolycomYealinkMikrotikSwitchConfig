// Enhanced SSH WebSocket server with network diagnostics and OpenVPN management (ESM version)
// Run: node backend/ssh-ws-server.js

import { WebSocketServer } from 'ws';
import { Client } from 'ssh2';
import express from 'express';
import cors from 'cors';
import net from 'net';
import http from 'http';
import os from 'os';
import { exec, spawn } from 'child_process';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create HTTP server for REST endpoints
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit for .ovpn files

// --- VPN Status API ---
import vpnStatusRouter from './vpn-status.js';
app.use('/system', vpnStatusRouter);

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

// Clean up temporary credentials file
async function cleanupCredentialsFile() {
  try {
    const credentialsPath = path.join(__dirname, 'vpn-credentials.txt');
    if (existsSync(credentialsPath)) {
      await fs.unlink(credentialsPath);
      addVpnLog('🗑️ Credentials file cleaned up');
    }
  } catch (error) {
    addVpnLog(`⚠️ Could not clean up credentials file: ${error.message}`);
  }
}

// Simple health check endpoint for startup monitoring
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'SSH WebSocket Backend'
  });
});

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
  let isConnectionEstablished = false;
  let connectionTimeout = null;
  let keepAliveInterval = null;

  // Set connection timeout
  connectionTimeout = setTimeout(() => {
    if (!isConnectionEstablished) {
      ws.send('Connection timeout. Please check host and credentials.\r\n');
      ws.close();
    }
  }, 30000); // 30 second timeout

  ws.send('🔗 PBX SSH Terminal Ready\r\n');
  ws.send('💡 Enter SSH credentials to connect to FreePBX server\r\n');

  ws.on('message', function incoming(message) {
    // On first message, expect JSON with SSH credentials
    if (!sshClient._ready) {
      try {
        const { host, username, password } = JSON.parse(message);
        
        ws.send(`🔌 Connecting to ${host} as ${username}...\r\n`);
        
        sshClient.on('ready', () => {
          clearTimeout(connectionTimeout);
          isConnectionEstablished = true;
          
          ws.send(`✅ SSH connection established to ${host}\r\n`);
          ws.send('🖥️  Opening shell session...\r\n\r\n');
          
          sshClient.shell({ 
            term: 'xterm-256color',
            cols: 80,
            rows: 24 
          }, (err, stream) => {
            if (err) {
              ws.send(`❌ Shell error: ${err.message}\r\n`);
              ws.close();
              return;
            }
            
            shellStream = stream;
            
            // Handle shell data
            stream.on('data', (data) => {
              if (ws.readyState === ws.OPEN) {
                ws.send(data.toString());
              }
            });
            
            // Handle shell close
            stream.on('close', () => {
              ws.send('\r\n💀 Shell session ended\r\n');
              ws.close();
            });
            
            // Handle shell errors
            stream.on('error', (err) => {
              ws.send(`\r\n❌ Shell error: ${err.message}\r\n`);
              ws.close();
            });
            
            // Set up keepalive
            keepAliveInterval = setInterval(() => {
              if (ws.readyState === ws.OPEN) {
                ws.ping();
              }
            }, 30000); // Ping every 30 seconds
          });
        })
        .on('error', err => {
          clearTimeout(connectionTimeout);
          ws.send(`❌ SSH connection failed: ${err.message}\r\n`);
          ws.send(`💡 Check host, username, password, and VPN connection\r\n`);
          ws.close();
        })
        .on('close', () => {
          ws.send('\r\n🔌 SSH connection closed\r\n');
          ws.close();
        })
        .connect({ 
          host, 
          username, 
          password,
          readyTimeout: 20000, // 20 second ready timeout
          keepaliveInterval: 30000, // Send keepalive every 30 seconds
          keepaliveCountMax: 3 // Close after 3 failed keepalives
        });
        
        sshClient._ready = true;
      } catch (e) {
        clearTimeout(connectionTimeout);
        ws.send('❌ Invalid credentials format. Expected JSON with host, username, password\r\n');
        ws.close();
      }
      return;
    }
    
    // Forward terminal input to SSH
    if (shellStream && shellStream.writable) {
      shellStream.write(message);
    }
  });

  // Handle WebSocket close
  ws.on('close', () => {
    clearTimeout(connectionTimeout);
    clearInterval(keepAliveInterval);
    if (shellStream) {
      shellStream.end();
    }
    if (sshClient) {
      sshClient.end();
    }
  });

  // Handle WebSocket errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clearTimeout(connectionTimeout);
    clearInterval(keepAliveInterval);
    if (shellStream) {
      shellStream.end();
    }
    if (sshClient) {
      sshClient.end();
    }
  });

  // Handle WebSocket pong (keepalive response)
  ws.on('pong', () => {
    // Connection is alive
  });
});

// VPN Status endpoint
app.get('/vpn/status', async (req, res) => {
  try {
    // Check if dual VPN is configured
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    // Check if VPN status script exists
    const statusScriptPath = path.join(__dirname, '..', 'check-vpn-status.sh');
    
    if (existsSync(statusScriptPath)) {
      try {
        const { stdout } = await execAsync(`bash ${statusScriptPath}`);
        const vpnStatus = JSON.parse(stdout);
        res.json(vpnStatus);
        return;
      } catch (error) {
        console.error('Dual VPN status check failed:', error);
      }
    }
    
    // Fallback to single VPN status
    res.json({
      vpn_status: "single_vpn",
      connections: {
        single: {
          status: vpnState.status,
          interface: vpnState.interface,
          ip: vpnState.ip,
          logs: vpnState.logs.slice(-20),
          hasConfig: !!vpnState.configPath
        }
      },
      message: "Using single VPN mode. Run setup-dual-vpn.sh for dual VPN support"
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get VPN status',
      details: error.message 
    });
  }
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

// Download VPN config file
app.get('/vpn/download-config', (req, res) => {
  try {
    if (!vpnState.configPath) {
      return res.status(400).json({ error: 'No VPN config file available' });
    }

    // Send the config file with appropriate headers
    res.setHeader('Content-Type', 'application/x-openvpn-profile');
    res.setHeader('Content-Disposition', 'attachment; filename="vpn-config.ovpn"');
    res.sendFile(vpnState.configPath);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get VPN config content as text
app.get('/vpn/config-content', async (req, res) => {
  try {
    if (!vpnState.configPath) {
      return res.status(400).json({ error: 'No VPN config file available' });
    }

    const configContent = await fs.readFile(vpnState.configPath, 'utf8');
    res.json({ 
      content: configContent,
      filename: path.basename(vpnState.configPath)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check if VPN config requires credentials
app.get('/vpn/requires-credentials', async (req, res) => {
  try {
    if (!vpnState.configPath) {
      return res.status(400).json({ error: 'No VPN config file uploaded' });
    }

    const authType = await requiresCredentials(vpnState.configPath);
    res.json({ 
      authType: authType,
      requiresCredentials: authType === 'credentials',
      isSaml: authType === 'saml',
      isCertificate: authType === 'certificate'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to check if VPN config requires credentials
const requiresCredentials = async (configPath) => {
  try {
    const configContent = await fs.readFile(configPath, 'utf8');
    
    // Check for SAML authentication
    if (configContent.includes('WEB_AUTH') || configContent.includes('SAML') || configContent.includes('IV_SSO=webauth')) {
      return 'saml';  // Requires SAML web authentication
    }
    
    // Check for traditional username/password authentication
    if (configContent.includes('auth-user-pass')) {
      return 'credentials';  // Requires username/password
    }
    
    return 'certificate';  // Certificate-based authentication
  } catch (error) {
    console.error('Error reading VPN config:', error);
    return 'unknown';
  }
};

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

    // Check if VPN config requires credentials
    const authType = await requiresCredentials(vpnState.configPath);
    
    // Get credentials from request body
    const { username, password } = req.body || {};
    
    if (authType === 'saml') {
      return res.status(400).json({ 
        error: 'SAML authentication required',
        message: 'This VPN configuration requires SAML web-based authentication. Please use OpenVPN Connect or another SAML-compatible client.',
        authType: 'saml'
      });
    }
    
    if (authType === 'credentials' && (!username || !password)) {
      return res.status(400).json({ error: 'Username and password required for this VPN configuration' });
    }

    vpnState.status = 'connecting';
    vpnState.logs = [];
    addVpnLog('🔄 Initiating VPN connection...');
    
    if (authType === 'credentials') {
      addVpnLog(`👤 Connecting with user credentials: ${username}`);
    } else if (authType === 'certificate') {
      addVpnLog('🔐 Using certificate-based authentication');
    }

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

    let credentialsPath = null;
    let vpnArgs = ['--config', vpnState.configPath, '--dev-type', 'tun'];

    // Add container-friendly options
    vpnArgs.push(
      '--script-security', '2',
      '--up', '/bin/true',  // Dummy up script to avoid permission issues
      '--down', '/bin/true', // Dummy down script
      '--route-noexec',     // Don't try to add routes (may require privileges)
      '--ifconfig-noexec'   // Don't try to configure interface (may require privileges)
    );

    // Create temporary credentials file only if needed
    if (authType === 'credentials') {
      credentialsPath = path.join(__dirname, 'vpn-credentials.txt');
      await fs.writeFile(credentialsPath, `${username}\n${password}`);
      vpnArgs.push('--auth-user-pass', credentialsPath);
      addVpnLog('🔑 Credentials file created');
    }

    // Start OpenVPN process without sudo (handle permissions differently)
    addVpnLog('🔧 Starting OpenVPN in container-friendly mode...');
    addVpnLog('ℹ️ Note: Some network features may be limited in container environment');

    vpnState.process = spawn('openvpn', vpnArgs, {
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
      } else if (output.includes('web based SAML authentication') || output.includes('IV_SSO=webauth')) {
        vpnState.status = 'error';
        addVpnLog('❌ SAML Authentication Required');
        addVpnLog('🔍 This VPN requires web-based SAML authentication');
        addVpnLog('💡 Use OpenVPN Connect app or similar SAML-compatible client');
      } else if (output.includes('AUTH: Received control message: AUTH_FAILED')) {
        vpnState.status = 'error';
        if (output.includes('SAML') || output.includes('webauth')) {
          addVpnLog('❌ SAML authentication required - standard OpenVPN client not supported');
        } else {
          addVpnLog('❌ Authentication failed - check credentials');
        }
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
      
      // Clean up credentials file
      cleanupCredentialsFile();
    });

    // Handle process errors
    vpnState.process.on('error', (error) => {
      addVpnLog(`❌ VPN process error: ${error.message}`);
      vpnState.status = 'error';
      vpnState.process = null;
      
      // Clean up credentials file
      cleanupCredentialsFile();
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
    
    // Clean up credentials file
    cleanupCredentialsFile();
    
    res.json({ success: true, message: 'VPN disconnected' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dual VPN Management Endpoints
app.post('/vpn/dual/start', async (req, res) => {
  try {
    const { vpn } = req.body; // 'work', 'home', or 'both'
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    let command;
    switch (vpn) {
      case 'work':
        command = 'sudo systemctl start openvpn-work';
        break;
      case 'home':
        command = 'sudo systemctl start openvpn-home';
        break;
      case 'both':
        command = 'sudo /usr/local/bin/vpn-manager start-both';
        break;
      default:
        return res.status(400).json({ error: 'Invalid VPN type. Use: work, home, or both' });
    }
    
    await execAsync(command);
    res.json({ success: true, message: `Started ${vpn} VPN` });
  } catch (error) {
    res.status(500).json({ 
      error: `Failed to start VPN: ${error.message}`,
      suggestion: 'Make sure dual VPN is configured (run setup-dual-vpn.sh)'
    });
  }
});

app.post('/vpn/dual/stop', async (req, res) => {
  try {
    const { vpn } = req.body; // 'work', 'home', or 'both'
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    let command;
    switch (vpn) {
      case 'work':
        command = 'sudo systemctl stop openvpn-work';
        break;
      case 'home':
        command = 'sudo systemctl stop openvpn-home';
        break;
      case 'both':
        command = 'sudo /usr/local/bin/vpn-manager stop-both';
        break;
      default:
        return res.status(400).json({ error: 'Invalid VPN type. Use: work, home, or both' });
    }
    
    await execAsync(command);
    res.json({ success: true, message: `Stopped ${vpn} VPN` });
  } catch (error) {
    res.status(500).json({ 
      error: `Failed to stop VPN: ${error.message}`,
      suggestion: 'Make sure dual VPN is configured (run setup-dual-vpn.sh)'
    });
  }
});

app.get('/vpn/dual/logs', async (req, res) => {
  try {
    const { vpn } = req.query; // 'work', 'home', or 'both'
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    let logs = {};
    
    if (vpn === 'work' || vpn === 'both' || !vpn) {
      try {
        const { stdout: workLogs } = await execAsync('sudo tail -50 /var/log/openvpn/work-vpn.log 2>/dev/null || echo "No work VPN logs"');
        logs.work = workLogs.split('\n').filter(line => line.trim());
      } catch (error) {
        logs.work = ['Work VPN logs not available'];
      }
    }
    
    if (vpn === 'home' || vpn === 'both' || !vpn) {
      try {
        const { stdout: homeLogs } = await execAsync('sudo tail -50 /var/log/openvpn/home-vpn.log 2>/dev/null || echo "No home VPN logs"');
        logs.home = homeLogs.split('\n').filter(line => line.trim());
      } catch (error) {
        logs.home = ['Home VPN logs not available'];
      }
    }
    
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ 
      error: `Failed to get VPN logs: ${error.message}` 
    });
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

// Check for pre-installed work VPN config on startup
const initializeVpnConfig = () => {
  const workConfigPath = path.join(__dirname, 'tjohnson-work.ovpn');
  
  if (existsSync(workConfigPath)) {
    vpnState.configPath = workConfigPath;
    addVpnLog('🔐 Work VPN configuration loaded (tjohnson@terminal.123.net)');
    console.log('✅ Work VPN config found:', workConfigPath);
  } else {
    console.log('⚠️  Work VPN config not found. Upload via diagnostics page.');
  }
};

// Initialize VPN config on server start
initializeVpnConfig();

// Get SAML login URL from VPN config
app.get('/vpn/saml-login-url', async (req, res) => {
  try {
    if (!vpnState.configPath) {
      return res.status(400).json({ error: 'No VPN config file uploaded' });
    }

    const loginUrl = await extractSamlLoginUrl(vpnState.configPath);
    res.json({ 
      loginUrl: loginUrl,
      server: loginUrl ? new URL(loginUrl).host : 'unknown'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Execute connect-vpn.sh script to connect to available VPN configs
app.post('/vpn/connect-script', async (req, res) => {
  try {
    addVpnLog('🚀 Starting VPN connection script...');
    
    // Check if connect-vpn.sh exists
    const scriptPath = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'connect-vpn.sh');
    
    try {
      await fs.access(scriptPath);
    } catch (error) {
      const errorMsg = 'connect-vpn.sh script not found';
      addVpnLog(`❌ ${errorMsg}`);
      return res.status(404).json({ error: errorMsg });
    }
    
    // Execute the script with proper permissions
    addVpnLog('📋 Executing connect-vpn.sh...');
    
    const scriptProcess = spawn('bash', [scriptPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: path.dirname(scriptPath)
    });
    
    let output = '';
    let errorOutput = '';
    
    scriptProcess.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      // Log each line as it comes in
      text.split('\n').filter(line => line.trim()).forEach(line => {
        addVpnLog(`📋 ${line}`);
      });
    });
    
    scriptProcess.stderr.on('data', (data) => {
      const text = data.toString();
      errorOutput += text;
      // Log error lines
      text.split('\n').filter(line => line.trim()).forEach(line => {
        addVpnLog(`⚠️ ${line}`);
      });
    });
    
    scriptProcess.on('close', (code) => {
      if (code === 0) {
        addVpnLog('✅ VPN connection script completed successfully');
        addVpnLog('💡 Check VPN Status panel below for active connections');
      } else {
        addVpnLog(`❌ VPN connection script exited with code ${code}`);
      }
    });
    
    // Don't wait for the script to complete - return immediately
    res.json({ 
      success: true, 
      message: 'VPN connection script started',
      note: 'Check the logs below for progress and results'
    });
    
  } catch (error) {
    const errorMsg = `Failed to execute VPN connection script: ${error.message}`;
    addVpnLog(`❌ ${errorMsg}`);
    res.status(500).json({ error: errorMsg });
  }
});

// System information and utility endpoints

// Get OS information for Linux distribution detection
app.get('/system/os-info', async (req, res) => {
  try {
    let distro = 'unknown';
    let version = 'unknown';
    
    try {
      // Try to read /etc/os-release
      const osRelease = await fs.readFile('/etc/os-release', 'utf8');
      const lines = osRelease.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('ID=')) {
          distro = line.split('=')[1].replace(/"/g, '');
        } else if (line.startsWith('VERSION_ID=')) {
          version = line.split('=')[1].replace(/"/g, '');
        }
      }
    } catch (error) {
      // Fallback methods
      try {
        const lsbRelease = await fs.readFile('/etc/lsb-release', 'utf8');
        if (lsbRelease.includes('Ubuntu')) distro = 'ubuntu';
        else if (lsbRelease.includes('Debian')) distro = 'debian';
      } catch (e) {
        // Try other methods
        try {
          const redhatRelease = await fs.readFile('/etc/redhat-release', 'utf8');
          if (redhatRelease.includes('Fedora')) distro = 'fedora';
          else if (redhatRelease.includes('CentOS')) distro = 'centos';
          else if (redhatRelease.includes('Red Hat')) distro = 'rhel';
        } catch (e2) {
          // Default to platform info
          distro = os.platform();
        }
      }
    }
    
    res.json({
      platform: os.platform(),
      arch: os.arch(),
      distro: distro,
      version: version,
      release: os.release(),
      hostname: os.hostname()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Attempt to open network settings (Linux desktop environments)
app.post('/system/open-network-settings', async (req, res) => {
  try {
    // Try different commands based on desktop environment
    const commands = [
      'gnome-control-center network',  // GNOME
      'systemsettings5 kcm_networkmanagement',  // KDE Plasma 5
      'systemsettings kcm_networkmanagement',   // KDE Plasma 4
      'unity-control-center network',   // Unity
      'nm-connection-editor',           // NetworkManager GUI
      'network-manager-gnome'           // Legacy
    ];
    
    let success = false;
    
    for (const cmd of commands) {
      try {
        const [command, ...args] = cmd.split(' ');
        const child = spawn(command, args, { detached: true, stdio: 'ignore' });
        child.unref();
        success = true;
        break;
      } catch (error) {
        // Try next command
        continue;
      }
    }
    
    if (success) {
      res.json({ success: true, message: 'Network settings opened' });
    } else {
      res.json({ 
        success: false, 
        message: 'Could not open network settings automatically',
        suggestion: 'Try: Settings → Network or run "nm-connection-editor" in terminal'
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check server-side VPN connectivity (independent of client VPN)
app.get('/system/server-vpn-status', async (req, res) => {
  try {
    // Test connectivity to known work VPN endpoints
    const testEndpoints = [
      { host: '69.39.69.102', port: 5060, name: 'Primary PBX' },
      { host: 'terminal.123.net', port: 443, name: 'VPN Gateway' },
      { host: '216.234.97.2', port: 53, name: 'Work DNS' }
    ];
    
    let connectedCount = 0;
    const results = [];
    
    for (const endpoint of testEndpoints) {
      try {
        const isReachable = await testTcpConnection(endpoint.host, endpoint.port, 3000);
        results.push({
          name: endpoint.name,
          host: endpoint.host,
          port: endpoint.port,
          reachable: isReachable
        });
        if (isReachable) connectedCount++;
      } catch (error) {
        results.push({
          name: endpoint.name,
          host: endpoint.host,
          port: endpoint.port,
          reachable: false,
          error: error.message
        });
      }
    }
    
    // Determine VPN status based on connectivity
    let vpnStatus = 'disconnected';
    if (connectedCount >= 2) {
      vpnStatus = 'connected';
    } else if (connectedCount >= 1) {
      vpnStatus = 'partial';
    }
    
    res.json({
      status: vpnStatus,
      connectedEndpoints: connectedCount,
      totalEndpoints: testEndpoints.length,
      results: results,
      message: vpnStatus === 'connected' ? 
        'Server has VPN connectivity to work network' : 
        vpnStatus === 'partial' ?
        'Server has partial connectivity - VPN may be unstable' :
        'Server cannot reach work network - VPN may be disconnected'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the combined HTTP/WebSocket server
const PORT = 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`SSH WebSocket server with diagnostics running on http://0.0.0.0:${PORT}`);
  console.log('Available endpoints:');
  console.log('  POST /ping - Network connectivity test');
  console.log('  WS /ssh - SSH terminal connection');
  console.log('  GET /vpn/status - VPN status');
  console.log('  POST /vpn/upload-config - Upload VPN config');
  console.log('  POST /vpn/connect - Connect to VPN');
  console.log('  POST /vpn/disconnect - Disconnect VPN');
  console.log('  GET /vpn/requires-credentials - Check if VPN config requires credentials');
  console.log('  GET /vpn/saml-login-url - Get SAML authentication URL from VPN config');
  console.log('  GET /vpn/download-config - Download VPN config file');
  console.log('  GET /vpn/config-content - Get VPN config content as text');
  console.log('  GET /system/os-info - Get operating system information');
  console.log('  POST /system/open-network-settings - Open network settings GUI');
  console.log('  GET /system/os-info - Get OS information');
  console.log('  POST /system/open-network-settings - Open network settings (Linux)');
  console.log('  GET /system/server-vpn-status - Check server-side VPN connectivity');
});
