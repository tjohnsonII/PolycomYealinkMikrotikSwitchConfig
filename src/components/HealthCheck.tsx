import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../utils/api-config';
import API_CONFIG from '../utils/api-config';
import '../styles/inline-styles-fix.css';

const HealthCheck: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState({
    auth: 'checking',
    api: 'checking',
    ws: 'checking'
  });

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    // Check Auth Server
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const authResponse = await fetch(`${API_CONFIG.baseUrl}/api/auth/health`, { 
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      setHealthStatus(prev => ({ 
        ...prev, 
        auth: authResponse.ok ? 'healthy' : 'error' 
      }));
    } catch {
      setHealthStatus(prev => ({ ...prev, auth: 'error' }));
    }

    // Check API Server  
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const apiResponse = await fetch(getApiUrl('health'), { 
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      setHealthStatus(prev => ({ 
        ...prev, 
        api: apiResponse.ok ? 'healthy' : 'error' 
      }));
    } catch {
      setHealthStatus(prev => ({ ...prev, api: 'error' }));
    }

    // Check WebSocket (basic test)
    try {
      const ws = new WebSocket(`${API_CONFIG.wsBaseUrl}/ssh`);
      ws.onopen = () => {
        setHealthStatus(prev => ({ ...prev, ws: 'healthy' }));
        ws.close();
      };
      ws.onerror = () => {
        setHealthStatus(prev => ({ ...prev, ws: 'error' }));
      };
      
      // Timeout after 5 seconds
      setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          setHealthStatus(prev => ({ ...prev, ws: 'timeout' }));
          ws.close();
        }
      }, 5000);
    } catch {
      setHealthStatus(prev => ({ ...prev, ws: 'error' }));
    }
  };

  const getStatusClassName = (status: string) => {
    switch (status) {
      case 'healthy': return 'health-check-status-healthy';
      case 'error': return 'health-check-status-error';
      case 'timeout': return 'health-check-status-timeout';
      default: return 'health-check-status-checking';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'healthy': return '✅ Healthy';
      case 'error': return '❌ Error';
      case 'timeout': return '⏰ Timeout';
      default: return '🔄 Checking...';
    }
  };

  return (
    <div className="health-check-container">
      <h3 className="health-check-title">
        System Health Check
      </h3>
      
      <div className="health-check-grid">
        <div className="health-check-item">
          <span>Auth Server ({API_CONFIG.authBaseUrl}):</span>
          <span className={getStatusClassName(healthStatus.auth)}>
            {getStatusText(healthStatus.auth)}
          </span>
        </div>
        
        <div className="health-check-item">
          <span>API Server ({API_CONFIG.baseUrl}):</span>
          <span className={getStatusClassName(healthStatus.api)}>
            {getStatusText(healthStatus.api)}
          </span>
        </div>
        
        <div className="health-check-item">
          <span>WebSocket ({API_CONFIG.wsBaseUrl}):</span>
          <span className={getStatusClassName(healthStatus.ws)}>
            {getStatusText(healthStatus.ws)}
          </span>
        </div>
      </div>

      <button
        onClick={checkHealth}
        className="health-check-refresh-button"
      >
        Refresh Health Check
      </button>

      <div className="health-check-config-section">
        <div className="health-check-config-title">Configuration:</div>
        Hostname: {window.location.hostname}<br />
        Protocol: {window.location.protocol}<br />
        Port: {window.location.port || 'default'}
      </div>
    </div>
  );
};

export default HealthCheck;
