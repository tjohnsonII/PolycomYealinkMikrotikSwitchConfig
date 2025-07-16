#!/usr/bin/env node

/**
 * Service Controller for Phone Configuration Generator
 * 
 * This module provides functions to start, stop, and monitor all services
 * used by the Phone Configuration Generator application.
 */

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');
const execAsync = promisify(exec);

// Service configurations
const SERVICES = {
    webapp: {
        name: 'Main Web Application',
        port: 3000,
        script: 'backend/static-server.js',
        args: [],
        env: { NODE_ENV: 'production' }
    },
    ssh: {
        name: 'SSH WebSocket Server',
        port: 3001,
        script: 'backend/ssh-ws-server.js',
        args: [],
        env: {}
    },
    auth: {
        name: 'Authentication Server',
        port: 3002,
        script: 'backend/auth-server.js',
        args: [],
        env: {}
    }
};

// Active processes
const processes = new Map();

/**
 * Check if a port is in use
 */
async function isPortInUse(port) {
    try {
        const { stdout } = await execAsync(`lsof -i :${port} -sTCP:LISTEN -t`);
        return stdout.trim().length > 0;
    } catch {
        return false;
    }
}

/**
 * Kill process on a specific port
 */
async function killPort(port) {
    try {
        const { stdout } = await execAsync(`lsof -i :${port} -sTCP:LISTEN -t`);
        if (stdout.trim()) {
            const pids = stdout.trim().split('\n');
            for (const pid of pids) {
                try {
                    process.kill(parseInt(pid), 'SIGTERM');
                    setTimeout(() => {
                        try {
                            process.kill(parseInt(pid), 'SIGKILL');
                        } catch {}
                    }, 5000);
                } catch {}
            }
        }
    } catch {}
}

/**
 * Start a service
 */
async function startService(serviceName) {
    const service = SERVICES[serviceName];
    if (!service) {
        throw new Error(`Unknown service: ${serviceName}`);
    }

    // Check if already running
    if (processes.has(serviceName)) {
        const proc = processes.get(serviceName);
        if (proc && !proc.killed) {
            throw new Error(`Service ${serviceName} is already running`);
        }
    }

    // Kill any existing processes on the port
    await killPort(service.port);

    // Start the service
    const scriptPath = path.join(PROJECT_ROOT, service.script);
    const proc = spawn('node', [scriptPath, ...service.args], {
        cwd: PROJECT_ROOT,
        env: { ...process.env, ...service.env },
        stdio: ['ignore', 'pipe', 'pipe']
    });

    processes.set(serviceName, proc);

    // Set up logging
    const logDir = path.join(PROJECT_ROOT, 'logs');
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }

    const logFile = path.join(logDir, `${serviceName}.log`);
    const logStream = fs.createWriteStream(logFile, { flags: 'a' });

    proc.stdout.pipe(logStream);
    proc.stderr.pipe(logStream);

    // Handle process events
    proc.on('exit', (code, signal) => {
        console.log(`Service ${serviceName} exited with code ${code}, signal ${signal}`);
        processes.delete(serviceName);
        logStream.end();
    });

    proc.on('error', (error) => {
        console.error(`Service ${serviceName} error:`, error);
        processes.delete(serviceName);
        logStream.end();
    });

    // Wait a bit for the service to start
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify it's running
    const isRunning = await isPortInUse(service.port);
    if (!isRunning) {
        throw new Error(`Service ${serviceName} failed to start on port ${service.port}`);
    }

    return {
        name: service.name,
        port: service.port,
        pid: proc.pid,
        status: 'running'
    };
}

/**
 * Stop a service
 */
async function stopService(serviceName) {
    const service = SERVICES[serviceName];
    if (!service) {
        throw new Error(`Unknown service: ${serviceName}`);
    }

    const proc = processes.get(serviceName);
    if (proc && !proc.killed) {
        proc.kill('SIGTERM');
        setTimeout(() => {
            if (!proc.killed) {
                proc.kill('SIGKILL');
            }
        }, 5000);
    }

    // Also kill any processes on the port
    await killPort(service.port);

    processes.delete(serviceName);

    return {
        name: service.name,
        port: service.port,
        status: 'stopped'
    };
}

/**
 * Get service status
 */
async function getServiceStatus(serviceName) {
    const service = SERVICES[serviceName];
    if (!service) {
        throw new Error(`Unknown service: ${serviceName}`);
    }

    const proc = processes.get(serviceName);
    const isRunning = await isPortInUse(service.port);

    return {
        name: service.name,
        port: service.port,
        pid: proc ? proc.pid : null,
        status: isRunning ? 'running' : 'stopped',
        managed: !!proc
    };
}

/**
 * Get all services status
 */
async function getAllServicesStatus() {
    const statuses = {};
    for (const serviceName of Object.keys(SERVICES)) {
        statuses[serviceName] = await getServiceStatus(serviceName);
    }
    return statuses;
}

/**
 * Start all services
 */
async function startAllServices() {
    const results = {};
    for (const serviceName of Object.keys(SERVICES)) {
        try {
            results[serviceName] = await startService(serviceName);
        } catch (error) {
            results[serviceName] = {
                name: SERVICES[serviceName].name,
                port: SERVICES[serviceName].port,
                status: 'error',
                error: error.message
            };
        }
    }
    return results;
}

/**
 * Stop all services
 */
async function stopAllServices() {
    const results = {};
    for (const serviceName of Object.keys(SERVICES)) {
        try {
            results[serviceName] = await stopService(serviceName);
        } catch (error) {
            results[serviceName] = {
                name: SERVICES[serviceName].name,
                port: SERVICES[serviceName].port,
                status: 'error',
                error: error.message
            };
        }
    }
    return results;
}

/**
 * Restart a service
 */
async function restartService(serviceName) {
    await stopService(serviceName);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return await startService(serviceName);
}

/**
 * Clean up on exit
 */
process.on('SIGINT', async () => {
    console.log('Shutting down services...');
    await stopAllServices();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Shutting down services...');
    await stopAllServices();
    process.exit(0);
});

export {
    startService,
    stopService,
    getServiceStatus,
    getAllServicesStatus,
    startAllServices,
    stopAllServices,
    restartService,
    SERVICES
};
