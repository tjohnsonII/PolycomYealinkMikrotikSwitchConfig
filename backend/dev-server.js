#!/usr/bin/env node

import http from 'http';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { lookup } from 'mime-types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.DEV_PORT || 8080;

// Get the project root directory (one level up from backend)
const projectRoot = path.join(__dirname, '..');
const distPath = path.join(projectRoot, 'dist');

// Check if dist directory exists
if (!fs.existsSync(distPath)) {
  console.error('❌ Build directory not found. Please run "npm run build:dev" first.');
  process.exit(1);
}

const app = express();

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

// Create the main HTTP server
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
  if (url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      service: 'development-server',
      port: PORT,
      timestamp: new Date().toISOString()
    }));
    return;
  }
  
  // Handle static files
  if (url.includes('.') && !url.startsWith('/api')) {
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

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Development HTTP server running on http://0.0.0.0:${PORT}`);
  console.log(`📁 Serving static files from: ${distPath}`);
  console.log(`🌐 Access at:`);
  console.log(`   • http://localhost:${PORT}`);
  console.log(`   • http://192.168.1.60:${PORT} (LAN)`);
  console.log(`💡 This is a development server without HTTPS`);
});
