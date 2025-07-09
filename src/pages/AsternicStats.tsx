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
        maxWidth: '1000px',
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
          📊 Asternic Call Center Stats
        </h1>
        
        <p style={{
          textAlign: 'center',
          color: 'var(--text-secondary)',
          marginBottom: '32px',
          fontSize: '1.1rem'
        }}>
          Generate quick access links to Asternic Call Center Statistics dashboard
        </p>

        {/* Configuration Form */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          
          {/* Server Configuration */}
          <div style={{
            backgroundColor: 'var(--bg-light)',
            padding: '24px',
            borderRadius: '8px',
            border: '1px solid var(--border-light)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: 'var(--brand-primary)' }}>
              Server Configuration
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Asternic Server URL:
              </label>
              <input
                type="text"
                value={statsConfig.serverUrl}
                onChange={(e) => handleInputChange('serverUrl', e.target.value)}
                placeholder="192.168.1.100 or asternic.example.com"
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
                Username (optional):
              </label>
              <input
                type="text"
                value={statsConfig.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="admin"
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
                Password (optional):
              </label>
              <input
                type="password"
                value={statsConfig.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="password"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-light)'
                }}
              />
            </div>
          </div>

          {/* Report Configuration */}
          <div style={{
            backgroundColor: 'var(--bg-light)',
            padding: '24px',
            borderRadius: '8px',
            border: '1px solid var(--border-light)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: 'var(--brand-primary)' }}>
              Report Configuration
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Report Type:
              </label>
              <select
                value={statsConfig.reportType}
                onChange={(e) => handleInputChange('reportType', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-light)'
                }}
              >
                <option value="dashboard">Dashboard (Main)</option>
                <option value="agent">Agent Statistics</option>
                <option value="queue">Queue Statistics</option>
                <option value="calls">Call Logs</option>
                <option value="wallboard">Live Wallboard</option>
              </select>
            </div>

            {statsConfig.reportType === 'agent' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Agent Extension:
                </label>
                <input
                  type="text"
                  value={statsConfig.extension}
                  onChange={(e) => handleInputChange('extension', e.target.value)}
                  placeholder="1001"
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-light)'
                  }}
                />
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Time Range:
              </label>
              <select
                value={statsConfig.timeRange}
                onChange={(e) => handleInputChange('timeRange', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-light)'
                }}
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
        <div style={{
          backgroundColor: 'var(--bg-light)',
          padding: '24px',
          borderRadius: '8px',
          border: '1px solid var(--border-light)',
          marginBottom: '32px'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: 'var(--brand-primary)' }}>
            Quick Access
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px'
          }}>
            <button
              onClick={() => {
                setStatsConfig(prev => ({ ...prev, reportType: 'dashboard' }));
                setTimeout(generateStatsUrl, 100);
              }}
              style={{
                padding: '12px 16px',
                backgroundColor: 'var(--brand-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              📊 Dashboard
            </button>
            
            <button
              onClick={() => {
                setStatsConfig(prev => ({ ...prev, reportType: 'wallboard' }));
                setTimeout(generateStatsUrl, 100);
              }}
              style={{
                padding: '12px 16px',
                backgroundColor: 'var(--brand-secondary)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              📺 Live Wallboard
            </button>
            
            <button
              onClick={() => {
                setStatsConfig(prev => ({ ...prev, reportType: 'queue' }));
                setTimeout(generateStatsUrl, 100);
              }}
              style={{
                padding: '12px 16px',
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              📞 Queue Stats
            </button>
            
            <button
              onClick={() => {
                setStatsConfig(prev => ({ ...prev, reportType: 'calls' }));
                setTimeout(generateStatsUrl, 100);
              }}
              style={{
                padding: '12px 16px',
                backgroundColor: '#6f42c1',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              📋 Call Logs
            </button>
          </div>
        </div>

        {/* Generate Button */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <button
            onClick={generateStatsUrl}
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
            🔗 Generate Access Link
          </button>
        </div>

        {/* Generated URL Display */}
        {generatedUrl && (
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
                Generated Access Link
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
                  📋 Copy URL
                </button>
                <button
                  onClick={openStatsWindow}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'var(--brand-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  🚀 Open Stats
                </button>
              </div>
            </div>
            
            <div style={{
              backgroundColor: 'var(--bg-white)',
              border: '1px solid var(--border-light)',
              borderRadius: '4px',
              padding: '12px',
              fontFamily: 'monospace',
              fontSize: '14px',
              wordBreak: 'break-all',
              color: 'var(--text-primary)'
            }}>
              {generatedUrl}
            </div>
          </div>
        )}

        {/* Information Panel */}
        <div style={{
          backgroundColor: '#e3f2fd',
          border: '1px solid #2196f3',
          borderRadius: '8px',
          padding: '16px',
          marginTop: '24px'
        }}>
          <h4 style={{ color: '#1976d2', margin: '0 0 8px 0' }}>
            ℹ️ About Asternic Call Center Stats
          </h4>
          <ul style={{ margin: 0, color: '#1565c0', paddingLeft: '20px' }}>
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
