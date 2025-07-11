/**
 * Web Management Console JavaScript Application
 * 
 * Provides real-time monitoring and control for the Phone Config Generator
 * through a web interface with WebSocket connectivity.
 */

class ManagementConsole {
    constructor() {
        this.socket = io();
        this.services = {};
        this.startTime = Date.now();
        this.setupEventListeners();
        this.setupWebSocket();
        this.initialize();
    }

    setupEventListeners() {
        // Auto-refresh logs when service changes
        document.getElementById('log-service').addEventListener('change', () => {
            this.refreshLogs();
        });

        // Tab change events
        document.querySelectorAll('button[data-bs-toggle="tab"]').forEach(tab => {
            tab.addEventListener('shown.bs.tab', (e) => {
                const target = e.target.getAttribute('data-bs-target');
                this.handleTabChange(target);
            });
        });
    }

    setupWebSocket() {
        this.socket.on('services-status', (statuses) => {
            this.services = statuses;
            this.updateServiceStatus();
        });

        this.socket.on('connect', () => {
            console.log('Connected to management server');
            this.updateConnectionStatus(true);
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from management server');
            this.updateConnectionStatus(false);
        });
        
        // Handle terminal output
        this.socket.on('terminal-output', (data) => {
            const output = document.getElementById('terminal-output');
            if (output) {
                const outputDiv = document.createElement('div');
                outputDiv.className = data.error ? 'terminal-error' : 'terminal-success';
                outputDiv.textContent = data.output;
                output.appendChild(outputDiv);
                output.scrollTop = output.scrollHeight;
            }
        });
    }

    async initialize() {
        this.updateLastUpdate();
        await this.loadDashboard();
        
        // Set up periodic updates
        setInterval(() => {
            this.updateLastUpdate();
            this.updateUptime();
        }, 1000);
    }

    updateConnectionStatus(connected) {
        const indicator = document.querySelector('.real-time-indicator');
        if (connected) {
            indicator.style.backgroundColor = '#28a745';
            indicator.style.animation = 'pulse 2s infinite';
        } else {
            indicator.style.backgroundColor = '#dc3545';
            indicator.style.animation = 'none';
        }
    }

    updateLastUpdate() {
        const now = new Date();
        document.getElementById('last-update').textContent = 
            `Last Update: ${now.toLocaleTimeString()}`;
    }

    updateUptime() {
        const uptime = Math.floor((Date.now() - this.startTime) / 1000);
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = uptime % 60;
        document.getElementById('uptime').textContent = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    async loadDashboard() {
        try {
            const response = await fetch('/api/dashboard');
            const data = await response.json();
            
            if (data.services) {
                this.services = data.services;
                this.updateServiceStatus();
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
        }
    }

    updateServiceStatus() {
        let healthyCount = 0;
        let warningCount = 0;
        let errorCount = 0;

        // Update individual service status
        for (const [service, status] of Object.entries(this.services)) {
            const statusElement = document.getElementById(`${service}-status`);
            if (statusElement) {
                statusElement.className = 'badge badge-lg';
                
                switch (status.status) {
                    case 'healthy':
                        statusElement.classList.add('bg-success');
                        statusElement.textContent = '✅ Healthy';
                        healthyCount++;
                        break;
                    case 'unhealthy':
                    case 'running':
                        statusElement.classList.add('bg-warning');
                        statusElement.textContent = '⚠️ Warning';
                        warningCount++;
                        break;
                    case 'stopped':
                    default:
                        statusElement.classList.add('bg-danger');
                        statusElement.textContent = '❌ Stopped';
                        errorCount++;
                        break;
                }
            }
        }
        
        // Update webapp status (based on all services)
        const webappStatusElement = document.getElementById('webapp-status');
        if (webappStatusElement) {
            webappStatusElement.className = 'badge badge-lg';
            
            // Check if all main services are healthy
            const requiredServices = ['ssh-ws', 'auth', 'proxy'];
            const allHealthy = requiredServices.every(service => 
                this.services[service] && this.services[service].status === 'healthy'
            );
            
            if (allHealthy) {
                webappStatusElement.classList.add('bg-success');
                webappStatusElement.textContent = '✅ Online';
            } else {
                const anyRunning = requiredServices.some(service => 
                    this.services[service] && this.services[service].status === 'healthy'
                );
                
                if (anyRunning) {
                    webappStatusElement.classList.add('bg-warning');
                    webappStatusElement.textContent = '⚠️ Partial';
                } else {
                    webappStatusElement.classList.add('bg-danger');
                    webappStatusElement.textContent = '❌ Offline';
                }
            }
        }

        // Update header stats
        document.getElementById('healthy-count').textContent = healthyCount;
        document.getElementById('warning-count').textContent = warningCount;
        document.getElementById('error-count').textContent = errorCount;
    }

    handleTabChange(target) {
        switch (target) {
            case '#services':
                this.loadServicesTab();
                break;
            case '#logs':
                this.refreshLogs();
                break;
            case '#files':
                this.refreshFiles();
                break;
            case '#troubleshoot':
                this.loadTroubleshootTab();
                break;
        }
    }

    async loadServicesTab() {
        const container = document.getElementById('services-details');
        container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading service details...</div>';

        try {
            const response = await fetch('/api/services/status');
            const services = await response.json();

            let html = '<div class="row">';
            for (const [key, service] of Object.entries(services)) {
                const statusClass = service.status === 'healthy' ? 'success' : 
                                   service.status === 'stopped' ? 'danger' : 'warning';
                
                html += `
                    <div class="col-md-6 mb-3">
                        <div class="card">
                            <div class="card-header">
                                <i class="fas fa-server"></i> ${key.toUpperCase()} Service
                                <span class="badge bg-${statusClass} float-end">${service.status}</span>
                            </div>
                            <div class="card-body">
                                <p><strong>Message:</strong> ${service.message}</p>
                                ${service.health ? `<details><summary>Health Response</summary><pre class="mt-2">${service.health}</pre></details>` : ''}
                                <div class="mt-3">
                                    <button class="btn btn-success btn-sm" onclick="startService('${key}')">
                                        <i class="fas fa-play"></i> Start
                                    </button>
                                    <button class="btn btn-warning btn-sm" onclick="restartService('${key}')">
                                        <i class="fas fa-redo"></i> Restart
                                    </button>
                                    <button class="btn btn-danger btn-sm" onclick="stopService('${key}')">
                                        <i class="fas fa-stop"></i> Stop
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }
            html += '</div>';
            container.innerHTML = html;
        } catch (error) {
            container.innerHTML = `<div class="alert alert-danger">Error loading services: ${error.message}</div>`;
        }
    }

    async refreshLogs() {
        const service = document.getElementById('log-service').value;
        const output = document.getElementById('log-output');
        
        output.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading logs...</div>';

        try {
            const response = await fetch(`/api/logs/${service}`);
            const data = await response.json();
            
            if (data.success) {
                output.textContent = data.logs || 'No logs available';
            } else {
                output.textContent = `Error loading logs: ${data.error}`;
            }
        } catch (error) {
            output.textContent = `Error: ${error.message}`;
        }
    }

    async refreshFiles() {
        const container = document.getElementById('files-content');
        container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading files...</div>';

        try {
            const response = await fetch('/api/files');
            const files = await response.json();

            let html = '';
            for (const [category, fileList] of Object.entries(files)) {
                html += `
                    <div class="mb-4">
                        <h5><i class="fas fa-folder"></i> ${category}</h5>
                        <div class="file-tree">
                `;
                
                for (const file of fileList) {
                    const icon = file.isDirectory ? 'fa-folder' : 'fa-file';
                    const statusClass = file.exists ? 'file-exists' : 'file-missing';
                    const statusIcon = file.exists ? '✅' : '❌';
                    const sizeInfo = file.exists && !file.isDirectory ? ` (${this.formatBytes(file.size)})` : '';
                    
                    html += `
                        <div class="${statusClass}">
                            ${statusIcon} <i class="fas ${icon}"></i> ${file.path}${sizeInfo}
                            ${file.exists && file.modified ? `<small class="text-muted"> - ${new Date(file.modified).toLocaleDateString()}</small>` : ''}
                        </div>
                    `;
                }
                
                html += `
                        </div>
                    </div>
                `;
            }
            
            container.innerHTML = html;
        } catch (error) {
            container.innerHTML = `<div class="alert alert-danger">Error loading files: ${error.message}</div>`;
        }
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async loadTroubleshootTab() {
        await this.checkPorts();
        await this.checkSSL();
        await this.checkDependencies();
    }

    async checkPorts() {
        const container = document.getElementById('port-status');
        container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Checking ports...</div>';

        try {
            const response = await fetch('/api/troubleshoot/ports');
            const ports = await response.json();

            let html = '';
            for (const [port, info] of Object.entries(ports)) {
                const statusClass = info.inUse ? 'success' : 'secondary';
                const statusText = info.inUse ? 'In Use' : 'Free';
                
                html += `
                    <div class="mb-2">
                        <strong>Port ${port}:</strong> 
                        <span class="badge bg-${statusClass}">${statusText}</span>
                    </div>
                `;
            }
            
            container.innerHTML = html;
        } catch (error) {
            container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
        }
    }

    async checkSSL() {
        const container = document.getElementById('ssl-status');
        container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Checking SSL...</div>';

        try {
            const response = await fetch('/api/troubleshoot/ssl');
            const ssl = await response.json();

            let html = '';
            
            // Certificate status
            html += `
                <div class="mb-2">
                    <strong>Certificate:</strong> 
                    <span class="badge bg-${ssl.certificate.exists ? 'success' : 'danger'}">
                        ${ssl.certificate.exists ? '✅ Found' : '❌ Missing'}
                    </span>
                </div>
            `;
            
            // Private key status
            html += `
                <div class="mb-2">
                    <strong>Private Key:</strong> 
                    <span class="badge bg-${ssl.privateKey.valid ? 'success' : 'danger'}">
                        ${ssl.privateKey.valid ? '✅ Valid' : '❌ Invalid'}
                    </span>
                </div>
            `;
            
            // Match status
            html += `
                <div class="mb-2">
                    <strong>Key Match:</strong> 
                    <span class="badge bg-${ssl.match ? 'success' : 'danger'}">
                        ${ssl.match ? '✅ Match' : '❌ Mismatch'}
                    </span>
                </div>
            `;
            
            container.innerHTML = html;
        } catch (error) {
            container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
        }
    }

    async checkDependencies() {
        const container = document.getElementById('deps-status');
        container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Checking dependencies...</div>';

        try {
            const response = await fetch('/api/troubleshoot/dependencies');
            const deps = await response.json();

            let html = '';
            
            const checks = [
                { name: 'Node.js', status: deps.node.installed, info: deps.node.version },
                { name: 'NPM', status: deps.npm.installed, info: deps.npm.version },
                { name: 'package.json', status: deps.packageJson },
                { name: 'node_modules', status: deps.nodeModules },
                { name: 'Build Directory', status: deps.buildDirectory }
            ];
            
            for (const check of checks) {
                html += `
                    <div class="mb-2">
                        <strong>${check.name}:</strong> 
                        <span class="badge bg-${check.status ? 'success' : 'danger'}">
                            ${check.status ? '✅ OK' : '❌ Missing'}
                        </span>
                        ${check.info ? `<small class="text-muted"> ${check.info}</small>` : ''}
                    </div>
                `;
            }
            
            container.innerHTML = html;
        } catch (error) {
            container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
        }
    }

    async serviceAction(action, service) {
        try {
            const response = await fetch(`/api/services/${service}/${action}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showNotification(`${action} ${service} successful`, 'success');
                // Refresh service status
                await this.loadDashboard();
            } else {
                this.showNotification(`${action} ${service} failed: ${result.error}`, 'danger');
            }
        } catch (error) {
            this.showNotification(`Error: ${error.message}`, 'danger');
        }
    }

    async buildApplication() {
        this.showNotification('Building application...', 'info');
        
        try {
            const response = await fetch('/api/build', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showNotification('Application built successfully', 'success');
            } else {
                this.showNotification(`Build failed: ${result.error}`, 'danger');
            }
        } catch (error) {
            this.showNotification(`Build error: ${error.message}`, 'danger');
        }
    }

    async runHealthChecks() {
        this.showNotification('Running health checks...', 'info');
        
        try {
            const response = await fetch('/api/health-checks');
            const results = await response.json();
            
            let healthy = 0;
            let total = 0;
            
            for (const [service, result] of Object.entries(results)) {
                total++;
                if (result.success) healthy++;
            }
            
            const message = `Health checks complete: ${healthy}/${total} services healthy`;
            const type = healthy === total ? 'success' : 'warning';
            
            this.showNotification(message, type);
        } catch (error) {
            this.showNotification(`Health check error: ${error.message}`, 'danger');
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 400px;';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
}

// Service management functions (global scope for onclick handlers)
async function startService(service) {
    await app.serviceAction('start', service);
}

async function stopService(service) {
    await app.serviceAction('stop', service);
}

async function restartService(service) {
    await app.serviceAction('restart', service);
}

async function startAllServices() {
    await Promise.all([
        app.serviceAction('start', 'ssh-ws'),
        app.serviceAction('start', 'auth'),
        app.serviceAction('start', 'proxy')
    ]);
}

async function stopAllServices() {
    await Promise.all([
        app.serviceAction('stop', 'ssh-ws'),
        app.serviceAction('stop', 'auth'),
        app.serviceAction('stop', 'proxy')
    ]);
}

async function restartAllServices() {
    await Promise.all([
        app.serviceAction('restart', 'ssh-ws'),
        app.serviceAction('restart', 'auth'),
        app.serviceAction('restart', 'proxy')
    ]);
}

async function buildApplication() {
    await app.buildApplication();
}

//=============================================================================
// Webapp Control Functions
//=============================================================================

async function startWebApp() {
    try {
        const response = await fetch('/api/services/webapp/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('✅ Web Application Started Successfully!\n\nAll services are now running and the webapp is accessible at:\nhttps://123hostedtools.com');
        } else {
            alert('❌ Failed to start webapp: ' + result.error);
        }
    } catch (error) {
        alert('❌ Error starting webapp: ' + error.message);
    }
}

async function stopWebApp() {
    if (confirm('⚠️ This will stop the entire web application.\nUsers will not be able to access the website.\n\nContinue?')) {
        try {
            const response = await fetch('/api/services/webapp/stop', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert('✅ Web Application Stopped\n\nAll services have been stopped.');
            } else {
                alert('❌ Failed to stop webapp: ' + result.error);
            }
        } catch (error) {
            alert('❌ Error stopping webapp: ' + error.message);
        }
    }
}

async function restartWebApp() {
    if (confirm('⚠️ This will restart the entire web application.\nUsers may experience a brief interruption.\n\nContinue?')) {
        try {
            await stopWebApp();
            await new Promise(resolve => setTimeout(resolve, 2000));
            await startWebApp();
        } catch (error) {
            alert('❌ Error restarting webapp: ' + error.message);
        }
    }
}

async function buildWebApp() {
    try {
        const response = await fetch('/api/webapp/build', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('✅ Webapp Built Successfully!\n\nThe frontend has been rebuilt and is ready for deployment.');
        } else {
            alert('❌ Build failed: ' + result.error);
        }
    } catch (error) {
        alert('❌ Error building webapp: ' + error.message);
    }
}

//=============================================================================
// System Control Functions
//=============================================================================

async function startEntireSystem() {
    if (confirm('🚀 This will start the entire Phone Configuration Generator system.\n\nContinue?')) {
        try {
            const response = await fetch('/api/system/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert('✅ System Startup Initiated\n\nThe entire system is starting up. This may take a moment.');
            } else {
                alert('❌ Failed to start system: ' + result.error);
            }
        } catch (error) {
            alert('❌ Error starting system: ' + error.message);
        }
    }
}

async function stopEntireSystem() {
    if (confirm('⚠️ This will stop the ENTIRE Phone Configuration Generator system.\nAll services will be stopped and users will lose access.\n\nContinue?')) {
        try {
            const response = await fetch('/api/system/stop', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert('✅ System Stopped\n\nAll services have been stopped.');
            } else {
                alert('❌ Failed to stop system: ' + result.error);
            }
        } catch (error) {
            alert('❌ Error stopping system: ' + error.message);
        }
    }
}

async function refreshLogs() {
    await app.refreshLogs();
}

async function checkPorts() {
    await app.checkPorts();
}

async function checkSSL() {
    await app.checkSSL();
}

async function checkDependencies() {
    await app.checkDependencies();
}

//=============================================================================
// Terminal Functions
//=============================================================================

let terminalHistory = [];
let terminalHistoryIndex = -1;
let commandCounter = 0;

function executeCommand() {
    const input = document.getElementById('terminal-input');
    const command = input.value.trim();
    
    if (!command) return;
    
    // Add to history
    terminalHistory.push(command);
    terminalHistoryIndex = terminalHistory.length;
    
    // Clear input
    input.value = '';
    
    // Show command in terminal
    const output = document.getElementById('terminal-output');
    const commandId = ++commandCounter;
    
    // Add command to output
    const commandDiv = document.createElement('div');
    commandDiv.innerHTML = `<span class="terminal-command">$ ${command}</span>`;
    output.appendChild(commandDiv);
    
    // Scroll to bottom
    output.scrollTop = output.scrollHeight;
    
    // Send command via WebSocket
    app.socket.emit('terminal-command', {
        command: command,
        id: commandId
    });
}

function insertCommand(command) {
    const input = document.getElementById('terminal-input');
    input.value = command;
    input.focus();
}

function clearTerminal() {
    const output = document.getElementById('terminal-output');
    output.innerHTML = `
        <div class="terminal-welcome">
            🖥️ <strong>Phone Config Manager Terminal</strong><br>
            Ready to execute commands. Type your command and press Enter.<br>
            <small class="text-muted">Current directory: /home/tim2/v3_PYMSC/PolycomYealinkMikrotikSwitchConfig</small><br>
            <hr>
        </div>
    `;
}

// Handle terminal input events
document.addEventListener('DOMContentLoaded', () => {
    const terminalInput = document.getElementById('terminal-input');
    
    if (terminalInput) {
        // Handle Enter key
        terminalInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                executeCommand();
            }
        });
        
        // Handle arrow keys for history
        terminalInput.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (terminalHistoryIndex > 0) {
                    terminalHistoryIndex--;
                    terminalInput.value = terminalHistory[terminalHistoryIndex];
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (terminalHistoryIndex < terminalHistory.length - 1) {
                    terminalHistoryIndex++;
                    terminalInput.value = terminalHistory[terminalHistoryIndex];
                } else {
                    terminalHistoryIndex = terminalHistory.length;
                    terminalInput.value = '';
                }
            }
        });
    }
});

// Initialize the application
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new ManagementConsole();
});
