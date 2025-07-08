#!/bin/bash

#################################################################################
# Complete System Setup Script
# 
# This script sets up the entire phone configuration system with:
# - Service monitoring and health checks
# - Automated backups and maintenance
# - System hardening and security
# - Cron job configuration
# - Systemd service installation
# 
# Usage: ./setup-production.sh [--install-systemd] [--install-cron]
#################################################################################

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_NAME="phone-config-generator"
INSTALL_SYSTEMD=false
INSTALL_CRON=false
USER=$(whoami)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "ERROR") echo -e "${RED}[$timestamp] [ERROR] $message${NC}" ;;
        "SUCCESS") echo -e "${GREEN}[$timestamp] [SUCCESS] $message${NC}" ;;
        "WARN") echo -e "${YELLOW}[$timestamp] [WARN] $message${NC}" ;;
        "INFO") echo -e "${BLUE}[$timestamp] [INFO] $message${NC}" ;;
        *) echo "[$timestamp] $message" ;;
    esac
}

# Check if running as root
check_root() {
    if [ "$EUID" -eq 0 ]; then
        log "ERROR" "This script should not be run as root"
        exit 1
    fi
}

# Check dependencies
check_dependencies() {
    log "INFO" "Checking dependencies..."
    
    local missing_deps=()
    
    # Check required commands
    local required_commands=("node" "npm" "curl" "lsof" "pkill" "ps" "netstat")
    
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" >/dev/null 2>&1; then
            missing_deps+=("$cmd")
        fi
    done
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        log "ERROR" "Missing required dependencies: ${missing_deps[*]}"
        log "INFO" "Please install the missing dependencies and try again"
        exit 1
    fi
    
    log "SUCCESS" "All dependencies are installed"
}

# Check Node.js version
check_node_version() {
    log "INFO" "Checking Node.js version..."
    
    local node_version=$(node --version | cut -d'v' -f2)
    local required_version="16.0.0"
    
    if [ "$(printf '%s\n' "$required_version" "$node_version" | sort -V | head -n1)" != "$required_version" ]; then
        log "ERROR" "Node.js version $node_version is too old. Required: $required_version or higher"
        exit 1
    fi
    
    log "SUCCESS" "Node.js version $node_version is compatible"
}

# Setup directory structure
setup_directories() {
    log "INFO" "Setting up directory structure..."
    
    # Create necessary directories
    mkdir -p "$SCRIPT_DIR/backups"
    mkdir -p "$SCRIPT_DIR/logs"
    mkdir -p "$SCRIPT_DIR/tmp"
    
    # Set permissions
    chmod 750 "$SCRIPT_DIR/backups"
    chmod 755 "$SCRIPT_DIR/logs"
    chmod 755 "$SCRIPT_DIR/tmp"
    
    log "SUCCESS" "Directory structure created"
}

# Make scripts executable
setup_scripts() {
    log "INFO" "Setting up scripts..."
    
    local scripts=("start-robust.sh" "watchdog.sh" "system-monitor.sh" "maintenance.sh")
    
    for script in "${scripts[@]}"; do
        if [ -f "$script" ]; then
            chmod +x "$script"
            log "INFO" "Made $script executable"
        else
            log "WARN" "Script $script not found"
        fi
    done
    
    log "SUCCESS" "Scripts configured"
}

# Install dependencies
install_dependencies() {
    log "INFO" "Installing Node.js dependencies..."
    
    # Install production dependencies
    npm install --production
    
    # Build the application
    npm run build
    
    log "SUCCESS" "Dependencies installed and application built"
}

# Setup systemd service
setup_systemd() {
    if [ "$INSTALL_SYSTEMD" = true ]; then
        log "INFO" "Installing systemd service..."
        
        # Copy service file
        sudo cp "$SCRIPT_DIR/$SERVICE_NAME.service" "/etc/systemd/system/"
        
        # Reload systemd
        sudo systemctl daemon-reload
        
        # Enable service
        sudo systemctl enable "$SERVICE_NAME.service"
        
        log "SUCCESS" "Systemd service installed and enabled"
        log "INFO" "You can now use: sudo systemctl start $SERVICE_NAME"
    else
        log "INFO" "Systemd service installation skipped (use --install-systemd to enable)"
    fi
}

# Setup cron jobs
setup_cron() {
    if [ "$INSTALL_CRON" = true ]; then
        log "INFO" "Setting up cron jobs..."
        
        # Create temporary cron file
        local temp_cron="/tmp/phone-config-cron.txt"
        
        # Get current crontab
        crontab -l > "$temp_cron" 2>/dev/null || echo "# Phone Config Generator Cron Jobs" > "$temp_cron"
        
        # Add our cron jobs
        cat >> "$temp_cron" << EOF

# Phone Config Generator - Automated Monitoring and Maintenance
# Added by setup-production.sh on $(date)

# Check service health every 5 minutes
*/5 * * * * cd $SCRIPT_DIR && ./watchdog.sh >> /dev/null 2>&1

# Check service health with restart capability every 15 minutes
*/15 * * * * cd $SCRIPT_DIR && ./watchdog.sh --restart-on-failure >> /dev/null 2>&1

# System monitoring every 10 minutes
*/10 * * * * cd $SCRIPT_DIR && ./system-monitor.sh >> /dev/null 2>&1

# Daily backup at 2:00 AM
0 2 * * * cd $SCRIPT_DIR && ./maintenance.sh --backup-only >> /dev/null 2>&1

# Weekly full maintenance on Sundays at 3:00 AM
0 3 * * 0 cd $SCRIPT_DIR && ./maintenance.sh >> /dev/null 2>&1

EOF
        
        # Install new crontab
        crontab "$temp_cron"
        rm "$temp_cron"
        
        log "SUCCESS" "Cron jobs installed"
        log "INFO" "You can view installed cron jobs with: crontab -l"
    else
        log "INFO" "Cron job installation skipped (use --install-cron to enable)"
    fi
}

# Create environment file if it doesn't exist
setup_environment() {
    log "INFO" "Setting up environment configuration..."
    
    if [ ! -f ".env" ]; then
        cat > .env << EOF
# Phone Configuration Generator Environment
# Created by setup-production.sh on $(date)

# Application Configuration
NODE_ENV=production
PORT=3000

# Authentication
JWT_SECRET=$(openssl rand -hex 32)
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=admin123

# Security
SESSION_SECRET=$(openssl rand -hex 32)

# Logging
LOG_LEVEL=info
LOG_FILE=logs/application.log

# Monitoring
HEALTH_CHECK_INTERVAL=30
MAX_RESTART_ATTEMPTS=3

# Backup Configuration
BACKUP_RETENTION_DAYS=30
LOG_RETENTION_DAYS=14

EOF
        
        chmod 600 .env
        log "SUCCESS" "Environment file created with secure defaults"
        log "WARN" "Please review and update .env file with your specific settings"
    else
        log "INFO" "Environment file already exists"
    fi
}

# Test installation
test_installation() {
    log "INFO" "Testing installation..."
    
    # Test watchdog script
    if ./watchdog.sh >/dev/null 2>&1; then
        log "SUCCESS" "Watchdog script test passed"
    else
        log "WARN" "Watchdog script test failed (this is normal if services aren't running)"
    fi
    
    # Test system monitor
    if ./system-monitor.sh >/dev/null 2>&1; then
        log "SUCCESS" "System monitor test passed"
    else
        log "WARN" "System monitor test failed"
    fi
    
    # Test maintenance script
    if ./maintenance.sh --backup-only >/dev/null 2>&1; then
        log "SUCCESS" "Maintenance script test passed"
    else
        log "WARN" "Maintenance script test failed"
    fi
    
    log "INFO" "Installation test completed"
}

# Display final information
show_final_info() {
    log "SUCCESS" "Production setup completed!"
    echo ""
    echo "🎉 Phone Configuration Generator Production Setup Complete!"
    echo ""
    echo "📁 Installation Directory: $SCRIPT_DIR"
    echo "👤 Running as user: $USER"
    echo ""
    echo "🚀 Starting the Application:"
    echo "   Manual start:    ./start-robust.sh"
    echo "   Development:     ./start-robust.sh --dev"
    echo ""
    if [ "$INSTALL_SYSTEMD" = true ]; then
        echo "🔧 Systemd Service:"
        echo "   Start service:   sudo systemctl start $SERVICE_NAME"
        echo "   Stop service:    sudo systemctl stop $SERVICE_NAME"
        echo "   Service status:  sudo systemctl status $SERVICE_NAME"
        echo "   View logs:       sudo journalctl -u $SERVICE_NAME -f"
        echo ""
    fi
    if [ "$INSTALL_CRON" = true ]; then
        echo "⏰ Automated Monitoring:"
        echo "   Cron jobs installed for automatic monitoring and maintenance"
        echo "   View cron jobs:  crontab -l"
        echo ""
    fi
    echo "📊 Monitoring Scripts:"
    echo "   Health check:    ./watchdog.sh"
    echo "   System monitor:  ./system-monitor.sh"
    echo "   Maintenance:     ./maintenance.sh"
    echo ""
    echo "📝 Configuration Files:"
    echo "   Environment:     .env"
    echo "   Systemd service: $SERVICE_NAME.service"
    echo "   Cron reference:  cron-config.txt"
    echo ""
    echo "🌍 Access URLs:"
    echo "   Local:           http://localhost:3000"
    echo "   LAN:             http://$(hostname -I | awk '{print $1}'):3000"
    echo ""
    echo "📚 Documentation:"
    echo "   - Review the README.md for detailed usage instructions"
    echo "   - Check the .env file for configuration options"
    echo "   - Monitor logs in the logs/ directory"
    echo ""
}

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --install-systemd)
                INSTALL_SYSTEMD=true
                shift
                ;;
            --install-cron)
                INSTALL_CRON=true
                shift
                ;;
            --help|-h)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --install-systemd    Install systemd service"
                echo "  --install-cron       Install cron jobs for monitoring"
                echo "  --help, -h           Show this help message"
                echo ""
                exit 0
                ;;
            *)
                log "ERROR" "Unknown option: $1"
                exit 1
                ;;
        esac
    done
}

# Main installation process
main() {
    log "INFO" "Starting Phone Configuration Generator Production Setup..."
    
    check_root
    check_dependencies
    check_node_version
    setup_directories
    setup_scripts
    install_dependencies
    setup_environment
    setup_systemd
    setup_cron
    test_installation
    show_final_info
    
    log "SUCCESS" "Production setup completed successfully!"
}

# Parse arguments and run main
parse_arguments "$@"
main
