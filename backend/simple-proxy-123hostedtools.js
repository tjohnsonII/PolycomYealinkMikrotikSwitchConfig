#!/usr/bin/env node

import https from 'https';
import http from 'http';
import httpProxy from 'http-proxy';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { lookup } from 'mime-types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PROXY_PORT || 3001;
const HTTPS_PORT = process.env.HTTPS_PORT || 443;

// Get the project root directory (one level up from backend)
const projectRoot = path.join(__dirname, '..');
const distPath = path.join(projectRoot, 'dist');

// SSL certificate paths - Using 123hostedtools.com certificates
const SSL_PATHS = {
  key: path.resolve(__dirname, '../ssl/123hostedtools.com.key'),
  cert: path.resolve(__dirname, '../ssl/123hostedtools_com.crt'),
  ca: path.resolve(__dirname, '../ssl/123hostedtools_com.ca-bundle')
};

// Check if dist directory exists
if (!fs.existsSync(distPath)) {
  console.error('❌ Build directory not found. Please run "npm run build" first.');
  process.exit(1);
}

// Check if SSL certificates exist
if (!fs.existsSync(SSL_PATHS.key)) {
  console.error('❌ SSL private key not found at:', SSL_PATHS.key);
  process.exit(1);
}

if (!fs.existsSync(SSL_PATHS.cert)) {
  console.error('❌ SSL certificate not found. Please place the matching certificate at:', SSL_PATHS.cert);
  console.error('   The certificate should match the CSR you submitted.');
  process.exit(1);
}

// Load SSL certificates
const sslOptions = {
  key: fs.readFileSync(SSL_PATHS.key),
  cert: fs.readFileSync(SSL_PATHS.cert)
};

// Add CA bundle if it exists
if (fs.existsSync(SSL_PATHS.ca)) {
  sslOptions.ca = fs.readFileSync(SSL_PATHS.ca);
  console.log('✅ CA bundle loaded');
}

// Create proxy instances
const proxy = httpProxy.createProxyServer({});

// Proxy error handler
proxy.on('error', (err, req, res) => {
  console.error(`Proxy error for ${req.url}:`, err.message);
  if (!res.headersSent) {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: 'Backend service unavailable', 
      service: req.url.startsWith('/api/auth') ? 'authentication' : 'ssh-websocket',
      timestamp: new Date().toISOString()
    }));
  }
});

// Helper function to serve static files
const serveStaticFile = (filePath, res) => {
  try {
    const fullPath = path.join(distPath, filePath);
    
    // Security check - make sure we're not serving files outside dist
    if (!fullPath.startsWith(distPath)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      const content = fs.readFileSync(fullPath);
      const mimeType = lookup(fullPath) || 'application/octet-stream';
      
      res.writeHead(200, {
        'Content-Type': mimeType,
        'Content-Length': content.length,
        'Cache-Control': fullPath.endsWith('.html') ? 'no-cache' : 'public, max-age=31536000'
      });
      res.end(content);
      return true;
    }
  } catch (error) {
    console.error('Error serving static file:', error);
  }
  return false;
};

// Helper function to serve React app (index.html)
const serveReactApp = (res) => {
  try {
    const indexPath = path.join(distPath, 'index.html');
    const content = fs.readFileSync(indexPath);
    
    res.writeHead(200, {
      'Content-Type': 'text/html',
      'Content-Length': content.length,
      'Cache-Control': 'no-cache'
    });
    res.end(content);
    return true;
  } catch (error) {
    console.error('Error serving React app:', error);
    res.writeHead(500);
    res.end('Internal Server Error');
    return false;
  }
};

// Request handler
const requestHandler = (req, res) => {
  const url = req.url;
  const method = req.method;
  
  console.log(`${method} ${url}`);
  
  // CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS requests
  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Health check endpoint
  if (url === '/proxy-health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      service: 'reverse-proxy-123hostedtools',
      domain: '123hostedtools.com',
      port: HTTPS_PORT,
      timestamp: new Date().toISOString()
    }));
    return;
  }
  
  // Proxy API calls
  if (url.startsWith('/api/auth/')) {
    // Proxy to auth server, rewriting path
    const targetUrl = url.replace('/api/auth', '/api');
    req.url = targetUrl;
    console.log(`🔄 Proxying ${method} ${url} → localhost:3002${targetUrl}`);
    proxy.web(req, res, { target: 'http://localhost:3002' });
    return;
  }
  
  if (url.startsWith('/api/admin/')) {
    // Proxy to auth server
    console.log(`🔄 Proxying ${method} ${url} → localhost:3002${url}`);
    proxy.web(req, res, { target: 'http://localhost:3002' });
    return;
  }
  
  if (url.startsWith('/api/vpn/')) {
    // Proxy VPN API calls to SSH WebSocket server, rewriting path
    const targetUrl = url.replace('/api/vpn', '/vpn');
    req.url = targetUrl;
    console.log(`🔄 Proxying ${method} ${url} → localhost:3001${targetUrl}`);
    proxy.web(req, res, { target: 'http://localhost:3001' });
    return;
  }
  
  if (url.startsWith('/api/system/')) {
    // Proxy system API calls to SSH WebSocket server, rewriting path
    const targetUrl = url.replace('/api/system', '/system');
    req.url = targetUrl;
    console.log(`🔄 Proxying ${method} ${url} → localhost:3001${targetUrl}`);
    proxy.web(req, res, { target: 'http://localhost:3001' });
    return;
  }
  
  // Special handling for ping endpoint
  if (url === '/api/ping') {
    req.url = '/ping';
    console.log(`🔄 Proxying ${method} ${url} → localhost:3001/ping`);
    proxy.web(req, res, { target: 'http://localhost:3001' });
    return;
  }
  
  // Special handling for health endpoint
  if (url === '/api/health') {
    req.url = '/health';
    console.log(`🔄 Proxying ${method} ${url} → localhost:3001/health`);
    proxy.web(req, res, { target: 'http://localhost:3001' });
    return;
  }

  if (url.startsWith('/api/')) {
    // Proxy other API calls to SSH WebSocket server
    console.log(`🔄 Proxying ${method} ${url} → localhost:3001${url}`);
    proxy.web(req, res, { target: 'http://localhost:3001' });
    return;
  }
  
  // Handle static files
  if (url.includes('.') && !url.startsWith('/api') && !url.startsWith('/ws')) {
    if (serveStaticFile(url, res)) {
      return;
    }
  }
  
  // Handle React Router routes (serve index.html for all other GET requests)
  if (method === 'GET') {
    serveReactApp(res);
    return;
  }
  
  // 404 for everything else
  res.writeHead(404);
  res.end('Not Found');
};

// Create HTTPS server
const httpsServer = https.createServer(sslOptions, requestHandler);

// Create HTTP server for redirect
const httpServer = http.createServer((req, res) => {
  const host = req.headers.host;
  const redirectUrl = `https://${host}${req.url}`;
  
  console.log(`🔄 HTTP→HTTPS redirect: ${req.url} → ${redirectUrl}`);
  
  res.writeHead(301, { 
    'Location': redirectUrl,
    'Content-Type': 'text/plain'
  });
  res.end(`Redirecting to ${redirectUrl}`);
});

// Handle WebSocket upgrades
httpsServer.on('upgrade', (req, socket, head) => {
  const url = req.url;
  
  if (url.startsWith('/ws/')) {
    // Proxy WebSocket to SSH server, rewriting path
    const targetUrl = url.replace('/ws', '');
    req.url = targetUrl;
    console.log(`🔄 Proxying WebSocket ${url} → localhost:3001${targetUrl}`);
    proxy.ws(req, socket, head, { target: 'http://localhost:3001' });
  } else {
    socket.destroy();
  }
});

// Start servers
httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {
  console.log(`🚀 HTTPS Server running on https://0.0.0.0:${HTTPS_PORT}`);
  console.log(`🔒 SSL certificates loaded for 123hostedtools.com`);
  console.log(`📁 Serving static files from: ${distPath}`);
  console.log(`🔄 Proxying API calls:`);
  console.log(`   • /api/auth/* → localhost:3002/*`);
  console.log(`   • /api/admin/* → localhost:3002/api/admin/*`);
  console.log(`   • /api/vpn/* → localhost:3001/vpn/*`);
  console.log(`   • /api/system/* → localhost:3001/system/*`);
  console.log(`   • /api/* → localhost:3001/api/*`);
  console.log(`   • /ws/* → localhost:3001/*`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 HTTPS proxy shutting down...');
  httpsServer.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 HTTPS proxy shutting down...');
  httpsServer.close();
  process.exit(0);
});
