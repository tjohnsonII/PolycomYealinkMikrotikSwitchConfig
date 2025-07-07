import React, { useState, useRef } from 'react';
import TerminalPanel from '../components/TerminalPanel';

const Diagnostic: React.FC = () => {
  // VPN connection state
  const [vpnStatus, setVpnStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [vpnConfig, setVpnConfig] = useState({
    serverHost: '',
    serverPort: '1194',
    username: '',
    password: '',
    configFile: null as File | null
  });
  const [logs, setLogs] = useState<string[]>([]);
  const [pbxServers, setPbxServers] = useState([
    { name: 'Primary PBX', host: '', port: '5060', status: 'unknown' as 'unknown' | 'reachable' | 'unreachable' | 'testing' },
    { name: 'Secondary PBX', host: '', port: '5060', status: 'unknown' as 'unknown' | 'reachable' | 'unreachable' | 'testing' }
  ]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add log entry
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-49), `[${timestamp}] ${message}`]);
  };

  // Simulate VPN connection process
  const connectVPN = async () => {
    if (!vpnConfig.configFile && (!vpnConfig.serverHost || !vpnConfig.username || !vpnConfig.password)) {
      addLog('❌ Missing VPN configuration. Please provide config file or server details.');
      return;
    }

    setVpnStatus('connecting');
    addLog('🔄 Initiating VPN connection...');
    
    try {
      // Simulate connection process
      addLog('📡 Connecting to VPN server...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      addLog('🔐 Authenticating credentials...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      addLog('🛡️ Establishing secure tunnel...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setVpnStatus('connected');
      addLog('✅ VPN connection established successfully!');
      addLog('🌐 VPN IP: 10.8.0.2 (example)');
      
      // Auto-test PBX servers after VPN connection
      setTimeout(() => testAllPbxServers(), 1000);
      
    } catch (error) {
      setVpnStatus('error');
      addLog('❌ VPN connection failed: ' + (error as Error).message);
    }
  };

  // Disconnect VPN
  const disconnectVPN = () => {
    setVpnStatus('disconnected');
    addLog('🔌 VPN disconnected');
    // Reset PBX status when VPN disconnects
    setPbxServers(prev => prev.map(server => ({ ...server, status: 'unknown' })));
  };

  // Test individual PBX server
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
      // Simulate network test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate random success/failure for demo
      const isReachable = Math.random() > 0.3;
      
      if (isReachable) {
        setPbxServers(prev => prev.map((s, i) => i === index ? { ...s, status: 'reachable' } : s));
        addLog(`✅ ${server.name}: Reachable via VPN`);
      } else {
        setPbxServers(prev => prev.map((s, i) => i === index ? { ...s, status: 'unreachable' } : s));
        addLog(`❌ ${server.name}: Unreachable`);
      }
    } catch (error) {
      setPbxServers(prev => prev.map((s, i) => i === index ? { ...s, status: 'unreachable' } : s));
      addLog(`❌ ${server.name}: Test failed - ${(error as Error).message}`);
    }
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
          <h3>VPN Configuration</h3>
          
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
            />
            {vpnConfig.configFile && (
              <div style={{ fontSize: '14px', color: '#28a745' }}>
                ✅ {vpnConfig.configFile.name}
              </div>
            )}
          </div>

          <div style={{ fontSize: '14px', marginBottom: '15px', fontStyle: 'italic' }}>
            <strong>OR</strong> manually enter server details:
          </div>

          {/* Manual Configuration */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>Server Host:</label>
              <input
                type="text"
                value={vpnConfig.serverHost}
                onChange={e => setVpnConfig(prev => ({ ...prev, serverHost: e.target.value }))}
                placeholder="vpn.yourcompany.com"
                style={{ width: '100%', padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
                disabled={vpnStatus === 'connecting'}
              />
            </div>
            <div>
              <label style={{ fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>Port:</label>
              <input
                type="text"
                value={vpnConfig.serverPort}
                onChange={e => setVpnConfig(prev => ({ ...prev, serverPort: e.target.value }))}
                placeholder="1194"
                style={{ width: '100%', padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
                disabled={vpnStatus === 'connecting'}
              />
            </div>
            <div>
              <label style={{ fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>Username:</label>
              <input
                type="text"
                value={vpnConfig.username}
                onChange={e => setVpnConfig(prev => ({ ...prev, username: e.target.value }))}
                placeholder="your-username"
                style={{ width: '100%', padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
                disabled={vpnStatus === 'connecting'}
              />
            </div>
            <div>
              <label style={{ fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>Password:</label>
              <input
                type="password"
                value={vpnConfig.password}
                onChange={e => setVpnConfig(prev => ({ ...prev, password: e.target.value }))}
                placeholder="your-password"
                style={{ width: '100%', padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
                disabled={vpnStatus === 'connecting'}
              />
            </div>
          </div>

          {/* VPN Control Buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={connectVPN}
              disabled={vpnStatus === 'connecting' || vpnStatus === 'connected'}
              style={{
                backgroundColor: vpnStatus === 'connected' ? '#6c757d' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 16px',
                cursor: vpnStatus === 'connecting' || vpnStatus === 'connected' ? 'not-allowed' : 'pointer',
                fontWeight: 'bold'
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
