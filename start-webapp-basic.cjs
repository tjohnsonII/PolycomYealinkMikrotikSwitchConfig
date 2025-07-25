#!/usr/bin/env node
/**
 * Ultra-simple production webapp starter for SystemD service
 * Basic HTTP server for built React app
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.HTTP_PORT || 3080;

// Basic HTTP server
const server = http.createServer((req, res) => {
  // Serve index.html for all requests
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  
  if (fs.existsSync(indexPath)) {
    const content = fs.readFileSync(indexPath, 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(content);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 - React app not found. Run: npm run build');
  }
});

server.listen(PORT, () => {
  console.log(`✅ HTTP Server running on port ${PORT}`);
  console.log(`📱 Access at: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📄 Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('📄 Received SIGINT, shutting down gracefully...');
  server.close(() => {
    process.exit(0);
  });
});
