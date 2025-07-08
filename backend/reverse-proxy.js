#!/usr/bin/env node

import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PROXY_PORT || 3000;

// Get the project root directory (one level up from backend)
const projectRoot = path.join(__dirname, '..');
const distPath = path.join(projectRoot, 'dist');

// Check if dist directory exists
if (!fs.existsSync(distPath)) {
  console.error('❌ Build directory not found. Please run "npm run build" first.');
  process.exit(1);
}

console.log('🔧 Setting up reverse proxy server...');

// Basic middleware setup
app.use(express.json());

// Proxy configuration for backend services
const createProxy = (target, pathRewrite = {}) => {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    timeout: 10000,
    proxyTimeout: 10000,
    pathRewrite,
    onError: (err, req, res) => {
      console.error(`Proxy error for ${req.url}:`, err.message);
      if (!res.headersSent) {
        res.status(502).json({ 
          error: 'Backend service unavailable', 
          service: req.url.startsWith('/api/auth') ? 'authentication' : 'ssh-websocket',
          timestamp: new Date().toISOString()
        });
      }
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log(`🔄 Proxying ${req.method} ${req.url} to ${target}`);
    }
  });
};

// Setup proxy routes manually to avoid Express routing issues
const authProxy = createProxy('http://localhost:3002', {
  '^/api/auth': '/api' // Remove /auth prefix when forwarding
});

const adminProxy = createProxy('http://localhost:3002');

const apiProxy = createProxy('http://localhost:3001');

const wsProxy = createProxy('http://localhost:3001', {
  '^/ws': '' // Remove /ws prefix when forwarding  
});

// Manual routing to avoid Express path-to-regexp issues
app.use((req, res, next) => {
  const url = req.url;
  const method = req.method;
  
  // Health check first
  if (url === '/proxy-health') {
    return res.json({ 
      status: 'ok', 
      service: 'reverse-proxy',
      port: PORT,
      timestamp: new Date().toISOString()
    });
  }
  
  // Route API calls to appropriate backend
  if (url.startsWith('/api/auth/')) {
    return authProxy(req, res, next);
  } else if (url.startsWith('/api/admin/')) {
    return adminProxy(req, res, next);
  } else if (url.startsWith('/api/')) {
    return apiProxy(req, res, next);
  } else if (url.startsWith('/ws/')) {
    return wsProxy(req, res, next);
  }
  
  // Handle static files
  if (url !== '/' && (url.includes('.') || url === '/favicon.ico')) {
    return express.static(distPath)(req, res, next);
  }
  
  // Handle React Router routes (SPA)
  if (method === 'GET' && !url.startsWith('/api') && !url.startsWith('/ws') && url !== '/proxy-health') {
    return res.sendFile(path.join(distPath, 'index.html'));
  }
  
  next();
});

// Serve static files as fallback
app.use(express.static(distPath));

// 404 handler
app.use((req, res) => {
  res.status(404).send('Not Found');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Reverse proxy server running on http://0.0.0.0:${PORT}`);
  console.log(`📁 Serving static files from: ${distPath}`);
  console.log(`🔄 Proxying API calls:`);
  console.log(`   • /api/auth/* → localhost:3002/api/*`);
  console.log(`   • /api/admin/* → localhost:3002/api/admin/*`);
  console.log(`   • /api/* → localhost:3001/api/*`);
  console.log(`   • /ws/* → localhost:3001/*`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Reverse proxy shutting down...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Reverse proxy shutting down...');
  process.exit(0);
});
