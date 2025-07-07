import React from 'react';

const VPNReference: React.FC = () => (
  <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
    <h1>VPN Setup & Configuration Reference</h1>
    <p style={{ fontSize: '16px', marginBottom: '20px', color: '#666' }}>
      Complete guide for setting up OpenVPN client connections to access PBX servers securely.
    </p>

    {/* OpenVPN Client Installation */}
    <section style={{ marginBottom: '30px' }}>
      <h2 style={{ color: '#0066cc', borderBottom: '2px solid #0066cc', paddingBottom: '5px' }}>
        📦 OpenVPN Client Installation
      </h2>
      
      <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px', marginBottom: '15px' }}>
        <h3>Windows Installation</h3>
        <ol style={{ lineHeight: '1.6' }}>
          <li>Download OpenVPN Community Edition from <a href="https://openvpn.net/community-downloads/" target="_blank" rel="noopener noreferrer">https://openvpn.net/community-downloads/</a></li>
          <li>Run the installer as Administrator</li>
          <li>Install with default options (include TAP driver)</li>
          <li>Place your <code>.ovpn</code> config file in: <code>C:\Program Files\OpenVPN\config\</code></li>
          <li>Right-click OpenVPN GUI → "Run as Administrator"</li>
          <li>Right-click system tray icon → Connect to your profile</li>
        </ol>
      </div>

      <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px', marginBottom: '15px' }}>
        <h3>macOS Installation</h3>
        <ol style={{ lineHeight: '1.6' }}>
          <li>Install via Homebrew: <code>brew install --cask tunnelblick</code></li>
          <li>Or download Tunnelblick from <a href="https://tunnelblick.net/" target="_blank" rel="noopener noreferrer">https://tunnelblick.net/</a></li>
          <li>Double-click your <code>.ovpn</code> file to import</li>
          <li>Connect via Tunnelblick menu</li>
        </ol>
      </div>

      <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px' }}>
        <h3>Linux Installation</h3>
        <pre style={{ backgroundColor: '#000', color: '#00ff00', padding: '10px', borderRadius: '3px' }}>
{`# Ubuntu/Debian
sudo apt update
sudo apt install openvpn

# CentOS/RHEL
sudo yum install openvpn

# Connect using config file
sudo openvpn --config /path/to/your/config.ovpn`}
        </pre>
      </div>
    </section>

    {/* Configuration File Structure */}
    <section style={{ marginBottom: '30px' }}>
      <h2 style={{ color: '#0066cc', borderBottom: '2px solid #0066cc', paddingBottom: '5px' }}>
        📄 OpenVPN Configuration File (.ovpn)
      </h2>
      
      <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px', marginBottom: '15px' }}>
        <h3>Sample Configuration</h3>
        <pre style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ddd', borderRadius: '3px', overflowX: 'auto' }}>
{`client
dev tun
proto udp
remote vpn.yourcompany.com 1194
resolv-retry infinite
nobind
persist-key
persist-tun
ca ca.crt
cert client.crt
key client.key
cipher AES-256-CBC
auth SHA256
comp-lzo
verb 3

# Optional: Route specific subnets through VPN
route 192.168.100.0 255.255.255.0
route 10.0.0.0 255.255.0.0

# Optional: DNS settings
dhcp-option DNS 8.8.8.8
dhcp-option DNS 8.8.4.4`}
        </pre>
        <ul style={{ marginTop: '10px' }}>
          <li><strong>remote:</strong> Your VPN server address and port</li>
          <li><strong>ca/cert/key:</strong> Certificate files (may be embedded inline)</li>
          <li><strong>route:</strong> Specific networks to route through VPN</li>
          <li><strong>cipher/auth:</strong> Encryption settings (must match server)</li>
        </ul>
      </div>
    </section>

    {/* PBX Access Configuration */}
    <section style={{ marginBottom: '30px' }}>
      <h2 style={{ color: '#0066cc', borderBottom: '2px solid #0066cc', paddingBottom: '5px' }}>
        📞 PBX Server Access Configuration
      </h2>
      
      <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px', marginBottom: '15px' }}>
        <h3>Common PBX Ports</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <thead>
            <tr style={{ backgroundColor: '#e9ecef' }}>
              <th style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'left' }}>Service</th>
              <th style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'left' }}>Protocol</th>
              <th style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'left' }}>Default Port</th>
              <th style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'left' }}>Purpose</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #dee2e6', padding: '8px' }}>SIP</td>
              <td style={{ border: '1px solid #dee2e6', padding: '8px' }}>UDP/TCP</td>
              <td style={{ border: '1px solid #dee2e6', padding: '8px' }}>5060</td>
              <td style={{ border: '1px solid #dee2e6', padding: '8px' }}>SIP signaling</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #dee2e6', padding: '8px' }}>SIP TLS</td>
              <td style={{ border: '1px solid #dee2e6', padding: '8px' }}>TCP</td>
              <td style={{ border: '1px solid #dee2e6', padding: '8px' }}>5061</td>
              <td style={{ border: '1px solid #dee2e6', padding: '8px' }}>Secure SIP signaling</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #dee2e6', padding: '8px' }}>RTP</td>
              <td style={{ border: '1px solid #dee2e6', padding: '8px' }}>UDP</td>
              <td style={{ border: '1px solid #dee2e6', padding: '8px' }}>10000-20000</td>
              <td style={{ border: '1px solid #dee2e6', padding: '8px' }}>Voice media</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #dee2e6', padding: '8px' }}>HTTP Admin</td>
              <td style={{ border: '1px solid #dee2e6', padding: '8px' }}>TCP</td>
              <td style={{ border: '1px solid #dee2e6', padding: '8px' }}>80/8080</td>
              <td style={{ border: '1px solid #dee2e6', padding: '8px' }}>Web interface</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #dee2e6', padding: '8px' }}>HTTPS Admin</td>
              <td style={{ border: '1px solid #dee2e6', padding: '8px' }}>TCP</td>
              <td style={{ border: '1px solid #dee2e6', padding: '8px' }}>443/8443</td>
              <td style={{ border: '1px solid #dee2e6', padding: '8px' }}>Secure web interface</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px' }}>
        <h3>Testing PBX Connectivity</h3>
        <div style={{ marginBottom: '15px' }}>
          <h4>Command Line Testing:</h4>
          <pre style={{ backgroundColor: '#000', color: '#00ff00', padding: '10px', borderRadius: '3px' }}>
{`# Test SIP port connectivity
telnet pbx.company.com 5060

# Test with netcat
nc -zv pbx.company.com 5060

# Test HTTP admin interface
curl -I http://pbx.company.com:8080

# Test with ping
ping pbx.company.com`}
          </pre>
        </div>
        
        <div style={{ 
          backgroundColor: '#e7f3ff', 
          border: '1px solid #b3d9ff', 
          borderRadius: '4px', 
          padding: '10px', 
          marginTop: '15px' 
        }}>
          <strong>💡 Tip:</strong> Use the built-in VPN diagnostic tool on this page to automatically test PBX connectivity once your VPN is connected!
        </div>
      </div>
    </section>

    {/* Troubleshooting */}
    <section style={{ marginBottom: '30px' }}>
      <h2 style={{ color: '#0066cc', borderBottom: '2px solid #0066cc', paddingBottom: '5px' }}>
        🔧 Troubleshooting
      </h2>
      
      <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px', marginBottom: '15px' }}>
        <h3>Common Connection Issues</h3>
        <ul style={{ lineHeight: '1.6' }}>
          <li><strong>Port blocking:</strong> Check if your ISP or firewall blocks VPN ports (1194, 443)</li>
          <li><strong>Certificate errors:</strong> Ensure all certificate files are present and valid</li>
          <li><strong>DNS issues:</strong> Try using IP addresses instead of hostnames</li>
          <li><strong>Firewall blocking:</strong> Temporarily disable local firewall to test</li>
          <li><strong>Time sync issues:</strong> Ensure system time is accurate for certificate validation</li>
        </ul>
      </div>

      <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px', marginBottom: '15px' }}>
        <h3>Diagnostic Commands</h3>
        <pre style={{ backgroundColor: '#000', color: '#00ff00', padding: '10px', borderRadius: '3px' }}>
{`# Check VPN interface
ip addr show tun0
ifconfig tun0

# Check routing
ip route
route -n

# Check if VPN is receiving traffic
sudo tcpdump -i tun0

# Test DNS resolution through VPN
nslookup pbx.company.com

# Check VPN logs (Linux)
sudo journalctl -u openvpn
tail -f /var/log/openvpn.log`}
        </pre>
      </div>

      <div style={{ backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '4px', padding: '15px' }}>
        <h3>🚨 Security Best Practices</h3>
        <ul style={{ lineHeight: '1.6', marginBottom: '0' }}>
          <li><strong>Certificate Management:</strong> Store certificates securely, never in public locations</li>
          <li><strong>Strong Authentication:</strong> Use certificate + password authentication when possible</li>
          <li><strong>Network Isolation:</strong> Only route necessary traffic through VPN</li>
          <li><strong>Regular Updates:</strong> Keep OpenVPN client updated to latest version</li>
          <li><strong>Connection Monitoring:</strong> Monitor for unexpected disconnections</li>
        </ul>
      </div>
    </section>

    {/* Summary */}
    <section style={{ backgroundColor: '#e7f3ff', padding: '20px', borderRadius: '5px', border: '1px solid #b3d9ff' }}>
      <h2 style={{ color: '#0066cc', marginTop: '0' }}>📋 Quick Setup Summary</h2>
      <ol style={{ lineHeight: '1.8' }}>
        <li><strong>📦 Install OpenVPN Client</strong> - Download and install appropriate client for your OS</li>
        <li><strong>📄 Get Configuration File</strong> - Obtain .ovpn file from your IT administrator</li>
        <li><strong>🔐 Import Configuration</strong> - Load the configuration into your VPN client</li>
        <li><strong>🌐 Connect to VPN</strong> - Establish the secure tunnel</li>
        <li><strong>🧪 Test Connectivity</strong> - Use the diagnostic tool above to verify PBX access</li>
        <li><strong>📞 Configure PBX Access</strong> - Update your phone/software with internal PBX addresses</li>
      </ol>
      
      <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#d1ecf1', borderRadius: '4px' }}>
        <strong>🎯 Pro Tip:</strong> Use the VPN diagnostic tool on the main Diagnostics page to automatically test your PBX servers once connected!
      </div>
    </section>
  </div>
);

export default VPNReference;
