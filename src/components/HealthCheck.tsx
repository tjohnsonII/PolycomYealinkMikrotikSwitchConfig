import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../utils/api-config';
import API_CONFIG from '../utils/api-config';

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
      
      const authResponse = await fetch(`${API_CONFIG.authBaseUrl}/health`, { 
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      setHealthStatus(prev => ({ 
        ...prev, 
        auth: authResponse.ok ? 'healthy' : 'error' 
      }));
    } catch (error) {
      setHealthStatus(prev => ({ ...prev, auth: 'error' }));
    }

    // Check API Server  
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const apiResponse = await fetch(getApiUrl('ping'), { 
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      setHealthStatus(prev => ({ 
        ...prev, 
        api: apiResponse.ok ? 'healthy' : 'error' 
      }));
    } catch (error) {
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
    } catch (error) {
      setHealthStatus(prev => ({ ...prev, ws: 'error' }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#28a745';
      case 'error': return '#dc3545';
      case 'timeout': return '#ffc107';
      default: return '#6c757d';
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
    <div style={{
      background: 'var(--bg-white)',
      border: '1px solid var(--border-light)',
      borderRadius: '0.5rem',
      padding: '1rem',
      marginBottom: '1rem'
    }}>
      <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>
        System Health Check
      </h3>
      
      <div style={{ display: 'grid', gap: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Auth Server ({API_CONFIG.authBaseUrl}):</span>
          <span style={{ color: getStatusColor(healthStatus.auth) }}>
            {getStatusText(healthStatus.auth)}
          </span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>API Server ({API_CONFIG.baseUrl}):</span>
          <span style={{ color: getStatusColor(healthStatus.api) }}>
            {getStatusText(healthStatus.api)}
          </span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>WebSocket ({API_CONFIG.wsBaseUrl}):</span>
          <span style={{ color: getStatusColor(healthStatus.ws) }}>
            {getStatusText(healthStatus.ws)}
          </span>
        </div>
      </div>

      <button
        onClick={checkHealth}
        style={{
          marginTop: '1rem',
          padding: '0.5rem 1rem',
          background: 'var(--brand-primary)',
          color: 'white',
          border: 'none',
          borderRadius: '0.25rem',
          cursor: 'pointer'
        }}
      >
        Refresh Health Check
      </button>

      <div style={{ 
        marginTop: '1rem', 
        padding: '0.5rem', 
        background: 'var(--bg-light)', 
        borderRadius: '0.25rem',
        fontSize: '0.875rem',
        color: 'var(--text-secondary)'
      }}>
        <strong>Configuration:</strong><br />
        Hostname: {window.location.hostname}<br />
        Protocol: {window.location.protocol}<br />
        Port: {window.location.port || 'default'}
      </div>
    </div>
  );
};

export default HealthCheck;
