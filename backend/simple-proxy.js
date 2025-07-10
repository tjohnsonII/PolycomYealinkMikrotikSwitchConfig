#!/usr/bin/env node

import http from 'http';
import httpProxy from 'http-proxy';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { lookup } from 'mime-types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PROXY_PORT || 3000;

// Get the project root directory (one level up from backend)
const projectRoot = path.join(__dirname, '..');
const distPath = path.join(projectRoot, 'dist');

// Check if dist directory exists
if (!fs.existsSync(distPath)) {
  console.error('❌ Build directory not found. Please run "npm run build" first.');
  process.exit(1);
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

// Create the main server
const server = http.createServer((req, res) => {
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
      service: 'reverse-proxy',
      port: PORT,
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
});

// Handle WebSocket upgrades
server.on('upgrade', (req, socket, head) => {
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

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Reverse proxy server running on http://0.0.0.0:${PORT}`);
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
  console.log('🛑 Reverse proxy shutting down...');
  server.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Reverse proxy shutting down...');
  server.close();
  process.exit(0);
});
