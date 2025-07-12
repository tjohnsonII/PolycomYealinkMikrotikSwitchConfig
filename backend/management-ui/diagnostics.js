/**
 * Diagnostics Console JavaScript
 * 
 * Provides network diagnostics and system information tools
 */

class DiagnosticsConsole {
    constructor() {
        this.outputElement = document.getElementById('command-output');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Allow Enter key to trigger ping
        document.getElementById('ping-host').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                runPing();
            }
        });

        // Allow Enter key to trigger traceroute
        document.getElementById('trace-host').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                runTraceroute();
            }
        });
    }

    appendOutput(text, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const colorClass = type === 'error' ? 'color: #ff4444;' : 
                          type === 'success' ? 'color: #44ff44;' : 
                          type === 'warning' ? 'color: #ffff44;' : 
                          'color: #00ff00;';
        
        const line = `<div style="${colorClass}">[${timestamp}] ${text}</div>`;
        this.outputElement.innerHTML += line;
        this.outputElement.scrollTop = this.outputElement.scrollHeight;
    }

    clear() {
        this.outputElement.innerHTML = 'Welcome to System Diagnostics Console\nReady to run network diagnostics...\n';
    }

    async runCommand(endpoint, data = {}) {
        try {
            const response = await fetch(`/api/diagnostics/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            return result;
        } catch (error) {
            this.appendOutput(`Error: ${error.message}`, 'error');
            return { error: error.message };
        }
    }

    async ping(host) {
        this.appendOutput(`🔍 Pinging ${host}...`, 'info');
        
        const result = await this.runCommand('ping', { host });
        
        if (result.success) {
            this.appendOutput(`✅ Ping successful to ${host}`, 'success');
            this.appendOutput(result.output, 'info');
        } else {
            this.appendOutput(`❌ Ping failed to ${host}: ${result.error}`, 'error');
            if (result.output) {
                this.appendOutput(result.output, 'warning');
            }
        }
    }

    async traceroute(host) {
        this.appendOutput(`🗺️ Tracing route to ${host}...`, 'info');
        
        const result = await this.runCommand('traceroute', { host });
        
        if (result.success) {
            this.appendOutput(`✅ Traceroute completed to ${host}`, 'success');
            this.appendOutput(result.output, 'info');
        } else {
            this.appendOutput(`❌ Traceroute failed to ${host}: ${result.error}`, 'error');
            if (result.output) {
                this.appendOutput(result.output, 'warning');
            }
        }
    }

    async getNetworkInterfaces() {
        this.appendOutput('🔌 Getting network interfaces...', 'info');
        
        const result = await this.runCommand('interfaces');
        
        if (result.success) {
            this.appendOutput('✅ Network interfaces:', 'success');
            this.appendOutput(result.output, 'info');
        } else {
            this.appendOutput(`❌ Failed to get network interfaces: ${result.error}`, 'error');
        }
    }

    async getRoutingTable() {
        this.appendOutput('🛣️ Getting routing table...', 'info');
        
        const result = await this.runCommand('routes');
        
        if (result.success) {
            this.appendOutput('✅ Routing table:', 'success');
            this.appendOutput(result.output, 'info');
        } else {
            this.appendOutput(`❌ Failed to get routing table: ${result.error}`, 'error');
        }
    }

    async testDNS() {
        this.appendOutput('🔍 Testing DNS resolution...', 'info');
        
        const testHosts = ['google.com', 'cloudflare.com', 'github.com'];
        
        for (const host of testHosts) {
            const result = await this.runCommand('dns', { host });
            
            if (result.success) {
                this.appendOutput(`✅ DNS resolution for ${host}: ${result.ip}`, 'success');
            } else {
                this.appendOutput(`❌ DNS resolution failed for ${host}: ${result.error}`, 'error');
            }
        }
    }

    async testPorts() {
        this.appendOutput('🔌 Testing port connectivity...', 'info');
        
        const testPorts = [
            { host: 'google.com', port: 80, name: 'HTTP' },
            { host: 'google.com', port: 443, name: 'HTTPS' },
            { host: '8.8.8.8', port: 53, name: 'DNS' },
            { host: '69.39.69.102', port: 5060, name: 'Work PBX' }
        ];
        
        for (const test of testPorts) {
            const result = await this.runCommand('port', { host: test.host, port: test.port });
            
            if (result.success && result.reachable) {
                this.appendOutput(`✅ ${test.name} (${test.host}:${test.port}) - Connected`, 'success');
            } else {
                this.appendOutput(`❌ ${test.name} (${test.host}:${test.port}) - Not reachable`, 'error');
            }
        }
    }
}

// Initialize diagnostics console
const diagnostics = new DiagnosticsConsole();

// Global functions for onclick handlers
async function runPing(preset = null) {
    const host = preset === 'work' ? '69.39.69.102' : document.getElementById('ping-host').value;
    if (!host) {
        alert('Please enter a hostname or IP address');
        return;
    }
    await diagnostics.ping(host);
}

async function runTraceroute(preset = null) {
    const host = preset === 'work' ? '69.39.69.102' : document.getElementById('trace-host').value;
    if (!host) {
        alert('Please enter a hostname or IP address');
        return;
    }
    await diagnostics.traceroute(host);
}

async function getNetworkInterfaces() {
    await diagnostics.getNetworkInterfaces();
}

async function getRoutingTable() {
    await diagnostics.getRoutingTable();
}

async function testDNS() {
    await diagnostics.testDNS();
}

async function testPorts() {
    await diagnostics.testPorts();
}

function clearOutput() {
    diagnostics.clear();
}

// Auto-refresh connection indicator
setInterval(() => {
    const indicator = document.querySelector('.real-time-indicator');
    if (indicator) {
        // Simple health check
        fetch('/api/health')
            .then(response => response.json())
            .then(data => {
                if (data.status === 'healthy') {
                    indicator.style.backgroundColor = '#28a745';
                    indicator.style.animation = 'pulse 2s infinite';
                } else {
                    indicator.style.backgroundColor = '#dc3545';
                    indicator.style.animation = 'none';
                }
            })
            .catch(error => {
                indicator.style.backgroundColor = '#dc3545';
                indicator.style.animation = 'none';
            });
    }
}, 5000);
