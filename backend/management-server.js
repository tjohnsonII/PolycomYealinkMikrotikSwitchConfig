#!/usr/bin/env node

/**
 * Web-Based Management Console for Phone Config Generator
 * 
 * This creates a localhost-only web interface for managing, monitoring,
 * and troubleshooting the Phone Configuration Generator webapp.
 * 
 * Features:
 * - Real-time service monitoring
 * - Interactive troubleshooting tools
 * - Log viewing and analysis
 * - Service management (start/stop/restart)
 * - File system overview
 * - Health checks and diagnostics
 * - SSL certificate management
 * - Network monitoring
 * 
 * Security: Only accessible from localhost (127.0.0.1)
 */

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execAsync = promisify(exec);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const MANAGEMENT_PORT = 3099; // Localhost-only management port
const PROJECT_ROOT = path.join(__dirname, '..');

// Security: Only allow localhost connections
app.use((req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    if (clientIP !== '127.0.0.1' && clientIP !== '::1' && clientIP !== '::ffff:127.0.0.1') {
        return res.status(403).json({ error: 'Access denied. This interface is only accessible from localhost.' });
    }
    next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'management-ui')));

// Service definitions
const SERVICES = {
    'ssh-ws': {
        script: 'backend/ssh-ws-server.js',
        port: 3001,
        health: 'http://localhost:3001/health',
        name: 'SSH WebSocket Server',
        type: 'backend'
    },
    'auth': {
        script: 'backend/auth-server.js',
        port: 3002,
        health: 'http://localhost:3002/health',
        name: 'Authentication Server',
        type: 'backend'
    },
    'proxy': {
        script: 'backend/simple-proxy-https.js',
        port: 8443,
        health: 'https://localhost:8443/proxy-health',
        name: 'HTTPS Proxy Server',
        type: 'frontend'
    },
    'webapp': {
        script: null, // Special handling for webapp
        port: 8443,
        health: 'https://localhost:8443/',
        name: 'Main Web Application',
        type: 'webapp'
    }
};

// Project file categories
const PROJECT_FILES = {
    'Frontend Core': ['src/App.tsx', 'src/main.tsx', 'index.html'],
    'Backend Services': ['backend/auth-server.js', 'backend/ssh-ws-server.js', 'backend/simple-proxy-https.js'],
    'Configuration': ['vite.config.ts', 'package.json', 'tsconfig.json', '.env'],
    'Phone Templates': ['src/assets/OnNetMikrotikConfigTemplate.txt', 'src/assets/OTTMikrotikTemplate.txt'],
    'Switch Templates': ['src/assets/24PortSwithTemplate.txt', 'src/assets/48PortSwitchTemplate.txt'],
    'Components': ['src/components/ConfigContext.tsx', 'src/components/AuthContext.tsx'],
    'Pages': ['src/pages/MikrotikTemplates.tsx', 'src/pages/PhoneConfig.tsx', 'src/pages/Diagnostic.tsx'],
    'Startup Scripts': ['start-robust.sh', 'start-robust-menu.sh', 'launch-manager.sh'],
    'SSL/Security': ['ssl/', '.gitignore', 'SECURITY.md'],
    'Documentation': ['README.md', 'STARTUP_README.md', 'HTTPS_SETUP.md', 'ENHANCED_MANAGER_README.md']
};

//=============================================================================
// Utility Functions
//=============================================================================

const execCommand = async (command, options = {}) => {
    try {
        const { stdout, stderr } = await execAsync(command, { 
            cwd: PROJECT_ROOT,
            ...options 
        });
        return { success: true, stdout, stderr };
    } catch (error) {
        return { success: false, error: error.message, stdout: error.stdout, stderr: error.stderr };
    }
};

const isPortInUse = async (port) => {
    try {
        const result = await execCommand(`lsof -i :${port} -sTCP:LISTEN -t`);
        return result.success && result.stdout.trim().length > 0;
    } catch (error) {
        return false;
    }
};

const getServiceStatus = async (serviceKey) => {
    const service = SERVICES[serviceKey];
    if (!service) return { status: 'unknown', message: 'Service not found' };
    
    const portInUse = await isPortInUse(service.port);
    if (!portInUse) {
        return { status: 'stopped', message: 'Service not running' };
    }
    
    // Test health endpoint
    try {
        const healthCommand = service.health.startsWith('https:') 
            ? `curl -k -s -f --connect-timeout 3 "${service.health}"`
            : `curl -s -f --connect-timeout 3 "${service.health}"`;
        
        const result = await execCommand(healthCommand);
        if (result.success) {
            return { status: 'healthy', message: 'Service healthy', health: result.stdout };
        } else {
            return { status: 'unhealthy', message: 'Health check failed' };
        }
    } catch (error) {
        return { status: 'running', message: 'Running but health check failed' };
    }
};

const getAllServicesStatus = async () => {
    const statuses = {};
    for (const [key, service] of Object.entries(SERVICES)) {
        statuses[key] = await getServiceStatus(key);
    }
    return statuses;
};

const getProjectFileInfo = async () => {
    const fileInfo = {};
    
    for (const [category, files] of Object.entries(PROJECT_FILES)) {
        fileInfo[category] = [];
        
        for (const file of files) {
            const fullPath = path.join(PROJECT_ROOT, file);
            try {
                const stats = await fs.promises.stat(fullPath);
                fileInfo[category].push({
                    path: file,
                    exists: true,
                    size: stats.size,
                    modified: stats.mtime,
                    isDirectory: stats.isDirectory()
                });
            } catch (error) {
                fileInfo[category].push({
                    path: file,
                    exists: false,
                    error: error.message
                });
            }
        }
    }
    
    return fileInfo;
};

//=============================================================================
// API Endpoints
//=============================================================================

// Get dashboard data
app.get('/api/dashboard', async (req, res) => {
    try {
        const services = await getAllServicesStatus();
        const systemInfo = await execCommand('uname -a && free -h && df -h .');
        
        res.json({
            services,
            systemInfo: systemInfo.stdout,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get service status
app.get('/api/services/status', async (req, res) => {
    try {
        const statuses = await getAllServicesStatus();
        res.json(statuses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start service
app.post('/api/services/:service/start', async (req, res) => {
    const { service } = req.params;
    const serviceConfig = SERVICES[service];
    
    if (!serviceConfig) {
        return res.status(404).json({ error: 'Service not found' });
    }
    
    try {
        if (service === 'webapp') {
            // Special handling for webapp - build and start all services
            const buildResult = await execCommand('npm run build');
            if (!buildResult.success) {
                return res.status(500).json({ error: 'Failed to build webapp: ' + buildResult.stderr });
            }
            
            // Start all backend services needed for webapp
            for (const [key, svc] of Object.entries(SERVICES)) {
                if (svc.type === 'backend' || svc.type === 'frontend') {
                    const killResult = await execCommand(`pkill -f "${svc.script}"`);
                    
                    const startCommand = key === 'proxy' 
                        ? `cd backend && PROXY_PORT=${svc.port} nohup node ${path.basename(svc.script)} > ${key}.log 2>&1 &`
                        : `cd backend && nohup node ${path.basename(svc.script)} > ${key}.log 2>&1 &`;
                    
                    await execCommand(startCommand);
                }
            }
            
            // Wait for services to start
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            res.json({ 
                success: true, 
                message: 'Web application built and started (all services running)',
                buildOutput: buildResult.stdout
            });
        } else {
            // Regular service start
            const killResult = await execCommand(`pkill -f "${serviceConfig.script}"`);
            
            const startCommand = service === 'proxy' 
                ? `cd backend && PROXY_PORT=${serviceConfig.port} nohup node ${path.basename(serviceConfig.script)} > ${service}.log 2>&1 &`
                : `cd backend && nohup node ${path.basename(serviceConfig.script)} > ${service}.log 2>&1 &`;
            
            const result = await execCommand(startCommand);
            
            // Wait a moment for service to start
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const status = await getServiceStatus(service);
            
            res.json({ 
                success: true, 
                message: `${serviceConfig.name} started`,
                status 
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Stop service
app.post('/api/services/:service/stop', async (req, res) => {
    const { service } = req.params;
    const serviceConfig = SERVICES[service];
    
    if (!serviceConfig) {
        return res.status(404).json({ error: 'Service not found' });
    }
    
    try {
        if (service === 'webapp') {
            // Stop all services for webapp
            for (const [key, svc] of Object.entries(SERVICES)) {
                if (svc.type === 'backend' || svc.type === 'frontend') {
                    await execCommand(`pkill -f "${svc.script}"`);
                }
            }
            
            res.json({ 
                success: true, 
                message: 'Web application stopped (all services stopped)' 
            });
        } else {
            const result = await execCommand(`pkill -f "${serviceConfig.script}"`);
            
            res.json({ 
                success: true, 
                message: `${serviceConfig.name} stopped` 
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Build webapp
app.post('/api/webapp/build', async (req, res) => {
    try {
        log("INFO", "Starting webapp build...");
        
        // Clean previous build
        const cleanResult = await execCommand('rm -rf dist');
        
        // Build the webapp
        const buildResult = await execCommand('npm run build');
        
        if (!buildResult.success) {
            return res.status(500).json({ 
                success: false, 
                error: 'Build failed', 
                output: buildResult.stderr 
            });
        }
        
        // Verify build
        const verifyResult = await execCommand('ls -la dist/');
        
        res.json({
            success: true,
            message: 'Webapp built successfully',
            buildOutput: buildResult.stdout,
            buildFiles: verifyResult.stdout
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start entire system using start-robust.sh
app.post('/api/system/start', async (req, res) => {
    try {
        log("INFO", "Starting entire system...");
        
        const startResult = await execCommand('./start-robust.sh --no-webui &');
        
        res.json({
            success: true,
            message: 'System startup initiated',
            output: startResult.stdout
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Stop entire system using stop-robust.sh
app.post('/api/system/stop', async (req, res) => {
    try {
        log("INFO", "Stopping entire system...");
        
        const stopResult = await execCommand('./stop-robust.sh');
        
        res.json({
            success: true,
            message: 'System stopped',
            output: stopResult.stdout
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Restart service
app.post('/api/services/:service/restart', async (req, res) => {
    const { service } = req.params;
    const serviceConfig = SERVICES[service];
    
    if (!serviceConfig) {
        return res.status(404).json({ error: 'Service not found' });
    }
    
    try {
        // Stop
        await execCommand(`pkill -f "${serviceConfig.script}"`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Start
        const startCommand = service === 'proxy' 
            ? `cd backend && PROXY_PORT=${serviceConfig.port} nohup node ${path.basename(serviceConfig.script)} > ${service}.log 2>&1 &`
            : `cd backend && nohup node ${path.basename(serviceConfig.script)} > ${service}.log 2>&1 &`;
        
        await execCommand(startCommand);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const status = await getServiceStatus(service);
        
        res.json({ 
            success: true, 
            message: `${serviceConfig.name} restarted`,
            status 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get logs
app.get('/api/logs/:service', async (req, res) => {
    const { service } = req.params;
    const lines = req.query.lines || 50;
    
    try {
        let logFile;
        if (service === 'startup') {
            logFile = 'startup-robust.log';
        } else if (SERVICES[service]) {
            logFile = `backend/${service}.log`;
        } else {
            return res.status(404).json({ error: 'Log file not found' });
        }
        
        const result = await execCommand(`tail -${lines} ${logFile}`);
        
        res.json({
            success: true,
            logs: result.stdout || 'No logs available',
            service,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get project files
app.get('/api/files', async (req, res) => {
    try {
        const fileInfo = await getProjectFileInfo();
        res.json(fileInfo);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Run health checks
app.get('/api/health-checks', async (req, res) => {
    try {
        const results = {};
        
        for (const [key, service] of Object.entries(SERVICES)) {
            const healthCommand = service.health.startsWith('https:') 
                ? `curl -k -s -f --connect-timeout 5 "${service.health}"`
                : `curl -s -f --connect-timeout 5 "${service.health}"`;
            
            const result = await execCommand(healthCommand);
            results[key] = {
                name: service.name,
                endpoint: service.health,
                success: result.success,
                response: result.stdout,
                error: result.stderr
            };
        }
        
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Troubleshooting endpoints
app.get('/api/troubleshoot/ports', async (req, res) => {
    try {
        const ports = [3001, 3002, 8443, 443];
        const results = {};
        
        for (const port of ports) {
            const result = await execCommand(`lsof -i :${port} -sTCP:LISTEN`);
            results[port] = {
                inUse: result.success && result.stdout.trim().length > 0,
                details: result.stdout
            };
        }
        
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/troubleshoot/ssl', async (req, res) => {
    try {
        const certPath = 'ssl/123hostedtools_com.crt';
        const keyPath = 'ssl/123hostedtools.com.key';
        
        const certInfo = await execCommand(`openssl x509 -in ${certPath} -noout -subject -dates`);
        const keyTest = await execCommand(`openssl rsa -in ${keyPath} -noout -check`);
        
        // Check if cert and key match
        const certHash = await execCommand(`openssl x509 -in ${certPath} -noout -modulus | openssl md5`);
        const keyHash = await execCommand(`openssl rsa -in ${keyPath} -noout -modulus | openssl md5`);
        
        res.json({
            certificate: {
                exists: certInfo.success,
                info: certInfo.stdout,
                error: certInfo.stderr
            },
            privateKey: {
                exists: keyTest.success,
                valid: keyTest.success,
                error: keyTest.stderr
            },
            match: certHash.stdout === keyHash.stdout
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/troubleshoot/dependencies', async (req, res) => {
    try {
        const nodeVersion = await execCommand('node --version');
        const npmVersion = await execCommand('npm --version');
        const packageJson = fs.existsSync(path.join(PROJECT_ROOT, 'package.json'));
        const nodeModules = fs.existsSync(path.join(PROJECT_ROOT, 'node_modules'));
        const distExists = fs.existsSync(path.join(PROJECT_ROOT, 'dist'));
        
        res.json({
            node: {
                installed: nodeVersion.success,
                version: nodeVersion.stdout?.trim()
            },
            npm: {
                installed: npmVersion.success,
                version: npmVersion.stdout?.trim()
            },
            packageJson: packageJson,
            nodeModules: nodeModules,
            buildDirectory: distExists
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Build application
app.post('/api/build', async (req, res) => {
    try {
        const result = await execCommand('npm run build');
        res.json({
            success: result.success,
            output: result.stdout,
            error: result.stderr
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//=============================================================================
// WebSocket for Real-time Updates
//=============================================================================

io.on('connection', (socket) => {
    console.log('Management client connected');
    
    // Send initial status
    getAllServicesStatus().then(statuses => {
        socket.emit('services-status', statuses);
    });
    
    // Set up periodic status updates
    const statusInterval = setInterval(async () => {
        const statuses = await getAllServicesStatus();
        socket.emit('services-status', statuses);
    }, 5000); // Update every 5 seconds
    
    // Handle terminal command execution
    socket.on('terminal-command', async (data) => {
        const { command, id } = data;
        
        // Security: Only allow safe commands
        const dangerousCommands = ['rm -rf', 'sudo', 'su', 'chmod 777', 'shutdown', 'reboot'];
        const isDangerous = dangerousCommands.some(cmd => command.toLowerCase().includes(cmd));
        
        if (isDangerous) {
            socket.emit('terminal-output', {
                id,
                output: `❌ Command blocked for security: ${command}\n`,
                error: true,
                complete: true
            });
            return;
        }
        
        // Execute command
        try {
            const childProcess = spawn('bash', ['-c', command], {
                cwd: PROJECT_ROOT,
                stdio: ['pipe', 'pipe', 'pipe'],
                shell: true
            });
            
            let output = '';
            
            childProcess.stdout.on('data', (data) => {
                const text = data.toString();
                output += text;
                socket.emit('terminal-output', {
                    id,
                    output: text,
                    error: false,
                    complete: false
                });
            });
            
            childProcess.stderr.on('data', (data) => {
                const text = data.toString();
                output += text;
                socket.emit('terminal-output', {
                    id,
                    output: text,
                    error: true,
                    complete: false
                });
            });
            
            childProcess.on('close', (code) => {
                socket.emit('terminal-output', {
                    id,
                    output: `\n[Process exited with code ${code}]\n`,
                    error: code !== 0,
                    complete: true,
                    exitCode: code
                });
            });
            
        } catch (error) {
            socket.emit('terminal-output', {
                id,
                output: `❌ Error executing command: ${error.message}\n`,
                error: true,
                complete: true
            });
        }
    });
    
    socket.on('disconnect', () => {
        console.log('Management client disconnected');
        clearInterval(statusInterval);
    });
});

//=============================================================================
// Start Management Server
//=============================================================================

server.listen(MANAGEMENT_PORT, '127.0.0.1', () => {
    console.log('🎛️  Web Management Console Started');
    console.log(`🌐 Access: http://localhost:${MANAGEMENT_PORT}`);
    console.log('🔒 Security: Localhost only access');
    console.log('📊 Features: Real-time monitoring, service management, troubleshooting');
    console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Management console shutting down...');
    server.close();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 Management console shutting down...');
    server.close();
    process.exit(0);
});
