#!/usr/bin/env node

/**
 * Health Check Script for Phone Config Generator
 * 
 * This script performs comprehensive health checks for all services
 * and provides detailed status information for monitoring systems.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Configuration
const CONFIG = {
    services: [
        { name: 'ssh-ws', port: 3000, protocol: 'http', path: '/health' },
        { name: 'auth', port: 3001, protocol: 'http', path: '/health' },
        { name: 'management', port: 3099, protocol: 'http', path: '/health' },
        { name: 'webapp', port: 3443, protocol: 'https', path: '/' },
        { name: 'proxy', port: 443, protocol: 'https', path: '/', optional: true }
    ],
    thresholds: {
        cpu: 80,
        memory: 80,
        disk: 80,
        load: 5.0
    },
    timeout: 5000,
    logDir: path.join(__dirname, '..', 'logs'),
    pidDir: path.join(__dirname, '..', 'pids')
};

// Colors for output
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m'
};

// Logging function
function log(level, message) {
    const timestamp = new Date().toISOString();
    const color = colors[level] || colors.reset;
    
    if (process.env.JSON_OUTPUT !== 'true') {
        console.log(`${color}[${timestamp}] ${level.toUpperCase()}: ${message}${colors.reset}`);
    }
}

// HTTP/HTTPS request helper
function makeRequest(options) {
    return new Promise((resolve, reject) => {
        const protocol = options.protocol === 'https' ? https : http;
        const timeout = setTimeout(() => {
            reject(new Error('Request timeout'));
        }, CONFIG.timeout);

        const req = protocol.request(options, (res) => {
            clearTimeout(timeout);
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    data: data
                });
            });
        });

        req.on('error', (err) => {
            clearTimeout(timeout);
            reject(err);
        });

        req.end();
    });
}

// Check service health
async function checkService(service) {
    const startTime = Date.now();
    
    try {
        const options = {
            hostname: 'localhost',
            port: service.port,
            path: service.path,
            method: 'GET',
            timeout: CONFIG.timeout,
            rejectUnauthorized: false // Allow self-signed certificates
        };

        const response = await makeRequest(options);
        const responseTime = Date.now() - startTime;

        return {
            name: service.name,
            status: 'healthy',
            statusCode: response.statusCode,
            responseTime: responseTime,
            accessible: response.statusCode >= 200 && response.statusCode < 400,
            error: null
        };
    } catch (error) {
        return {
            name: service.name,
            status: 'unhealthy',
            statusCode: null,
            responseTime: Date.now() - startTime,
            accessible: false,
            error: error.message
        };
    }
}

// Check process status
async function checkProcesses() {
    const processes = [];
    
    for (const service of CONFIG.services) {
        const pidFile = path.join(CONFIG.pidDir, `${service.name}.pid`);
        
        try {
            if (fs.existsSync(pidFile)) {
                const pid = fs.readFileSync(pidFile, 'utf8').trim();
                const { stdout } = await execAsync(`ps -p ${pid} -o pid,pcpu,pmem,etime,comm --no-headers`);
                
                if (stdout.trim()) {
                    const [, cpu, memory, uptime, command] = stdout.trim().split(/\s+/);
                    processes.push({
                        name: service.name,
                        pid: parseInt(pid),
                        running: true,
                        cpu: parseFloat(cpu),
                        memory: parseFloat(memory),
                        uptime: uptime,
                        command: command
                    });
                } else {
                    processes.push({
                        name: service.name,
                        pid: parseInt(pid),
                        running: false,
                        cpu: 0,
                        memory: 0,
                        uptime: '0',
                        command: 'N/A'
                    });
                }
            } else {
                processes.push({
                    name: service.name,
                    pid: null,
                    running: false,
                    cpu: 0,
                    memory: 0,
                    uptime: '0',
                    command: 'N/A'
                });
            }
        } catch (error) {
            processes.push({
                name: service.name,
                pid: null,
                running: false,
                cpu: 0,
                memory: 0,
                uptime: '0',
                command: 'N/A',
                error: error.message
            });
        }
    }
    
    return processes;
}

// Check system resources
async function checkSystemResources() {
    try {
        // CPU usage
        const { stdout: cpuInfo } = await execAsync("top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | awk -F'%' '{print $1}'");
        const cpuUsage = parseFloat(cpuInfo.trim()) || 0;

        // Memory usage
        const { stdout: memInfo } = await execAsync("free -m | awk 'NR==2{printf \"%d,%d,%.1f\", $3,$2,$3*100/$2}'");
        const [memUsed, memTotal, memPercent] = memInfo.trim().split(',').map(Number);

        // Disk usage
        const { stdout: diskInfo } = await execAsync("df / | awk 'NR==2{printf \"%.1f,%.1f,%s\", $3/1024/1024,$2/1024/1024,$5}'");
        const [diskUsed, diskTotal, diskPercentStr] = diskInfo.trim().split(',');
        const diskPercent = parseFloat(diskPercentStr.replace('%', ''));

        // Load average
        const { stdout: loadInfo } = await execAsync("uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//'");
        const loadAverage = parseFloat(loadInfo.trim()) || 0;

        // Network connections
        const { stdout: connInfo } = await execAsync("netstat -an | grep ESTABLISHED | wc -l");
        const connections = parseInt(connInfo.trim()) || 0;

        return {
            cpu: {
                usage: cpuUsage,
                threshold: CONFIG.thresholds.cpu,
                healthy: cpuUsage < CONFIG.thresholds.cpu
            },
            memory: {
                used: memUsed,
                total: memTotal,
                percent: memPercent,
                threshold: CONFIG.thresholds.memory,
                healthy: memPercent < CONFIG.thresholds.memory
            },
            disk: {
                used: diskUsed,
                total: diskTotal,
                percent: diskPercent,
                threshold: CONFIG.thresholds.disk,
                healthy: diskPercent < CONFIG.thresholds.disk
            },
            load: {
                average: loadAverage,
                threshold: CONFIG.thresholds.load,
                healthy: loadAverage < CONFIG.thresholds.load
            },
            connections: connections
        };
    } catch (error) {
        return {
            cpu: { usage: 0, healthy: false, error: error.message },
            memory: { used: 0, total: 0, percent: 0, healthy: false, error: error.message },
            disk: { used: 0, total: 0, percent: 0, healthy: false, error: error.message },
            load: { average: 0, healthy: false, error: error.message },
            connections: 0
        };
    }
}

// Check log files for errors
async function checkLogs() {
    const logSummary = {
        errorCount: 0,
        warningCount: 0,
        recentErrors: [],
        recentWarnings: []
    };

    for (const service of CONFIG.services) {
        const logFile = path.join(CONFIG.logDir, `${service.name}.log`);
        
        try {
            if (fs.existsSync(logFile)) {
                const { stdout } = await execAsync(`tail -n 100 ${logFile} | grep -i error | wc -l`);
                const errorCount = parseInt(stdout.trim()) || 0;
                
                const { stdout: warnOut } = await execAsync(`tail -n 100 ${logFile} | grep -i warn | wc -l`);
                const warnCount = parseInt(warnOut.trim()) || 0;
                
                logSummary.errorCount += errorCount;
                logSummary.warningCount += warnCount;
                
                if (errorCount > 0) {
                    const { stdout: errors } = await execAsync(`tail -n 100 ${logFile} | grep -i error | tail -n 3`);
                    logSummary.recentErrors.push({
                        service: service.name,
                        errors: errors.trim().split('\n').filter(line => line.trim())
                    });
                }
                
                if (warnCount > 0) {
                    const { stdout: warnings } = await execAsync(`tail -n 100 ${logFile} | grep -i warn | tail -n 3`);
                    logSummary.recentWarnings.push({
                        service: service.name,
                        warnings: warnings.trim().split('\n').filter(line => line.trim())
                    });
                }
            }
        } catch (error) {
            logSummary.recentErrors.push({
                service: service.name,
                errors: [`Failed to read log file: ${error.message}`]
            });
        }
    }

    return logSummary;
}

// Main health check function
async function performHealthCheck() {
    const timestamp = new Date().toISOString();
    const results = {
        timestamp: timestamp,
        overall: 'healthy',
        services: [],
        processes: [],
        system: {},
        logs: {},
        summary: {
            healthyServices: 0,
            unhealthyServices: 0,
            runningProcesses: 0,
            stoppedProcesses: 0,
            systemHealthy: true,
            recommendations: []
        }
    };

    try {
        // Check services
        log('info', 'Checking service health...');
        const serviceChecks = await Promise.all(
            CONFIG.services.map(service => checkService(service))
        );
        
        results.services = serviceChecks;
        results.summary.healthyServices = serviceChecks.filter(s => s.status === 'healthy').length;
        results.summary.unhealthyServices = serviceChecks.filter(s => s.status === 'unhealthy').length;

        // Check processes
        log('info', 'Checking process status...');
        results.processes = await checkProcesses();
        results.summary.runningProcesses = results.processes.filter(p => p.running).length;
        results.summary.stoppedProcesses = results.processes.filter(p => !p.running).length;

        // Check system resources
        log('info', 'Checking system resources...');
        results.system = await checkSystemResources();
        
        // Check logs
        log('info', 'Checking log files...');
        results.logs = await checkLogs();

        // Determine overall health
        const unhealthyServices = results.services.filter(s => s.status === 'unhealthy' && !CONFIG.services.find(cs => cs.name === s.name)?.optional);
        const stoppedProcesses = results.processes.filter(p => !p.running);
        const systemIssues = Object.values(results.system).filter(metric => metric.healthy === false);

        if (unhealthyServices.length > 0 || stoppedProcesses.length > 0 || systemIssues.length > 0) {
            results.overall = 'unhealthy';
        } else if (results.logs.errorCount > 0 || results.summary.unhealthyServices > 0) {
            results.overall = 'degraded';
        }

        // Generate recommendations
        if (results.system.cpu && !results.system.cpu.healthy) {
            results.summary.recommendations.push(`High CPU usage: ${results.system.cpu.usage}%`);
        }
        if (results.system.memory && !results.system.memory.healthy) {
            results.summary.recommendations.push(`High memory usage: ${results.system.memory.percent}%`);
        }
        if (results.system.disk && !results.system.disk.healthy) {
            results.summary.recommendations.push(`High disk usage: ${results.system.disk.percent}%`);
        }
        if (results.logs.errorCount > 0) {
            results.summary.recommendations.push(`${results.logs.errorCount} errors found in logs`);
        }
        if (stoppedProcesses.length > 0) {
            results.summary.recommendations.push(`${stoppedProcesses.length} processes are not running`);
        }

        results.summary.systemHealthy = systemIssues.length === 0;

    } catch (error) {
        results.overall = 'error';
        results.error = error.message;
        log('error', `Health check failed: ${error.message}`);
    }

    return results;
}

// Output results
function outputResults(results) {
    if (process.env.JSON_OUTPUT === 'true') {
        console.log(JSON.stringify(results, null, 2));
        return;
    }

    console.log('\n' + '='.repeat(60));
    console.log(`${colors.cyan}Phone Config Generator - Health Check Report${colors.reset}`);
    console.log('='.repeat(60));
    console.log(`Timestamp: ${results.timestamp}`);
    
    const overallColor = results.overall === 'healthy' ? colors.green : 
                        results.overall === 'degraded' ? colors.yellow : colors.red;
    console.log(`Overall Status: ${overallColor}${results.overall.toUpperCase()}${colors.reset}`);
    
    // Services
    console.log('\n' + colors.cyan + 'Services:' + colors.reset);
    results.services.forEach(service => {
        const statusColor = service.status === 'healthy' ? colors.green : colors.red;
        const responseTime = service.responseTime ? `(${service.responseTime}ms)` : '';
        console.log(`  ${statusColor}●${colors.reset} ${service.name}: ${service.status} ${responseTime}`);
        if (service.error) {
            console.log(`    ${colors.red}Error: ${service.error}${colors.reset}`);
        }
    });

    // Processes
    console.log('\n' + colors.cyan + 'Processes:' + colors.reset);
    results.processes.forEach(process => {
        const statusColor = process.running ? colors.green : colors.red;
        const status = process.running ? 'running' : 'stopped';
        console.log(`  ${statusColor}●${colors.reset} ${process.name}: ${status}`);
        if (process.running) {
            console.log(`    PID: ${process.pid}, CPU: ${process.cpu}%, Memory: ${process.memory}%, Uptime: ${process.uptime}`);
        }
    });

    // System Resources
    console.log('\n' + colors.cyan + 'System Resources:' + colors.reset);
    if (results.system.cpu) {
        const cpuColor = results.system.cpu.healthy ? colors.green : colors.red;
        console.log(`  ${cpuColor}●${colors.reset} CPU: ${results.system.cpu.usage}%`);
    }
    if (results.system.memory) {
        const memColor = results.system.memory.healthy ? colors.green : colors.red;
        console.log(`  ${memColor}●${colors.reset} Memory: ${results.system.memory.percent}% (${results.system.memory.used}MB/${results.system.memory.total}MB)`);
    }
    if (results.system.disk) {
        const diskColor = results.system.disk.healthy ? colors.green : colors.red;
        console.log(`  ${diskColor}●${colors.reset} Disk: ${results.system.disk.percent}% (${results.system.disk.used}GB/${results.system.disk.total}GB)`);
    }
    if (results.system.load) {
        const loadColor = results.system.load.healthy ? colors.green : colors.red;
        console.log(`  ${loadColor}●${colors.reset} Load: ${results.system.load.average}`);
    }

    // Logs
    if (results.logs.errorCount > 0 || results.logs.warningCount > 0) {
        console.log('\n' + colors.cyan + 'Log Summary:' + colors.reset);
        if (results.logs.errorCount > 0) {
            console.log(`  ${colors.red}●${colors.reset} Errors: ${results.logs.errorCount}`);
        }
        if (results.logs.warningCount > 0) {
            console.log(`  ${colors.yellow}●${colors.reset} Warnings: ${results.logs.warningCount}`);
        }
    }

    // Recommendations
    if (results.summary.recommendations.length > 0) {
        console.log('\n' + colors.cyan + 'Recommendations:' + colors.reset);
        results.summary.recommendations.forEach(rec => {
            console.log(`  ${colors.yellow}!${colors.reset} ${rec}`);
        });
    }

    console.log('\n' + '='.repeat(60));
    console.log(`Summary: ${results.summary.healthyServices}/${results.services.length} services healthy, ${results.summary.runningProcesses}/${results.processes.length} processes running`);
    console.log('='.repeat(60) + '\n');
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
        console.log('Phone Config Generator - Health Check Script');
        console.log('');
        console.log('Usage: node health-check.js [options]');
        console.log('');
        console.log('Options:');
        console.log('  --json          Output results in JSON format');
        console.log('  --continuous    Run continuously (every 30 seconds)');
        console.log('  --help, -h      Show this help message');
        console.log('');
        console.log('Examples:');
        console.log('  node health-check.js');
        console.log('  node health-check.js --json');
        console.log('  node health-check.js --continuous');
        console.log('  JSON_OUTPUT=true node health-check.js');
        process.exit(0);
    }

    if (args.includes('--json')) {
        process.env.JSON_OUTPUT = 'true';
    }

    const continuous = args.includes('--continuous');

    do {
        const results = await performHealthCheck();
        outputResults(results);
        
        // Exit with appropriate code
        if (!continuous) {
            process.exit(results.overall === 'healthy' ? 0 : 1);
        }
        
        if (continuous) {
            await new Promise(resolve => setTimeout(resolve, 30000));
        }
    } while (continuous);
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Run the health check
if (require.main === module) {
    main().catch(error => {
        console.error('Health check failed:', error);
        process.exit(1);
    });
}

module.exports = { performHealthCheck, checkService, checkProcesses, checkSystemResources };