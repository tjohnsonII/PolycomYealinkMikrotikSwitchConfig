// VPN Management Console JavaScript

// Debug logging function
function debugLog(message) {
    console.log(message);
    const debugContainer = document.getElementById('debugMessages');
    if (debugContainer) {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.textContent = `[${timestamp}] ${message}`;
        debugContainer.appendChild(logEntry);
        
        // Auto-scroll to bottom
        const container = document.getElementById('debugContainer');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }
}

function clearDebugLog() {
    const debugContainer = document.getElementById('debugMessages');
    if (debugContainer) {
        debugContainer.innerHTML = 'Debug log cleared...';
    }
}

class VPNManager {
    constructor() {
        debugLog('🔧 VPNManager constructor called');
        this.currentStatus = {};
        this.logs = [];
        this.refreshInterval = null;
        this.init();
    }

    init() {
        debugLog('🔧 VPNManager init() called');
        // Load initial status
        this.refreshStatus();
        
        // Set up auto-refresh
        this.startAutoRefresh();
        
        // Set up form handlers
        this.setupFormHandlers();
        debugLog('✅ VPNManager initialization complete');
    }

    async refreshStatus() {
        try {
            const response = await fetch('/api/vpn/status');
            const data = await response.json();
           function connectWorkVPN() {
    debugLog('🏢 Connect Work VPN button clicked');
    if (!vpnManager) {
        debugLog('❌ VPN Manager not initialized!');
        return;
    }
    vpnManager.connectWorkVPN();
}

function connectHomeVPN() {
    debugLog('🏠 Connect Home VPN button clicked');
    if (!vpnManager) {
        debugLog('❌ VPN Manager not initialized!');
        return;
    }
    vpnManager.connectHomeVPN();
}

function connectSamlVPN() {
    debugLog('🔐 Connect SAML VPN button clicked');
    if (!vpnManager) {
        debugLog('❌ VPN Manager not initialized!');
        return;
    }
    vpnManager.connectSamlVPN();
}

function showSamlAuthModal() {
    debugLog('🔐 Show SAML Auth Modal button clicked');
    if (!vpnManager) {
        debugLog('❌ VPN Manager not initialized!');
        return;
    }
    vpnManager.showSamlAuthModal();
}atus = data;
            this.updateStatusDisplay();
        } catch (error) {
            console.error('Error fetching VPN status:', error);
            this.showAlert('Error loading VPN status: ' + error.message, 'danger');
        }
    }

    updateStatusDisplay() {
        const container = document.getElementById('vpnStatusContainer');
        const detailedContainer = document.getElementById('detailedStatusContainer');
        
        if (!this.currentStatus || Object.keys(this.currentStatus).length === 0) {
            container.innerHTML = '<div class="loading">No VPN status data available</div>';
            return;
        }

        // Status overview
        const statusHtml = this.renderStatusOverview();
        container.innerHTML = statusHtml;

        // Detailed status
        const detailedHtml = this.renderDetailedStatus();
        detailedContainer.innerHTML = detailedHtml;
    }

    renderStatusOverview() {
        const status = this.currentStatus;
        let html = '<div class="status-grid">';

        // Overall VPN Status
        const isConnected = status.connected || false;
        const connectionClass = isConnected ? 'status-connected' : 'status-disconnected';
        
        html += `
            <div class="status-item ${connectionClass}">
                <h3>🔐 VPN Status</h3>
                <p><strong>Status:</strong> ${isConnected ? '✅ Connected' : '❌ Disconnected'}</p>
                <p><strong>Config:</strong> ${status.configName || 'None'}</p>
                <p><strong>Last Updated:</strong> ${new Date(status.timestamp || Date.now()).toLocaleString()}</p>
            </div>
        `;

        // Dual VPN Status
        if (status.dualVpn) {
            html += `
                <div class="status-item">
                    <h3>🔄 Dual VPN</h3>
                    <p><strong>Status:</strong> ${status.dualVpn.active ? '✅ Active' : '❌ Inactive'}</p>
                    <p><strong>Home:</strong> ${status.dualVpn.homeStatus || 'Unknown'}</p>
                    <p><strong>Work:</strong> ${status.dualVpn.workStatus || 'Unknown'}</p>
                </div>
            `;
        }

        // System VPN Status
        if (status.systemStatus) {
            const systemStatus = status.systemStatus;
            html += `
                <div class="status-item">
                    <h3>🖥️ System Status</h3>
                    <p><strong>OpenVPN3 Sessions:</strong> ${systemStatus.openvpn3Sessions ? 'Active' : 'None'}</p>
                    <p><strong>TUN Interfaces:</strong> ${systemStatus.tunIfaces ? 'Present' : 'None'}</p>
                    <p><strong>VPN Routes:</strong> ${systemStatus.vpnRoutes ? 'Configured' : 'None'}</p>
                </div>
            `;
        }

        // Error Status
        if (status.error) {
            html += `
                <div class="status-item status-disconnected">
                    <h3>⚠️ Error</h3>
                    <p><strong>Message:</strong> ${status.error}</p>
                    <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                </div>
            `;
        }

        html += '</div>';
        return html;
    }

    renderDetailedStatus() {
        const status = this.currentStatus;
        let html = '<div class="row">';

        // Connection Details
        html += `
            <div class="col-md-6">
                <h4>📡 Connection Details</h4>
                <div class="card">
                    <div class="card-body">
                        <p><strong>Connected:</strong> ${status.connected ? 'Yes' : 'No'}</p>
                        <p><strong>Config Name:</strong> ${status.configName || 'N/A'}</p>
                        <p><strong>Connection Type:</strong> ${status.connectionType || 'N/A'}</p>
                        <p><strong>Server:</strong> ${status.server || 'N/A'}</p>
                        <p><strong>Local IP:</strong> ${status.localIp || 'N/A'}</p>
                        <p><strong>Remote IP:</strong> ${status.remoteIp || 'N/A'}</p>
                    </div>
                </div>
            </div>
        `;

        // System Information
        if (status.systemStatus) {
            const sys = status.systemStatus;
            html += `
                <div class="col-md-6">
                    <h4>🖥️ System Information</h4>
                    <div class="card">
                        <div class="card-body">
                            <p><strong>OpenVPN3 Sessions:</strong></p>
                            <pre style="font-size: 12px; background: #f8f9fa; padding: 10px; border-radius: 4px;">${sys.openvpn3Sessions || 'None'}</pre>
                            <p><strong>TUN Interfaces:</strong></p>
                            <pre style="font-size: 12px; background: #f8f9fa; padding: 10px; border-radius: 4px;">${sys.tunIfaces || 'None'}</pre>
                            <p><strong>TUN IP Addresses:</strong></p>
                            <pre style="font-size: 12px; background: #f8f9fa; padding: 10px; border-radius: 4px;">${sys.tunIps || 'None'}</pre>
                            <p><strong>VPN Routes:</strong></p>
                            <pre style="font-size: 12px; background: #f8f9fa; padding: 10px; border-radius: 4px;">${sys.vpnRoutes || 'None'}</pre>
                        </div>
                    </div>
                </div>
            `;
        }

        html += '</div>';
        return html;
    }

    async refreshLogs() {
        try {
            const response = await fetch('/api/vpn/dual/logs');
            const data = await response.json();
            this.logs = data.logs || [];
            this.updateLogsDisplay();
        } catch (error) {
            console.error('Error fetching logs:', error);
            this.showAlert('Error loading logs: ' + error.message, 'danger');
        }
    }

    updateLogsDisplay() {
        const container = document.getElementById('vpnLogsContainer');
        const logContainer = container.querySelector('.log-container');
        
        if (!this.logs || this.logs.length === 0) {
            logContainer.innerHTML = '<div class="log-entry">No logs available</div>';
            return;
        }

        let html = '';
        this.logs.slice(-50).forEach(log => {
            const logClass = this.getLogClass(log.message);
            html += `<div class="log-entry ${logClass}">[${log.timestamp}] ${log.message}</div>`;
        });

        logContainer.innerHTML = html;
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    getLogClass(message) {
        if (message.includes('ERROR') || message.includes('failed') || message.includes('❌')) {
            return 'error';
        }
        if (message.includes('SUCCESS') || message.includes('connected') || message.includes('✅')) {
            return 'success';
        }
        return 'info';
    }

    async connectWorkVPN() {
        debugLog('🔧 connectWorkVPN method called');
        await this.connectVPN('work');
    }

    async connectHomeVPN() {
        debugLog('🔧 connectHomeVPN method called');
        await this.connectVPN('home');
    }

    async connectSamlVPN() {
        debugLog('🔧 connectSamlVPN method called');
        await this.connectVPN('work', {}, true);
    }

    async connectVPN(name, credentials = {}, useSaml = false) {
        try {
            debugLog('🔧 connectVPN method called: ' + JSON.stringify({ name, useSaml }));
            this.showAlert('Connecting to VPN...', 'info');
            
            const endpoint = useSaml ? '/api/vpn/saml-connect' : '/api/vpn/connect';
            debugLog('📡 Using endpoint: ' + endpoint);
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: name,
                    username: credentials.username,
                    password: credentials.password,
                    samlAuth: useSaml
                })
            });

            const result = await response.json();
            debugLog('📡 API Response: ' + JSON.stringify(result));
            
            if (response.ok && result.success) {
                this.showAlert(`Successfully connected to ${name} VPN`, 'success');
                this.refreshStatus();
            } else {
                let message = `Failed to connect to ${name} VPN: ${result.message || 'Unknown error'}`;
                if (result.authType === 'saml') {
                    message += '\n\nThis VPN requires SAML authentication. Click "🔐 SAML Work VPN" or "📋 SAML Instructions" for guidance.';
                }
                this.showAlert(message, 'danger');
            }
        } catch (error) {
            debugLog('❌ Error connecting to VPN: ' + error.message);
            this.showAlert('Error connecting to VPN: ' + error.message, 'danger');
        }
    }

    async getSamlLoginUrl() {
        try {
            const response = await fetch('/api/vpn/saml-login-url');
            const result = await response.json();
            
            if (response.ok && result.loginUrl) {
                const samlStatus = document.getElementById('samlStatus');
                samlStatus.innerHTML = `
                    <div class="alert alert-info">
                        <h4>🔗 SAML Login URL</h4>
                        <p><strong>Server:</strong> ${result.server}</p>
                        <p><strong>URL:</strong> <a href="${result.loginUrl}" target="_blank">${result.loginUrl}</a></p>
                        <p><strong>Instructions:</strong> Click the link above to authenticate, then return here to connect.</p>
                        <div>
                            <button class="btn btn-primary" onclick="window.open('${result.loginUrl}', '_blank')">🌐 Open SAML Login</button>
                        </div>
                    </div>
                `;
                this.showAlert('SAML login URL retrieved successfully', 'success');
            } else {
                this.showAlert('Failed to get SAML login URL: ' + (result.error || 'Unknown error'), 'danger');
            }
        } catch (error) {
            console.error('Error getting SAML login URL:', error);
            this.showAlert('Error getting SAML login URL: ' + error.message, 'danger');
        }
    }

    async attemptSamlConnection() {
        try {
            this.showAlert('Attempting SAML VPN connection...', 'info');
            
            const response = await fetch('/api/vpn/saml-connect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: 'work'
                })
            });

            const result = await response.json();
            
            if (response.ok && result.success) {
                this.showAlert('SAML VPN connection successful!', 'success');
                this.refreshStatus();
            } else {
                this.showAlert(`SAML VPN connection failed: ${result.message || 'Unknown error'}`, 'danger');
            }
        } catch (error) {
            console.error('Error attempting SAML connection:', error);
            this.showAlert('Error attempting SAML connection: ' + error.message, 'danger');
        }
    }

    showSamlInstructions() {
        document.getElementById('samlInstructionsModal').style.display = 'block';
    }

    showSamlAuthModal() {
        document.getElementById('samlAuthModal').style.display = 'block';
        this.getSamlLoginUrl(); // Automatically get the SAML URL when modal opens
    }

    async openSamlBrowser() {
        try {
            const response = await fetch('/api/vpn/saml-login-url');
            const result = await response.json();
            
            if (response.ok && result.loginUrl) {
                const iframe = document.getElementById('samlIframe');
                iframe.src = result.loginUrl;
                document.getElementById('samlBrowserFrame').style.display = 'block';
                document.getElementById('samlAuthForm').style.display = 'none';
                this.showAlert('SAML login page loaded. Complete authentication in the browser below.', 'info');
            } else {
                this.showAlert('Failed to get SAML login URL: ' + (result.error || 'Unknown error'), 'danger');
            }
        } catch (error) {
            console.error('Error opening SAML browser:', error);
            this.showAlert('Error opening SAML browser: ' + error.message, 'danger');
        }
    }

    async checkSamlAuth() {
        try {
            this.showAlert('Checking SAML authentication and attempting VPN connection...', 'info');
            
            const response = await fetch('/api/vpn/saml-connect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: 'work'
                })
            });

            const result = await response.json();
            
            if (response.ok && result.success) {
                this.showAlert('SAML authentication successful! VPN connected.', 'success');
                this.closeModal('samlAuthModal');
                this.refreshStatus();
            } else {
                this.showAlert(`SAML authentication failed: ${result.message || 'Unknown error'}\n\nTip: Make sure you completed the login process in the browser.`, 'danger');
            }
        } catch (error) {
            console.error('Error checking SAML authentication:', error);
            this.showAlert('Error checking SAML authentication: ' + error.message, 'danger');
        }
    }

    refreshSamlBrowser() {
        const iframe = document.getElementById('samlIframe');
        iframe.src = iframe.src;
        this.showAlert('Browser refreshed. Please complete authentication again.', 'info');
    }

    async openExternalBrowser() {
        try {
            const response = await fetch('/api/vpn/saml-login-url');
            const result = await response.json();
            
            if (response.ok && result.loginUrl) {
                window.open(result.loginUrl, '_blank');
                this.showAlert('SAML login opened in external browser. Complete authentication there, then click "I\'ve Completed Authentication".', 'info');
            } else {
                this.showAlert('Failed to get SAML login URL: ' + (result.error || 'Unknown error'), 'danger');
            }
        } catch (error) {
            console.error('Error opening external browser:', error);
            this.showAlert('Error opening external browser: ' + error.message, 'danger');
        }
    }

    async submitSamlCredentials(formData) {
        try {
            this.showAlert('Submitting SAML credentials...', 'info');
            
            const response = await fetch('/api/vpn/saml-connect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: 'work',
                    username: formData.get('samlUsername'),
                    password: formData.get('samlPassword'),
                    otp: formData.get('samlOtp')
                })
            });

            const result = await response.json();
            
            if (response.ok && result.success) {
                this.showAlert('SAML credentials accepted! VPN connected.', 'success');
                this.closeModal('samlAuthModal');
                this.refreshStatus();
            } else {
                this.showAlert(`SAML authentication failed: ${result.message || 'Unknown error'}\n\nPlease check your credentials and try again.`, 'danger');
            }
        } catch (error) {
            console.error('Error submitting SAML credentials:', error);
            this.showAlert('Error submitting SAML credentials: ' + error.message, 'danger');
        }
    }

    async startDualVPN() {
        try {
            this.showAlert('Starting dual VPN...', 'info');
            
            const response = await fetch('/api/vpn/dual/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({})
            });

            const result = await response.json();
            
            if (response.ok && result.success) {
                this.showAlert('Dual VPN started successfully', 'success');
                this.refreshStatus();
            } else {
                this.showAlert(`Failed to start dual VPN: ${result.message || 'Unknown error'}`, 'danger');
            }
        } catch (error) {
            console.error('Error starting dual VPN:', error);
            this.showAlert('Error starting dual VPN: ' + error.message, 'danger');
        }
    }

    async disconnectAll() {
        try {
            this.showAlert('Disconnecting all VPNs...', 'info');
            
            const response = await fetch('/api/vpn/disconnect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({})
            });

            const result = await response.json();
            
            if (response.ok && result.success) {
                this.showAlert('All VPNs disconnected successfully', 'success');
                this.refreshStatus();
            } else {
                this.showAlert(`Failed to disconnect VPNs: ${result.message || 'Unknown error'}`, 'danger');
            }
        } catch (error) {
            console.error('Error disconnecting VPNs:', error);
            this.showAlert('Error disconnecting VPNs: ' + error.message, 'danger');
        }
    }

    async uploadConfig(name, content) {
        try {
            this.showAlert('Uploading VPN configuration...', 'info');
            
            const response = await fetch('/api/vpn/upload-config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: name,
                    content: content
                })
            });

            const result = await response.json();
            
            if (response.ok && result.success) {
                this.showAlert(`VPN configuration "${name}" uploaded successfully`, 'success');
                this.refreshStatus();
            } else {
                this.showAlert(`Failed to upload configuration: ${result.message || 'Unknown error'}`, 'danger');
            }
        } catch (error) {
            console.error('Error uploading configuration:', error);
            this.showAlert('Error uploading configuration: ' + error.message, 'danger');
        }
    }

    setupFormHandlers() {
        // Connect form
        document.getElementById('connectForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const vpnName = formData.get('vpnName');
            const username = formData.get('username');
            const password = formData.get('password');
            
            await this.connectVPN(vpnName, { username, password });
            this.closeModal('connectModal');
        });

        // Upload form
        document.getElementById('uploadForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const configName = formData.get('configName');
            const configContent = formData.get('configContent');
            
            await this.uploadConfig(configName, configContent);
            this.closeModal('uploadModal');
        });

        // SAML credentials form handler
        document.getElementById('samlCredentialsForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            await this.submitSamlCredentials(formData);
        });
    }

    showAlert(message, type) {
        const container = document.getElementById('alertContainer');
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;
        
        container.appendChild(alert);
        
        // Remove alert after 5 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, 5000);
    }

    showConnectModal() {
        document.getElementById('connectModal').style.display = 'block';
    }

    showUploadModal() {
        document.getElementById('uploadModal').style.display = 'block';
    }

    showHelpModal() {
        document.getElementById('helpModal').style.display = 'block';
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    clearLogs() {
        this.logs = [];
        this.updateLogsDisplay();
    }

    startAutoRefresh() {
        // Refresh every 30 seconds
        this.refreshInterval = setInterval(() => {
            this.refreshStatus();
            this.refreshLogs();
        }, 30000);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }
}

// Global functions for HTML onclick handlers
let vpnManager;

function refreshStatus() {
    vpnManager.refreshStatus();
}

function refreshLogs() {
    vpnManager.refreshLogs();
}

function connectWorkVPN() {
    vpnManager.connectWorkVPN();
}

function connectHomeVPN() {
    vpnManager.connectHomeVPN();
}

function connectSamlVPN() {
    vpnManager.connectSamlVPN();
}

function getSamlLoginUrl() {
    vpnManager.getSamlLoginUrl();
}

function attemptSamlConnection() {
    vpnManager.attemptSamlConnection();
}

function showSamlInstructions() {
    vpnManager.showSamlInstructions();
}

function showSamlAuthModal() {
    vpnManager.showSamlAuthModal();
}

function openSamlBrowser() {
    vpnManager.openSamlBrowser();
}

function checkSamlAuth() {
    vpnManager.checkSamlAuth();
}

function refreshSamlBrowser() {
    vpnManager.refreshSamlBrowser();
}

function openExternalBrowser() {
    vpnManager.openExternalBrowser();
}

function startDualVPN() {
    vpnManager.startDualVPN();
}

function disconnectAll() {
    vpnManager.disconnectAll();
}

function showConnectModal() {
    vpnManager.showConnectModal();
}

function showUploadModal() {
    vpnManager.showUploadModal();
}

function showHelpModal() {
    vpnManager.showHelpModal();
}

function closeModal(modalId) {
    vpnManager.closeModal(modalId);
}

function clearLogs() {
    vpnManager.clearLogs();
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    debugLog('🚀 Initializing VPN Manager...');
    vpnManager = new VPNManager();
    debugLog('✅ VPN Manager initialized successfully');
});

// Add global error handler
window.addEventListener('error', (event) => {
    debugLog('❌ JavaScript Error: ' + event.error);
    if (event.error?.stack) {
        debugLog('📍 Stack: ' + event.error.stack);
    }
});

// Close modals when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}
