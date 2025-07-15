import React, { useState } from 'react';

const ATA: React.FC = () => {
  const [customerHandle, setCustomerHandle] = useState('');
  const [pbxIP, setPbxIP] = useState('');
  const [extensionNumber, setExtensionNumber] = useState('');
  const [extensionSecret, setExtensionSecret] = useState('');
  const [showConfig, setShowConfig] = useState(false);

  const generateConfig = () => {
    if (!customerHandle || !pbxIP || !extensionNumber || !extensionSecret) {
      alert('Please fill in all required fields');
      return;
    }
    setShowConfig(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Configuration copied to clipboard!');
  };

  return (
    <div className="ata-container">
      <div className="ata-main-card">
        <h1 className="ata-title">
          📠 Grandstream ATA Configuration
        </h1>

        <div className="ata-info-section">
          <h3 className="ata-info-title">
            ℹ️ About ATAs (Analog Telephone Adapters)
          </h3>
          <p className="ata-info-text">
            ATAs convert analog devices like fax machines, alarm systems, and legacy phones to work with VoIP systems.
            This configuration is specifically optimized for fax transmission reliability.
          </p>
        </div>

        {/* Input Form */}
        <div className="ata-form-section">
          <h2 className="ata-form-title">
            Configuration Parameters
          </h2>
          
          <div className="ata-form-grid">
            <div className="ata-form-group">
              <label htmlFor="customer-handle" className="ata-form-label">
                Customer Handle *
              </label>
              <input
                id="customer-handle"
                type="text"
                value={customerHandle}
                onChange={(e) => setCustomerHandle(e.target.value)}
                placeholder="e.g., ACME123"
                className="ata-form-input"
                aria-required="true"
                aria-describedby="customer-handle-desc"
              />
              <span id="customer-handle-desc" className="sr-only">
                Enter a unique identifier for the customer
              </span>
            </div>

            <div className="ata-form-group">
              <label htmlFor="pbx-ip" className="ata-form-label">
                PBX IP Address *
              </label>
              <input
                id="pbx-ip"
                type="text"
                value={pbxIP}
                onChange={(e) => setPbxIP(e.target.value)}
                placeholder="e.g., 192.168.1.100"
                className="ata-form-input"
                aria-required="true"
                aria-describedby="pbx-ip-desc"
              />
              <span id="pbx-ip-desc" className="sr-only">
                Enter the IP address of the PBX server
              </span>
            </div>

            <div className="ata-form-group">
              <label htmlFor="extension-number" className="ata-form-label">
                Extension Number *
              </label>
              <input
                id="extension-number"
                type="text"
                value={extensionNumber}
                onChange={(e) => setExtensionNumber(e.target.value)}
                placeholder="e.g., 201"
                className="ata-form-input"
                aria-required="true"
                aria-describedby="extension-number-desc"
              />
              <span id="extension-number-desc" className="sr-only">
                Enter the extension number for this ATA
              </span>
            </div>

            <div className="ata-form-group">
              <label htmlFor="extension-secret" className="ata-form-label">
                Extension Secret *
              </label>
              <input
                id="extension-secret"
                type="password"
                value={extensionSecret}
                onChange={(e) => setExtensionSecret(e.target.value)}
                placeholder="Extension password"
                className="ata-form-input"
                aria-required="true"
                aria-describedby="extension-secret-desc"
              />
              <span id="extension-secret-desc" className="sr-only">
                Enter the password for the extension
              </span>
            </div>
          </div>

          <button
            onClick={generateConfig}
            className="ata-generate-button"
            aria-label="Generate ATA configuration steps"
          >
            Generate Configuration Steps
          </button>
        </div>

        {/* Configuration Steps */}
        {showConfig && (
          <div className="ata-config-section">
            <div className="ata-config-header">
              <h2 className="ata-config-title">
                📋 Grandstream ATA Configuration Steps
              </h2>
              <button
                onClick={() => copyToClipboard(document.getElementById('config-content')?.innerText || '')}
                className="ata-copy-button"
                aria-label="Copy all configuration steps to clipboard"
              >
                📋 Copy All
              </button>
            </div>

            <div id="config-content">
              <div className="ata-important-note">
                <strong>⚠️ Important:</strong> Access the ATA web interface by typing its IP address in your browser.
                Default login is usually admin/admin or admin/123.
              </div>

              {/* Step 1 - Advanced Settings */}
              <div className="ata-step-section">
                <h3 className="ata-step-title ata-step-title-error">
                  🔧 STEP 1: ADVANCED SETTINGS
                </h3>
                <ul className="ata-step-list">
                  <li>Change Password to: <strong>08520852123Net</strong></li>
                  <li>Set 3CX Auto Provision to: <strong>NO</strong></li>
                  <li>Set Automatic Upgrade to: <strong>NO</strong></li>
                  <li>Select: <strong>Always Skip the Firmware Check</strong></li>
                  <li>Set Enable TR-069 to: <strong>NO</strong></li>
                  <li><strong>Click APPLY at the bottom</strong></li>
                </ul>
              </div>

              {/* Step 2 - Basic Settings */}
              <div className="ata-step-section">
                <h3 className="ata-step-title ata-step-title-success">
                  ⚙️ STEP 2: BASIC SETTINGS
                </h3>
                <ul className="ata-step-list">
                  <li>Set DHCP Hostname to: <strong>{customerHandle}_ATA</strong></li>
                  <li>Set Time Zone to: <strong>Eastern</strong></li>
                  <li><strong>Click APPLY at the bottom</strong></li>
                </ul>
              </div>

              {/* Step 3 - FXS Port Settings */}
              <div className="ata-step-section">
                <h3 className="ata-step-title ata-step-title-info">
                  📞 STEP 3: FXS PORT 1 SETTINGS
                </h3>
                
                <div className="ata-subsection">
                  <h4 className="ata-subsection-title">SIP Configuration:</h4>
                  <ul className="ata-step-list">
                    <li>Primary SIP Server: <strong>{pbxIP}</strong></li>
                    <li>SIP User ID: <strong>{extensionNumber}</strong></li>
                    <li>Authenticate ID: <strong>{extensionNumber}</strong></li>
                    <li>Authenticate Password: <strong>{extensionSecret}</strong></li>
                  </ul>
                </div>

                <div className="ata-subsection">
                  <h4 className="ata-subsection-title">Call Waiting Settings:</h4>
                  <ul className="ata-step-list">
                    <li>Disable Call Waiting: <strong>YES</strong></li>
                    <li>Disable Call Waiting Caller ID: <strong>YES</strong></li>
                    <li>Disable Call Waiting Tone: <strong>YES</strong></li>
                  </ul>
                </div>

                <div className="ata-subsection">
                  <h4 className="ata-subsection-title">Audio & Codec Settings:</h4>
                  <ul className="ata-step-list">
                    <li>Ring Timeout: <strong>90</strong></li>
                    <li>Preferred Vocoder (choices 1-8): <strong>ALL SET TO PCMU</strong></li>
                    <li>TX Gain: <strong>-6dB</strong></li>
                    <li>RX Gain: <strong>-6dB</strong></li>
                  </ul>
                </div>

                <div className="ata-subsection">
                  <h4 className="ata-subsection-title">Fax Optimization:</h4>
                  <ul className="ata-step-list">
                    <li>Fax Mode: <strong>PASS-THROUGH</strong></li>
                    <li>Re-invite After Fax Tone Detected: <strong>ENABLED</strong></li>
                    <li>Jitter Buffer Type: <strong>ADAPTIVE</strong></li>
                    <li>Jitter Buffer Length: <strong>HIGH</strong></li>
                  </ul>
                </div>

                <div className="ata-subsection">
                  <h4 className="ata-subsection-title">Echo Cancellation:</h4>
                  <ul className="ata-step-list">
                    <li>Disable Line Echo Canceller (LEC): <strong>YES</strong></li>
                    <li>Disable Network Echo Suppressor: <strong>YES</strong></li>
                  </ul>
                </div>

                <div>
                  <h4 className="ata-subsection-title">Call Features:</h4>
                  <ul className="ata-step-list">
                    <li>Enable Call Features: <strong>NO</strong></li>
                  </ul>
                </div>

                <div className="ata-apply-note">
                  <strong>✅ Click APPLY at the bottom once completed</strong>
                </div>
              </div>

              {/* Verification Steps */}
              <div className="ata-verification-section">
                <h3 className="ata-verification-title">
                  ✅ VERIFICATION STEPS
                </h3>
                <ol className="ata-verification-list">
                  <li>Check that the ATA shows "Registered" status for FXS Port 1</li>
                  <li>Test making an outbound call from the connected fax/analog device</li>
                  <li>Test receiving an inbound call to extension {extensionNumber}</li>
                  <li>Test fax transmission if applicable</li>
                  <li>Monitor for any registration issues in the ATA logs</li>
                </ol>
              </div>

              {/* Troubleshooting */}
              <div className="ata-troubleshooting-section">
                <h3 className="ata-troubleshooting-title">
                  🔍 TROUBLESHOOTING TIPS
                </h3>
                <ul className="ata-troubleshooting-list">
                  <li><strong>No Registration:</strong> Verify PBX IP, extension credentials, and network connectivity</li>
                  <li><strong>Fax Issues:</strong> Ensure T.38 is disabled on PBX side, use pass-through mode</li>
                  <li><strong>Audio Quality:</strong> Adjust gain settings if audio is too loud/quiet</li>
                  <li><strong>Echo Problems:</strong> Verify echo cancellation settings are disabled as configured</li>
                  <li><strong>Ring Issues:</strong> Check ring timeout and analog device compatibility</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ATA;
