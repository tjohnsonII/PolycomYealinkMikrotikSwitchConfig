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
    const { name, username, password, otp, samlAuth } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'VPN name is required' });
    }

    // Check if config exists
    const configPath = path.join(path.dirname(new URL(import.meta.url).pathname), `${name}.ovpn`);
    
    try {
      await fs.access(configPath);
    } catch (error) {
      return res.status(404).json({ error: 'No VPN config file uploaded' });
    }

    const configContent = await fs.readFile(configPath, 'utf8');
    const authType = getAuthType(configContent);

    addVpnLog(`🚀 Connecting to ${name} VPN...`);
    
    // Handle SAML authentication
    if (authType === 'saml' || samlAuth) {
      addVpnLog('🔐 Using SAML authentication with OpenVPN3');
      
      try {
        // Use OpenVPN3 for SAML authentication
        const { spawn } = await import('child_process');
        
        // First, import the configuration if it's not already imported
        addVpnLog('📋 Importing VPN configuration into OpenVPN3...');
        
        const importProcess = spawn('openvpn3', ['config-import', '--config', configPath, '--name', name, '--persistent'], {
          stdio: ['pipe', 'pipe', 'pipe']
        });
        
        let importOutput = '';
        
        importProcess.stdout.on('data', (data) => {
          const text = data.toString();
          importOutput += text;
          addVpnLog(`📋 Import: ${text.trim()}`);
        });
        
        importProcess.stderr.on('data', (data) => {
          const text = data.toString();
          importOutput += text;
          if (!text.includes('already imported') && !text.includes('Configuration already exists')) {
            addVpnLog(`⚠️ Import: ${text.trim()}`);
          }
        });
        
        importProcess.on('close', (code) => {
          addVpnLog(`📋 Import process completed with code: ${code}`);
          
          // Now start the VPN session with SAML support
          addVpnLog('🚀 Starting OpenVPN3 session with SAML support...');
          
          const sessionProcess = spawn('openvpn3', ['session-start', '--config', name], {
            stdio: ['pipe', 'pipe', 'pipe']
          });
          
          let sessionOutput = '';
          
          sessionProcess.stdout.on('data', (data) => {
            const text = data.toString();
            sessionOutput += text;
            addVpnLog(`🔐 Session: ${text.trim()}`);
            
            // Check for SAML authentication prompts
            if (text.includes('Please open a web browser') || text.includes('Authentication required')) {
              addVpnLog('🌐 SAML authentication required - browser should open automatically');
              addVpnLog('💡 Complete authentication in your browser, then return here');
            }
            
            if (text.includes('Connected') || text.includes('Connection established')) {
              addVpnLog('✅ VPN connection established successfully');
              vpnState.connected = true;
              vpnState.connecting = false;
              vpnState.configName = name;
              vpnState.connectionType = 'saml';
            }
          });
          
          sessionProcess.stderr.on('data', (data) => {
            const text = data.toString();
            sessionOutput += text;
            addVpnLog(`⚠️ Session: ${text.trim()}`);
          });
          
          sessionProcess.on('close', (sessionCode) => {
            addVpnLog(`🔚 Session process completed with code: ${sessionCode}`);
            vpnState.connecting = false;
            
            if (sessionCode === 0) {
              addVpnLog('✅ SAML VPN connection completed successfully');
              vpnState.connected = true;
            } else {
              addVpnLog(`❌ SAML VPN connection failed with exit code ${sessionCode}`);
              vpnState.connected = false;
            }
          });
          
          // Store process reference for potential cleanup
          vpnState.process = sessionProcess;
        });
        
        // Update VPN state
        vpnState.configPath = configPath;
        vpnState.configName = name;
        vpnState.connecting = true;
        vpnState.connected = false;
        vpnState.connectionType = 'saml';
        
        return res.json({ 
          success: true, 
          message: 'SAML authentication with OpenVPN3 initiated',
          authType: 'saml',
          note: 'A browser window should open for SAML authentication. Complete the login process there.',
          instructions: [
            '1. Browser window will open automatically',
            '2. Enter your work username and password',
            '3. Enter your 2FA/OTP code',
            '4. VPN will connect automatically after authentication'
          ]
        });
        
      } catch (error) {
        addVpnLog(`❌ OpenVPN3 SAML authentication error: ${error.message}`);
        return res.status(500).json({ 
          error: 'OpenVPN3 SAML authentication failed',
          message: 'Unable to start SAML authentication with OpenVPN3',
          authType: 'saml'
        });
      }
    }

    // Handle regular authentication
    if (authType === 'password') {
      if (!username || !password) {
        return res.status(400).json({ 
          error: 'Username and password required',
          message: 'This VPN configuration requires username and password authentication.',
          authType: 'password'
        });
      }

      // Create credentials file
      const credentialsPath = path.join(path.dirname(new URL(import.meta.url).pathname), 'vpn-credentials.txt');
      await fs.writeFile(credentialsPath, `${username}\n${password}\n`);
      
      // Schedule cleanup
      setTimeout(() => {
        cleanupCredentials();
      }, 60000); // Clean up after 60 seconds
    }

    // Update VPN state
    vpnState.configPath = configPath;
    vpnState.configName = name;
    vpnState.connecting = true;
    vpnState.connected = false;
    vpnState.connectionType = authType;

    addVpnLog(`🔧 Starting OpenVPN process for ${name}...`);

    // Start OpenVPN process
    const { spawn } = await import('child_process');
    const ovpnArgs = ['--config', configPath, '--verb', '3'];
    
    if (authType === 'password') {
      ovpnArgs.push('--auth-user-pass', path.join(path.dirname(new URL(import.meta.url).pathname), 'vpn-credentials.txt'));
    }

    const ovpnProcess = spawn('openvpn', ovpnArgs, {
      stdio: 'pipe',
      cwd: path.dirname(configPath)
    });

    // Store process reference
    vpnState.process = ovpnProcess;

    // Handle process output
    let output = '';
    let errorOutput = '';

    ovpnProcess.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      addVpnLog(`📊 ${text.trim()}`);
      
      // Check for successful connection
      if (text.includes('Initialization Sequence Completed')) {
        addVpnLog('✅ VPN connection established successfully');
        vpnState.connected = true;
        vpnState.connecting = false;
      } else if (output.includes('web based SAML authentication') || output.includes('IV_SSO=webauth')) {
        addVpnLog('🔐 SAML Authentication Required');
        addVpnLog('❌ SAML Authentication Required');
        addVpnLog('🔍 This VPN requires web-based SAML authentication');
        addVpnLog('💡 Use OpenVPN Connect app or similar SAML-compatible client');
        
        // Kill the process since it won't work with regular OpenVPN
        if (output.includes('SAML') || output.includes('webauth')) {
          addVpnLog('❌ SAML authentication required - standard OpenVPN client not supported');
        }
        
        vpnState.connecting = false;
        vpnState.connected = false;
        ovpnProcess.kill();
        
        return res.status(400).json({ 
          error: 'SAML authentication required',
          message: 'This VPN requires SAML web-based authentication. Use the SAML connection option.',
          authType: 'saml'
        });
      }
    });

    ovpnProcess.stderr.on('data', (data) => {
      const text = data.toString();
      errorOutput += text;
      addVpnLog(`❌ ${text.trim()}`);
    });

    ovpnProcess.on('close', (code) => {
      addVpnLog(`🔚 OpenVPN process exited with code ${code}`);
      vpnState.connecting = false;
      
      if (code === 0) {
        addVpnLog('✅ VPN connection completed successfully');
        vpnState.connected = true;
      } else {
        addVpnLog(`❌ VPN connection failed with exit code ${code}`);
        vpnState.connected = false;
      }
      
      // Clean up
      cleanupCredentials();
    });

    // Set timeout for connection attempt
    setTimeout(() => {
      if (vpnState.connecting) {
        addVpnLog('⏰ Connection timeout - terminating process');
        ovpnProcess.kill();
        vpnState.connecting = false;
        vpnState.connected = false;
      }
    }, 30000); // 30 second timeout

    res.json({ 
      success: true, 
      message: `VPN connection initiated for ${name}`,
      authType: authType,
      process: 'started'
    });

  } catch (error) {
    addVpnLog(`❌ Connection error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Dedicated SAML Connect endpoint
app.post('/vpn/saml-connect', async (req, res) => {
  try {
    const { name } = req.body;
    
    // Default to work VPN for SAML
    const vpnName = name || 'work';
    
    addVpnLog(`🔐 Starting SAML authentication for ${vpnName} VPN...`);
    
    // Get the config path
    const configPath = path.join(path.dirname(new URL(import.meta.url).pathname), `${vpnName}.ovpn`);
    
    if (!await fs.access(configPath).then(() => true).catch(() => false)) {
      addVpnLog(`❌ Configuration file not found: ${configPath}`);
      return res.status(404).json({ 
        error: 'Configuration file not found',
        message: `No configuration file found for ${vpnName} VPN`
      });
    }
    
    // Update VPN state
    vpnState.configPath = configPath;
    vpnState.configName = vpnName;
    vpnState.connecting = true;
    vpnState.connected = false;
    vpnState.connectionType = 'saml';
    
    addVpnLog('🚀 Using OpenVPN3 for SAML authentication...');
    
    try {
      // First, import the configuration
      const { spawn } = await import('child_process');
      
      // Remove existing configuration if it exists
      const removeProcess = spawn('openvpn3', ['config-remove', '--config', vpnName], {
        stdio: 'pipe'
      });
      
      removeProcess.on('close', async (removeCode) => {
        // Import the configuration
        const importProcess = spawn('openvpn3', ['config-import', '--config', configPath, '--name', vpnName, '--persistent'], {
          stdio: 'pipe'
        });
        
        let importOutput = '';
        importProcess.stdout.on('data', (data) => {
          importOutput += data.toString();
          addVpnLog(`📥 Import: ${data.toString().trim()}`);
        });
        
        importProcess.stderr.on('data', (data) => {
          addVpnLog(`❌ Import error: ${data.toString().trim()}`);
        });
        
        importProcess.on('close', async (importCode) => {
          if (importCode === 0) {
            addVpnLog('✅ Configuration imported successfully');
            
            // Now start the VPN session with SAML support
            addVpnLog('🚀 Starting OpenVPN3 session with SAML support...');
            
            const sessionProcess = spawn('openvpn3', ['session-start', '--config', vpnName], {
              stdio: 'pipe'
            });
            
            let sessionOutput = '';
            sessionProcess.stdout.on('data', (data) => {
              const text = data.toString();
              sessionOutput += text;
              addVpnLog(`📊 Session: ${text.trim()}`);
              
              // Check for SAML authentication prompts
              if (text.includes('https://') || text.includes('terminal.123.net/auth')) {
                addVpnLog('🌐 SAML authentication required - browser should open automatically');
                
                // Extract the authentication URL
                const urlMatch = text.match(/https:\/\/[^\s]+/);
                if (urlMatch) {
                  const authUrl = urlMatch[0];
                  addVpnLog(`🔗 Authentication URL: ${authUrl}`);
                  
                  // Try to open browser
                  try {
                    const { spawn: spawnBrowser } = require('child_process');
                    spawnBrowser('xdg-open', [authUrl], { detached: true, stdio: 'ignore' });
                  } catch (error) {
                    addVpnLog(`⚠️ Could not open browser automatically: ${error.message}`);
                  }
                }
              }
              
              // Check for successful connection
              if (text.includes('Connection established') || text.includes('Initialization Sequence Completed')) {
                addVpnLog('✅ SAML VPN connection completed successfully');
                vpnState.connected = true;
                vpnState.connecting = false;
              }
            });
            
            sessionProcess.stderr.on('data', (data) => {
              addVpnLog(`❌ Session error: ${data.toString().trim()}`);
            });
            
            sessionProcess.on('close', (sessionCode) => {
              if (sessionCode === 0) {
                addVpnLog('✅ SAML VPN connection completed successfully');
                vpnState.connected = true;
                vpnState.connecting = false;
              } else {
                addVpnLog(`❌ SAML VPN connection failed with exit code ${sessionCode}`);
                vpnState.connected = false;
                vpnState.connecting = false;
              }
            });
            
            // Store process reference
            vpnState.process = sessionProcess;
            
          } else {
            addVpnLog(`❌ Failed to import configuration with exit code ${importCode}`);
            vpnState.connecting = false;
            return res.status(500).json({
              error: 'Failed to import VPN configuration',
              message: 'Could not import VPN configuration for SAML authentication'
            });
          }
        });
      });
      
      // Set timeout for connection attempt
      setTimeout(() => {
        if (vpnState.connecting) {
          addVpnLog('⏰ SAML connection timeout - terminating process');
          if (vpnState.process) {
            vpnState.process.kill();
          }
          vpnState.connecting = false;
          vpnState.connected = false;
        }
      }, 120000); // 2 minute timeout for SAML
      
      res.json({
        success: true,
        message: `SAML authentication initiated for ${vpnName} VPN`,
        connectionType: 'saml',
        instructions: [
          '1. Browser window will open automatically for SAML authentication',
          '2. Enter your work username and password',
          '3. Enter your 2FA/OTP code',
          '4. VPN will connect automatically after authentication'
        ]
      });
      
    } catch (error) {
      addVpnLog(`❌ OpenVPN3 SAML authentication error: ${error.message}`);
      vpnState.connecting = false;
      return res.status(500).json({ 
        error: 'OpenVPN3 SAML authentication failed',
        message: 'Unable to start SAML authentication with OpenVPN3',
        authType: 'saml'
      });
    }
    
  } catch (error) {
    addVpnLog(`❌ SAML connection error: ${error.message}`);
    vpnState.connecting = false;
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
  const workConfigPath = path.join(__dirname, 'work.ovpn');
  
  if (existsSync(workConfigPath)) {
    vpnState.configPath = workConfigPath;
    addVpnLog('🔐 Work VPN configuration loaded (work.ovpn)');
    console.log('✅ Work VPN config found:', workConfigPath);
  } else {
    console.log('⚠️  Work VPN config not found. Upload via diagnostics page.');
  }
};

// Extract SAML login URL from VPN config
async function extractSamlLoginUrl(configPath) {
  try {
    const configContent = await fs.readFile(configPath, 'utf8');
    
    // Extract remote server for SAML URL construction
    const remoteMatch = configContent.match(/remote\s+([^\s]+)\s+(\d+)/i);
    if (remoteMatch) {
      const server = remoteMatch[1];
      const port = remoteMatch[2];
      
      // For work VPN, use terminal.123.net for SAML authentication
      if (server.includes('timsablab.ddns.net') || server.includes('ddns.net')) {
        return 'https://terminal.123.net/auth';
      }
      
      // For other servers, try common SAML authentication URLs
      const possibleUrls = [
        `https://${server}/auth`,
        `https://${server}/saml`,
        `https://${server}/webauth`,
        `https://${server}:${port}/auth`,
        `https://${server}:${port}/saml`,
        `https://${server}:${port}/webauth`
      ];
      
      return possibleUrls[0]; // Return the most likely URL
    }
    
    // Fallback to terminal.123.net for work VPN
    return 'https://terminal.123.net/auth';
  } catch (error) {
    console.error('Error extracting SAML login URL:', error);
    return 'https://terminal.123.net/auth'; // Fallback URL
  }
}

// Check if VPN config requires SAML authentication
function requiresSamlAuth(configContent) {
  const samlIndicators = [
    'auth-user-pass',
    'WEB_AUTH',
    'SAML',
    'IV_SSO=webauth',
    'auth-retry interact',
    'webauth-url'
  ];
  
  return samlIndicators.some(indicator => 
    configContent.toLowerCase().includes(indicator.toLowerCase())
  );
}

// Get authentication type from VPN config
function getAuthType(configContent) {
  // Check for SAML authentication first
  if (configContent.includes('WEB_AUTH') || 
      configContent.includes('SAML') || 
      configContent.includes('IV_SSO=webauth') ||
      configContent.includes('auth-retry interact')) {
    return 'saml';
  }
  
  // Check for username/password authentication
  if (configContent.includes('auth-user-pass')) {
    return 'password';
  }
  
  // Default to certificate-based
  return 'certificate';
}

// Clean up credentials helper
function cleanupCredentials() {
  cleanupCredentialsFile();
}

// Initialize VPN config on server start
initializeVpnConfig();

// Get SAML login URL from VPN config
app.get('/vpn/saml-login-url', async (req, res) => {
  try {
    if (!vpnState.configPath) {
      return res.status(400).json({ error: 'No VPN config file uploaded' });
    }

    const loginUrl = await extractSamlLoginUrl(vpnState.configPath);
    let serverHost = 'unknown';
    
    if (loginUrl) {
      try {
        const urlObj = new URL(loginUrl);
        serverHost = urlObj.host;
      } catch (urlError) {
        console.error('URL parsing error:', urlError.message);
        serverHost = 'terminal.123.net';
      }
    }
    
    res.json({ 
      loginUrl: loginUrl || 'https://terminal.123.net/auth',
      server: serverHost
    });
  } catch (error) {
    console.error('SAML login URL error:', error);
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
