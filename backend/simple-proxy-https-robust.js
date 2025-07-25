#!/usr/bin/env node

/**
 * Robust HTTPS Reverse Proxy for Phone Config Webapp
 * 
 * This proxy serves the React webapp and proxies API calls to backend services.
 * It's designed to be stable, performant, and handle SSL properly.
 */

import https from 'https';
import http from 'http';
import httpProxy from 'http-proxy';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { lookup } from 'mime-types';
import { createReadStream } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PROXY_PORT || (process.getuid && process.getuid() === 0 ? 443 : 3000);

// Get the project root directory (one level up from backend)
const projectRoot = path.join(__dirname, '..');
const distPath = path.join(projectRoot, 'dist');

console.log(`🔧 Starting HTTPS Proxy Server...`);
console.log(`📁 Project root: ${projectRoot}`);
console.log(`📁 Dist path: ${distPath}`);
console.log(`🌐 Port: ${PORT}`);

// SSL certificate paths - Using 123hostedtools.com certificates
const SSL_PATHS = {
  key: path.resolve(__dirname, '../ssl/123hostedtools.com.key'),
  cert: path.resolve(__dirname, '../ssl/123hostedtools_com.crt'),
  ca: [
    path.resolve(__dirname, '../ssl/123hostedtools_com.ca-bundle')
  ]
};

// Validate required directories and files
if (!fs.existsSync(distPath)) {
  console.error('❌ Build directory not found:', distPath);
  console.error('   Please run "npm run build:dev" first.');
  process.exit(1);
}

if (!fs.existsSync(SSL_PATHS.key) || !fs.existsSync(SSL_PATHS.cert)) {
  console.error('❌ SSL certificates not found.');
  console.error('   Key:', SSL_PATHS.key);
  console.error('   Cert:', SSL_PATHS.cert);
  process.exit(1);
}

// Load SSL certificates with error handling
let sslOptions;
try {
  sslOptions = {
    key: fs.readFileSync(SSL_PATHS.key),
    cert: fs.readFileSync(SSL_PATHS.cert),
    ca: SSL_PATHS.ca.filter(caPath => fs.existsSync(caPath)).map(caPath => fs.readFileSync(caPath))
  };
  console.log('✅ SSL certificates loaded successfully');
} catch (error) {
  console.error('❌ Failed to load SSL certificates:', error.message);
  process.exit(1);
}

// Create proxy instance with better error handling
const proxy = httpProxy.createProxyServer({
  secure: false,
  changeOrigin: true,
  timeout: 30000, // 30 second timeout
  proxyTimeout: 30000
});

// Enhanced proxy error handler
proxy.on('error', (err, req, res) => {
  console.error(`❌ Proxy error for ${req.method} ${req.url}:`, err.message);
  
  if (!res.headersSent) {
    try {
      res.writeHead(502, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        error: 'Backend service unavailable', 
        service: getServiceName(req.url),
        url: req.url,
        timestamp: new Date().toISOString()
      }));
    } catch (writeError) {
      console.error('❌ Error writing proxy error response:', writeError.message);
    }
  }
});

// Helper to get service name for error messages
const getServiceName = (url) => {
  if (url.startsWith('/api/auth')) return 'authentication';
  if (url.startsWith('/api/admin')) return 'authentication';
  if (url.startsWith('/api/vpn')) return 'vpn-management';
  if (url.startsWith('/api/system')) return 'system-diagnostics';
  return 'backend-api';
};

// Enhanced static file serving with streaming for large files
const serveStaticFile = (filePath, req, res) => {
  try {
    const fullPath = path.join(distPath, filePath);
    
    // Security check - prevent directory traversal
    const normalizedPath = path.normalize(fullPath);
    if (!normalizedPath.startsWith(distPath)) {
      console.log(`🚫 Blocked path traversal attempt: ${filePath}`);
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden: Path traversal not allowed');
      return true;
    }
    
    // Check if file exists and is a file
    if (!fs.existsSync(normalizedPath)) {
      return false; // File not found, let other handlers try
    }
    
    const stats = fs.statSync(normalizedPath);
    if (!stats.isFile()) {
      return false; // Not a file
    }
    
    // Get MIME type
    const mimeType = lookup(normalizedPath) || 'application/octet-stream';
    
    // Set response headers
    const headers = {
      'Content-Type': mimeType,
      'Content-Length': stats.size,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cache-Control': normalizedPath.endsWith('.html') ? 'no-cache' : 'public, max-age=31536000',
      'Last-Modified': stats.mtime.toUTCString(),
      'ETag': `"${stats.size}-${stats.mtime.getTime()}"`
    };
    
    // Handle conditional requests
    const ifModifiedSince = req.headers['if-modified-since'];
    const ifNoneMatch = req.headers['if-none-match'];
    
    if (ifModifiedSince && new Date(ifModifiedSince) >= stats.mtime) {
      res.writeHead(304, headers);
      res.end();
      return true;
    }
    
    if (ifNoneMatch === headers['ETag']) {
      res.writeHead(304, headers);
      res.end();
      return true;
    }
    
    console.log(`📄 Serving static file: ${filePath} (${stats.size} bytes, ${mimeType})`);
    
    // For HEAD requests, only send headers, no body
    if (req.method === 'HEAD') {
      res.writeHead(200, headers);
      res.end();
      return true;
    }
    
    // Stream large files, read small files into memory
    if (stats.size > 1024 * 1024) { // 1MB threshold
      res.writeHead(200, headers);
      const stream = createReadStream(normalizedPath);
      stream.pipe(res);
      
      stream.on('error', (error) => {
        console.error(`❌ Stream error for ${filePath}:`, error.message);
        if (!res.headersSent) {
          res.writeHead(500);
          res.end('Internal Server Error');
        }
      });
    } else {
      // Read small files into memory for better performance
      const content = fs.readFileSync(normalizedPath);
      res.writeHead(200, headers);
      res.end(content);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Error serving static file ${filePath}:`, error.message);
    return false;
  }
};

// Enhanced React app serving
const serveReactApp = (req, res) => {
  try {
    const indexPath = path.join(distPath, 'index.html');
    
    if (!fs.existsSync(indexPath)) {
      console.error('❌ index.html not found:', indexPath);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error: index.html not found');
      return false;
    }
    
    const stats = fs.statSync(indexPath);
    const content = fs.readFileSync(indexPath, 'utf8');
    
    const headers = {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Length': Buffer.byteLength(content, 'utf8'),
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Last-Modified': stats.mtime.toUTCString()
    };
    
    // For HEAD requests, only send headers, no body
    if (req.method === 'HEAD') {
      res.writeHead(200, headers);
      res.end();
      return true;
    }
    
    res.writeHead(200, headers);
    res.end(content);
    return true;
  } catch (error) {
    console.error('❌ Error serving React app:', error.message);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
    return false;
  }
};

// Main request handler
const handleRequest = (req, res) => {
  const url = req.url;
  const method = req.method;
  const userAgent = req.headers['user-agent'] || 'unknown';
  
  console.log(`${method} ${url} - ${userAgent.substring(0, 50)}`);
  
  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Health check endpoint
  if (url === '/proxy-health') {
    const healthData = {
      status: 'ok',
      service: 'robust-https-proxy',
      port: PORT,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: '2.0.0'
    };
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(healthData, null, 2));
    return;
  }
  
  // API proxying with enhanced error handling
  if (url.startsWith('/api/')) {
    let target = 'http://localhost:3000';
    let targetUrl = url;
    
    // Route different API endpoints to appropriate services
    if (url.startsWith('/api/auth/')) {
      target = 'http://localhost:3002';
      targetUrl = url.replace('/api/auth', '');
      req.url = targetUrl;
    } else if (url.startsWith('/api/admin/')) {
      target = 'http://localhost:3002';
      // Keep full path for admin
    } else if (url.startsWith('/api/vpn/')) {
      targetUrl = url.replace('/api/vpn', '/vpn');
      req.url = targetUrl;
    } else if (url.startsWith('/api/system/')) {
      targetUrl = url.replace('/api/system', '/system');
      req.url = targetUrl;
    } else if (url === '/api/ping') {
      req.url = '/ping';
    } else if (url === '/api/health') {
      req.url = '/health';
    }
    
    console.log(`🔄 Proxying ${method} ${url} → ${target}${targetUrl}`);
    proxy.web(req, res, { target });
    return;
  }
  
  // WebSocket handling
  if (url.startsWith('/ws/')) {
    // This will be handled by the upgrade event
    res.writeHead(400);
    res.end('WebSocket connections must use upgrade protocol');
    return;
  }
  
  // Static file serving with enhanced logic
  if (method === 'GET' || method === 'HEAD') {
    // Try to serve as static file first (for assets)
    if (url.includes('.') && !url.includes('..')) {
      if (serveStaticFile(url, req, res)) {
        return;
      }
    }
    
    // Serve React app for all other GET/HEAD requests (SPA routing)
    serveReactApp(req, res);
    return;
  }
  
  // Method not allowed for non-GET/HEAD requests to static resources
  res.writeHead(405, { 'Content-Type': 'text/plain' });
  res.end(`Method ${method} not allowed`);
};

// Create HTTPS server
const server = https.createServer(sslOptions, handleRequest);

// Enhanced WebSocket upgrade handling
server.on('upgrade', (req, socket, head) => {
  const url = req.url;
  
  console.log(`🔌 WebSocket upgrade request: ${url}`);
  
  if (url.startsWith('/ws/')) {
    const targetUrl = url.replace('/ws', '');
    req.url = targetUrl;
    console.log(`🔄 Proxying WebSocket ${url} → localhost:3000${targetUrl}`);
    proxy.ws(req, socket, head, { target: 'http://localhost:3000' });
  } else {
    console.log(`🚫 Rejected WebSocket upgrade for: ${url}`);
    socket.destroy();
  }
});

// Enhanced error handling for the main server
server.on('error', (error) => {
  console.error('❌ HTTPS Server error:', error.message);
  
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use.`);
    console.error('   Try: sudo lsof -i :' + PORT + ' to see what\'s using it');
    process.exit(1);
  } else if (error.code === 'EACCES') {
    console.error(`❌ Permission denied on port ${PORT}.`);
    console.error('   Try running with sudo for ports < 1024');
    process.exit(1);
  }
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('✅ HTTPS server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('✅ HTTPS server closed');
    process.exit(0);
  });
});

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('🎉 Robust HTTPS Proxy Server Started!');
  console.log('');
  console.log('📋 Server Information:');
  console.log(`   🌐 URL: https://localhost${PORT !== 443 ? ':' + PORT : ''}`);
  console.log(`   🔒 SSL: Enabled (123hostedtools.com)`);
  console.log(`   📁 Static files: ${distPath}`);
  console.log(`   🔄 API proxying: Enabled`);
  console.log('');
  console.log('🔄 API Routes:');
  console.log(`   • /api/auth/* → localhost:3002/*`);
  console.log(`   • /api/admin/* → localhost:3002/api/admin/*`);
  console.log(`   • /api/vpn/* → localhost:3000/vpn/*`);
  console.log(`   • /api/system/* → localhost:3000/system/*`);
  console.log(`   • /api/* → localhost:3000/api/*`);
  console.log(`   • /ws/* → localhost:3000/* (WebSocket)`);
  console.log('');
  console.log('🌐 External Access:');
  console.log(`   • https://123hostedtools.com${PORT !== 443 ? ':' + PORT : ''}`);
  console.log(`   • https://YOUR_DOMAIN_OR_IP${PORT !== 443 ? ':' + PORT : ''}`);
  console.log('');
});

// Log memory usage periodically
setInterval(() => {
  const usage = process.memoryUsage();
  console.log(`📊 Memory: ${Math.round(usage.heapUsed / 1024 / 1024)}MB heap, ${Math.round(usage.rss / 1024 / 1024)}MB RSS`);
}, 5 * 60 * 1000); // Every 5 minutes
