import React, { useState, useRef } from 'react';
import TerminalPanel from '../components/TerminalPanel';

const Diagnostic: React.FC = () => {
  // VPN connection state
  const [vpnStatus, setVpnStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [vpnConfig, setVpnConfig] = useState({
    configFile: null as File | null
  });
  const [logs, setLogs] = useState<string[]>([]);
  const [pbxServers, setPbxServers] = useState([
    { name: 'Primary PBX', host: '69.39.69.102', port: '5060', status: 'unknown' as 'unknown' | 'reachable' | 'unreachable' | 'testing' },
    { name: 'Secondary PBX', host: 'pbx.example.com', port: '5060', status: 'unknown' as 'unknown' | 'reachable' | 'unreachable' | 'testing' }
  ]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load VPN status on component mount
  React.useEffect(() => {
    loadVpnStatus();
  }, []);

  // Load current VPN status from backend
  const loadVpnStatus = async () => {
    try {
      const response = await fetch('http://localhost:3001/vpn/status');
      if (response.ok) {
        const status = await response.json();
        setVpnStatus(status.status);
        
        if (status.logs && status.logs.length > 0) {
          setLogs(status.logs);
        }

        // If connected, test PBX servers
        if (status.status === 'connected') {
          setTimeout(() => testAllPbxServers(), 1000);
        }
      }
    } catch (error) {
      console.error('Failed to load VPN status:', error);
    }
  };

  // Add log entry
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-49), `[${timestamp}] ${message}`]);
  };

  // Real VPN connection using OpenVPN
  const connectVPN = async () => {
    if (!vpnConfig.configFile) {
      addLog('❌ Please select an OpenVPN config file (.ovpn)');
      return;
    }

    setVpnStatus('connecting');
    
    try {
      // First upload the config file
      const fileContent = await readFileAsText(vpnConfig.configFile);
      
      const uploadResponse = await fetch('http://localhost:3001/vpn/upload-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: vpnConfig.configFile.name,
          content: fileContent
        })
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload config file');
      }

      addLog(`� Config file uploaded: ${vpnConfig.configFile.name}`);

      // Start VPN connection
      const connectResponse = await fetch('http://localhost:3001/vpn/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!connectResponse.ok) {
        const error = await connectResponse.json();
        throw new Error(error.error || 'Failed to connect VPN');
      }

      // Start polling for status updates
      pollVpnStatus();
      
    } catch (error) {
      setVpnStatus('error');
      addLog('❌ VPN connection failed: ' + (error as Error).message);
    }
  };

  // Helper function to read file as text
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  // Poll VPN status and update UI
  const pollVpnStatus = async () => {
    try {
      const response = await fetch('http://localhost:3001/vpn/status');
      if (response.ok) {
        const status = await response.json();
        
        setVpnStatus(status.status);
        
        // Add new logs
        if (status.logs && status.logs.length > 0) {
          const newLogs = status.logs.filter((log: string) => !logs.includes(log));
          if (newLogs.length > 0) {
            setLogs(prev => [...prev, ...newLogs].slice(-50));
          }
        }

        // If connected, test PBX servers
        if (status.status === 'connected' && vpnStatus !== 'connected') {
          setTimeout(() => testAllPbxServers(), 2000);
        }

        // Continue polling if connecting or connected
        if (status.status === 'connecting' || status.status === 'connected') {
          setTimeout(pollVpnStatus, 2000);
        }
      }
    } catch (error) {
      console.error('Failed to poll VPN status:', error);
    }
  };

  // Disconnect VPN
  const disconnectVPN = async () => {
    try {
      const response = await fetch('http://localhost:3001/vpn/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        setVpnStatus('disconnected');
        addLog('🔌 VPN disconnected');
        // Reset PBX status when VPN disconnects
        setPbxServers(prev => prev.map(server => ({ ...server, status: 'unknown' })));
      } else {
        addLog('⚠️ Failed to disconnect VPN');
      }
    } catch (error) {
      addLog('❌ Error disconnecting VPN: ' + (error as Error).message);
    }
  };

  // Test individual PBX server with real network connectivity
  const testPbxServer = async (index: number) => {
    if (vpnStatus !== 'connected') {
      addLog('⚠️ VPN must be connected to test PBX servers');
      return;
    }

    const server = pbxServers[index];
    if (!server.host) {
      addLog(`⚠️ ${server.name}: No host configured`);
      return;
    }

    setPbxServers(prev => prev.map((s, i) => i === index ? { ...s, status: 'testing' } : s));
    addLog(`🔍 Testing ${server.name} (${server.host}:${server.port})...`);

    try {
      // Perform real network connectivity test
      const testResult = await performNetworkTest(server.host, server.port);
      
      if (testResult.success) {
        setPbxServers(prev => prev.map((s, i) => i === index ? { ...s, status: 'reachable' } : s));
        addLog(`✅ ${server.name}: Reachable (${testResult.responseTime}ms)`);
        if (testResult.details) {
          addLog(`   Details: ${testResult.details}`);
        }
      } else {
        setPbxServers(prev => prev.map((s, i) => i === index ? { ...s, status: 'unreachable' } : s));
        addLog(`❌ ${server.name}: ${testResult.error}`);
        if (testResult.troubleshooting) {
          addLog(`   💡 Troubleshooting: ${testResult.troubleshooting}`);
        }
      }
    } catch (error) {
      setPbxServers(prev => prev.map((s, i) => i === index ? { ...s, status: 'unreachable' } : s));
      addLog(`❌ ${server.name}: Test failed - ${(error as Error).message}`);
    }
  };

  // Perform actual network connectivity test
  const performNetworkTest = async (host: string, port: string): Promise<{
    success: boolean;
    responseTime?: number;
    error?: string;
    details?: string;
    troubleshooting?: string;
  }> => {
    const startTime = Date.now();
    
    try {
      // Method 1: Try WebSocket connection to SSH backend for ping test
      const response = await fetch('http://localhost:3001/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host, port: parseInt(port) }),
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (response.ok) {
        const result = await response.json();
        const responseTime = Date.now() - startTime;
        
        if (result.reachable) {
          return {
            success: true,
            responseTime,
            details: result.details || `TCP connection successful on port ${port}`
          };
        } else {
          return {
            success: false,
            error: result.error || 'Host unreachable',
            troubleshooting: getTroubleshootingTips(host, port)
          };
        }
      } else {
        // Fallback to browser-based connectivity test
        return await performBrowserConnectivityTest(host, port);
      }
    } catch (error) {
      // Fallback to browser-based connectivity test
      return await performBrowserConnectivityTest(host, port);
    }
  };

  // Browser-based connectivity test (fallback)
  const performBrowserConnectivityTest = async (host: string, port: string): Promise<{
    success: boolean;
    responseTime?: number;
    error?: string;
    details?: string;
    troubleshooting?: string;
  }> => {
    const startTime = Date.now();
    
    try {
      // Try to resolve domain/ping via fetch with a small timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      // For PBX servers, we can try to connect to HTTP on common ports or use a proxy
      let testUrl = '';
      if (port === '5060' || port === '5061') {
        // SIP ports - test if host is reachable via HTTP ping
        testUrl = `http://${host}:80`; // Try HTTP first
      } else {
        testUrl = `http://${host}:${port}`;
      }
      
      const response = await fetch(testUrl, {
        method: 'GET',
        mode: 'no-cors', // Avoid CORS issues
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      
      return {
        success: true,
        responseTime,
        details: `Host responded (${response.type} response)`
      };
      
    } catch (error) {
      
      if ((error as Error).name === 'AbortError') {
        return {
          success: false,
          error: 'Connection timeout (5s)',
          troubleshooting: getTroubleshootingTips(host, port)
        };
      }
      
      // Network error could mean host is unreachable or port is closed
      return {
        success: false,
        error: `Network error: ${(error as Error).message}`,
        troubleshooting: getTroubleshootingTips(host, port)
      };
    }
  };

  // Get troubleshooting tips based on the test scenario
  const getTroubleshootingTips = (host: string, port: string): string => {
    const tips = [];
    
    if (port === '5060') {
      tips.push('Check if SIP service is running');
      tips.push('Verify firewall allows SIP traffic');
      tips.push('Ensure PBX is configured for your VPN subnet');
    }
    
    if (host.includes('.')) {
      tips.push('Verify DNS resolution is working through VPN');
      tips.push('Try using IP address instead of hostname');
    }
    
    tips.push('Check VPN routing table includes PBX network');
    tips.push('Verify PBX server is powered on and accessible');
    
    return tips.join(', ');
  };

  // Test all PBX servers
  const testAllPbxServers = async () => {
    for (let i = 0; i < pbxServers.length; i++) {
      if (pbxServers[i].host) {
        await testPbxServer(i);
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  };

  // Update PBX server configuration
  const updatePbxServer = (index: number, field: 'name' | 'host' | 'port', value: string) => {
    setPbxServers(prev => prev.map((server, i) => 
      i === index ? { ...server, [field]: value, status: 'unknown' } : server
    ));
  };

  // Handle config file upload
  const handleConfigFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setVpnConfig(prev => ({ ...prev, configFile: file }));
      addLog(`📁 Config file uploaded: ${file.name}`);
    }
  };

  return (
    <div style={{ padding: 32 }}>
      <h1>Diagnostics</h1>
      <p>This page provides diagnostic tools, VPN connectivity, and system monitoring for troubleshooting and support.</p>
      
      {/* VPN Connection Section */}
      <div style={{ margin: '32px 0', maxWidth: 1000 }}>
        <h2>🔐 VPN Connection & PBX Diagnostics</h2>
        
        {/* VPN Status */}
        <div style={{ 
          backgroundColor: vpnStatus === 'connected' ? '#d4edda' : vpnStatus === 'error' ? '#f8d7da' : '#fff3cd',
          border: `1px solid ${vpnStatus === 'connected' ? '#c3e6cb' : vpnStatus === 'error' ? '#f5c6cb' : '#ffeaa7'}`,
          borderRadius: '4px',
          padding: '10px',
          marginBottom: '20px'
        }}>
          <strong>Status: </strong>
          {vpnStatus === 'connected' && '🟢 Connected'}
          {vpnStatus === 'connecting' && '🟡 Connecting...'}
          {vpnStatus === 'disconnected' && '🔴 Disconnected'}
          {vpnStatus === 'error' && '❌ Connection Error'}
        </div>

        {/* VPN Configuration */}
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          border: '1px solid #e9ecef', 
          borderRadius: '6px', 
          padding: '15px', 
          marginBottom: '20px' 
        }}>
          <h3>Work VPN Configuration</h3>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
            Upload your work OpenVPN configuration file to establish a secure connection to the corporate network and test PBX connectivity.
          </p>
          
          {/* Config File Upload */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>
              OpenVPN Config File (.ovpn):
            </label>
            <input
              type="file"
              accept=".ovpn,.conf"
              ref={fileInputRef}
              onChange={handleConfigFileUpload}
              style={{ marginBottom: '5px' }}
              disabled={vpnStatus === 'connecting' || vpnStatus === 'connected'}
            />
            {vpnConfig.configFile && (
              <div style={{ fontSize: '14px', color: '#28a745' }}>
                ✅ {vpnConfig.configFile.name}
              </div>
            )}
            {!vpnConfig.configFile && (
              <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                Select your work VPN .ovpn configuration file
              </div>
            )}
          </div>

          {/* VPN Control Buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={connectVPN}
              disabled={vpnStatus === 'connecting' || vpnStatus === 'connected' || !vpnConfig.configFile}
              style={{
                backgroundColor: vpnStatus === 'connected' ? '#6c757d' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 16px',
                cursor: (vpnStatus === 'connecting' || vpnStatus === 'connected' || !vpnConfig.configFile) ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                opacity: !vpnConfig.configFile ? 0.6 : 1
              }}
            >
              {vpnStatus === 'connecting' ? '🔄 Connecting...' : '🔐 Connect VPN'}
            </button>
            <button
              onClick={disconnectVPN}
              disabled={vpnStatus !== 'connected'}
              style={{
                backgroundColor: vpnStatus === 'connected' ? '#dc3545' : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 16px',
                cursor: vpnStatus === 'connected' ? 'pointer' : 'not-allowed',
                fontWeight: 'bold'
              }}
            >
              🔌 Disconnect
            </button>
          </div>
        </div>

        {/* PBX Server Testing */}
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          border: '1px solid #e9ecef', 
          borderRadius: '6px', 
          padding: '15px', 
          marginBottom: '20px' 
        }}>
          <h3>PBX Server Testing</h3>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
            Configure your PBX servers and test connectivity through the VPN tunnel.
          </p>

          {pbxServers.map((server, index) => (
            <div key={index} style={{ 
              border: '1px solid #ddd', 
              borderRadius: '4px', 
              padding: '10px', 
              marginBottom: '10px',
              backgroundColor: '#fff'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 100px', gap: '10px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={server.name}
                  onChange={e => updatePbxServer(index, 'name', e.target.value)}
                  placeholder="PBX Name"
                  style={{ padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
                <input
                  type="text"
                  value={server.host}
                  onChange={e => updatePbxServer(index, 'host', e.target.value)}
                  placeholder="pbx.example.com"
                  style={{ padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
                <input
                  type="text"
                  value={server.port}
                  onChange={e => updatePbxServer(index, 'port', e.target.value)}
                  placeholder="5060"
                  style={{ padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
                <div style={{ textAlign: 'center' }}>
                  {server.status === 'unknown' && '❓ Unknown'}
                  {server.status === 'testing' && '🔄 Testing...'}
                  {server.status === 'reachable' && '✅ Reachable'}
                  {server.status === 'unreachable' && '❌ Unreachable'}
                </div>
                <button
                  onClick={() => testPbxServer(index)}
                  disabled={vpnStatus !== 'connected' || server.status === 'testing' || !server.host}
                  style={{
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '6px 12px',
                    cursor: (vpnStatus === 'connected' && server.status !== 'testing' && server.host) ? 'pointer' : 'not-allowed',
                    fontSize: '12px'
                  }}
                >
                  Test
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={testAllPbxServers}
            disabled={vpnStatus !== 'connected'}
            style={{
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 16px',
              cursor: vpnStatus === 'connected' ? 'pointer' : 'not-allowed',
              fontWeight: 'bold',
              marginTop: '10px'
            }}
          >
            🧪 Test All PBX Servers
          </button>
        </div>

        {/* Connection Log */}
        <div style={{ 
          backgroundColor: '#000', 
          color: '#00ff00', 
          borderRadius: '4px', 
          padding: '15px', 
          height: '200px', 
          overflowY: 'auto',
          fontFamily: 'monospace',
          fontSize: '12px',
          marginBottom: '20px'
        }}>
          {logs.length === 0 ? (
            <div style={{ color: '#888' }}>VPN connection log will appear here...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index}>{log}</div>
            ))
          )}
        </div>
      </div>

      {/* Troubleshooting Guide */}
      <div style={{
        backgroundColor: '#f8f9fa',
        border: '1px solid #e9ecef',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h3 style={{ 
          color: '#333', 
          marginTop: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          🔧 PBX Connectivity Troubleshooting
        </h3>
        
        <div style={{ marginBottom: '15px' }}>
          <strong>If VPN shows "Connected" but PBX servers are "Unreachable":</strong>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <h4 style={{ color: '#495057', marginBottom: '10px' }}>🔍 Common Issues:</h4>
            <ul style={{ color: '#6c757d', lineHeight: '1.6' }}>
              <li><strong>VPN Routing:</strong> VPN might not route to PBX subnet</li>
              <li><strong>Firewall:</strong> PBX firewall blocking your VPN IP</li>
              <li><strong>Network Segmentation:</strong> PBX on isolated network</li>
              <li><strong>SIP Port:</strong> Port 5060 might be filtered</li>
              <li><strong>DNS Issues:</strong> Hostname not resolving via VPN</li>
            </ul>
          </div>
          
          <div>
            <h4 style={{ color: '#495057', marginBottom: '10px' }}>🛠️ Troubleshooting Steps:</h4>
            <ol style={{ color: '#6c757d', lineHeight: '1.6' }}>
              <li>Check VPN routes: <code>route -n</code> or <code>ip route</code></li>
              <li>Test basic connectivity: <code>ping 69.39.69.102</code></li>
              <li>Test specific port: <code>telnet 69.39.69.102 5060</code></li>
              <li>Try alternative ports (80, 443, 22)</li>
              <li>Contact network admin for PBX firewall rules</li>
            </ol>
          </div>
        </div>
        
        <div style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '4px',
          padding: '12px',
          marginTop: '15px'
        }}>
          <strong>💡 Pro Tip:</strong> Use the SSH Terminal below to run network diagnostic commands directly through the VPN connection.
        </div>
      </div>

      {/* SSH Terminal Section */}
      <div style={{ margin: '32px 0', maxWidth: 900 }}>
        <h2>SSH Terminal (Beta)</h2>
        <TerminalPanel />
      </div>
      {/* Add diagnostic widgets, logs, or tools here as needed */}
    </div>
  );
};

export default Diagnostic;
