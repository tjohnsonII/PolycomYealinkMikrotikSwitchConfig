/**
 * API Configuration Utility
 * 
 * Dynamically determines the correct API base URL based on the environment:
 * - Uses reverse proxy setup where all API calls go through the same port as frontend
 * - Auth API calls go to /api/auth/* 
 * - Other API calls go to /api/*
 */

// Get the current base URL for the frontend
const getBaseUrl = (): string => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = window.location.port;
  
  // Use the same host and port as the frontend
  if (port) {
    return `${protocol}//${hostname}:${port}`;
  } else {
    return `${protocol}//${hostname}`;
  }
};

// Get API base URL - same as frontend since we use reverse proxy
const getApiBaseUrl = (): string => {
  return getBaseUrl();
};

// Get Auth API base URL - same as frontend since we use reverse proxy  
const getAuthApiBaseUrl = (): string => {
  return getBaseUrl();
};

// Get WebSocket URL - same host as frontend
const getWsBaseUrl = (): string => {
  const hostname = window.location.hostname;
  const port = window.location.port;
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  
  if (port) {
    return `${wsProtocol}//${hostname}:${port}`;
  } else {
    return `${wsProtocol}//${hostname}`;
  }
};

export const API_CONFIG = {
  baseUrl: getApiBaseUrl(),
  authBaseUrl: getAuthApiBaseUrl(),
  wsBaseUrl: getWsBaseUrl(),
  
  // API endpoints
  endpoints: {
    // Auth endpoints (use /api/auth/ prefix for reverse proxy)
    login: '/api/auth/login',
    register: '/api/auth/register',
    me: '/api/auth/me',
    logout: '/api/auth/logout',
    
    // Admin endpoints (use /api/admin/ prefix)
    'admin/users': '/api/admin/users',
    'admin/users/{id}': '/api/admin/users/{id}',
    'admin/users/{id}/role': '/api/admin/users/{id}/role',
    'admin/pending-users': '/api/admin/pending-users',
    'admin/approve-user/{id}': '/api/admin/approve-user/{id}',
    'admin/deny-user/{id}': '/api/admin/deny-user/{id}',
    
    // VPN endpoints (use /api/ prefix)
    vpnStatus: '/api/vpn/status',
    vpnRequiresCredentials: '/api/vpn/requires-credentials',
    vpnUploadConfig: '/api/vpn/upload-config',
    vpnConnect: '/api/vpn/connect',
    vpnDisconnect: '/api/vpn/disconnect',
    vpnConfigContent: '/api/vpn/config-content',
    vpnConnectScript: '/api/vpn/connect-script',
    'vpnConnect-script': '/api/vpn/connect-script',
    vpnSamlLoginUrl: '/api/vpn/saml-login-url',
    
    // System endpoints (use /api/ prefix)
    ping: '/api/ping',
    health: '/api/health',
    systemVpnStatus: '/api/system/vpn-status',
    systemOsInfo: '/api/system/os-info',
    systemOpenNetworkSettings: '/api/system/open-network-settings',
    
    // SSH WebSocket (use /ws prefix)
    ssh: '/ws/ssh'
  }
};

// Helper function to build full API URLs - now all use the same base URL
export const getApiUrl = (endpoint: keyof typeof API_CONFIG.endpoints): string => {
  return `${API_CONFIG.baseUrl}${API_CONFIG.endpoints[endpoint]}`;
};

// Helper function to get WebSocket URL
export const getWsUrl = (endpoint: keyof typeof API_CONFIG.endpoints): string => {
  return `${API_CONFIG.wsBaseUrl}${API_CONFIG.endpoints[endpoint]}`;
};

// For debugging - log the current configuration
console.log('API Configuration:', {
  baseUrl: API_CONFIG.baseUrl,
  authBaseUrl: API_CONFIG.authBaseUrl,
  wsBaseUrl: API_CONFIG.wsBaseUrl,
  hostname: window.location.hostname,
  protocol: window.location.protocol
});

export default API_CONFIG;
