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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minHeight: '100vh',
      justifyContent: 'flex-start',
      padding: '20px',
      backgroundColor: 'var(--bg-light)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '1200px',
        backgroundColor: 'var(--bg-white)',
        borderRadius: '12px',
        padding: '32px',
        boxShadow: 'var(--shadow)',
        border: '1px solid var(--border-light)'
      }}>
        <h1 style={{
          margin: '0 0 32px 0',
          color: 'var(--text-primary)',
          textAlign: 'center',
          fontSize: '2.5rem',
          fontWeight: 'bold'
        }}>
          📠 ATA Configuration Generator
        </h1>
        
        <p style={{
          textAlign: 'center',
          color: 'var(--text-secondary)',
          marginBottom: '32px',
          fontSize: '1.1rem'
        }}>
          Configure Analog Telephone Adapters for fax machines and analog devices
        </p>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '32px',
          borderBottom: '1px solid var(--border-light)',
          paddingBottom: '8px'
        }}>
          <button
            onClick={() => setActiveTab('general')}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: activeTab === 'general' ? 'bold' : 'normal',
              color: activeTab === 'general' ? 'var(--brand-primary)' : 'var(--text-secondary)',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === 'general' ? '2px solid var(--brand-primary)' : 'none',
              transition: 'color 0.3s, border-bottom 0.3s'
            }}
          >
            General ATA Config
          </button>
          <button
            onClick={() => setActiveTab('grandstream')}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: activeTab === 'grandstream' ? 'bold' : 'normal',
              color: activeTab === 'grandstream' ? 'var(--brand-primary)' : 'var(--text-secondary)',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === 'grandstream' ? '2px solid var(--brand-primary)' : 'none',
              transition: 'color 0.3s, border-bottom 0.3s'
            }}
          >
            Grandstream Specific Config
          </button>
          <button
            onClick={() => setActiveTab('cisco')}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: activeTab === 'cisco' ? 'bold' : 'normal',
              color: activeTab === 'cisco' ? 'var(--brand-primary)' : 'var(--text-secondary)',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === 'cisco' ? '2px solid var(--brand-primary)' : 'none',
              transition: 'color 0.3s, border-bottom 0.3s'
            }}
          >
            Cisco SPA 122 Config
          </button>
        </div>

        {/* General Tab Content */}
        {activeTab === 'general' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
            marginBottom: '32px'
          }}>
            
            {/* Device Configuration */}
            <div style={{
              backgroundColor: 'var(--bg-light)',
              padding: '24px',
              borderRadius: '8px',
              border: '1px solid var(--border-light)'
            }}>
              <h3 style={{ margin: '0 0 16px 0', color: 'var(--brand-primary)' }}>
                Device Configuration
              </h3>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Device Model:
                </label>
                <select
                  value={ataConfig.deviceModel}
                  onChange={(e) => handleInputChange('deviceModel', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-light)'
                  }}
                >
                  <option value="Grandstream HT802">Grandstream HT802</option>
                  <option value="Grandstream HT801">Grandstream HT801</option>
                  <option value="Cisco SPA 122">Cisco SPA 122</option>
                  <option value="Cisco ATA 191">Cisco ATA 191</option>
                  <option value="Obihai OBi202">Obihai OBi202</option>
                  <option value="Linksys PAP2T">Linksys PAP2T</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  SIP Server:
                </label>
                <input
                  type="text"
                  value={ataConfig.sipServer}
                  onChange={(e) => handleInputChange('sipServer', e.target.value)}
                  placeholder="192.168.1.100 or pbx.example.com"
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-light)'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  SIP Port:
                </label>
                <input
                  type="text"
                  value={ataConfig.sipPort}
                  onChange={(e) => handleInputChange('sipPort', e.target.value)}
                  placeholder="5060"
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-light)'
                  }}
                />
              </div>
            </div>

            {/* Extension Configuration */}
            <div style={{
              backgroundColor: 'var(--bg-light)',
              padding: '24px',
              borderRadius: '8px',
              border: '1px solid var(--border-light)'
            }}>
              <h3 style={{ margin: '0 0 16px 0', color: 'var(--brand-primary)' }}>
                Extension Configuration
              </h3>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Fax Extension:
                </label>
                <input
                  type="text"
                  value={ataConfig.faxExtension}
                  onChange={(e) => handleInputChange('faxExtension', e.target.value)}
                  placeholder="2001"
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-light)'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Fax Password:
                </label>
                <input
                  type="password"
                  value={ataConfig.faxPassword}
                  onChange={(e) => handleInputChange('faxPassword', e.target.value)}
                  placeholder="Extension password"
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-light)'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Analog Extension:
                </label>
                <input
                  type="text"
                  value={ataConfig.analogExtension}
                  onChange={(e) => handleInputChange('analogExtension', e.target.value)}
                  placeholder="2002"
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-light)'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Analog Password:
                </label>
                <input
                  type="password"
                  value={ataConfig.analogPassword}
                  onChange={(e) => handleInputChange('analogPassword', e.target.value)}
                  placeholder="Extension password"
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-light)'
                  }}
                />
              </div>
            </div>

            {/* Audio and Codec Settings */}
            <div style={{
              backgroundColor: 'var(--bg-light)',
              padding: '24px',
              borderRadius: '8px',
              border: '1px solid var(--border-light)'
            }}>
              <h3 style={{ margin: '0 0 16px 0', color: 'var(--brand-primary)' }}>
                Audio & Codec Settings
              </h3>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Preferred Codec:
                </label>
                <select
                  value={ataConfig.codecPreference}
                  onChange={(e) => handleInputChange('codecPreference', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-light)'
                  }}
                >
                  <option value="G.711u">G.711u (μ-law)</option>
                  <option value="G.711a">G.711a (A-law)</option>
                  <option value="G.729">G.729</option>
                  <option value="G.722">G.722</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Fax Mode:
                </label>
                <select
                  value={ataConfig.faxMode}
                  onChange={(e) => handleInputChange('faxMode', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-light)'
                  }}
                >
                  <option value="T.38">T.38 (Recommended)</option>
                  <option value="G.711 Passthrough">G.711 Passthrough</option>
                  <option value="Auto">Auto Detect</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
                  <input
                    type="checkbox"
                    checked={ataConfig.echoCancel}
                    onChange={(e) => handleInputChange('echoCancel', e.target.checked)}
                    style={{ marginRight: '8px' }}
                  />
                  Enable Echo Cancellation
                </label>
                <small style={{ color: 'var(--text-secondary)' }}>
                  (Usually disabled for fax lines)
                </small>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  DTMF Mode:
                </label>
                <select
                  value={ataConfig.dtmfMode}
                  onChange={(e) => handleInputChange('dtmfMode', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-light)'
                  }}
                >
                  <option value="RFC2833">RFC2833</option>
                  <option value="SIP INFO">SIP INFO</option>
                  <option value="In-band">In-band</option>
                </select>
              </div>
            </div>

            {/* Advanced Settings */}
            <div style={{
              backgroundColor: 'var(--bg-light)',
              padding: '24px',
              borderRadius: '8px',
              border: '1px solid var(--border-light)'
            }}>
              <h3 style={{ margin: '0 0 16px 0', color: 'var(--brand-primary)' }}>
                Advanced Settings
              </h3>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Dial Plan:
                </label>
                <input
                  type="text"
                  value={ataConfig.dialPlan}
                  onChange={(e) => handleInputChange('dialPlan', e.target.value)}
                  placeholder="(*|#|0|00|[1-9]++|*x+|911|933)"
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-light)'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Registration Expiry (seconds):
                </label>
                <input
                  type="text"
                  value={ataConfig.registrationExpiry}
                  onChange={(e) => handleInputChange('registrationExpiry', e.target.value)}
                  placeholder="3600"
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-light)'
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Grandstream Tab Content */}
        {activeTab === 'grandstream' && (
          <div>
            <div style={{
              background: '#e3f2fd',
              border: '1px solid #2196f3',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px'
            }}>
              <h3 style={{ color: '#1976d2', margin: '0 0 8px 0' }}>
                📠 Grandstream ATA - Step by Step Configuration
              </h3>
              <p style={{ margin: 0, color: '#1565c0' }}>
                This guide provides detailed instructions for configuring Grandstream ATAs with fax-optimized settings.
              </p>
            </div>

            {/* Configuration Input Form */}
            <div style={{
              background: '#f8f9fa',
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              padding: '24px',
              marginBottom: '24px'
            }}>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>
                Configuration Parameters
              </h3>
              
              <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    Customer Handle:
                  </label>
                  <input
                    type="text"
                    value={grandstreamConfig.customerHandle}
                    onChange={(e) => handleGrandstreamChange('customerHandle', e.target.value)}
                    placeholder="Enter customer handle"
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid var(--border-light)'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    PBX IP Address:
                  </label>
                  <input
                    type="text"
                    value={grandstreamConfig.pbxIP}
                    onChange={(e) => handleGrandstreamChange('pbxIP', e.target.value)}
                    placeholder="192.168.1.100"
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid var(--border-light)'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    Extension Number:
                  </label>
                  <input
                    type="text"
                    value={grandstreamConfig.extensionNumber}
                    onChange={(e) => handleGrandstreamChange('extensionNumber', e.target.value)}
                    placeholder="2001"
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid var(--border-light)'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    Extension Secret:
                  </label>
                  <input
                    type="password"
                    value={grandstreamConfig.extensionSecret}
                    onChange={(e) => handleGrandstreamChange('extensionSecret', e.target.value)}
                    placeholder="Extension password"
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid var(--border-light)'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Grandstream Configuration Steps */}
            <div style={{
              background: 'var(--bg-white)',
              border: '2px solid var(--brand-primary)',
              borderRadius: '8px',
              padding: '24px'
            }}>
              <h3 style={{ color: 'var(--brand-primary)', marginBottom: '16px' }}>
                📋 Grandstream Configuration Steps
              </h3>
              
              <ol style={{ lineHeight: '1.8', color: 'var(--text-primary)' }}>
                <li><strong>Access Web Interface:</strong> Connect to the Grandstream device's web interface (usually 192.168.x.x)</li>
                <li><strong>Login:</strong> Use admin credentials to access the configuration</li>
                <li><strong>Basic Settings:</strong> Navigate to Basic Settings and configure:
                  <ul style={{ marginTop: '8px' }}>
                    <li>Primary SIP Server: <strong>{grandstreamConfig.pbxIP || '[PBX IP Address]'}</strong></li>
                    <li>SIP User ID: <strong>{grandstreamConfig.extensionNumber || '[Extension Number]'}</strong></li>
                    <li>Authenticate ID: <strong>{grandstreamConfig.extensionNumber || '[Extension Number]'}</strong></li>
                    <li>Authenticate Password: <strong>{grandstreamConfig.extensionSecret || '[Extension Password]'}</strong></li>
                  </ul>
                </li>
                <li><strong>Audio Settings:</strong> Configure for fax optimization:
                  <ul style={{ marginTop: '8px' }}>
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
            <div style={{
              background: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px'
            }}>
              <h3 style={{ color: '#856404', margin: '0 0 8px 0' }}>
                📠 Cisco SPA 122 ATA - Step by Step Configuration
              </h3>
              <p style={{ margin: 0, color: '#856404' }}>
                This guide provides detailed instructions for configuring Cisco SPA 122 ATAs with fax-optimized settings.
              </p>
            </div>

            {/* Configuration Input Form */}
            <div style={{
              background: '#f8f9fa',
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              padding: '24px',
              marginBottom: '24px'
            }}>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>
                Configuration Parameters
              </h3>
              
              <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    Customer Handle:
                  </label>
                  <input
                    type="text"
                    value={ciscoConfig.customerHandle}
                    onChange={(e) => handleCiscoChange('customerHandle', e.target.value)}
                    placeholder="Enter customer handle"
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid var(--border-light)'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    PBX IP Address:
                  </label>
                  <input
                    type="text"
                    value={ciscoConfig.pbxIP}
                    onChange={(e) => handleCiscoChange('pbxIP', e.target.value)}
                    placeholder="192.168.1.100"
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid var(--border-light)'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    Extension Number:
                  </label>
                  <input
                    type="text"
                    value={ciscoConfig.extensionNumber}
                    onChange={(e) => handleCiscoChange('extensionNumber', e.target.value)}
                    placeholder="2001"
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid var(--border-light)'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    Extension Password:
                  </label>
                  <input
                    type="password"
                    value={ciscoConfig.extensionPassword}
                    onChange={(e) => handleCiscoChange('extensionPassword', e.target.value)}
                    placeholder="Extension password"
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid var(--border-light)'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Step-by-Step Configuration Guide */}
            <div style={{
              background: 'var(--bg-white)',
              border: '1px solid var(--border-light)',
              borderRadius: '8px',
              padding: '24px',
              marginBottom: '24px'
            }}>
              <h3 style={{ color: 'var(--brand-primary)', marginBottom: '16px' }}>
                📋 Step-by-Step Configuration Instructions
              </h3>
              
              <div style={{
                background: '#ffeaa7',
                border: '1px solid #fdcb6e',
                borderRadius: '4px',
                padding: '12px',
                marginBottom: '16px'
              }}>
                <strong>⚠️ Important:</strong> This process requires physical access to the Cisco SPA 122 device and network connectivity.
              </div>

              <ol style={{ lineHeight: '1.8', color: 'var(--text-primary)' }}>
                <li><strong>Factory Reset:</strong> Hold down the physical Reset button on the SPA122 device until it resets to factory defaults.</li>
                
                <li><strong>Initial Login:</strong> Once factory defaulted, log into the ATA via web browser using default credentials:
                  <ul style={{ marginTop: '8px' }}>
                    <li>Username: <code style={{ background: '#f8f9fa', padding: '2px 4px', borderRadius: '3px' }}>admin</code></li>
                    <li>Password: <code style={{ background: '#f8f9fa', padding: '2px 4px', borderRadius: '3px' }}>admin</code></li>
                  </ul>
                </li>
                
                <li><strong>Firmware Upgrade:</strong> Select the <strong>Administration</strong> tab, then <strong>Firmware Upgrade</strong>. Upgrade the firmware file to the latest version.</li>
                
                <li><strong>Post-Firmware Access:</strong> After firmware update, access the ATA locally via Ethernet port on IP address:
                  <code style={{ background: '#f8f9fa', padding: '2px 4px', borderRadius: '3px', margin: '0 4px' }}>192.168.15.1</code>
                  (Web Access is disabled after firmware update)
                </li>
                
                <li><strong>Change Admin Password:</strong>
                  <ul style={{ marginTop: '8px' }}>
                    <li>Go to <strong>Administration</strong> → <strong>User List</strong></li>
                    <li>Edit the admin user</li>
                    <li>Set password to: <code style={{ background: '#f8f9fa', padding: '2px 4px', borderRadius: '3px' }}>08520852</code></li>
                    <li>Submit changes</li>
                  </ul>
                </li>
                
                <li><strong>Enable Remote Management:</strong>
                  <ul style={{ marginTop: '8px' }}>
                    <li>Go to <strong>Administration</strong> → <strong>Web Access Management</strong></li>
                    <li>Set <strong>Remote Management</strong> to <strong>Enabled</strong></li>
                    <li>Submit changes</li>
                  </ul>
                </li>
                
                <li><strong>Configure Hostname:</strong>
                  <ul style={{ marginTop: '8px' }}>
                    <li>Go to <strong>Network Setup</strong> → <strong>Internet Settings</strong></li>
                    <li>Set Host Name to: <strong>{ciscoConfig.customerHandle}</strong>ATA (or similar identifier)</li>
                    <li>Submit changes</li>
                  </ul>
                </li>
                
                <li><strong>Set Timezone:</strong>
                  <ul style={{ marginTop: '8px' }}>
                    <li>Go to <strong>Network Setup</strong> → <strong>Time Settings</strong></li>
                    <li>Set Timezone to <strong>Eastern</strong></li>
                    <li>Submit changes</li>
                  </ul>
                </li>
                
                <li><strong>Disable Provisioning:</strong>
                  <ul style={{ marginTop: '8px' }}>
                    <li>Go to <strong>Voice</strong> → <strong>Provisioning</strong></li>
                    <li>Set <strong>Provisioning Enable</strong> to <strong>No</strong></li>
                    <li>Submit changes</li>
                  </ul>
                </li>
                
                <li><strong>Configure Line 1:</strong> Go to <strong>Voice</strong> → <strong>Line 1</strong> and configure the following sections:
                  
                  <div style={{ marginTop: '12px', marginLeft: '20px' }}>
                    <h4 style={{ color: 'var(--brand-secondary)', marginBottom: '8px' }}>a. Network Settings:</h4>
                    <ul>
                      <li>Set <strong>Jitter Buffer Adjustment</strong> to <strong>No</strong></li>
                      <li>Set <strong>Network Jitter Level</strong> to <strong>Very High</strong></li>
                    </ul>
                    
                    <h4 style={{ color: 'var(--brand-secondary)', marginBottom: '8px', marginTop: '16px' }}>b. Proxy and Registration:</h4>
                    <ul>
                      <li>Enter PBX IP Address: <strong>{ciscoConfig.pbxIP || '[Enter PBX IP]'}</strong></li>
                    </ul>
                    
                    <h4 style={{ color: 'var(--brand-secondary)', marginBottom: '8px', marginTop: '16px' }}>c. Subscriber Information:</h4>
                    <ul>
                      <li>Display Name: <strong>{ciscoConfig.extensionNumber || '[Extension Number]'}</strong></li>
                      <li>User ID: <strong>{ciscoConfig.extensionNumber || '[Extension Number]'}</strong></li>
                      <li>Auth ID: <strong>{ciscoConfig.extensionNumber || '[Extension Number]'}</strong></li>
                      <li>Password: <strong>{ciscoConfig.extensionPassword || '[Extension Password]'}</strong></li>
                    </ul>
                    
                    <h4 style={{ color: 'var(--brand-secondary)', marginBottom: '8px', marginTop: '16px' }}>d. Supplementary Service Subscription:</h4>
                    <ul>
                      <li>Set <strong>Call Waiting Serv</strong> to <strong>No</strong></li>
                      <li>Set <strong>Three Way Conf Serv</strong> to <strong>No</strong></li>
                      <li>Set <strong>Service Announcement Serv</strong> to <strong>No</strong></li>
                    </ul>
                    
                    <h4 style={{ color: 'var(--brand-secondary)', marginBottom: '8px', marginTop: '16px' }}>e. Audio Configuration:</h4>
                    <ul>
                      <li>Set <strong>Second Preferred Codec</strong> to <strong>G711a</strong></li>
                      <li>Set the following to <strong>Yes</strong>:
                        <ul style={{ marginTop: '4px' }}>
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
                  <ul style={{ marginTop: '8px' }}>
                    <li>Submit all changes</li>
                    <li>Reboot the device if required</li>
                    <li>Test registration with the PBX</li>
                    <li>Test fax functionality</li>
                  </ul>
                </li>
              </ol>
            </div>

            {/* Additional Notes */}
            <div style={{
              background: '#d1ecf1',
              border: '1px solid #bee5eb',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px'
            }}>
              <h4 style={{ color: '#0c5460', margin: '0 0 8px 0' }}>
                📝 Additional Configuration Notes:
              </h4>
              <ul style={{ margin: 0, color: '#0c5460' }}>
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
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <button
            onClick={generateAtaConfig}
            style={{
              padding: '16px 32px',
              fontSize: '18px',
              fontWeight: 'bold',
              color: 'white',
              backgroundColor: 'var(--brand-primary)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background-color 0.3s'
            }}
          >
            🔧 Generate ATA Configuration
          </button>
        </div>

        {/* Generated Configuration Display */}
        {generatedConfig && (
          <div style={{
            backgroundColor: 'var(--bg-light)',
            border: '1px solid var(--border-light)',
            borderRadius: '8px',
            padding: '24px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h3 style={{ margin: 0, color: 'var(--brand-primary)' }}>
                Generated ATA Configuration
              </h3>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={copyToClipboard}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'var(--brand-secondary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  📋 Copy
                </button>
                <button
                  onClick={downloadConfig}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'var(--brand-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  💾 Download
                </button>
              </div>
            </div>
            
            <textarea
              value={generatedConfig}
              readOnly
              style={{
                width: '100%',
                height: '400px',
                padding: '16px',
                fontFamily: 'monospace',
                fontSize: '14px',
                backgroundColor: 'var(--bg-white)',
                border: '1px solid var(--border-light)',
                borderRadius: '4px',
                resize: 'vertical'
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ATA;
