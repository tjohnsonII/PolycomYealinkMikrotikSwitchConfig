#!/usr/bin/env node
/**
 * Production webapp starter for SystemD service
 * Serves built React app with HTTPS/HTTP fallback
 */

const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3443;
const HTTP_PORT = process.env.HTTP_PORT || 3080;

// Serve static files from dist
app.use(express.static('dist'));

// Handle client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// SSL configuration
const sslKeyPath = process.env.SSL_KEY_PATH || './ssl/123hostedtools.com.key';
const sslCertPath = process.env.SSL_CERT_PATH || './ssl/123hostedtools_com.crt';

// Start server
if (fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)) {
  try {
    const options = {
      key: fs.readFileSync(sslKeyPath),
      cert: fs.readFileSync(sslCertPath)
    };
    
    https.createServer(options, app).listen(PORT, () => {
      console.log(`✅ HTTPS Server running on port ${PORT}`);
      console.log(`📱 Access at: https://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ SSL Error:', error.message);
    console.log('🔄 Falling back to HTTP server...');
    startHttpServer();
  }
} else {
  console.log('⚠️  SSL certificates not found, starting HTTP server');
  startHttpServer();
}

function startHttpServer() {
  http.createServer(app).listen(HTTP_PORT, () => {
    console.log(`🌐 HTTP Server running on port ${HTTP_PORT}`);
    console.log(`📱 Access at: http://localhost:${HTTP_PORT}`);
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📄 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📄 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});
