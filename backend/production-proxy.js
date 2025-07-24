#!/usr/bin/env node

/**
 * Production Proxy Server for 123hostedtools.com
 * 
 * Priority: 1 (Production)
 * Domain: 123hostedtools.com
 * SSL: Production certificates required
 * Purpose: Main production application serving
 * 
 * This is the primary production server that handles all public traffic
 * for 123hostedtools.com with proper SSL certificates and security.
 */

import https from 'https';
import http from 'http';
import httpProxy from 'http-proxy';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { lookup } from 'mime-types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Production configuration
const HTTP_PORT = 8080;
const HTTPS_PORT = 8443;
const DOMAIN = '123hostedtools.com';

// Get the project root directory
const projectRoot = path.join(__dirname, '..');
const distPath = path.join(projectRoot, 'dist');

// SSL certificate paths for 123hostedtools.com
const SSL_PATHS = {
  key: path.resolve(__dirname, '../ssl/123hostedtools_private_key.txt'),
  cert: path.resolve(__dirname, '../ssl/123hostedtools_com.crt'),
  ca: path.resolve(__dirname, '../ssl/123hostedtools_com.ca-bundle')
};

// Backend services
const SERVICES = {
  auth: 'https://localhost:3002',
  ssh: 'https://localhost:3001',
  management: 'http://localhost:3099'
};

console.log('🚀 Production Proxy Server Starting...');
console.log(`🌐 Domain: ${DOMAIN}`);
console.log(`📁 Static files: ${distPath}`);

// Validate prerequisites
if (!fs.existsSync(distPath)) {
  console.error('❌ Build directory not found. Run "npm run build" first.');
  process.exit(1);
}

if (!fs.existsSync(SSL_PATHS.key) || !fs.existsSync(SSL_PATHS.cert)) {
  console.error('❌ SSL certificates not found for 123hostedtools.com');
  console.error('   Required files:');
  console.error(`   - ${SSL_PATHS.key}`);
  console.error(`   - ${SSL_PATHS.cert}`);
  process.exit(1);
}

// Load SSL certificates
const sslOptions = {
  key: fs.readFileSync(SSL_PATHS.key),
  cert: fs.readFileSync(SSL_PATHS.cert)
};

if (fs.existsSync(SSL_PATHS.ca)) {
  sslOptions.ca = fs.readFileSync(SSL_PATHS.ca);
  console.log('✅ CA bundle loaded');
}

// Create proxy with production settings
const proxy = httpProxy.createProxyServer({
  secure: true,
  changeOrigin: true,
  timeout: 30000,
  proxyTimeout: 30000
});

// Enhanced error handling for production
proxy.on('error', (err, req, res) => {
  const serviceName = getServiceName(req.url);
  console.error(`❌ Production proxy error for ${req.url} (${serviceName}):`, err.message);
  
  if (!res.headersSent) {
    const errorResponse = {
      error: 'Service temporarily unavailable',
      service: serviceName,
      message: 'Please try again in a moment',
      timestamp: new Date().toISOString(),
      domain: DOMAIN
    };
    
    res.writeHead(502, { 
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    });
    res.end(JSON.stringify(errorResponse, null, 2));
  }
});

// Service name helper
const getServiceName = (url) => {
  if (url.startsWith('/api/auth/') || url.startsWith('/api/admin/')) return 'Authentication';
  if (url.startsWith('/api/management/')) return 'Management';
  if (url.startsWith('/api/')) return 'Application API';
  return 'Web Application';
};

// Static file serving
const serveStaticFile = (filePath, res) => {
  try {
    const fullPath = path.join(distPath, filePath);
    
    if (!fullPath.startsWith(distPath)) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Forbidden' }));
      return true;
    }
    
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      const content = fs.readFileSync(fullPath);
      const mimeType = lookup(fullPath) || 'application/octet-stream';
      
      res.writeHead(200, {
        'Content-Type': mimeType,
        'Content-Length': content.length,
        'Cache-Control': fullPath.endsWith('.html') ? 'no-cache' : 'public, max-age=31536000',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY'
      });
      res.end(content);
      return true;
    }
  } catch (error) {
    console.error('❌ Static file error:', error);
  }
  return false;
};

// React app serving
const serveReactApp = (res) => {
  try {
    const indexPath = path.join(distPath, 'index.html');
    if (!fs.existsSync(indexPath)) {
      throw new Error('index.html not found');
    }
    
    const content = fs.readFileSync(indexPath);
    res.writeHead(200, {
      'Content-Type': 'text/html',
      'Content-Length': content.length,
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY'
    });
    res.end(content);
    return true;
  } catch (error) {
    console.error('❌ React app error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: 'Application unavailable',
      message: 'Please contact support',
      timestamp: new Date().toISOString()
    }));
    return false;
  }
};

// Main request handler
const requestHandler = (req, res) => {
  const url = req.url;
  const method = req.method;
  
  // Production security headers
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // CORS headers for API
  res.setHeader('Access-Control-Allow-Origin', `https://${DOMAIN}`);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  console.log(`📝 ${method} ${url} from ${req.socket.remoteAddress}`);
  
  // Health check endpoint
  if (url === '/health' || url === '/api/health') {
    const health = {
      status: 'healthy',
      service: 'Production Proxy',
      domain: DOMAIN,
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      environment: 'production'
    };
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(health, null, 2));
    return;
  }
  
  // API routing
  if (url.startsWith('/api/auth/')) {
    const rewrittenUrl = url.replace('/api/auth', '/api');
    req.url = rewrittenUrl;
    proxy.web(req, res, { target: SERVICES.auth });
    return;
  }
  
  if (url.startsWith('/api/admin/')) {
    proxy.web(req, res, { target: SERVICES.auth });
    return;
  }
  
  if (url.startsWith('/api/management/')) {
    const rewrittenUrl = url.replace('/api/management', '/api');
    req.url = rewrittenUrl;
    proxy.web(req, res, { target: SERVICES.management });
    return;
  }
  
  if (url.startsWith('/api/vpn/')) {
    const rewrittenUrl = url.replace('/api/vpn', '/vpn');
    req.url = rewrittenUrl;
    proxy.web(req, res, { target: SERVICES.ssh });
    return;
  }
  
  if (url.startsWith('/api/system/')) {
    const rewrittenUrl = url.replace('/api/system', '/system');
    req.url = rewrittenUrl;
    proxy.web(req, res, { target: SERVICES.ssh });
    return;
  }
  
  if (url.startsWith('/api/')) {
    proxy.web(req, res, { target: SERVICES.ssh });
    return;
  }
  
  // Static file handling
  if (url.includes('.') && !url.startsWith('/api') && !url.startsWith('/ws')) {
    if (serveStaticFile(url, res)) {
      return;
    }
  }
  
  // React Router fallback
  if (method === 'GET') {
    serveReactApp(res);
    return;
  }
  
  // 404 for everything else
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    error: 'Not Found',
    url,
    timestamp: new Date().toISOString()
  }));
};

// Create HTTPS server
const httpsServer = https.createServer(sslOptions, requestHandler);

// Create HTTP server for redirect
const httpServer = http.createServer((req, res) => {
  const host = req.headers.host || DOMAIN;
  const redirectUrl = `https://${host}${req.url}`;
  
  console.log(`🔄 HTTP→HTTPS redirect: ${req.url} → ${redirectUrl}`);
  
  res.writeHead(301, { 
    'Location': redirectUrl,
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
  });
  res.end();
});

// WebSocket handling
httpsServer.on('upgrade', (req, socket, head) => {
  const url = req.url;
  console.log(`🔌 WebSocket upgrade: ${url}`);
  
  if (url.startsWith('/ws/')) {
    const targetUrl = url.replace('/ws', '');
    req.url = targetUrl;
    proxy.ws(req, socket, head, { target: SERVICES.ssh });
  } else {
    socket.destroy();
  }
});

// Start servers
httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {
  console.log(`✅ HTTPS server running on https://0.0.0.0:${HTTPS_PORT}`);
  console.log(`🔒 SSL certificates loaded for ${DOMAIN}`);
  console.log(`📁 Static files: ${distPath}`);
  console.log(`🔄 API routing:`);
  console.log(`   • /api/auth/* → Authentication Service`);
  console.log(`   • /api/admin/* → Authentication Service`);
  console.log(`   • /api/management/* → Management Service`);
  console.log(`   • /api/vpn/* → VPN Service`);
  console.log(`   • /api/system/* → System Service`);
  console.log(`   • /api/* → Application API`);
  console.log(`   • /ws/* → WebSocket Service`);
  console.log(`   • /* → React Application`);
});

httpServer.listen(HTTP_PORT, '0.0.0.0', () => {
  console.log(`✅ HTTP server running on http://0.0.0.0:${HTTP_PORT} (redirects to HTTPS)`);
});

// Graceful shutdown
const shutdown = () => {
  console.log('🛑 Production proxy shutting down...');
  httpsServer.close();
  httpServer.close();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('SIGUSR2', shutdown);

// Error handling
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
  process.exit(1);
});

console.log('🎉 Production Proxy Server Ready!');
console.log(`🌐 Access: https://${DOMAIN}`);
console.log(`🔒 Security: Production SSL certificates`);
console.log(`📊 Priority: 1 (Production)`);
console.log('');
