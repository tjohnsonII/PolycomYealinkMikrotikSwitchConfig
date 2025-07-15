import React, { useState } from 'react';
import '../styles/inline-styles-fix.css';

// ATA Device models and their specifications
const ATA_MODELS = {
  'Grandstream HT802': {
    fxsPorts: 2,
    supportsT38: true,
    defaultCodecs: ['G.711u', 'G.711a', 'G.729', 'G.722'],
    configMethod: 'Web Interface'
  },
  'Grandstream HT801': {
    fxsPorts: 1,
    supportsT38: true,
    defaultCodecs: ['G.711u', 'G.711a', 'G.729', 'G.722'],
    configMethod: 'Web Interface'
  },
  'Cisco SPA 122': {
    fxsPorts: 1,
    supportsT38: true,
    defaultCodecs: ['G.711u', 'G.711a', 'G.729', 'G.722'],
    configMethod: 'Web Interface'
  },
  'Cisco ATA 191': {
    fxsPorts: 2,
    supportsT38: true,
    defaultCodecs: ['G.711u', 'G.711a', 'G.729', 'G.722'],
    configMethod: 'Web Interface'
  }
};

const ATA: React.FC = () => {
  const [ataConfig, setAtaConfig] = useState({
    deviceModel: 'Grandstream HT802',
    sipServer: '',
    sipPort: '5060',
    extension: '',
    password: '',
    codecPreference: 'G.711u',
    faxSettings: {
      enableT38: true,
      faxMode: 'T.38',
      faxRate: '14400',
      faxEcm: true
    },
    advancedSettings: {
      dtmfMode: 'RFC2833',
      rtpPort: '5004',
      sipTransport: 'UDP',
      registerExpires: '3600',
      keepAlive: true
    }
  });

  const [generatedConfig, setGeneratedConfig] = useState('');
  const [activeTab, setActiveTab] = useState('basic');

  const handleInputChange = (field: string, value: string | boolean) => {
    if (field.includes('.')) {
      const [section, key] = field.split('.');
      setAtaConfig(prev => ({
        ...prev,
        [section]: {
          ...(prev[section as keyof typeof prev] as Record<string, string | boolean>),
          [key]: value
        }
      }));
    } else {
      setAtaConfig(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const generateAtaConfig = () => {
    const selectedModel = ATA_MODELS[ataConfig.deviceModel as keyof typeof ATA_MODELS];
    
    let config = `# ATA Configuration for ${ataConfig.deviceModel}
# Generated on ${new Date().toLocaleString()}
# Device has ${selectedModel.fxsPorts} FXS port(s)

## Basic SIP Configuration
SIP Server: ${ataConfig.sipServer}
SIP Port: ${ataConfig.sipPort}
SIP Transport: ${ataConfig.advancedSettings.sipTransport}
Registration Expires: ${ataConfig.advancedSettings.registerExpires} seconds

## Extension Configuration
Extension: ${ataConfig.extension}
Password: ${ataConfig.password}

## Audio Codec Settings
Preferred Codec: ${ataConfig.codecPreference}
DTMF Mode: ${ataConfig.advancedSettings.dtmfMode}
RTP Port Range: ${ataConfig.advancedSettings.rtpPort}+

## Fax Configuration
`;

    if (selectedModel.supportsT38) {
      config += `T.38 Fax Support: ${ataConfig.faxSettings.enableT38 ? 'Enabled' : 'Disabled'}
Fax Mode: ${ataConfig.faxSettings.faxMode}
Fax Rate: ${ataConfig.faxSettings.faxRate} bps
Fax ECM: ${ataConfig.faxSettings.faxEcm ? 'Enabled' : 'Disabled'}

`;
    }

    config += `## Network Settings
Keep Alive: ${ataConfig.advancedSettings.keepAlive ? 'Enabled' : 'Disabled'}

## Configuration Notes
- Access device web interface at device IP address
- Default credentials are usually admin/admin
- Reboot device after applying configuration
- Test both voice and fax functionality
- Ensure proper network firewall rules for SIP and RTP traffic

## Device-Specific Instructions for ${ataConfig.deviceModel}:
`;

    // Add device-specific configuration steps
    if (ataConfig.deviceModel.includes('Grandstream')) {
      config += `
1. Access web interface at device IP
2. Navigate to Account 1 -> Basic Settings
3. Enter SIP Server, User ID, and Password
4. Go to Account 1 -> Codec Settings
5. Select preferred codec order
6. For fax: Enable T.38 in FXS Port settings
7. Save and reboot device
`;
    } else if (ataConfig.deviceModel.includes('Cisco')) {
      config += `
1. Access web interface at device IP
2. Navigate to Voice -> Line 1
3. Enter Proxy, User ID, and Password
4. Go to Voice -> Regional settings for codecs
5. Configure fax settings in Voice -> Line 1 -> Fax
6. Apply changes and reboot
`;
    }

    setGeneratedConfig(config);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedConfig);
      alert('Configuration copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      alert('Failed to copy configuration. Please select and copy manually.');
    }
  };

  const downloadConfig = () => {
    const blob = new Blob([generatedConfig], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ATA_${ataConfig.deviceModel.replace(/\s+/g, '_')}_Config.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setAtaConfig({
      deviceModel: 'Grandstream HT802',
      sipServer: '',
      sipPort: '5060',
      extension: '',
      password: '',
      codecPreference: 'G.711u',
      faxSettings: {
        enableT38: true,
        faxMode: 'T.38',
        faxRate: '14400',
        faxEcm: true
      },
      advancedSettings: {
        dtmfMode: 'RFC2833',
        rtpPort: '5004',
        sipTransport: 'UDP',
        registerExpires: '3600',
        keepAlive: true
      }
    });
    setGeneratedConfig('');
  };

  const selectedModel = ATA_MODELS[ataConfig.deviceModel as keyof typeof ATA_MODELS];

  return (
    <div className="ata-clean-container">
      <div className="ata-clean-header">
        <h1 className="ata-clean-title">
          📠 ATA Configuration Generator
        </h1>
        <p className="ata-clean-subtitle">
          Generate configuration for Analog Telephone Adapters with fax support
        </p>
        
        <div className="ata-clean-notice">
          <h3>🎉 Enhanced ATA Configuration Tool</h3>
          <p>This tool now includes comprehensive ATA configuration capabilities:</p>
          <ul>
            <li>✅ Device-specific configuration templates</li>
            <li>✅ Advanced fax optimization settings (T.38 support)</li>
            <li>✅ Multiple codec options and network settings</li>
            <li>✅ Step-by-step configuration guides</li>
            <li>✅ Export and download functionality</li>
          </ul>
          <p><strong>Select your device model below and configure settings using the tabs.</strong></p>
        </div>
      </div>

      {/* Device Selection */}
      <div className="ata-clean-form-section">
        <h3>📱 Device Selection</h3>
        <div className="ata-clean-form-group">
          <label className="ata-clean-form-label">
            ATA Device Model:
          </label>
          <select
            value={ataConfig.deviceModel}
            onChange={(e) => handleInputChange('deviceModel', e.target.value)}
            className="ata-clean-form-select"
            title="Select the ATA device model"
          >
            {Object.entries(ATA_MODELS).map(([model, specs]) => (
              <option key={model} value={model}>
                {model} ({specs.fxsPorts} port{specs.fxsPorts > 1 ? 's' : ''})
              </option>
            ))}
          </select>
        </div>
        
        <div className="ata-clean-device-info">
          <p><strong>Selected Device:</strong> {ataConfig.deviceModel}</p>
          <p><strong>FXS Ports:</strong> {selectedModel.fxsPorts} | <strong>T.38 Fax:</strong> {selectedModel.supportsT38 ? 'Supported' : 'Not Supported'}</p>
          <p><strong>Configuration Method:</strong> {selectedModel.configMethod}</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="ata-clean-tab-container">
        <button
          className={`ata-clean-tab-button ${activeTab === 'basic' ? 'active' : ''}`}
          onClick={() => setActiveTab('basic')}
          title="Basic SIP configuration settings"
        >
          🔧 Basic Settings
        </button>
        <button
          className={`ata-clean-tab-button ${activeTab === 'fax' ? 'active' : ''}`}
          onClick={() => setActiveTab('fax')}
          title="Fax-specific configuration settings"
        >
          📠 Fax Settings
        </button>
        <button
          className={`ata-clean-tab-button ${activeTab === 'advanced' ? 'active' : ''}`}
          onClick={() => setActiveTab('advanced')}
          title="Advanced network and SIP settings"
        >
          ⚙️ Advanced Settings
        </button>
      </div>

      {/* Tab Content */}
      <div className="ata-clean-tab-content">
        {activeTab === 'basic' && (
          <div className="ata-clean-form-section">
            <h3>🔧 Basic SIP Configuration</h3>
            
            <div className="ata-clean-form-group">
              <label className="ata-clean-form-label">
                SIP Server:
              </label>
              <input
                type="text"
                value={ataConfig.sipServer}
                onChange={(e) => handleInputChange('sipServer', e.target.value)}
                placeholder="192.168.1.100 or pbx.example.com"
                className="ata-clean-form-input"
                title="Enter SIP server IP address or hostname"
              />
            </div>

            <div className="ata-clean-form-group">
              <label className="ata-clean-form-label">
                SIP Port:
              </label>
              <input
                type="text"
                value={ataConfig.sipPort}
                onChange={(e) => handleInputChange('sipPort', e.target.value)}
                placeholder="5060"
                className="ata-clean-form-input"
                title="Enter SIP port number (default: 5060)"
              />
            </div>

            <div className="ata-clean-form-group">
              <label className="ata-clean-form-label">
                Extension Number:
              </label>
              <input
                type="text"
                value={ataConfig.extension}
                onChange={(e) => handleInputChange('extension', e.target.value)}
                placeholder="2001"
                className="ata-clean-form-input"
                title="Enter extension number"
              />
            </div>

            <div className="ata-clean-form-group">
              <label className="ata-clean-form-label">
                Extension Password:
              </label>
              <input
                type="password"
                value={ataConfig.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Extension password"
                className="ata-clean-form-input"
                title="Enter extension password"
              />
            </div>

            <div className="ata-clean-form-group">
              <label className="ata-clean-form-label">
                Preferred Codec:
              </label>
              <select
                value={ataConfig.codecPreference}
                onChange={(e) => handleInputChange('codecPreference', e.target.value)}
                className="ata-clean-form-select"
                title="Select preferred audio codec"
              >
                {selectedModel.defaultCodecs.map(codec => (
                  <option key={codec} value={codec}>
                    {codec} {codec === 'G.711u' ? '(μ-law)' : codec === 'G.711a' ? '(A-law)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {activeTab === 'fax' && (
          <div className="ata-clean-form-section">
            <h3>📠 Fax Configuration</h3>
            
            {selectedModel.supportsT38 ? (
              <>
                <div className="ata-clean-form-group">
                  <label className="ata-clean-checkbox-label">
                    <input
                      type="checkbox"
                      checked={ataConfig.faxSettings.enableT38}
                      onChange={(e) => handleInputChange('faxSettings.enableT38', e.target.checked)}
                      className="ata-clean-checkbox-input"
                      title="Enable T.38 fax support"
                    />
                    Enable T.38 Fax Support
                  </label>
                  <div className="ata-clean-checkbox-help">
                    T.38 provides reliable fax transmission over IP networks
                  </div>
                </div>

                <div className="ata-clean-form-group">
                  <label className="ata-clean-form-label">
                    Fax Mode:
                  </label>
                  <select
                    value={ataConfig.faxSettings.faxMode}
                    onChange={(e) => handleInputChange('faxSettings.faxMode', e.target.value)}
                    className="ata-clean-form-select"
                    title="Select fax transmission mode"
                  >
                    <option value="T.38">T.38 (Recommended)</option>
                    <option value="Passthrough">Passthrough</option>
                    <option value="G.711">G.711 Passthrough</option>
                  </select>
                </div>

                <div className="ata-clean-form-group">
                  <label className="ata-clean-form-label">
                    Fax Rate:
                  </label>
                  <select
                    value={ataConfig.faxSettings.faxRate}
                    onChange={(e) => handleInputChange('faxSettings.faxRate', e.target.value)}
                    className="ata-clean-form-select"
                    title="Select fax transmission rate"
                  >
                    <option value="14400">14.4k bps</option>
                    <option value="9600">9.6k bps</option>
                    <option value="7200">7.2k bps</option>
                    <option value="4800">4.8k bps</option>
                  </select>
                </div>

                <div className="ata-clean-form-group">
                  <label className="ata-clean-checkbox-label">
                    <input
                      type="checkbox"
                      checked={ataConfig.faxSettings.faxEcm}
                      onChange={(e) => handleInputChange('faxSettings.faxEcm', e.target.checked)}
                      className="ata-clean-checkbox-input"
                      title="Enable Error Correction Mode for fax"
                    />
                    Enable ECM (Error Correction Mode)
                  </label>
                  <div className="ata-clean-checkbox-help">
                    ECM helps ensure fax transmission accuracy
                  </div>
                </div>
              </>
            ) : (
              <div className="ata-clean-fax-warning">
                <p><strong>Note:</strong> The selected device ({ataConfig.deviceModel}) does not support T.38 fax.</p>
                <p>Basic fax passthrough may still be available through G.711 codec.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="ata-clean-form-section">
            <h3>⚙️ Advanced Network Settings</h3>
            
            <div className="ata-clean-form-group">
              <label className="ata-clean-form-label">
                DTMF Mode:
              </label>
              <select
                value={ataConfig.advancedSettings.dtmfMode}
                onChange={(e) => handleInputChange('advancedSettings.dtmfMode', e.target.value)}
                className="ata-clean-form-select"
                title="Select DTMF transmission mode"
              >
                <option value="RFC2833">RFC2833 (Recommended)</option>
                <option value="SIP INFO">SIP INFO</option>
                <option value="Inband">Inband</option>
              </select>
            </div>

            <div className="ata-clean-form-group">
              <label className="ata-clean-form-label">
                RTP Port Range Start:
              </label>
              <input
                type="text"
                value={ataConfig.advancedSettings.rtpPort}
                onChange={(e) => handleInputChange('advancedSettings.rtpPort', e.target.value)}
                placeholder="5004"
                className="ata-clean-form-input"
                title="Enter starting RTP port number"
              />
            </div>

            <div className="ata-clean-form-group">
              <label className="ata-clean-form-label">
                SIP Transport:
              </label>
              <select
                value={ataConfig.advancedSettings.sipTransport}
                onChange={(e) => handleInputChange('advancedSettings.sipTransport', e.target.value)}
                className="ata-clean-form-select"
                title="Select SIP transport protocol"
              >
                <option value="UDP">UDP</option>
                <option value="TCP">TCP</option>
                <option value="TLS">TLS</option>
              </select>
            </div>

            <div className="ata-clean-form-group">
              <label className="ata-clean-form-label">
                Registration Expires (seconds):
              </label>
              <input
                type="text"
                value={ataConfig.advancedSettings.registerExpires}
                onChange={(e) => handleInputChange('advancedSettings.registerExpires', e.target.value)}
                placeholder="3600"
                className="ata-clean-form-input"
                title="Enter registration expiry time in seconds"
              />
            </div>

            <div className="ata-clean-form-group">
              <label className="ata-clean-checkbox-label">
                <input
                  type="checkbox"
                  checked={ataConfig.advancedSettings.keepAlive}
                  onChange={(e) => handleInputChange('advancedSettings.keepAlive', e.target.checked)}
                  className="ata-clean-checkbox-input"
                  title="Enable SIP keep-alive packets"
                />
                Enable Keep-Alive
              </label>
              <div className="ata-clean-checkbox-help">
                Sends periodic packets to maintain NAT bindings
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Generate Button */}
      <div className="ata-clean-generate-button-container">
        <button
          onClick={generateAtaConfig}
          className="ata-clean-generate-button"
          title="Generate ATA configuration based on current settings"
        >
          🔧 Generate Configuration
        </button>
      </div>

      {/* Generated Configuration Display */}
      {generatedConfig && (
        <div className="ata-clean-output-container">
          <div className="ata-clean-output-header">
            <h3 className="ata-clean-output-title">
              Generated ATA Configuration
            </h3>
            <div className="ata-clean-output-buttons">
              <button
                onClick={copyToClipboard}
                className="ata-clean-copy-button"
                title="Copy configuration to clipboard"
              >
                📋 Copy
              </button>
              <button
                onClick={downloadConfig}
                className="ata-clean-copy-button ata-clean-download-button"
                title="Download configuration as text file"
              >
                💾 Download
              </button>
              <button
                onClick={resetForm}
                className="ata-clean-copy-button ata-clean-reset-button"
                title="Reset all settings to default"
              >
                🔄 Reset
              </button>
            </div>
          </div>
          
          <div className="ata-clean-output-section">
            <textarea
              value={generatedConfig}
              readOnly
              className="ata-clean-output-textarea"
              title="Generated ATA configuration"
              placeholder="Generated configuration will appear here..."
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ATA;
