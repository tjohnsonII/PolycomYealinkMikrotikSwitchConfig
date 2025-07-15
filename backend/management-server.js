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

const MANAGEMENT_PORT = 3099; // Management console port
const PROJECT_ROOT = path.join(__dirname, '..');

// Configuration for network access
const ALLOW_LAN_ACCESS = process.env.WEBUI_ALLOW_LAN === 'true' || process.argv.includes('--allow-lan');
const BIND_ADDRESS = ALLOW_LAN_ACCESS ? '0.0.0.0' : '127.0.0.1';

// Security: Control access based on configuration
app.use((req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    
    // Always allow localhost
    if (clientIP === '127.0.0.1' || clientIP === '::1' || clientIP === '::ffff:127.0.0.1') {
        return next();
    }
    
    // If LAN access is enabled, allow private IP ranges
    if (ALLOW_LAN_ACCESS) {
        const isPrivateIP = (ip) => {
            // Remove IPv6 prefix if present
            const cleanIP = ip.replace(/^::ffff:/, '');
            
            // Check for private IP ranges
            const privateRanges = [
                /^10\./,                    // 10.0.0.0/8
                /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
                /^192\.168\./,              // 192.168.0.0/16
                /^169\.254\./,              // 169.254.0.0/16 (link-local)
                /^fc00:/,                   // IPv6 private range
                /^fe80:/                    // IPv6 link-local
            ];
            
            return privateRanges.some(range => range.test(cleanIP));
        };
        
        if (isPrivateIP(clientIP)) {
            return next();
        }
    }
    
    // Deny all other connections
    return res.status(403).json({ 
        error: 'Access denied. This interface is only accessible from localhost' + 
               (ALLOW_LAN_ACCESS ? ' or private networks.' : '.'),
        clientIP: clientIP,
        allowLAN: ALLOW_LAN_ACCESS
    });
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'management-ui')));

// Service definitions - New consolidated server architecture
const SERVICES = {
    'production': {
        script: 'backend/production-proxy.js',
        port: 3000,
        httpsPort: 8443,
        health: 'https://localhost:8443/health',
        name: 'Production Server (123hostedtools.com)',
        type: 'priority-1',
        priority: 1,
        description: 'Production server with SSL for 123hostedtools.com domain'
    },
    'management': {
        script: 'backend/management-server.js',
        port: 3099,
        health: 'http://localhost:3099/api/health',
        name: 'Management Console',
        type: 'priority-1',
        priority: 1,
        description: 'Web-based management console for system control'
    },
    'vpn': {
        script: 'backend/vpn-server.js',
        port: 3001,
        health: 'https://localhost:3001/health',
        name: 'VPN Server',
        type: 'priority-2',
        priority: 2,
        description: 'VPN connectivity and network diagnostics'
    },
    'development': {
        script: 'backend/dev-server.js',
        port: 3002,
        health: 'http://localhost:3002/health',
        name: 'Development Server',
        type: 'priority-3',
        priority: 3,
        description: 'Development tools, hot reloading, and testing'
    },
    'webapp': {
        script: null, // Special handling for webapp (starts production server)
        port: 3000,
        httpsPort: 8443,
        health: 'https://localhost:8443/',
        name: 'Main Web Application',
        type: 'webapp',
        description: 'Full web application with all services'
    }
};

// Port cleanup function - Updated for new server architecture
const cleanupPorts = async () => {
    console.log('🧹 Cleaning up ports for consolidated server architecture...');
    const ports = [
        3000,  // Production HTTP
        3001,  // VPN Server
        3002,  // Development Server
        3099,  // Management Console (keep running)
        8443   // Production HTTPS
    ];
    
    for (const port of ports) {
        // Skip management port (this server)
        if (port === MANAGEMENT_PORT) continue;
        
        try {
            const result = await execCommand(`lsof -Pi :${port} -sTCP:LISTEN -t`);
            if (result.success && result.stdout.trim()) {
                const pids = result.stdout.trim().split('\n');
                for (const pid of pids) {
                    console.log(`🔄 Killing process ${pid} on port ${port}`);
                    await execCommand(`kill -TERM ${pid}`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    // Force kill if still running
                    const stillRunning = await execCommand(`kill -0 ${pid}`);
                    if (stillRunning.success) {
                        console.log(`⚡ Force killing process ${pid}`);
                        await execCommand(`kill -KILL ${pid}`);
                    }
                }
            }
        } catch (error) {
            console.error(`Error cleaning port ${port}:`, error.message);
        }
    }
    
    console.log('✅ Port cleanup complete - ready for consolidated servers');
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

// Cleanup ports endpoint
app.post('/api/system/cleanup-ports', async (req, res) => {
    try {
        await cleanupPorts();
        res.json({
            success: true,
            message: 'Ports cleaned up successfully'
        });
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
            // Special handling for webapp - start production server
            console.log("🧹 Cleaning up ports before starting webapp...");
            await cleanupPorts();
            
            // Build the webapp first
            console.log("🔨 Building webapp...");
            const buildResult = await execCommand('npm run build');
            
            if (!buildResult.success) {
                return res.status(500).json({ 
                    error: 'Failed to build webapp',
                    details: buildResult.stderr || buildResult.stdout
                });
            }
            
            // Start production server
            console.log("🚀 Starting production server...");
            const startCommand = `cd backend && nohup node production-proxy.js > ../logs/production.log 2>&1 &`;
            await execCommand(startCommand);
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            res.json({ 
                success: true, 
                message: 'Web application started successfully (production server)',
                service: 'production'
            });
        } else if (service === 'production') {
            // Start production server
            console.log("🚀 Starting production server...");
            await execCommand(`pkill -f "production-proxy.js"`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const startCommand = `cd backend && nohup node production-proxy.js > ../logs/production.log 2>&1 &`;
            await execCommand(startCommand);
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const status = await getServiceStatus(service);
            res.json({ 
                success: true, 
                message: 'Production server started',
                status 
            });
        } else if (service === 'vpn') {
            // Start VPN server
            console.log("🌐 Starting VPN server...");
            await execCommand(`pkill -f "vpn-server.js"`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const startCommand = `cd backend && nohup node vpn-server.js > ../logs/vpn.log 2>&1 &`;
            await execCommand(startCommand);
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const status = await getServiceStatus(service);
            res.json({ 
                success: true, 
                message: 'VPN server started',
                status 
            });
        } else if (service === 'development') {
            // Start development server
            console.log("🛠️  Starting development server...");
            await execCommand(`pkill -f "dev-server.js"`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const startCommand = `cd backend && nohup node dev-server.js > ../logs/dev.log 2>&1 &`;
            await execCommand(startCommand);
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const status = await getServiceStatus(service);
            res.json({ 
                success: true, 
                message: 'Development server started',
                status 
            });
        } else {
            // Generic service start
            const killResult = await execCommand(`pkill -f "${serviceConfig.script}"`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const startCommand = `cd backend && nohup node ${path.basename(serviceConfig.script)} > ../logs/${service}.log 2>&1 &`;
            const result = await execCommand(startCommand);
            
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
            console.log("🛑 Stopping all webapp services...");
            await cleanupPorts();
            
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
            ? `cd backend && PROXY_PORT=${serviceConfig.port} nohup node simple-proxy-https.js > ${service}.log 2>&1 &`
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

// VPN Management endpoints
app.get('/api/vpn/status', async (req, res) => {
    try {
        const sshWsResponse = await fetch('http://localhost:3001/vpn/status');
        const vpnStatus = await sshWsResponse.json();
        
        const systemVpnResponse = await fetch('http://localhost:3001/system/vpn-status');
        const systemVpnStatus = await systemVpnResponse.json();
        
        res.json({
            ...vpnStatus,
            systemStatus: systemVpnStatus,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/vpn/connect', async (req, res) => {
    try {
        const response = await fetch('http://localhost:3001/vpn/connect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body)
        });
        const result = await response.json();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/vpn/disconnect', async (req, res) => {
    try {
        const response = await fetch('http://localhost:3001/vpn/disconnect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body)
        });
        const result = await response.json();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/vpn/dual/start', async (req, res) => {
    try {
        const response = await fetch('http://localhost:3001/vpn/dual/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body)
        });
        const result = await response.json();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/vpn/dual/stop', async (req, res) => {
    try {
        const response = await fetch('http://localhost:3001/vpn/dual/stop', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body)
        });
        const result = await response.json();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/vpn/dual/logs', async (req, res) => {
    try {
        const response = await fetch('http://localhost:3001/vpn/dual/logs');
        const result = await response.json();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/vpn/config-content', async (req, res) => {
    try {
        const response = await fetch(`http://localhost:3001/vpn/config-content?name=${req.query.name}`);
        const result = await response.json();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/vpn/upload-config', async (req, res) => {
    try {
        const response = await fetch('http://localhost:3001/vpn/upload-config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body)
        });
        const result = await response.json();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/vpn/requires-credentials', async (req, res) => {
    try {
        const response = await fetch(`http://localhost:3001/vpn/requires-credentials?name=${req.query.name}`);
        const result = await response.json();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/vpn/saml-login-url', async (req, res) => {
    try {
        const response = await fetch('http://localhost:3001/vpn/saml-login-url');
        const result = await response.json();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/vpn/saml-connect', async (req, res) => {
    try {
        const { name, username, password, otp } = req.body;
        
        // If manual credentials are provided, pass them to the VPN connection
        if (username && password) {
            console.log('SAML connection with manual credentials:', { name, username, hasOtp: !!otp });
            
            // For manual SAML authentication, we'll use the regular connect endpoint
            // but with SAML flag and credentials
            const response = await fetch('http://localhost:3001/vpn/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name,
                    username: username,
                    password: password,
                    otp: otp,
                    samlAuth: true
                })
            });
            const result = await response.json();
            res.json(result);
        } else {
            // For automated SAML authentication, use the dedicated SAML endpoint
            console.log('SAML connection using OpenVPN3 automated flow:', { name });
            
            const response = await fetch('http://localhost:3001/vpn/saml-connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name || 'work'
                })
            });
            const result = await response.json();
            res.json(result);
        }
    } catch (error) {
        console.error('SAML connect error:', error);
        res.status(500).json({ 
            error: error.message,
            message: 'Failed to connect to SAML VPN. Check your credentials and try again.'
        });
    }
});

//=============================================================================
// Diagnostics API Endpoints
//=============================================================================

// Ping command
app.post('/api/diagnostics/ping', async (req, res) => {
    const { host } = req.body;
    
    if (!host) {
        return res.status(400).json({ error: 'Host parameter is required' });
    }
    
    try {
        const result = await execCommand(`ping -c 4 ${host}`);
        res.json({
            success: result.success,
            output: result.stdout || result.stderr,
            error: result.error
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Traceroute command
app.post('/api/diagnostics/traceroute', async (req, res) => {
    const { host } = req.body;
    
    if (!host) {
        return res.status(400).json({ error: 'Host parameter is required' });
    }
    
    try {
        const result = await execCommand(`traceroute -m 15 ${host}`);
        res.json({
            success: result.success,
            output: result.stdout || result.stderr,
            error: result.error
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Network interfaces
app.post('/api/diagnostics/interfaces', async (req, res) => {
    try {
        const result = await execCommand('ip addr show');
        res.json({
            success: result.success,
            output: result.stdout || result.stderr,
            error: result.error
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Routing table
app.post('/api/diagnostics/routes', async (req, res) => {
    try {
        const result = await execCommand('ip route show');
        res.json({
            success: result.success,
            output: result.stdout || result.stderr,
            error: result.error
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DNS resolution
app.post('/api/diagnostics/dns', async (req, res) => {
    const { host } = req.body;
    
    if (!host) {
        return res.status(400).json({ error: 'Host parameter is required' });
    }
    
    try {
        const result = await execCommand(`nslookup ${host}`);
        
        // Try to extract IP from nslookup output
        let ip = 'Unknown';
        if (result.stdout) {
            const lines = result.stdout.split('\n');
            for (const line of lines) {
                if (line.includes('Address:') && !line.includes('#53')) {
                    ip = line.split('Address:')[1].trim();
                    break;
                }
            }
        }
        
        res.json({
            success: result.success,
            ip: ip,
            output: result.stdout || result.stderr,
            error: result.error
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Port connectivity test
app.post('/api/diagnostics/port', async (req, res) => {
    const { host, port } = req.body;
    
    if (!host || !port) {
        return res.status(400).json({ error: 'Host and port parameters are required' });
    }
    
    try {
        // Use netcat to test port connectivity
        const result = await execCommand(`nc -zv ${host} ${port}`, { timeout: 5000 });
        
        res.json({
            success: true,
            reachable: result.success,
            output: result.stdout || result.stderr,
            error: result.error
        });
    } catch (error) {
        res.json({
            success: false,
            reachable: false,
            error: error.message
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'Management Console'
    });
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

// Clean up ports on startup
cleanupPorts().then(() => {
    console.log('🎛️  Starting Web Management Console...');
    
    server.listen(MANAGEMENT_PORT, BIND_ADDRESS, () => {
        console.log('🎛️  Web Management Console Started');
        console.log(`🌐 Access: http://${BIND_ADDRESS === '0.0.0.0' ? 'localhost' : BIND_ADDRESS}:${MANAGEMENT_PORT}`);
        if (ALLOW_LAN_ACCESS) {
            console.log('🌐 LAN Access: Enabled (accessible from private networks)');
            console.log(`🌐 LAN URL: http://YOUR_SERVER_IP:${MANAGEMENT_PORT}`);
        } else {
            console.log('🔒 Security: Localhost only access');
        }
        console.log('📊 Features: Real-time monitoring, service management, troubleshooting');
        console.log('🧹 Port Cleanup: Automatic cleanup of conflicting ports');
        console.log('🚀 Usage: Start/stop webapp and services through web interface');
        console.log('');
    });
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
