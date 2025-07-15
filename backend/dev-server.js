#!/usr/bin/env node

/**
 * Development Server for Dev Environment
 * 
 * Priority: 3 (Development)
 * Purpose: Handles hot reloading, dev tools, testing, and development features
 * Port: 3002 (HTTP)
 * 
 * This server provides development tools, hot reloading, testing capabilities,
 * and development environment features for the application.
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import chokidar from 'chokidar';
import { performance } from 'perf_hooks';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execAsync = promisify(exec);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "https://localhost:8443", "http://localhost:3099"],
    methods: ["GET", "POST"]
  }
});

const PORT = 3002;
const PROJECT_ROOT = path.resolve(__dirname, '..');

console.log('🛠️  Development Server Starting...');
console.log(`📡 Port: ${PORT}`);
console.log(`🔗 Purpose: Development tools and hot reloading`);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Development mode headers
app.use((req, res, next) => {
  res.setHeader('X-Dev-Mode', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  next();
});

// Development state
let devState = {
  buildStatus: 'idle',
  testStatus: 'idle',
  lintStatus: 'idle',
  hotReload: false,
  watchers: {},
  buildStats: {
    lastBuild: null,
    buildTime: 0,
    errors: [],
    warnings: []
  },
  testResults: {
    passed: 0,
    failed: 0,
    coverage: 0,
    lastRun: null
  }
};

//=============================================================================
// Development Functions
//=============================================================================

const runCommand = async (command, options = {}) => {
  const startTime = performance.now();
  
  try {
    const result = await execAsync(command, {
      cwd: PROJECT_ROOT,
      ...options
    });
    
    const duration = performance.now() - startTime;
    
    return {
      success: true,
      stdout: result.stdout,
      stderr: result.stderr,
      duration: Math.round(duration),
      command
    };
  } catch (error) {
    const duration = performance.now() - startTime;
    
    return {
      success: false,
      stdout: error.stdout || '',
      stderr: error.stderr || '',
      error: error.message,
      duration: Math.round(duration),
      command
    };
  }
};

const buildProject = async () => {
  console.log('🏗️  Building project...');
  devState.buildStatus = 'building';
  
  io.emit('build-status', { status: 'building', timestamp: new Date().toISOString() });
  
  try {
    const result = await runCommand('npm run build');
    
    devState.buildStatus = result.success ? 'success' : 'failed';
    devState.buildStats = {
      lastBuild: new Date().toISOString(),
      buildTime: result.duration,
      errors: result.success ? [] : [result.error],
      warnings: []
    };
    
    io.emit('build-complete', {
      success: result.success,
      stats: devState.buildStats,
      output: result.stdout,
      errors: result.stderr
    });
    
    return result;
  } catch (error) {
    devState.buildStatus = 'failed';
    devState.buildStats.errors.push(error.message);
    
    io.emit('build-complete', {
      success: false,
      stats: devState.buildStats,
      error: error.message
    });
    
    throw error;
  }
};

const runTests = async (testType = 'all') => {
  console.log(`🧪 Running tests: ${testType}`);
  devState.testStatus = 'running';
  
  io.emit('test-status', { status: 'running', type: testType, timestamp: new Date().toISOString() });
  
  try {
    let command;
    
    switch (testType) {
      case 'unit':
        command = 'npm run test:unit';
        break;
      case 'integration':
        command = 'npm run test:integration';
        break;
      case 'e2e':
        command = 'npm run test:e2e';
        break;
      case 'coverage':
        command = 'npm run test:coverage';
        break;
      default:
        command = 'npm test';
    }
    
    const result = await runCommand(command);
    
    devState.testStatus = result.success ? 'passed' : 'failed';
    devState.testResults = {
      passed: result.success ? 1 : 0,
      failed: result.success ? 0 : 1,
      coverage: 0, // Would parse from actual test output
      lastRun: new Date().toISOString()
    };
    
    io.emit('test-complete', {
      success: result.success,
      type: testType,
      results: devState.testResults,
      output: result.stdout,
      errors: result.stderr
    });
    
    return result;
  } catch (error) {
    devState.testStatus = 'failed';
    
    io.emit('test-complete', {
      success: false,
      type: testType,
      error: error.message
    });
    
    throw error;
  }
};

const runLinter = async () => {
  console.log('🔍 Running linter...');
  devState.lintStatus = 'running';
  
  io.emit('lint-status', { status: 'running', timestamp: new Date().toISOString() });
  
  try {
    const result = await runCommand('npm run lint');
    
    devState.lintStatus = result.success ? 'passed' : 'failed';
    
    io.emit('lint-complete', {
      success: result.success,
      output: result.stdout,
      errors: result.stderr
    });
    
    return result;
  } catch (error) {
    devState.lintStatus = 'failed';
    
    io.emit('lint-complete', {
      success: false,
      error: error.message
    });
    
    throw error;
  }
};

const startFileWatcher = () => {
  console.log('👁️  Starting file watchers...');
  
  // Watch source files
  const srcWatcher = chokidar.watch([
    path.join(PROJECT_ROOT, 'src/**/*.{ts,tsx,js,jsx}'),
    path.join(PROJECT_ROOT, 'src/**/*.{css,scss,sass}'),
    path.join(PROJECT_ROOT, 'public/**/*'),
    path.join(PROJECT_ROOT, 'backend/**/*.js')
  ], {
    ignored: /node_modules/,
    persistent: true,
    ignoreInitial: true
  });
  
  srcWatcher.on('change', (filePath) => {
    console.log(`📝 File changed: ${path.relative(PROJECT_ROOT, filePath)}`);
    
    io.emit('file-changed', {
      file: path.relative(PROJECT_ROOT, filePath),
      timestamp: new Date().toISOString()
    });
    
    // Trigger appropriate actions based on file type
    if (devState.hotReload) {
      if (filePath.endsWith('.js') || filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
        buildProject();
      }
    }
  });
  
  devState.watchers.src = srcWatcher;
  
  // Watch test files
  const testWatcher = chokidar.watch([
    path.join(PROJECT_ROOT, 'src/**/*.test.{ts,tsx,js,jsx}'),
    path.join(PROJECT_ROOT, 'src/**/*.spec.{ts,tsx,js,jsx}'),
    path.join(PROJECT_ROOT, 'tests/**/*')
  ], {
    ignored: /node_modules/,
    persistent: true,
    ignoreInitial: true
  });
  
  testWatcher.on('change', (filePath) => {
    console.log(`🧪 Test file changed: ${path.relative(PROJECT_ROOT, filePath)}`);
    
    io.emit('test-file-changed', {
      file: path.relative(PROJECT_ROOT, filePath),
      timestamp: new Date().toISOString()
    });
    
    // Auto-run tests if enabled
    if (devState.hotReload) {
      runTests('unit');
    }
  });
  
  devState.watchers.test = testWatcher;
  
  console.log('✅ File watchers started');
};

const stopFileWatchers = () => {
  console.log('🛑 Stopping file watchers...');
  
  Object.values(devState.watchers).forEach(watcher => {
    if (watcher) {
      watcher.close();
    }
  });
  
  devState.watchers = {};
  console.log('✅ File watchers stopped');
};

//=============================================================================
// API Endpoints
//=============================================================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Development Server',
    version: '1.0.0',
    priority: 3,
    timestamp: new Date().toISOString(),
    features: ['Hot reloading', 'Testing', 'Linting', 'Build tools', 'File watching']
  });
});

// Development status
app.get('/dev/status', (req, res) => {
  res.json({
    ...devState,
    timestamp: new Date().toISOString()
  });
});

// Build project
app.post('/dev/build', async (req, res) => {
  try {
    const result = await buildProject();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Run tests
app.post('/dev/test', async (req, res) => {
  try {
    const { type = 'all' } = req.body;
    const result = await runTests(type);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Run linter
app.post('/dev/lint', async (req, res) => {
  try {
    const result = await runLinter();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle hot reload
app.post('/dev/hot-reload', (req, res) => {
  const { enabled } = req.body;
  devState.hotReload = enabled;
  
  if (enabled) {
    startFileWatcher();
  } else {
    stopFileWatchers();
  }
  
  res.json({
    hotReload: devState.hotReload,
    message: `Hot reload ${enabled ? 'enabled' : 'disabled'}`
  });
});

// Get project structure
app.get('/dev/structure', async (req, res) => {
  try {
    const result = await runCommand('find . -type f -name "*.js" -o -name "*.ts" -o -name "*.tsx" -o -name "*.jsx" | grep -v node_modules | head -50');
    
    res.json({
      files: result.stdout.split('\n').filter(f => f.trim()),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get package.json scripts
app.get('/dev/scripts', async (req, res) => {
  try {
    const packagePath = path.join(PROJECT_ROOT, 'package.json');
    const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    res.json({
      scripts: packageData.scripts || {},
      dependencies: packageData.dependencies || {},
      devDependencies: packageData.devDependencies || {},
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Run custom script
app.post('/dev/script', async (req, res) => {
  try {
    const { script } = req.body;
    
    if (!script) {
      return res.status(400).json({ error: 'Script parameter is required' });
    }
    
    const result = await runCommand(`npm run ${script}`);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get build logs
app.get('/dev/logs/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const logPath = path.join(PROJECT_ROOT, `logs/${type}.log`);
    
    if (fs.existsSync(logPath)) {
      const logs = fs.readFileSync(logPath, 'utf8').split('\n').slice(-100);
      res.json({
        logs,
        type,
        timestamp: new Date().toISOString()
      });
    } else {
      res.json({
        logs: [],
        type,
        message: 'Log file not found',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//=============================================================================
// WebSocket for Real-time Updates
//=============================================================================

io.on('connection', (socket) => {
  console.log('Development client connected');
  
  // Send current dev state
  socket.emit('dev-state', devState);
  
  // Handle custom command execution
  socket.on('run-command', async (data) => {
    const { command, id } = data;
    
    try {
      const result = await runCommand(command);
      socket.emit('command-result', { id, result });
    } catch (error) {
      socket.emit('command-result', { 
        id, 
        result: { success: false, error: error.message } 
      });
    }
  });
  
  // Handle file operations
  socket.on('read-file', async (data) => {
    const { filePath, id } = data;
    
    try {
      const fullPath = path.join(PROJECT_ROOT, filePath);
      const content = fs.readFileSync(fullPath, 'utf8');
      
      socket.emit('file-content', { id, content, filePath });
    } catch (error) {
      socket.emit('file-content', { 
        id, 
        error: error.message, 
        filePath 
      });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Development client disconnected');
  });
});

//=============================================================================
// Start Server
//=============================================================================

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Development server running on http://0.0.0.0:${PORT}`);
  console.log(`🛠️  Features:`);
  console.log(`   • Hot reloading and file watching`);
  console.log(`   • Build tools and testing`);
  console.log(`   • Linting and code quality`);
  console.log(`   • Real-time development updates`);
  console.log(`   • Custom script execution`);
  console.log(`   • Project structure analysis`);
  console.log(`📊 Priority: 3 (Development)`);
  console.log('');
});

// Start file watchers by default
startFileWatcher();

// Graceful shutdown
const shutdown = () => {
  console.log('🛑 Development server shutting down...');
  stopFileWatchers();
  server.close();
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

console.log('🎉 Development Server Ready!');
console.log(`🌐 Access: http://localhost:${PORT}`);
console.log(`🔗 Purpose: Development tools and hot reloading`);
console.log('');
