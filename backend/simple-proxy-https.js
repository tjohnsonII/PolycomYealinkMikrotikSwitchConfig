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

const PORT = process.env.PROXY_PORT || (process.getuid && process.getuid() === 0 ? 443 : 3000);

// Get the project root directory (one level up from backend)
const projectRoot = path.join(__dirname, '..');
const distPath = path.join(projectRoot, 'dist');

// SSL certificate paths - Using 123hostedtools.com certificates
const SSL_PATHS = {
  key: path.resolve(__dirname, '../ssl/123hostedtools.com.key'),
  cert: path.resolve(__dirname, '../ssl/123hostedtools_com.crt'),
  ca: [
    path.resolve(__dirname, '../ssl/123hostedtools_com.ca-bundle')
  ]
};

// Check if dist directory exists
if (!fs.existsSync(distPath)) {
  console.error('❌ Build directory not found. Please run "npm run build" first.');
  process.exit(1);
}

// Check if SSL certificates exist
if (!fs.existsSync(SSL_PATHS.key) || !fs.existsSync(SSL_PATHS.cert)) {
  console.error('❌ SSL certificates not found. Please ensure 123hostedtools.com certificates are properly installed.');
  process.exit(1);
}

// Load SSL certificates
const sslOptions = {
  key: fs.readFileSync(SSL_PATHS.key),
  cert: fs.readFileSync(SSL_PATHS.cert),
  ca: SSL_PATHS.ca.map(caPath => fs.readFileSync(caPath))
};

// Create proxy instances
const proxy = httpProxy.createProxyServer({
  secure: false, // Allow proxy to self-signed certificates
  changeOrigin: true
});

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

// Create the main HTTPS server
const server = https.createServer(sslOptions, (req, res) => {
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
      service: 'reverse-proxy-https',
      port: PORT,
      timestamp: new Date().toISOString()
    }));
    return;
  }
  
  // Proxy API calls
  if (url.startsWith('/api/auth/')) {
    // Proxy to HTTP auth server, rewriting path
    const targetUrl = url.replace('/api/auth', '');
    req.url = targetUrl;
    console.log(`🔄 Proxying ${method} ${url} → localhost:3002${targetUrl} (HTTP)`);
    proxy.web(req, res, { target: 'http://localhost:3002' });
    return;
  }
  
  if (url.startsWith('/api/admin/')) {
    // Proxy to HTTP auth server
    console.log(`🔄 Proxying ${method} ${url} → localhost:3002${url} (HTTP)`);
    proxy.web(req, res, { target: 'http://localhost:3002' });
    return;
  }
  
  if (url.startsWith('/api/vpn/')) {
    // Proxy VPN API calls to HTTP SSH WebSocket server, rewriting path
    const targetUrl = url.replace('/api/vpn', '/vpn');
    req.url = targetUrl;
    console.log(`🔄 Proxying ${method} ${url} → localhost:3001${targetUrl} (HTTP)`);
    proxy.web(req, res, { target: 'http://localhost:3001' });
    return;
  }
  
  if (url.startsWith('/api/system/')) {
    // Proxy system API calls to HTTP SSH WebSocket server, rewriting path
    const targetUrl = url.replace('/api/system', '/system');
    req.url = targetUrl;
    console.log(`🔄 Proxying ${method} ${url} → localhost:3001${targetUrl} (HTTP)`);
    proxy.web(req, res, { target: 'http://localhost:3001' });
    return;
  }
  
  // Special handling for ping endpoint
  if (url === '/api/ping') {
    req.url = '/ping';
    console.log(`🔄 Proxying ${method} ${url} → localhost:3001/ping (HTTP)`);
    proxy.web(req, res, { target: 'http://localhost:3001' });
    return;
  }
  
  // Special handling for health endpoint
  if (url === '/api/health') {
    req.url = '/health';
    console.log(`🔄 Proxying ${method} ${url} → localhost:3001/health (HTTP)`);
    proxy.web(req, res, { target: 'http://localhost:3001' });
    return;
  }

  if (url.startsWith('/api/')) {
    // Proxy other API calls to HTTPS SSH WebSocket server
    console.log(`🔄 Proxying ${method} ${url} → localhost:3001${url} (HTTP)`);
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
});

// Handle WebSocket upgrades
server.on('upgrade', (req, socket, head) => {
  const url = req.url;
  
  if (url.startsWith('/ws/')) {
    // Proxy WebSocket to HTTPS SSH server, rewriting path
    const targetUrl = url.replace('/ws', '');
    req.url = targetUrl;
    console.log(`🔄 Proxying WebSocket ${url} → localhost:3001${targetUrl} (HTTP)`);
    proxy.ws(req, socket, head, { target: 'http://localhost:3001' });
  } else {
    socket.destroy();
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ HTTPS reverse proxy server running on https://0.0.0.0:${PORT}`);
  console.log(`🔒 Using 123hostedtools.com SSL certificate`);
  console.log(`📁 Serving static files from: ${distPath}`);
  console.log(`🔄 Proxying API calls (HTTP):`);
  console.log(`   • /api/auth/* → localhost:3002/* (HTTP)`);
  console.log(`   • /api/admin/* → localhost:3002/api/admin/* (HTTP)`);
  console.log(`   • /api/vpn/* → localhost:3001/vpn/* (HTTP)`);
  console.log(`   • /api/system/* → localhost:3001/system/* (HTTP)`);
  console.log(`   • /api/* → localhost:3001/api/* (HTTP)`);
  console.log(`   • /ws/* → localhost:3001/* (HTTP)`);
  console.log(`🌐 Access at: https://localhost:${PORT} or https://123hostedtools.com:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 HTTPS reverse proxy shutting down...');
  server.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 HTTPS reverse proxy shutting down...');
  server.close();
  process.exit(0);
});
