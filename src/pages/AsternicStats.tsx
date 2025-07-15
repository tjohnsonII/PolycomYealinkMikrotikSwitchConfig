import React, { useState } from 'react';

const AsternicStats: React.FC = () => {
  const [statsConfig, setStatsConfig] = useState({
    serverUrl: '',
    username: '',
    password: '',
    extension: '',
    timeRange: '24h',
    reportType: 'agent'
  });

  const [generatedUrl, setGeneratedUrl] = useState('');

  const handleInputChange = (field: string, value: string) => {
    setStatsConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateStatsUrl = () => {
    const { serverUrl, username, password, extension, timeRange, reportType } = statsConfig;
    
    let baseUrl = serverUrl;
    if (!baseUrl.startsWith('http')) {
      baseUrl = 'http://' + baseUrl;
    }
    if (!baseUrl.endsWith('/')) {
      baseUrl += '/';
    }
    
    // Generate URL based on report type
    let url = `${baseUrl}asternic/`;
    
    if (reportType === 'agent' && extension) {
      url += `agent.php?extension=${extension}`;
    } else if (reportType === 'queue') {
      url += 'queue.php';
    } else if (reportType === 'calls') {
      url += 'calls.php';
    } else if (reportType === 'wallboard') {
      url += 'wallboard.php';
    } else {
      url += 'dashboard.php';
    }
    
    // Add time range parameter
    if (timeRange && timeRange !== 'custom') {
      url += (url.includes('?') ? '&' : '?') + `range=${timeRange}`;
    }
    
    // Add authentication parameters if provided
    if (username && password) {
      url += (url.includes('?') ? '&' : '?') + `user=${encodeURIComponent(username)}&pass=${encodeURIComponent(password)}`;
    }
    
    setGeneratedUrl(url);
  };

  const openStatsWindow = () => {
    if (generatedUrl) {
      window.open(generatedUrl, '_blank', 'width=1200,height=800,resizable=yes,scrollbars=yes');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedUrl);
    alert('URL copied to clipboard!');
  };

  return (
    <div className="asternic-stats-container">
      <div className="asternic-stats-content">
        <h1 className="asternic-stats-title">
          📊 Asternic Call Center Stats
        </h1>
        
        <p className="asternic-stats-subtitle">
          Generate quick access links to Asternic Call Center Statistics dashboard
        </p>

        {/* Configuration Form */}
        <div className="asternic-stats-grid">
          
          {/* Server Configuration */}
          <div className="asternic-stats-section">
            <h3 className="asternic-stats-section-title">
              Server Configuration
            </h3>
            
            <div className="asternic-stats-form-group">
              <label className="asternic-stats-form-label">
                Asternic Server URL:
              </label>
              <input
                type="text"
                value={statsConfig.serverUrl}
                onChange={(e) => handleInputChange('serverUrl', e.target.value)}
                placeholder="192.168.1.100 or asternic.example.com"
                className="asternic-stats-form-input"
              />
            </div>

            <div className="asternic-stats-form-group">
              <label className="asternic-stats-form-label">
                Username (optional):
              </label>
              <input
                type="text"
                value={statsConfig.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="admin"
                className="asternic-stats-form-input"
              />
            </div>

            <div className="asternic-stats-form-group">
              <label className="asternic-stats-form-label">
                Password (optional):
              </label>
              <input
                type="password"
                value={statsConfig.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="password"
                className="asternic-stats-form-input"
              />
            </div>
          </div>

          {/* Report Configuration */}
          <div className="asternic-stats-section">
            <h3 className="asternic-stats-section-title">
              Report Configuration
            </h3>
            
            <div className="asternic-stats-form-group">
              <label className="asternic-stats-form-label">
                Report Type:
              </label>
              <select
                value={statsConfig.reportType}
                onChange={(e) => handleInputChange('reportType', e.target.value)}
                className="asternic-stats-form-select"
                title="Select report type"
                aria-label="Select report type"
              >
                <option value="dashboard">Dashboard (Main)</option>
                <option value="agent">Agent Statistics</option>
                <option value="queue">Queue Statistics</option>
                <option value="calls">Call Logs</option>
                <option value="wallboard">Live Wallboard</option>
              </select>
            </div>

            {statsConfig.reportType === 'agent' && (
              <div className="asternic-stats-form-group">
                <label className="asternic-stats-form-label">
                  Agent Extension:
                </label>
                <input
                  type="text"
                  value={statsConfig.extension}
                  onChange={(e) => handleInputChange('extension', e.target.value)}
                  placeholder="1001"
                  className="asternic-stats-form-input"
                />
              </div>
            )}

            <div className="asternic-stats-form-group">
              <label className="asternic-stats-form-label">
                Time Range:
              </label>
              <select
                value={statsConfig.timeRange}
                onChange={(e) => handleInputChange('timeRange', e.target.value)}
                className="asternic-stats-form-select"
                title="Select time range"
                aria-label="Select time range"
              >
                <option value="1h">Last 1 Hour</option>
                <option value="4h">Last 4 Hours</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
          </div>
        </div>

        {/* Quick Access Buttons */}
        <div className="asternic-stats-output-section">
          <h3 className="asternic-stats-output-title">
            Quick Access
          </h3>
          
          <div className="asternic-stats-button-group">
            <button
              onClick={() => {
                setStatsConfig(prev => ({ ...prev, reportType: 'dashboard' }));
                setTimeout(generateStatsUrl, 100);
              }}
              className="asternic-stats-button"
            >
              📊 Dashboard
            </button>
            
            <button
              onClick={() => {
                setStatsConfig(prev => ({ ...prev, reportType: 'wallboard' }));
                setTimeout(generateStatsUrl, 100);
              }}
              className="asternic-stats-button"
            >
              📺 Live Wallboard
            </button>
            
            <button
              onClick={() => {
                setStatsConfig(prev => ({ ...prev, reportType: 'queue' }));
                setTimeout(generateStatsUrl, 100);
              }}
              className="asternic-stats-button"
            >
              📞 Queue Stats
            </button>
            
            <button
              onClick={() => {
                setStatsConfig(prev => ({ ...prev, reportType: 'calls' }));
                setTimeout(generateStatsUrl, 100);
              }}
              className="asternic-stats-button"
            >
              📋 Call Logs
            </button>
          </div>
        </div>

        {/* Generate Button */}
        <div className="asternic-stats-generate-section">
          <button
            onClick={generateStatsUrl}
            className="asternic-stats-generate-button"
          >
            🔗 Generate Access Link
          </button>
        </div>

        {/* Generated URL Display */}
        {generatedUrl && (
          <div className="asternic-stats-results-section">
            <div className="asternic-stats-results-header">
              <h3 className="asternic-stats-results-title">
                Generated Access Link
              </h3>
              <div className="asternic-stats-results-actions">
                <button
                  onClick={copyToClipboard}
                  className="asternic-stats-results-button"
                >
                  📋 Copy URL
                </button>
                <button
                  onClick={openStatsWindow}
                  className="asternic-stats-results-button"
                >
                  🚀 Open Stats
                </button>
              </div>
            </div>
            
            <div className="asternic-stats-results-content">
              {generatedUrl}
            </div>
          </div>
        )}

        {/* Information Panel */}
        <div className="asternic-stats-instructions">
          <h4 className="asternic-stats-instructions-title">
            ℹ️ About Asternic Call Center Stats
          </h4>
          <ul className="asternic-stats-instructions-list">
            <li>Asternic provides comprehensive call center analytics for Asterisk PBX systems</li>
            <li>Real-time monitoring of agents, queues, and call statistics</li>
            <li>Historical reporting and performance metrics</li>
            <li>Wallboard displays for live call center monitoring</li>
            <li>Requires Asternic to be installed and configured on your PBX server</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AsternicStats;
