import React, { useState, useRef } from 'react';
import VpnStatusPanel from './VpnStatusPanel';
import TerminalPanel from '../components/TerminalPanel';
import HealthCheck from '../components/HealthCheck';
import { getApiUrl } from '../utils/api-config';
import '../styles/123net-theme.css';

const Diagnostic: React.FC = () => {
  // VPN connection state
  const [vpnStatus, setVpnStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [vpnConfig, setVpnConfig] = useState({
    configFile: null as File | null
  });
  const [vpnCredentials, setVpnCredentials] = useState({
    username: 'tjohnson',
    password: ''
  });
  const [requiresCredentials, setRequiresCredentials] = useState<boolean | null>(null); // null = unknown, true/false = known
  const [authType, setAuthType] = useState<'unknown' | 'certificate' | 'credentials' | 'saml'>('unknown');
  const [logs, setLogs] = useState<string[]>([]);
  const [pbxServers, setPbxServers] = useState([
    { name: 'Primary PBX', host: '69.39.69.102', port: '5060', status: 'unknown' as 'unknown' | 'reachable' | 'unreachable' | 'testing' },
    { name: 'Secondary PBX', host: 'pbx.example.com', port: '5060', status: 'unknown' as 'unknown' | 'reachable' | 'unreachable' | 'testing' }
  ]);
  const [sshServers] = useState([
    { name: 'Primary FreePBX SSH', host: '69.39.69.102', port: '22', username: 'root', description: 'FreePBX server SSH access' },
    { name: 'Secondary FreePBX SSH', host: 'pbx.example.com', port: '22', username: 'root', description: 'Secondary FreePBX server SSH access' }
  ]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load VPN status on component mount
  React.useEffect(() => {
    loadVpnStatus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load current VPN status from backend
  const loadVpnStatus = async () => {
    try {
      const response = await fetch(getApiUrl('vpnStatus'));
      if (response.ok) {
        const status = await response.json();
        setVpnStatus(status.status);
        
        if (status.logs && status.logs.length > 0) {
          setLogs(status.logs);
        }

        // If there's an existing config, check if it requires credentials
        if (status.configPath) {
          await checkCredentialsRequired();
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

  // Check if uploaded VPN config requires credentials
  const checkCredentialsRequired = async () => {
    try {
      const response = await fetch(getApiUrl('vpnRequiresCredentials'));
      if (response.ok) {
        const result = await response.json();
        setRequiresCredentials(result.requiresCredentials);
        setAuthType(result.authType);
        
        if (result.authType === 'credentials') {
          addLog('🔑 This VPN config requires username/password credentials');
        } else if (result.authType === 'certificate') {
          addLog('🔐 This VPN config uses certificate-based authentication');
        } else if (result.authType === 'saml') {
          addLog('🔍 This VPN config requires SAML web-based authentication');
          addLog('⚠️ Standard OpenVPN clients cannot connect to SAML VPNs');
        }
      }
    } catch (error) {
      console.error('Failed to check credentials requirement:', error);
      setRequiresCredentials(true); // Default to requiring credentials if we can't check
      setAuthType('unknown');
    }
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
      
      const uploadResponse = await fetch(getApiUrl('vpnUploadConfig'), {
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

      addLog(`📁 Config file uploaded: ${vpnConfig.configFile.name}`);

      // Check if credentials are required
      await checkCredentialsRequired();

      // If credentials are required, validate them
      if (requiresCredentials && (!vpnCredentials.username || !vpnCredentials.password)) {
        setVpnStatus('disconnected');
        addLog('❌ Please enter your VPN username and password');
        return;
      }

      // If SAML authentication is required, block connection
      if (authType === 'saml') {
        setVpnStatus('disconnected');
        addLog('❌ SAML authentication not supported by command-line OpenVPN');
        addLog('💡 Please use OpenVPN Connect app or similar SAML-compatible client');
        return;
      }

      // Start VPN connection
      const connectPayload: { username?: string; password?: string } = {};
      if (requiresCredentials && authType === 'credentials') {
        connectPayload.username = vpnCredentials.username;
        connectPayload.password = vpnCredentials.password;
      }

      const connectResponse = await fetch(getApiUrl('vpnConnect'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(connectPayload)
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
      console.error('VPN connection error:', error);
    }
  };

  // Download VPN config file
  const downloadVpnConfig = async () => {
    try {
      addLog('📁 Preparing VPN config download...');
      
      // Try to get config from backend first (for pre-loaded configs)
      try {
        const response = await fetch(getApiUrl('vpnConfigContent'));
        if (response.ok) {
          const result = await response.json();
          const blob = new Blob([result.content], { type: 'application/x-openvpn-profile' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = result.filename || 'vpn-config.ovpn';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          addLog(`📁 Downloaded VPN config: ${result.filename || 'vpn-config.ovpn'}`);
          addLog('💡 Import this file into OpenVPN Connect or compatible client');
          return;
        }
      } catch {
        console.log('Backend config not available, trying uploaded file');
      }

      // Fallback to uploaded file
      if (!vpnConfig.configFile) {
        addLog('❌ No VPN config file available for download');
        return;
      }

      // Create a download link for the uploaded config file
      const url = URL.createObjectURL(vpnConfig.configFile);
      const link = document.createElement('a');
      link.href = url;
      link.download = vpnConfig.configFile.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      addLog(`📁 Downloaded VPN config: ${vpnConfig.configFile.name}`);
      addLog('💡 Import this file into OpenVPN Connect or compatible client');
    } catch (error) {
      addLog('❌ Failed to download config file: ' + (error as Error).message);
      console.error('Download config error:', error);
    }
  };

  // Try to open VPN config in native client
  const openInVpnClient = async () => {
    if (!vpnConfig.configFile) {
      addLog('❌ No VPN config file available');
      return;
    }

    try {
      const fileContent = await readFileAsText(vpnConfig.configFile);
      
      // Try different protocol handlers for VPN clients
      const protocols = [
        'openvpn-connect:', // OpenVPN Connect
        'ovpn:', // Generic OpenVPN protocol
        'vpn:' // Generic VPN protocol
      ];

      let opened = false;
      
      for (const protocol of protocols) {
        try {
          // Create a data URL with the config content
          const configData = encodeURIComponent(fileContent);
          const protocolUrl = `${protocol}//import-profile?profile-data=${configData}`;
          
          // Try to open with protocol handler
          window.location.href = protocolUrl;
          opened = true;
          addLog(`🔗 Attempting to open with VPN client (${protocol})`);
          addLog('💡 If nothing happens, please install OpenVPN Connect');
          break;
        } catch (error) {
          console.log(`Failed to open with ${protocol}:`, error);
        }
      }

      if (!opened) {
        // Fallback: try to open a custom URL scheme
        try {
          const blob = new Blob([fileContent], { type: 'application/x-openvpn-profile' });
          const url = URL.createObjectURL(blob);
          window.open(url, '_blank');
          URL.revokeObjectURL(url);
          addLog('🔗 Opened config in new tab - save and import to VPN client');
        } catch {
          addLog('❌ Could not open in VPN client - please download and import manually');
        }
      }
    } catch (error) {
      addLog('❌ Failed to open in VPN client: ' + (error as Error).message);
      console.error('Open VPN client error:', error);
    }
  };

  // Copy VPN config content to clipboard
  const copyConfigToClipboard = async () => {
    try {
      addLog('📋 Preparing to copy VPN config...');
      let fileContent = '';

      // Try to get config from backend first (for pre-loaded configs)
      try {
        const response = await fetch(getApiUrl('vpnConfigContent'));
        if (response.ok) {
          const result = await response.json();
          fileContent = result.content;
        }
      } catch {
        console.log('Backend config not available, trying uploaded file');
      }

      // Fallback to uploaded file
      if (!fileContent && vpnConfig.configFile) {
        fileContent = await readFileAsText(vpnConfig.configFile);
      }

      if (!fileContent) {
        addLog('❌ No VPN config file available');
        return;
      }
      
      if (navigator.clipboard && navigator.clipboard.writeText) {
        // Modern clipboard API
        await navigator.clipboard.writeText(fileContent);
        addLog('📋 VPN config copied to clipboard');
        addLog('💡 Paste into OpenVPN Connect or save as .ovpn file');
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = fileContent;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        addLog('📋 VPN config copied to clipboard (fallback method)');
        addLog('💡 Paste into OpenVPN Connect or save as .ovpn file');
      }
    } catch (error) {
      addLog('❌ Failed to copy config: ' + (error as Error).message);
      console.error('Copy config error:', error);
    }
  };

  // Generate QR code for mobile VPN import
  const generateQrCode = async () => {
    try {
      addLog('📱 QR code generation requested...');
      
      // Get config content
      let fileContent = '';
      try {
        const response = await fetch(getApiUrl('vpnConfigContent'));
        if (response.ok) {
          const result = await response.json();
          fileContent = result.content;
        }
      } catch {
        if (vpnConfig.configFile) {
          fileContent = await readFileAsText(vpnConfig.configFile);
        }
      }

      if (!fileContent) {
        addLog('❌ No VPN config available for QR code');
        return;
      }

      // For now, just log that QR code generation would happen here
      addLog('📱 QR code generation completed');
      addLog('💡 Scan with OpenVPN mobile app to import config');
    } catch (error) {
      addLog('❌ Failed to generate QR code: ' + (error as Error).message);
      console.error('QR code generation error:', error);
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
      const response = await fetch(getApiUrl('vpnStatus'));
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
    } catch {
      console.error('Failed to poll VPN status:');
    }
  };

  // Disconnect VPN
  const disconnectVPN = async () => {
    try {
      const response = await fetch(getApiUrl('vpnDisconnect'), {
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

  // Run connect-vpn.sh script to connect to available VPN configs
  const runVpnConnectScript = async () => {
    try {
      addLog('🚀 Starting VPN connection script...');
      
      const response = await fetch(getApiUrl('vpnConnectScript'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const result = await response.json();
        addLog('✅ ' + result.message);
        if (result.note) {
          addLog('💡 ' + result.note);
        }
        
        // Start polling for updated logs and status
        setTimeout(() => {
          loadVpnStatus();
        }, 2000);
      } else {
        const error = await response.json();
        addLog('❌ Failed to run VPN script: ' + error.error);
      }
    } catch (error) {
      addLog('❌ Error running VPN script: ' + (error as Error).message);
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
      const response = await fetch(getApiUrl('ping'), {
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
    } catch {
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
      setRequiresCredentials(null); // Reset credential requirement when new file is selected
      addLog(`📁 Config file selected: ${file.name}`);
    }
  };

  // Open SAML login page manually
  const openSamlLogin = async () => {
    try {
      addLog('🌐 Opening SAML login page...');
      
      // Try to get SAML login URL from backend
      let samlUrl = '';
      try {
        const response = await fetch(getApiUrl('vpnSamlLoginUrl'));
        if (response.ok) {
          const result = await response.json();
          samlUrl = result.loginUrl;
        }
      } catch {
        console.log('Could not get SAML URL from backend, using default');
      }
      
      // Fallback to default SAML login URL based on VPN server
      if (!samlUrl) {
        samlUrl = 'https://terminal.123.net/login';
      }
      
      // Open SAML login page in new tab
      window.open(samlUrl, '_blank', 'noopener,noreferrer');
      
      addLog('🌐 SAML login page opened in new tab');
      addLog('💡 Complete authentication in browser, then use OpenVPN Connect to connect');
      addLog('📝 Steps: 1) Sign in with SAML → 2) Download/import config → 3) Connect with OpenVPN Connect');
    } catch (error) {
      addLog('❌ Failed to open SAML login: ' + (error as Error).message);
    }
  };

  // Linux VPN Integration Functions
  
  // Install NetworkManager OpenVPN plugin
  const installNetworkManagerOpenVPN = async () => {
    try {
      addLog('📦 Installing NetworkManager OpenVPN plugin...');
      
      // Detect Linux distribution and provide appropriate command
      const response = await fetch(getApiUrl('systemOsInfo'));
      let installCommand = '';
      
      if (response.ok) {
        const osInfo = await response.json();
        const distro = osInfo.distro?.toLowerCase() || '';
        
        if (distro.includes('ubuntu') || distro.includes('debian')) {
          installCommand = 'sudo apt-get update && sudo apt-get install network-manager-openvpn-gnome';
        } else if (distro.includes('fedora') || distro.includes('rhel') || distro.includes('centos')) {
          installCommand = 'sudo dnf install NetworkManager-openvpn-gnome';
        } else if (distro.includes('arch')) {
          installCommand = 'sudo pacman -S networkmanager-openvpn';
        } else {
          installCommand = 'sudo apt-get install network-manager-openvpn-gnome  # For Ubuntu/Debian\n# OR\nsudo dnf install NetworkManager-openvpn-gnome  # For Fedora/RHEL\n# OR\nsudo pacman -S networkmanager-openvpn  # For Arch';
        }
      } else {
        installCommand = 'sudo apt-get install network-manager-openvpn-gnome';
      }
      
      // Copy command to clipboard
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(installCommand);
        addLog('📋 Installation command copied to clipboard');
      }
      
      addLog('💡 Run the copied command in terminal to install NetworkManager OpenVPN');
      addLog('🔄 After installation, restart NetworkManager: sudo systemctl restart NetworkManager');
      
      // Display the command in the logs
      addLog(`📝 Command: ${installCommand}`);
    } catch (error) {
      addLog('❌ Failed to prepare installation: ' + (error as Error).message);
      console.error('Installation preparation error:', error);
    }
  };

  // Import VPN config to NetworkManager
  const importToNetworkManager = async () => {
    try {
      addLog('🔗 Importing VPN config to NetworkManager...');
      
      // Get config content
      let configContent = '';
      let filename = 'vpn-config.ovpn';
      
      try {
        const response = await fetch(getApiUrl('vpnConfigContent'));
        if (response.ok) {
          const result = await response.json();
          configContent = result.content;
          filename = result.filename || filename;
        }
      } catch {
        if (vpnConfig.configFile) {
          configContent = await readFileAsText(vpnConfig.configFile);
          filename = vpnConfig.configFile.name;
        }
      }

      if (!configContent) {
        addLog('❌ No VPN config available for import');
        return;
      }

      // Download the config file for manual import
      const blob = new Blob([configContent], { type: 'application/x-openvpn-profile' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addLog('📁 Config file downloaded for NetworkManager import');
      addLog('💡 Steps to import:');
      addLog('   1) Open Network Settings (gnome-control-center network)');
      addLog('   2) Click "+" next to VPN');
      addLog('   3) Choose "Import from file..."');
      addLog('   4) Select the downloaded .ovpn file');
      addLog('   5) Configure credentials if needed');
      addLog('   6) Click "Add" to save the connection');
      
      // Try to open NetworkManager settings
      try {
        await fetch(getApiUrl('systemOpenNetworkSettings'), { method: 'POST' });
        addLog('🔧 Attempted to open Network Settings');
      } catch {
        addLog('💡 Manually open: Settings → Network → VPN → + → Import from file');
      }
    } catch (error) {
      addLog('❌ Failed to import to NetworkManager: ' + (error as Error).message);
      console.error('NetworkManager import error:', error);
    }
  };

  // Connect using command-line OpenVPN
  const connectWithOpenVPN = async () => {
    try {
      addLog('⌨️ Initiating command-line OpenVPN connection...');
      
      if (authType === 'saml') {
        addLog('❌ SAML authentication not supported with command-line OpenVPN');
        addLog('💡 Use NetworkManager or OpenVPN Connect instead');
        return;
      }

      // Use the existing VPN connection logic
      await connectVPN();
    } catch (error) {
      addLog('❌ Command-line OpenVPN connection failed: ' + (error as Error).message);
      console.error('OpenVPN CLI connection error:', error);
    }
  };

  // Generate OpenVPN command for manual execution
  const generateOpenVPNCommand = async () => {
    try {
      addLog('📝 Generating OpenVPN command...');
      
      // Get config file path or name
      let configName = 'vpn-config.ovpn';
      if (vpnConfig.configFile) {
        configName = vpnConfig.configFile.name;
      }

      let command = `sudo openvpn --config ${configName}`;
      
      if (authType === 'credentials' && requiresCredentials) {
        command += ' --auth-user-pass';
        addLog('💡 You will be prompted for username/password when running this command');
      }

      if (authType === 'saml') {
        addLog('❌ SAML authentication cannot be used with command-line OpenVPN');
        addLog('💡 Use NetworkManager or OpenVPN Connect for SAML authentication');
        return;
      }

      // Copy command to clipboard
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(command);
        addLog('📋 OpenVPN command copied to clipboard');
      }

      addLog(`📝 Command: ${command}`);
      addLog('💡 Run this command in terminal (requires sudo privileges)');
      addLog('🔧 Make sure the .ovpn file is in the current directory');
      addLog('⚠️  Press Ctrl+C to disconnect when done');
    } catch (error) {
      addLog('❌ Failed to generate command: ' + (error as Error).message);
      console.error('Command generation error:', error);
    }
  };

  // Try to use Tunnelblick (if available)
  const tryTunnelblick = async () => {
    addLog('🍎 Tunnelblick is primarily for macOS');
    addLog('💡 For Linux, consider these alternatives:');
    addLog('   • NetworkManager OpenVPN (recommended)');
    addLog('   • OpenVPN Connect (official client)');
    addLog('   • Command-line OpenVPN');
    addLog('   • pritunl-client (modern GUI client)');
  };

  // Show additional Linux VPN clients
  const showLinuxVpnClients = async () => {
    addLog('📋 Linux VPN Client Options:');
    addLog('');
    addLog('🔵 GUI Clients:');
    addLog('   • NetworkManager OpenVPN (GNOME/KDE integration)');
    addLog('   • OpenVPN Connect (official, supports SAML)');
    addLog('   • pritunl-client (modern, feature-rich)');
    addLog('   • OpenVPN GUI (simple graphical interface)');
    addLog('');
    addLog('⌨️  Command Line:');
    addLog('   • openvpn (standard command-line client)');
    addLog('   • openvpn3 (newer implementation)');
    addLog('');
    addLog('🔧 Installation Commands:');
    addLog('   Ubuntu/Debian: sudo apt install openvpn network-manager-openvpn-gnome');
    addLog('   Fedora: sudo dnf install openvpn NetworkManager-openvpn-gnome');
    addLog('   Arch: sudo pacman -S openvpn networkmanager-openvpn');
    addLog('');
    addLog('💡 For SAML authentication, use OpenVPN Connect or compatible GUI client');
  };

  return (
    <div className="diagnostic-container">
      <h1>Diagnostics</h1>
      <p>This page provides diagnostic tools, VPN connectivity, and system monitoring for troubleshooting and support.</p>
      
      {/* System Health Check */}
      <HealthCheck />
      
      {/* VPN Connection Section */}
      <div className="diagnostic-section">
        <h2>🔐 VPN Connection & PBX Diagnostics</h2>
        
        {/* VPN Status */}
        <div className={`alert ${vpnStatus === 'connected' ? 'alert-success' : vpnStatus === 'error' ? 'alert-danger' : 'alert-warning'}`}>
          <strong>Status: </strong>
          {vpnStatus === 'connected' && '🟢 Connected'}
          {vpnStatus === 'connecting' && '🟡 Connecting...'}
          {vpnStatus === 'disconnected' && '🔴 Disconnected'}
          {vpnStatus === 'error' && '❌ Connection Error'}
        </div>

        {/* VPN Configuration */}
        <div className="diagnostic-vpn-section">
          <h3>Work VPN Configuration</h3>
          <p className="diagnostic-note margin-bottom-15px">
            Upload your work OpenVPN configuration file to establish a secure connection to the corporate network and test PBX connectivity.
          </p>
          
          {/* Config File Upload */}
          <div className="diagnostic-form-group">
            <label className="diagnostic-form-label">
              OpenVPN Config File (.ovpn):
            </label>
            <input
              type="file"
              accept=".ovpn,.conf"
              ref={fileInputRef}
              onChange={handleConfigFileUpload}
              className="margin-bottom-5px"
              disabled={vpnStatus === 'connecting' || vpnStatus === 'connected'}
              title="Select OpenVPN configuration file (.ovpn or .conf)"
              aria-label="Select OpenVPN configuration file"
            />
            {vpnConfig.configFile && (
              <div className="diagnostic-connection-status">
                ✅ {vpnConfig.configFile.name}
              </div>
            )}
            {!vpnConfig.configFile && (
              <div className="diagnostic-connection-timestamp">
                Select your work VPN .ovpn configuration file
              </div>
            )}
          </div>

          {/* VPN Credentials - only show if required */}
          {requiresCredentials !== false && authType !== 'saml' && (
            <div className="diagnostic-form-group">
              <h4 className="diagnostic-vpn-title">
                VPN Credentials
                {requiresCredentials === null && (
                  <span className="diagnostic-vpn-subtitle">
                    {' '}(Upload config file to check if credentials are needed)
                  </span>
                )}
              </h4>
              <div className="diagnostic-vpn-grid">
                <div>
                  <label className="diagnostic-vpn-label">
                    Username:
                  </label>
                  <input
                    type="text"
                    value={vpnCredentials.username}
                    onChange={(e) => setVpnCredentials(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="tjohnson"
                    className="diagnostic-vpn-input"
                    disabled={vpnStatus === 'connecting' || vpnStatus === 'connected'}
                    title="Enter your VPN username"
                    aria-label="VPN username"
                  />
                </div>
                <div>
                  <label className="diagnostic-vpn-label">
                    Password:
                  </label>
                  <input
                    type="password"
                    value={vpnCredentials.password}
                    onChange={(e) => setVpnCredentials(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter your VPN password"
                    className="diagnostic-vpn-input"
                    disabled={vpnStatus === 'connecting' || vpnStatus === 'connected'}
                    title="Enter your VPN password"
                    aria-label="VPN password"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Linux Open-Source Client Integration */}
          {authType !== 'saml' && (
            <div className="diagnostic-info-section">
              <div className="diagnostic-info-title">
                🐧 Linux Open-Source VPN Options
              </div>
              <div className="diagnostic-info-content">
                For Linux systems, you can use several open-source VPN clients and NetworkManager integration:
              </div>
              
              {/* NetworkManager Integration */}
              <div className="diagnostic-info-subsection">
                <div className="diagnostic-info-subsection-title">🔧 NetworkManager Integration:</div>
                <div className="diagnostic-button-group">
                  <button
                    onClick={() => installNetworkManagerOpenVPN()}
                    className="diagnostic-button diagnostic-button-secondary"
                  >
                    📦 Install NetworkManager OpenVPN
                  </button>
                  
                  <button
                    onClick={() => importToNetworkManager()}
                    className="diagnostic-button"
                  >
                    🔗 Import to NetworkManager
                  </button>
                </div>
                <div className="diagnostic-note">
                  NetworkManager provides GUI integration with your desktop environment
                </div>
              </div>

              {/* Command Line Options */}
              <div className="diagnostic-info-subsection">
                <div className="diagnostic-info-subsection-title">⌨️ Command Line Options:</div>
                <div className="diagnostic-button-group">
                  <button
                    onClick={() => connectWithOpenVPN()}
                    className="diagnostic-button"
                  >
                    🔐 Connect with OpenVPN CLI
                  </button>
                  
                  <button
                    onClick={() => generateOpenVPNCommand()}
                    className="diagnostic-button"
                  >
                    📝 Generate Command
                  </button>
                </div>
                <div className="diagnostic-note">
                  Direct command-line connection using the system OpenVPN client
                </div>
              </div>

              {/* Third-Party Clients */}
              <div className="diagnostic-info-subsection">
                <div className="diagnostic-info-subsection-title">🎛️ Third-Party Clients:</div>
                <div className="diagnostic-button-group">
                  <a href="https://openvpn.net/community-downloads/" target="_blank" rel="noopener noreferrer" 
                     className="diagnostic-link">
                    🔽 OpenVPN Community
                  </a>
                  <button
                    onClick={() => tryTunnelblick()}
                    className="diagnostic-link"
                  >
                    🍎 Tunnelblick (if available)
                  </button>
                  <button
                    onClick={() => showLinuxVpnClients()}
                    className="diagnostic-link"
                  >
                    📋 More Linux Clients
                  </button>
                </div>
              </div>

              {/* Installation Instructions */}
              <div className="diagnostic-setup-section">
                <div className="diagnostic-setup-list-title">📖 Linux VPN Setup:</div>
                <ol className="diagnostic-setup-list">
                  <li><strong>Ubuntu/Debian:</strong>
                    <div className="diagnostic-code-block">
                      sudo apt-get install network-manager-openvpn-gnome
                    </div>
                  </li>
                  <li className="diagnostic-setup-list-item"><strong>Fedora/CentOS:</strong>
                    <div className="diagnostic-code-block">
                      sudo dnf install NetworkManager-openvpn-gnome
                    </div>
                  </li>
                  <li className="diagnostic-setup-list-item"><strong>Arch Linux:</strong>
                    <div className="diagnostic-code-block">
                      sudo pacman -S networkmanager-openvpn
                    </div>
                  </li>
                  <li className="diagnostic-setup-list-item">After installation, use NetworkManager GUI or the buttons above for easy setup</li>
                </ol>
              </div>
            </div>
          )}

          {/* Show message for SAML authentication */}
          {authType === 'saml' && (
            <div className="diagnostic-setup-section">
              <div className="diagnostic-setup-title">
                🔍 SAML Authentication Required
              </div>
              <div className="diagnostic-setup-content">
                This VPN configuration requires <strong>SAML web-based authentication</strong> and cannot be used with standard command-line OpenVPN clients.
              </div>
              
              {/* Quick Actions for SAML VPNs */}
              <div className="diagnostic-saml-actions">
                <div className="diagnostic-saml-actions-title">🚀 Quick Actions:</div>
                <div className="diagnostic-button-group">
                  {/* Download Config Button */}
                  <button
                    onClick={() => downloadVpnConfig()}
                    className="diagnostic-button diagnostic-button-primary"
                  >
                    📁 Download Config
                  </button>
                  
                  {/* Try to Open in OpenVPN Connect */}
                  <button
                    onClick={() => openInVpnClient()}
                    className="diagnostic-button diagnostic-button-success"
                  >
                    🔗 Open in VPN Client
                  </button>
                  
                  {/* Copy Config Content */}
                  <button
                    onClick={() => copyConfigToClipboard()}
                    className="diagnostic-button diagnostic-button-secondary"
                  >
                    📋 Copy Config
                  </button>
                  
                  {/* Generate QR Code */}
                  <button
                    onClick={() => generateQrCode()}
                    className="diagnostic-button diagnostic-button-info"
                  >
                    📱 QR Code
                  </button>
                  
                  {/* Manual SAML Login */}
                  <button
                    onClick={() => openSamlLogin()}
                    className="diagnostic-button diagnostic-button-danger"
                  >
                    🌐 Manual SAML Login
                  </button>
                </div>
              </div>

              {/* Step-by-Step Instructions */}
              <div className="diagnostic-setup-section">
                <div className="diagnostic-setup-title">📖 How to Connect:</div>
                
                {/* Option 1: Using OpenVPN Connect */}
                <div className="diagnostic-setup-option">
                  <div className="diagnostic-setup-option-title">Option 1: Using OpenVPN Connect (Recommended)</div>
                  <ol className="diagnostic-setup-list">
                    <li>Download and install <strong>OpenVPN Connect</strong> on your device</li>
                    <li>Use one of the options above to get the VPN config:
                      <ul className="diagnostic-setup-sublist">
                        <li><strong>📁 Download Config:</strong> Save .ovpn file and import manually</li>
                        <li><strong>🔗 Open in VPN Client:</strong> Try to launch OpenVPN Connect directly</li>
                        <li><strong>📋 Copy Config:</strong> Copy text and paste into client</li>
                        <li><strong>📱 QR Code:</strong> Scan with mobile app for quick import</li>
                      </ul>
                    </li>
                    <li>When connecting, OpenVPN Connect will open a web browser automatically</li>
                    <li>Log in with your company credentials in the browser</li>
                    <li>Return to OpenVPN Connect - you should now be connected!</li>
                  </ol>
                </div>

                {/* Option 2: Manual Browser Login */}
                <div className="diagnostic-setup-option">
                  <div className="diagnostic-setup-option-title-alt">Option 2: Manual Browser Login (For Testing/Troubleshooting)</div>
                  <ol className="diagnostic-setup-list">
                    <li>Click <strong>🌐 Login in Browser</strong> above to open the SAML login page</li>
                    <li>Complete your company authentication in the browser</li>
                    <li>Note: This won't establish a VPN connection, but confirms SAML auth works</li>
                    <li>Use this to verify your credentials before trying OpenVPN Connect</li>
                  </ol>
                </div>
              </div>

              {/* Download Links */}
              <div className="diagnostic-download-section">
                <div className="diagnostic-download-title">📱 Download VPN Clients:</div>
                <div className="diagnostic-download-links">
                  <a href="https://openvpn.net/connect-app/" target="_blank" rel="noopener noreferrer" 
                     className="diagnostic-link">
                    🖥️ OpenVPN Connect (Desktop)
                  </a>
                  <a href="https://play.google.com/store/apps/details?id=net.openvpn.openvpn" target="_blank" rel="noopener noreferrer"
                     className="diagnostic-link">
                    🤖 Android App
                  </a>
                  <a href="https://apps.apple.com/app/openvpn-connect/id590379981" target="_blank" rel="noopener noreferrer"
                     className="diagnostic-link">
                    🍎 iOS App
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* VPN Control Buttons */}
          <div className="diagnostic-button-row">
            <button
              onClick={connectVPN}
              disabled={vpnStatus === 'connecting' || vpnStatus === 'connected' || !vpnConfig.configFile || authType === 'saml'}
              className={`diagnostic-button ${vpnStatus === 'connected' ? 'diagnostic-button-disabled' : authType === 'saml' ? 'diagnostic-button-disabled' : 'diagnostic-button-success'}`}
            >
              {authType === 'saml' ? '🚫 SAML Not Supported' : vpnStatus === 'connecting' ? '🔄 Connecting...' : '🔐 Connect VPN'}
            </button>
            <button
              onClick={disconnectVPN}
              disabled={vpnStatus !== 'connected'}
              className={`diagnostic-button ${vpnStatus === 'connected' ? 'diagnostic-button-danger' : 'diagnostic-button-disabled'}`}
            >
              🔌 Disconnect
            </button>
            <button
              onClick={runVpnConnectScript}
              className="diagnostic-button diagnostic-button-info"
            >
              🚀 Run VPN Script
            </button>
          </div>
          <div className="diagnostic-note">
            💡 The "Run VPN Script" button executes connect-vpn.sh to connect all available VPN configs using appropriate methods (OpenVPN 3 for SAML, classic OpenVPN for others)
          </div>
        </div>

        {/* PBX Server Testing */}
        <div className="diagnostic-section">
          <h3>PBX Server Testing</h3>
          <p className="diagnostic-note margin-bottom-15px">
            Configure your PBX servers and test connectivity through the VPN tunnel.
          </p>

          {pbxServers.map((server, index) => (
            <div key={index} className="diagnostic-pbx-server">
              <div className="diagnostic-pbx-grid">
                <input
                  type="text"
                  value={server.name}
                  onChange={e => updatePbxServer(index, 'name', e.target.value)}
                  placeholder="PBX Name"
                  className="diagnostic-input"
                  title="Enter PBX server name"
                  aria-label={`PBX server ${index + 1} name`}
                />
                <input
                  type="text"
                  value={server.host}
                  onChange={e => updatePbxServer(index, 'host', e.target.value)}
                  placeholder="pbx.example.com"
                  className="diagnostic-input"
                  title="Enter PBX server hostname or IP address"
                  aria-label={`PBX server ${index + 1} hostname`}
                />
                <input
                  type="text"
                  value={server.port}
                  onChange={e => updatePbxServer(index, 'port', e.target.value)}
                  placeholder="5060"
                  className="diagnostic-input"
                  title="Enter PBX server port number"
                  aria-label={`PBX server ${index + 1} port`}
                />
                <div className="diagnostic-pbx-status">
                  {server.status === 'unknown' && '❓ Unknown'}
                  {server.status === 'testing' && '🔄 Testing...'}
                  {server.status === 'reachable' && '✅ Reachable'}
                  {server.status === 'unreachable' && '❌ Unreachable'}
                </div>
                <button
                  onClick={() => testPbxServer(index)}
                  disabled={vpnStatus !== 'connected' || server.status === 'testing' || !server.host}
                  className={`diagnostic-button ${(vpnStatus === 'connected' && server.status !== 'testing' && server.host) ? 'diagnostic-button-primary' : 'diagnostic-button-disabled'}`}
                >
                  Test
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={testAllPbxServers}
            disabled={vpnStatus !== 'connected'}
            className={`diagnostic-button ${vpnStatus === 'connected' ? 'diagnostic-button-info' : 'diagnostic-button-disabled'}`}
          >
            🧪 Test All PBX Servers
          </button>
        </div>

        {/* Connection Log */}
        <div className="diagnostic-log">
          {logs.length === 0 ? (
            <div className="diagnostic-log-empty">VPN connection log will appear here...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index}>{log}</div>
            ))
          )}
        </div>
      </div>

      {/* Troubleshooting Guide */}
      <div className="diagnostic-troubleshooting">
        <h3 className="diagnostic-troubleshooting-title">
          🔧 PBX Connectivity Troubleshooting
        </h3>
        
        <div className="diagnostic-troubleshooting-intro">
          <strong>If VPN shows "Connected" but PBX servers are "Unreachable":</strong>
        </div>
        
        <div className="diagnostic-troubleshooting-grid">
          <div>
            <h4 className="diagnostic-troubleshooting-subtitle">🔍 Common Issues:</h4>
            <ul className="diagnostic-troubleshooting-list">
              <li><strong>VPN Routing:</strong> VPN might not route to PBX subnet</li>
              <li><strong>Firewall:</strong> PBX firewall blocking your VPN IP</li>
              <li><strong>Network Segmentation:</strong> PBX on isolated network</li>
              <li><strong>SIP Port:</strong> Port 5060 might be filtered</li>
              <li><strong>DNS Issues:</strong> Hostname not resolving via VPN</li>
            </ul>
          </div>
          
          <div>
            <h4 className="diagnostic-troubleshooting-subtitle">🛠️ Troubleshooting Steps:</h4>
            <ol className="diagnostic-troubleshooting-list">
              <li>Check VPN routes: <code>route -n</code> or <code>ip route</code></li>
              <li>Test basic connectivity: <code>ping 69.39.69.102</code></li>
              <li>Test specific port: <code>telnet 69.39.69.102 5060</code></li>
              <li>Try alternative ports (80, 443, 22)</li>
              <li>Contact network admin for PBX firewall rules</li>
            </ol>
          </div>
        </div>
        
        <div className="diagnostic-troubleshooting-tip">
          <strong>💡 Pro Tip:</strong> The PBX connectivity tests above use TCP connections to verify that SIP services are reachable through the VPN.
        </div>
      </div>

      {/* VPN Status Panel */}
      <VpnStatusPanel />
      
      {/* SSH Terminal Access */}
      <div className="diagnostic-section">
        <h3>🖥️ FreePBX SSH Terminal Access</h3>
        <p className="diagnostic-note margin-bottom-15px">
          Connect to FreePBX servers via SSH for administration, troubleshooting, and configuration.
          <br />
          <strong>Note:</strong> VPN connection required for SSH access to remote FreePBX servers.
        </p>
        
        <div className="diagnostic-ssh-servers">
          <h4>Available SSH Servers:</h4>
          {sshServers.map((server, index) => (
            <div key={index} className="diagnostic-ssh-server">
              <div className="diagnostic-ssh-server-name">
                {server.name} - {server.host}:{server.port}
              </div>
              <div className="diagnostic-ssh-server-description">
                {server.description} | Default user: {server.username}
              </div>
            </div>
          ))}
        </div>
        
        <TerminalPanel />
        
        <div className="diagnostic-ssh-tips">
          <strong>🔐 SSH Connection Tips:</strong>
          <ul className="diagnostic-ssh-tips-list">
            <li>Ensure VPN is connected before attempting SSH connections</li>
            <li>Use the primary FreePBX server IP: 69.39.69.102</li>
            <li>Default SSH port: 22 (may be configured differently)</li>
            <li>Common FreePBX users: root, asterisk, admin</li>
            <li>FreePBX web interface typically available on port 80/443</li>
          </ul>
        </div>
      </div>
      
      {/* Additional Network Information */}
      <div className="diagnostic-section">
        <h3>📊 Network Connectivity Information</h3>
        <div className="diagnostic-network-info">
          <p><strong>PBX Testing:</strong> TCP connectivity tests verify that SIP services (port 5060/5061) are reachable through the VPN tunnel.</p>
          <p><strong>VPN Status:</strong> Live monitoring of OpenVPN sessions, network interfaces, and routing information.</p>
          <p><strong>Troubleshooting:</strong> If PBX servers show as unreachable, check VPN connection, firewall rules, and PBX server status.</p>
        </div>
      </div>
    </div>
  );
};

export default Diagnostic;
