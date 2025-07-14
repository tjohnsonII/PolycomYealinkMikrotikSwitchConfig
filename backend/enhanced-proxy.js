#!/usr/bin/env node

import http from 'http';
import https from 'https';
import httpProxy from 'http-proxy';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { lookup } from 'mime-types';
import net from 'net';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const ENABLE_HTTPS = process.env.ENABLE_HTTPS === 'true';
const HTTP_PORT = process.env.HTTP_PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 8443; // Non-privileged HTTPS port
const FORCE_HTTPS = process.env.FORCE_HTTPS === 'true';

// SSL certificate paths
const SSL_PATHS = {
  key: path.resolve(__dirname, '../ssl/123hostedtools_private_key.txt'),
  cert: path.resolve(__dirname, '../ssl/123hostedtools_com.crt'),
  ca: path.resolve(__dirname, '../ssl/123hostedtools_com.ca-bundle')
};

// Service endpoints
const SERVICES = {
  auth: { target: 'http://localhost:3002', priority: 1 },
  ssh_ws: { target: 'http://localhost:3001', priority: 2 },
  webui: { target: 'http://localhost:3099', priority: 3 }
};

// Get the project root directory
const projectRoot = path.join(__dirname, '..');
const distPath = path.join(projectRoot, 'dist');

console.log('🚀 Enhanced Reverse Proxy Server Starting...');
console.log(`📁 Project root: ${projectRoot}`);
console.log(`📦 Dist path: ${distPath}`);

// Port availability checker
const isPortAvailable = (port) => {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.once('close', () => resolve(true));
      server.close();
    });
    server.on('error', () => resolve(false));
  });
};

// Service health checker
const checkServiceHealth = async (service) => {
  return new Promise((resolve) => {
    const req = http.request(service.target + '/health', { timeout: 2000 }, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => resolve(false));
    req.end();
  });
};

// Create enhanced proxy with better error handling
const createProxy = () => {
  const proxy = httpProxy.createProxyServer({
    secure: false,
    changeOrigin: true,
    timeout: 30000,
    proxyTimeout: 30000,
    retry: 3
  });

  // Enhanced error handling
  proxy.on('error', (err, req, res, target) => {
    const serviceName = getServiceName(req.url);
    console.error(`❌ Proxy error for ${req.url} (${serviceName}):`, err.message);
    
    if (!res.headersSent) {
      const errorResponse = {
        error: 'Service temporarily unavailable',
        service: serviceName,
        message: err.code === 'ECONNREFUSED' ? 'Service is not running' : 'Connection failed',
        timestamp: new Date().toISOString(),
        url: req.url
      };
      
      res.writeHead(502, { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      });
      res.end(JSON.stringify(errorResponse, null, 2));
    }
  });

  // Connection retry logic
  proxy.on('proxyReq', (proxyReq, req, res, options) => {
    console.log(`🔄 Proxying ${req.method} ${req.url} → ${options.target}${req.url}`);
    
    // Add proxy headers
    proxyReq.setHeader('X-Forwarded-For', req.socket.remoteAddress);
    proxyReq.setHeader('X-Forwarded-Proto', req.socket.encrypted ? 'https' : 'http');
    proxyReq.setHeader('X-Forwarded-Host', req.headers.host);
  });

  return proxy;
};

// Get service name from URL
const getServiceName = (url) => {
  if (url.startsWith('/api/auth/') || url.startsWith('/api/admin/')) return 'Authentication Service';
  if (url.startsWith('/api/')) return 'SSH WebSocket Service';
  if (url.startsWith('/management/')) return 'Management Console';
  return 'Frontend';
};

// Determine target service
const getTarget = (url) => {
  if (url.startsWith('/api/auth/')) return SERVICES.auth.target;
  if (url.startsWith('/api/admin/')) return SERVICES.auth.target;
  if (url.startsWith('/api/')) return SERVICES.ssh_ws.target;
  if (url.startsWith('/management/')) return SERVICES.webui.target;
  return null;
};

// URL rewriter
const rewriteUrl = (originalUrl) => {
  if (originalUrl.startsWith('/api/auth/')) {
    return originalUrl.replace('/api/auth', '/api');
  }
  if (originalUrl.startsWith('/api/vpn/')) {
    return originalUrl.replace('/api/vpn', '/vpn');
  }
  if (originalUrl.startsWith('/api/system/')) {
    return originalUrl.replace('/api/system', '/system');
  }
  if (originalUrl.startsWith('/management/')) {
    return originalUrl.replace('/management', '');
  }
  return originalUrl;
};

// Serve static files
const serveStaticFile = (filePath, res) => {
  try {
    const fullPath = path.join(distPath, filePath);
    
    // Security check
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
        'X-Content-Type-Options': 'nosniff'
      });
      res.end(content);
      return true;
    }
  } catch (error) {
    console.error('❌ Error serving static file:', error);
  }
  return false;
};

// Serve React app
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
      'X-Content-Type-Options': 'nosniff'
    });
    res.end(content);
    return true;
  } catch (error) {
    console.error('❌ Error serving React app:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: 'React app not available',
      message: 'Build files not found. Run npm run build first.',
      timestamp: new Date().toISOString()
    }));
    return false;
  }
};

// Create request handler
const createRequestHandler = (proxy) => {
  return (req, res) => {
    const url = req.url;
    const method = req.method;
    
    // Security headers
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
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
    if (url === '/proxy-health' || url === '/health') {
      const health = {
        status: 'healthy',
        service: 'Enhanced Reverse Proxy',
        version: '2.0',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        ports: {
          http: HTTP_PORT,
          https: ENABLE_HTTPS ? HTTPS_PORT : null
        },
        services: Object.keys(SERVICES).reduce((acc, key) => {
          acc[key] = SERVICES[key].target;
          return acc;
        }, {})
      };
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(health, null, 2));
      return;
    }
    
    // Service status endpoint
    if (url === '/proxy-status') {
      Promise.all(
        Object.entries(SERVICES).map(async ([name, config]) => {
          const healthy = await checkServiceHealth(config);
          return { name, target: config.target, healthy };
        })
      ).then(services => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ services, timestamp: new Date().toISOString() }, null, 2));
      });
      return;
    }
    
    // API routing with enhanced error handling
    const target = getTarget(url);
    if (target) {
      const rewrittenUrl = rewriteUrl(url);
      req.url = rewrittenUrl;
      
      proxy.web(req, res, { target }, (error) => {
        if (error) {
          console.error(`❌ Proxy failed for ${url}:`, error.message);
        }
      });
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
};

// WebSocket handler
const createWebSocketHandler = (proxy) => {
  return (req, socket, head) => {
    const url = req.url;
    console.log(`🔌 WebSocket upgrade: ${url}`);
    
    if (url.startsWith('/ws/')) {
      const targetUrl = url.replace('/ws', '');
      req.url = targetUrl;
      proxy.ws(req, socket, head, { target: SERVICES.ssh_ws.target });
    } else {
      socket.destroy();
    }
  };
};

// SSL configuration
const getSSLOptions = () => {
  try {
    const options = {
      key: fs.readFileSync(SSL_PATHS.key),
      cert: fs.readFileSync(SSL_PATHS.cert)
    };
    
    if (fs.existsSync(SSL_PATHS.ca)) {
      options.ca = fs.readFileSync(SSL_PATHS.ca);
    }
    
    return options;
  } catch (error) {
    console.error('❌ SSL certificate error:', error.message);
    return null;
  }
};

// Start servers
const startServers = async () => {
  // Check if build exists
  if (!fs.existsSync(distPath)) {
    console.error('❌ Build directory not found. Please run "npm run build" first.');
    process.exit(1);
  }
  
  console.log('✅ Build directory found');
  
  const proxy = createProxy();
  const requestHandler = createRequestHandler(proxy);
  const wsHandler = createWebSocketHandler(proxy);
  
  // Start HTTP server
  console.log(`🔍 Checking HTTP port ${HTTP_PORT}...`);
  if (!(await isPortAvailable(HTTP_PORT))) {
    console.error(`❌ Port ${HTTP_PORT} is already in use!`);
    process.exit(1);
  }
  
  const httpServer = http.createServer(requestHandler);
  httpServer.on('upgrade', wsHandler);
  
  // Force HTTPS redirect handler
  if (ENABLE_HTTPS && FORCE_HTTPS) {
    httpServer.on('request', (req, res) => {
      const httpsUrl = `https://${req.headers.host.replace(`:${HTTP_PORT}`, `:${HTTPS_PORT}`)}${req.url}`;
      res.writeHead(301, { Location: httpsUrl });
      res.end();
    });
  }
  
  httpServer.listen(HTTP_PORT, '0.0.0.0', () => {
    console.log(`✅ HTTP server running on http://0.0.0.0:${HTTP_PORT}`);
  });
  
  // Start HTTPS server if enabled
  let httpsServer;
  if (ENABLE_HTTPS) {
    console.log(`🔍 Checking HTTPS port ${HTTPS_PORT}...`);
    if (!(await isPortAvailable(HTTPS_PORT))) {
      console.error(`❌ Port ${HTTPS_PORT} is already in use!`);
      process.exit(1);
    }
    
    const sslOptions = getSSLOptions();
    if (sslOptions) {
      httpsServer = https.createServer(sslOptions, requestHandler);
      httpsServer.on('upgrade', wsHandler);
      
      httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {
        console.log(`✅ HTTPS server running on https://0.0.0.0:${HTTPS_PORT}`);
        console.log(`🔒 Using 123hostedtools.com SSL certificate`);
      });
    } else {
      console.warn('⚠️  HTTPS disabled due to SSL certificate issues');
    }
  }
  
  // Display summary
  console.log('');
  console.log('🎉 Enhanced Reverse Proxy Started Successfully!');
  console.log('');
  console.log('📍 Service URLs:');
  console.log(`   🌐 HTTP:  http://localhost:${HTTP_PORT}`);
  if (httpsServer) {
    console.log(`   🔒 HTTPS: https://localhost:${HTTPS_PORT}`);
  }
  console.log('');
  console.log('🔄 Proxy Routes:');
  console.log('   • /api/auth/* → Authentication Service (port 3002)');
  console.log('   • /api/admin/* → Authentication Service (port 3002)');
  console.log('   • /api/* → SSH WebSocket Service (port 3001)');
  console.log('   • /management/* → Management Console (port 3099)');
  console.log('   • /ws/* → WebSocket connections (port 3001)');
  console.log('   • /* → React Frontend (static files)');
  console.log('');
  console.log('🏥 Health Checks:');
  console.log(`   • Proxy health: http://localhost:${HTTP_PORT}/proxy-health`);
  console.log(`   • Service status: http://localhost:${HTTP_PORT}/proxy-status`);
  console.log('');
  
  return { httpServer, httpsServer };
};

// Graceful shutdown
const setupGracefulShutdown = (servers) => {
  const shutdown = () => {
    console.log('\\n🛑 Graceful shutdown initiated...');
    
    const promises = [];
    if (servers.httpServer) {
      promises.push(new Promise(resolve => servers.httpServer.close(resolve)));
    }
    if (servers.httpsServer) {
      promises.push(new Promise(resolve => servers.httpsServer.close(resolve)));
    }
    
    Promise.all(promises).then(() => {
      console.log('✅ All servers stopped gracefully');
      process.exit(0);
    }).catch(() => {
      console.log('⚠️  Force exit after timeout');
      process.exit(1);
    });
    
    // Force exit after 10 seconds
    setTimeout(() => {
      console.log('⚠️  Force exit after timeout');
      process.exit(1);
    }, 10000);
  };
  
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
  process.on('SIGUSR2', shutdown); // For nodemon
};

// Error handling
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the application
startServers()
  .then(setupGracefulShutdown)
  .catch((error) => {
    console.error('❌ Failed to start servers:', error);
    process.exit(1);
  });
