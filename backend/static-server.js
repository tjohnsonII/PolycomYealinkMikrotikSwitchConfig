#!/usr/bin/env node

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.STATIC_PORT || 3000;

// Get the project root directory (one level up from backend)
const projectRoot = path.join(__dirname, '..');
const distPath = path.join(projectRoot, 'dist');

// Check if dist directory exists
if (!fs.existsSync(distPath)) {
  console.error('❌ Build directory not found. Please run "npm run build" first.');
  process.exit(1);
}

// Health check endpoint (must be first)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'static-server',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// Serve static files from the dist directory
app.use(express.static(distPath));

// Handle React Router routes - serve index.html for all routes
app.use((req, res) => {
  // Check if it's an API call or file request
  if (req.path.startsWith('/api/') || req.path.includes('.')) {
    return res.status(404).send('Not Found');
  }
  
  // For all other routes, serve the React app
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Static server running on http://0.0.0.0:${PORT}`);
  console.log(`📁 Serving files from: ${distPath}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Static server shutting down...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Static server shutting down...');
  process.exit(0);
});
