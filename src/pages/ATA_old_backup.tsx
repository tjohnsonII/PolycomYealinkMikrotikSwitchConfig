import React, { useState } from 'react';

const ATA: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [ataConfig, setAtaConfig] = useState({
    deviceModel: 'Grandstream HT802',
    sipServer: '',
    sipPort: '5060',
    faxExtension: '',
    faxPassword: '',
    analogExtension: '',
    analogPassword: '',
    codecPreference: 'G.711u',
    faxMode: 'T.38',
    echoCancel: true,
    dialPlan: '',
    dtmfMode: 'RFC2833',
    registrationExpiry: '3600'
  });

  // Grandstream specific configuration
  const [grandstreamConfig, setGrandstreamConfig] = useState({
    customerHandle: '',
    pbxIP: '',
    extensionNumber: '',
    extensionSecret: ''
  });

  // Cisco SPA 122 specific configuration
  const [ciscoConfig, setCiscoConfig] = useState({
    customerHandle: '',
    pbxIP: '',
    extensionNumber: '',
    extensionPassword: ''
  });

  const [generatedConfig, setGeneratedConfig] = useState('');

  const handleInputChange = (field: string, value: string | boolean) => {
    setAtaConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGrandstreamChange = (field: string, value: string) => {
    setGrandstreamConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCiscoChange = (field: string, value: string) => {
    setCiscoConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateAtaConfig = () => {
    const config = `# ATA Configuration for ${ataConfig.deviceModel}
# Generated on ${new Date().toLocaleString()}

## SIP Server Configuration
SIP Server: ${ataConfig.sipServer}
SIP Port: ${ataConfig.sipPort}

## Extension Configuration
Fax Extension: ${ataConfig.faxExtension}
Fax Password: ${ataConfig.faxPassword}
Analog Extension: ${ataConfig.analogExtension}
Analog Password: ${ataConfig.analogPassword}

## Codec and Audio Settings
Preferred Codec: ${ataConfig.codecPreference}
Fax Mode: ${ataConfig.faxMode}
Echo Cancellation: ${ataConfig.echoCancel ? 'Enabled' : 'Disabled'}
DTMF Mode: ${ataConfig.dtmfMode}

## Additional Settings
Dial Plan: ${ataConfig.dialPlan || 'Default'}
Registration Expiry: ${ataConfig.registrationExpiry} seconds

## Fax Optimization Settings
- Enable T.38 for reliable fax transmission
- Disable echo cancellation for fax lines
- Use G.711 codec for fax calls
- Configure proper gain settings
- Set appropriate timeouts for fax sessions
`;
    setGeneratedConfig(config);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedConfig);
    alert('Configuration copied to clipboard!');
  };

  const downloadConfig = () => {
    const blob = new Blob([generatedConfig], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${ataConfig.deviceModel.replace(/\s+/g, '_')}_config.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="ata-container">
      <div className="ata-content">
        <h1 className="ata-title">
          📠 ATA Configuration Generator
        </h1>
        
        <p className="ata-subtitle">
          Configure Analog Telephone Adapters for fax machines and analog devices
        </p>

        {/* Tabs */}
        <div className="ata-tabs">
          <button
            onClick={() => setActiveTab('general')}
            className={`ata-tab ${activeTab === 'general' ? 'active' : ''}`}
          >
            General ATA Config
          </button>
          <button
            onClick={() => setActiveTab('grandstream')}
            className={`ata-tab ${activeTab === 'grandstream' ? 'active' : ''}`}
          >
            Grandstream Specific Config
          </button>
          <button
            onClick={() => setActiveTab('cisco')}
            className={`ata-tab ${activeTab === 'cisco' ? 'active' : ''}`}
          >
            Cisco SPA 122 Config
          </button>
        </div>

        {/* General Tab Content */}
        {activeTab === 'general' && (
          <div className="ata-general-grid">
            
            {/* Device Configuration */}
            <div className="ata-form-section">
              <h3 className="ata-form-section-title">
                Device Configuration
              </h3>
              
              <div className="ata-form-group">
                <label className="ata-form-label">
                  Device Model:
                </label>
                <select
                  value={ataConfig.deviceModel}
                  onChange={(e) => handleInputChange('deviceModel', e.target.value)}
                  className="ata-form-select"
                  title="Device Model"
                >
                  <option value="Grandstream HT802">Grandstream HT802</option>
                  <option value="Grandstream HT801">Grandstream HT801</option>
                  <option value="Cisco SPA 122">Cisco SPA 122</option>
                  <option value="Cisco ATA 191">Cisco ATA 191</option>
                  <option value="Obihai OBi202">Obihai OBi202</option>
                  <option value="Linksys PAP2T">Linksys PAP2T</option>
                </select>
              </div>

              <div className="ata-form-group">
                <label className="ata-form-label">
                  SIP Server:
                </label>
                <input
                  type="text"
                  value={ataConfig.sipServer}
                  onChange={(e) => handleInputChange('sipServer', e.target.value)}
                  placeholder="192.168.1.100 or pbx.example.com"
                  className="ata-form-input"
                />
              </div>

              <div className="ata-form-group">
                <label className="ata-form-label">
                  SIP Port:
                </label>
                <input
                  type="text"
                  value={ataConfig.sipPort}
                  onChange={(e) => handleInputChange('sipPort', e.target.value)}
                  placeholder="5060"
                  className="ata-form-input"
                />
              </div>
            </div>

            {/* Extension Configuration */}
            <div className="ata-form-section">
              <h3 className="ata-form-section-title">
                Extension Configuration
              </h3>
              
              <div className="ata-form-group">
                <label className="ata-form-label">
                  Fax Extension:
                </label>
                <input
                  type="text"
                  value={ataConfig.faxExtension}
                  onChange={(e) => handleInputChange('faxExtension', e.target.value)}
                  placeholder="2001"
                  className="ata-form-input"
                />
              </div>

              <div className="ata-form-group">
                <label className="ata-form-label">
                  Fax Password:
                </label>
                <input
                  type="password"
                  value={ataConfig.faxPassword}
                  onChange={(e) => handleInputChange('faxPassword', e.target.value)}
                  placeholder="Extension password"
                  className="ata-form-input"
                />
              </div>

              <div className="ata-form-group">
                <label className="ata-form-label">
                  Analog Extension:
                </label>
                <input
                  type="text"
                  value={ataConfig.analogExtension}
                  onChange={(e) => handleInputChange('analogExtension', e.target.value)}
                  placeholder="2002"
                  className="ata-form-input"
                />
              </div>

              <div className="ata-form-group">
                <label className="ata-form-label">
                  Analog Password:
                </label>
                <input
                  type="password"
                  value={ataConfig.analogPassword}
                  onChange={(e) => handleInputChange('analogPassword', e.target.value)}
                  placeholder="Extension password"
                  className="ata-form-input"
                />
              </div>
            </div>

            {/* Audio and Codec Settings */}
            <div className="ata-form-section">
              <h3 className="ata-form-section-title">
                Audio & Codec Settings
              </h3>
              
              <div className="ata-form-group">
                <label className="ata-form-label">
                  Preferred Codec:
                </label>
                <select
                  value={ataConfig.codecPreference}
                  onChange={(e) => handleInputChange('codecPreference', e.target.value)}
                  className="ata-form-select"
                  title="Preferred Codec"
                >
                  <option value="G.711u">G.711u (μ-law)</option>
                  <option value="G.711a">G.711a (A-law)</option>
                  <option value="G.729">G.729</option>
                  <option value="G.722">G.722</option>
                </select>
              </div>

              <div className="ata-form-group">
                <label className="ata-form-label">
                  Fax Mode:
                </label>
                <select
                  value={ataConfig.faxMode}
                  onChange={(e) => handleInputChange('faxMode', e.target.value)}
                  className="ata-form-select"
                  title="Fax Mode"
                >
                  <option value="T.38">T.38 (Recommended)</option>
                  <option value="G.711 Passthrough">G.711 Passthrough</option>
                  <option value="Auto">Auto Detect</option>
                </select>
              </div>

              <div className="ata-form-group">
                <label className="ata-form-label-checkbox">
                  <input
                    type="checkbox"
                    checked={ataConfig.echoCancel}
                    onChange={(e) => handleInputChange('echoCancel', e.target.checked)}
                    className="ata-form-checkbox"
                  />
                  Enable Echo Cancellation
                </label>
                <small className="ata-form-help">
                  (Usually disabled for fax lines)
                </small>
              </div>

              <div className="ata-form-group">
                <label className="ata-form-label">
                  DTMF Mode:
                </label>
                <select
                  value={ataConfig.dtmfMode}
                  onChange={(e) => handleInputChange('dtmfMode', e.target.value)}
                  className="ata-form-select"
                  title="DTMF Mode"
                >
                  <option value="RFC2833">RFC2833</option>
                  <option value="SIP INFO">SIP INFO</option>
                  <option value="In-band">In-band</option>
                </select>
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="ata-form-section">
              <h3 className="ata-form-section-title">
                Advanced Settings
              </h3>
              
              <div className="ata-form-group">
                <label className="ata-form-label">
                  Dial Plan:
                </label>
                <input
                  type="text"
                  value={ataConfig.dialPlan}
                  onChange={(e) => handleInputChange('dialPlan', e.target.value)}
                  placeholder="(*|#|0|00|[1-9]++|*x+|911|933)"
                  className="ata-form-input"
                />
              </div>

              <div className="ata-form-group">
                <label className="ata-form-label">
                  Registration Expiry (seconds):
                </label>
                <input
                  type="text"
                  value={ataConfig.registrationExpiry}
                  onChange={(e) => handleInputChange('registrationExpiry', e.target.value)}
                  placeholder="3600"
                  className="ata-form-input"
                />
              </div>
            </div>
          </div>
        )}

        {/* Grandstream Tab Content */}
        {activeTab === 'grandstream' && (
          <div>
            <div className="ata-grandstream-info">
              <h3 className="ata-grandstream-info-title">
                📠 Grandstream ATA - Step by Step Configuration
              </h3>
              <p className="ata-grandstream-info-text">
                This guide provides detailed instructions for configuring Grandstream ATAs with fax-optimized settings.
              </p>
            </div>

            {/* Configuration Input Form */}
            <div className="ata-grandstream-form">
              <h3 className="ata-grandstream-form-title">
                Configuration Parameters
              </h3>
              
              <div className="ata-grandstream-form-grid">
                <div>
                  <label className="ata-form-label">
                    Customer Handle:
                  </label>
                  <input
                    type="text"
                    value={grandstreamConfig.customerHandle}
                    onChange={(e) => handleGrandstreamChange('customerHandle', e.target.value)}
                    placeholder="Enter customer handle"
                    className="ata-form-input"
                  />
                </div>
                
                <div>
                  <label className="ata-form-label">
                    PBX IP Address:
                  </label>
                  <input
                    type="text"
                    value={grandstreamConfig.pbxIP}
                    onChange={(e) => handleGrandstreamChange('pbxIP', e.target.value)}
                    placeholder="192.168.1.100"
                    className="ata-form-input"
                  />
                </div>
                
                <div>
                  <label className="ata-form-label">
                    Extension Number:
                  </label>
                  <input
                    type="text"
                    value={grandstreamConfig.extensionNumber}
                    onChange={(e) => handleGrandstreamChange('extensionNumber', e.target.value)}
                    placeholder="2001"
                    className="ata-form-input"
                  />
                </div>
                
                <div>
                  <label className="ata-form-label">
                    Extension Secret:
                  </label>
                  <input
                    type="password"
                    value={grandstreamConfig.extensionSecret}
                    onChange={(e) => handleGrandstreamChange('extensionSecret', e.target.value)}
                    placeholder="Extension password"
                    className="ata-form-input"
                  />
                </div>
              </div>
            </div>

            {/* Grandstream Configuration Steps */}
            <div className="ata-grandstream-steps">
              <h3 className="ata-grandstream-steps-title">
                📋 Grandstream Configuration Steps
              </h3>
              
              <ol className="ata-grandstream-steps-list">
                <li><strong>Access Web Interface:</strong> Connect to the Grandstream device's web interface (usually 192.168.x.x)</li>
                <li><strong>Login:</strong> Use admin credentials to access the configuration</li>
                <li><strong>Basic Settings:</strong> Navigate to Basic Settings and configure:
                  <ul className="ata-grandstream-steps-sublist">
                    <li>Primary SIP Server: <strong>{grandstreamConfig.pbxIP || '[PBX IP Address]'}</strong></li>
                    <li>SIP User ID: <strong>{grandstreamConfig.extensionNumber || '[Extension Number]'}</strong></li>
                    <li>Authenticate ID: <strong>{grandstreamConfig.extensionNumber || '[Extension Number]'}</strong></li>
                    <li>Authenticate Password: <strong>{grandstreamConfig.extensionSecret || '[Extension Password]'}</strong></li>
                  </ul>
                </li>
                <li><strong>Audio Settings:</strong> Configure for fax optimization:
                  <ul className="ata-grandstream-steps-sublist">
                    <li>Set Preferred Vocoder to G.711u or G.711a</li>
                    <li>Enable T.38 fax support</li>
                    <li>Disable echo cancellation for fax lines</li>
                    <li>Set silence suppression to No</li>
                  </ul>
                </li>
                <li><strong>Apply Settings:</strong> Save and apply all configuration changes</li>
                <li><strong>Test:</strong> Verify registration and test fax functionality</li>
              </ol>
            </div>
          </div>
        )}

        {/* Cisco SPA 122 Tab Content */}
        {activeTab === 'cisco' && (
          <div>
            <div className="ata-cisco-info">
              <h3 className="ata-cisco-info-title">
                📠 Cisco SPA 122 ATA - Step by Step Configuration
              </h3>
              <p className="ata-cisco-info-text">
                This guide provides detailed instructions for configuring Cisco SPA 122 ATAs with fax-optimized settings.
              </p>
            </div>

            {/* Configuration Input Form */}
            <div className="ata-cisco-form">
              <h3 className="ata-cisco-form-title">
                Configuration Parameters
              </h3>
              
              <div className="ata-cisco-form-grid">
                <div>
                  <label className="ata-form-label">
                    Customer Handle:
                  </label>
                  <input
                    type="text"
                    value={ciscoConfig.customerHandle}
                    onChange={(e) => handleCiscoChange('customerHandle', e.target.value)}
                    placeholder="Enter customer handle"
                    className="ata-form-input"
                  />
                </div>
                
                <div>
                  <label className="ata-form-label">
                    PBX IP Address:
                  </label>
                  <input
                    type="text"
                    value={ciscoConfig.pbxIP}
                    onChange={(e) => handleCiscoChange('pbxIP', e.target.value)}
                    placeholder="192.168.1.100"
                    className="ata-form-input"
                  />
                </div>
                
                <div>
                  <label className="ata-form-label">
                    Extension Number:
                  </label>
                  <input
                    type="text"
                    value={ciscoConfig.extensionNumber}
                    onChange={(e) => handleCiscoChange('extensionNumber', e.target.value)}
                    placeholder="2001"
                    className="ata-form-input"
                  />
                </div>
                
                <div>
                  <label className="ata-form-label">
                    Extension Password:
                  </label>
                  <input
                    type="password"
                    value={ciscoConfig.extensionPassword}
                    onChange={(e) => handleCiscoChange('extensionPassword', e.target.value)}
                    placeholder="Extension password"
                    className="ata-form-input"
                  />
                </div>
              </div>
            </div>

            {/* Step-by-Step Configuration Guide */}
            <div className="ata-cisco-steps">
              <h3 className="ata-cisco-steps-title">
                📋 Step-by-Step Configuration Instructions
              </h3>
              
              <div className="ata-cisco-warning">
                <strong>⚠️ Important:</strong> This process requires physical access to the Cisco SPA 122 device and network connectivity.
              </div>

              <ol className="ata-cisco-steps-list">
                <li><strong>Factory Reset:</strong> Hold down the physical Reset button on the SPA122 device until it resets to factory defaults.</li>
                
                <li><strong>Initial Login:</strong> Once factory defaulted, log into the ATA via web browser using default credentials:
                  <ul className="ata-cisco-steps-sublist">
                    <li>Username: <code className="ata-cisco-code">admin</code></li>
                    <li>Password: <code className="ata-cisco-code">admin</code></li>
                  </ul>
                </li>
                
                <li><strong>Firmware Upgrade:</strong> Select the <strong>Administration</strong> tab, then <strong>Firmware Upgrade</strong>. Upgrade the firmware file to the latest version.</li>
                
                <li><strong>Post-Firmware Access:</strong> After firmware update, access the ATA locally via Ethernet port on IP address:
                  <code className="ata-cisco-code-inline">192.168.15.1</code>
                  (Web Access is disabled after firmware update)
                </li>
                
                <li><strong>Change Admin Password:</strong>
                  <ul className="ata-cisco-steps-sublist">
                    <li>Go to <strong>Administration</strong> → <strong>User List</strong></li>
                    <li>Edit the admin user</li>
                    <li>Set password to: <code className="ata-cisco-code">08520852</code></li>
                    <li>Submit changes</li>
                  </ul>
                </li>
                
                <li><strong>Enable Remote Management:</strong>
                  <ul className="ata-cisco-steps-sublist">
                    <li>Go to <strong>Administration</strong> → <strong>Web Access Management</strong></li>
                    <li>Set <strong>Remote Management</strong> to <strong>Enabled</strong></li>
                    <li>Submit changes</li>
                  </ul>
                </li>
                
                <li><strong>Configure Hostname:</strong>
                  <ul className="ata-cisco-steps-sublist">
                    <li>Go to <strong>Network Setup</strong> → <strong>Internet Settings</strong></li>
                    <li>Set Host Name to: <strong>{ciscoConfig.customerHandle}</strong>ATA (or similar identifier)</li>
                    <li>Submit changes</li>
                  </ul>
                </li>
                
                <li><strong>Set Timezone:</strong>
                  <ul className="ata-cisco-steps-sublist">
                    <li>Go to <strong>Network Setup</strong> → <strong>Time Settings</strong></li>
                    <li>Set Timezone to <strong>Eastern</strong></li>
                    <li>Submit changes</li>
                  </ul>
                </li>
                
                <li><strong>Disable Provisioning:</strong>
                  <ul className="ata-cisco-steps-sublist">
                    <li>Go to <strong>Voice</strong> → <strong>Provisioning</strong></li>
                    <li>Set <strong>Provisioning Enable</strong> to <strong>No</strong></li>
                    <li>Submit changes</li>
                  </ul>
                </li>
                
                <li><strong>Configure Line 1:</strong> Go to <strong>Voice</strong> → <strong>Line 1</strong> and configure the following sections:
                  
                  <div className="ata-cisco-line-config">
                    <h4 className="ata-cisco-line-config-title">a. Network Settings:</h4>
                    <ul>
                      <li>Set <strong>Jitter Buffer Adjustment</strong> to <strong>No</strong></li>
                      <li>Set <strong>Network Jitter Level</strong> to <strong>Very High</strong></li>
                    </ul>
                    
                    <h4 className="ata-cisco-line-config-title">b. Proxy and Registration:</h4>
                    <ul>
                      <li>Enter PBX IP Address: <strong>{ciscoConfig.pbxIP || '[Enter PBX IP]'}</strong></li>
                    </ul>
                    
                    <h4 className="ata-cisco-line-config-title">c. Subscriber Information:</h4>
                    <ul>
                      <li>Display Name: <strong>{ciscoConfig.extensionNumber || '[Extension Number]'}</strong></li>
                      <li>User ID: <strong>{ciscoConfig.extensionNumber || '[Extension Number]'}</strong></li>
                      <li>Auth ID: <strong>{ciscoConfig.extensionNumber || '[Extension Number]'}</strong></li>
                      <li>Password: <strong>{ciscoConfig.extensionPassword || '[Extension Password]'}</strong></li>
                    </ul>
                    
                    <h4 className="ata-cisco-line-config-title">d. Supplementary Service Subscription:</h4>
                    <ul>
                      <li>Set <strong>Call Waiting Serv</strong> to <strong>No</strong></li>
                      <li>Set <strong>Three Way Conf Serv</strong> to <strong>No</strong></li>
                      <li>Set <strong>Service Announcement Serv</strong> to <strong>No</strong></li>
                    </ul>
                    
                    <h4 className="ata-cisco-line-config-title">e. Audio Configuration:</h4>
                    <ul>
                      <li>Set <strong>Second Preferred Codec</strong> to <strong>G711a</strong></li>
                      <li>Set the following to <strong>Yes</strong>:
                        <ul className="ata-cisco-audio-list">
                          <li>G729a Enable</li>
                          <li>G726a Enable</li>
                          <li>FAX V21 Detect Enable</li>
                          <li>FAX CNG Detect Enable</li>
                          <li>FAX Codec Symmetric</li>
                          <li>Fax Process NSE</li>
                          <li>FAX Disable ECAN</li>
                          <li>FAX T38 ECM Enable</li>
                          <li>Modem Line</li>
                          <li>Use Pref Codec Only</li>
                          <li>FAX Enable T38</li>
                        </ul>
                      </li>
                      <li>Set <strong>FAX Passthru Method</strong> to <strong>ReINVITE</strong></li>
                      <li>Set <strong>Echo Canc Enable</strong> to <strong>No</strong></li>
                      <li>Set <strong>FAX Tone Detect Mode</strong> to <strong>Caller or Callee</strong></li>
                    </ul>
                  </div>
                </li>
                
                <li><strong>Apply and Test:</strong>
                  <ul className="ata-cisco-steps-sublist">
                    <li>Submit all changes</li>
                    <li>Reboot the device if required</li>
                    <li>Test registration with the PBX</li>
                    <li>Test fax functionality</li>
                  </ul>
                </li>
              </ol>
            </div>

            {/* Additional Notes */}
            <div className="ata-cisco-notes">
              <h4 className="ata-cisco-notes-title">
                📝 Additional Configuration Notes:
              </h4>
              <ul className="ata-cisco-notes-list">
                <li>The SPA 122 supports 2 FXS ports for analog devices</li>
                <li>Default IP after firmware update: 192.168.15.1</li>
                <li>For fax optimization, T.38 should be enabled</li>
                <li>Echo cancellation is typically disabled for fax lines</li>
                <li>G.711a codec is preferred for fax transmission</li>
                <li>Remote management must be enabled for external access</li>
              </ul>
            </div>
          </div>
        )}

        {/* Generate Button */}
        <div className="ata-generate-button-container">
          <button
            onClick={generateAtaConfig}
            className="ata-generate-button"
          >
            🔧 Generate ATA Configuration
          </button>
        </div>

        {/* Generated Configuration Display */}
        {generatedConfig && (
          <div className="ata-output-section">
            <div className="ata-output-header">
              <h3 className="ata-output-title">
                Generated ATA Configuration
              </h3>
              <div className="ata-output-actions">
                <button
                  onClick={copyToClipboard}
                  className="ata-action-button secondary"
                >
                  📋 Copy
                </button>
                <button
                  onClick={downloadConfig}
                  className="ata-action-button primary"
                >
                  💾 Download
                </button>
              </div>
            </div>
            
            <textarea
              value={generatedConfig}
              readOnly
              className="ata-output-textarea"
              title="Generated ATA Configuration"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ATA;
