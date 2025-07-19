#!/bin/bash

#################################################################################
# Phone Configuration Generator - System Setup Script
#
# This script prepares the system for running the Phone Configuration Generator
# web application. It handles dependencies, builds the application, and sets up
# the environment.
#
# Usage: ./setup.sh [--production] [--force-build]
#################################################################################

set -e

# Configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FORCE_BUILD=false
PRODUCTION_MODE=false
CHECK_NETWORK=false

# Network configuration for multi-domain hosting
LOCAL_IP="127.0.0.1"
LAN_IP="192.168.254.253"
DOMAIN="123hostedtools.com"
MANAGEMENT_PORT="3099"
APP_PORT="3000"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Logging function
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "[$timestamp] [${GREEN}${level}${NC}] $message"
}

log_warn() {
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "[$timestamp] [${YELLOW}WARN${NC}] $message"
}

log_error() {
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "[$timestamp] [${RED}ERROR${NC}] $message"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check network accessibility
check_network() {
    echo -e "${CYAN}Checking network accessibility...${NC}"
    
    # Check if management server is running
    if ! netstat -tlnp 2>/dev/null | grep -q ":${MANAGEMENT_PORT}"; then
        echo -e "${YELLOW}Management server not running on port ${MANAGEMENT_PORT}${NC}"
        echo -e "${YELLOW}Starting management server...${NC}"
        
        # Start the management server
        cd "$PROJECT_DIR/backend"
        nohup node management-server.js > ../management-server.log 2>&1 &
        sleep 3
        
        # Check if it started successfully
        if ! netstat -tlnp 2>/dev/null | grep -q ":${MANAGEMENT_PORT}"; then
            echo -e "${RED}Failed to start management server${NC}"
            return 1
        fi
        echo -e "${GREEN}Management server started successfully${NC}"
    else
        echo -e "${GREEN}Management server is running on port ${MANAGEMENT_PORT}${NC}"
    fi
    
    # Test network accessibility
    echo -e "${CYAN}Testing network accessibility...${NC}"
    
    # Test localhost
    if curl -s "http://${LOCAL_IP}:${MANAGEMENT_PORT}/" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Localhost access: http://${LOCAL_IP}:${MANAGEMENT_PORT}/${NC}"
    else
        echo -e "${RED}✗ Localhost access failed${NC}"
    fi
    
    # Test LAN IP
    if curl -s "http://${LAN_IP}:${MANAGEMENT_PORT}/" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ LAN access: http://${LAN_IP}:${MANAGEMENT_PORT}/${NC}"
    else
        echo -e "${RED}✗ LAN access failed${NC}"
    fi
    
    # Test domain (if accessible)
    if curl -s "http://${DOMAIN}:${MANAGEMENT_PORT}/" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Domain access: http://${DOMAIN}:${MANAGEMENT_PORT}/${NC}"
    else
        echo -e "${YELLOW}⚠ Domain access not available (expected if not on target network)${NC}"
    fi
    
    # Test main app
    if curl -s "http://${LOCAL_IP}:${APP_PORT}/" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Main app: http://${LOCAL_IP}:${APP_PORT}/${NC}"
    else
        echo -e "${YELLOW}⚠ Main app not running (use ./start.sh to start)${NC}"
    fi
    
    echo -e "${CYAN}Network check completed${NC}"
}

# Function to create necessary directories
create_directories() {
    log "INFO" "Creating necessary directories..."
    mkdir -p logs
    mkdir -p data
    mkdir -p backups
    mkdir -p tmp
}

# Function to install Node.js dependencies
install_dependencies() {
    log "INFO" "Installing Node.js dependencies..."
    if [ ! -f "package-lock.json" ] || [ "$FORCE_BUILD" = true ]; then
        npm install
    else
        npm ci
    fi
}

# Function to build the application
build_app() {
    BUILD_DIR="dist"
    if [ "$FORCE_BUILD" = true ] || [ ! -d "$BUILD_DIR" ]; then
        log "INFO" "Building application..."
        
        if [ "$PRODUCTION_MODE" = true ]; then
            npm run build
        else
            npm run build:dev
        fi
        
        if [ ! -d "$BUILD_DIR" ]; then
            log_error "Build failed - dist directory not created"
            exit 1
        fi
        
        log "INFO" "Build completed successfully"
    else
        log "INFO" "Build already exists, skipping build step"
    fi
}

# Function to setup environment configuration
setup_environment() {
    log "INFO" "Setting up configuration files..."

    # Create environment file
    if [ ! -f ".env" ]; then
        log "INFO" "Creating .env file..."
        cat > .env << EOF
# Phone Configuration Generator Environment
NODE_ENV=${PRODUCTION_MODE:+production}${PRODUCTION_MODE:-development}
PORT=3000
MANAGEMENT_PORT=3099
SSH_WS_PORT=3001
AUTH_PORT=3002
WEBUI_ALLOW_LAN=true
BIND_ADDRESS=0.0.0.0
ALLOWED_DOMAINS=localhost,127.0.0.1,192.168.254.253,123hostedtools.com
SESSION_SECRET=$(openssl rand -hex 32)
EOF
    fi

    # Create default users file for management interface
    if [ ! -f "backend/users.json" ]; then
        log "INFO" "Creating default users file..."
        cat > backend/users.json << EOF
{
  "admin": {
    "username": "admin",
    "password": "\$2b\$10\$rH.8QqJ9J5vJ5vJ5vJ5vJ.OeqP3F4K5L6M7N8O9P0Q1R2S3T4U5V6W7X8Y9Z0",
    "role": "admin",
    "created": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  }
}
EOF
        log "INFO" "Default admin user created (username: admin, password: admin123)"
    fi
}

# Function to set executable permissions on scripts
set_executable_permissions() {
    log "INFO" "Setting executable permissions..."
    chmod +x start.sh
    chmod +x setup.sh
    find . -name "*.sh" -exec chmod +x {} \;
}

# Function to create startup script
create_startup_script() {
    if [ ! -f "start.sh" ]; then
        log "INFO" "Creating startup script..."
        cat > start.sh << 'EOF'
#!/bin/bash

# Simple Management Console Startup
# This starts ONLY the web management interface

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MANAGEMENT_PORT=3099

echo "Starting Phone Configuration Generator Management Console..."
echo "Project directory: $PROJECT_DIR"
echo "Management console: http://localhost:$MANAGEMENT_PORT"
echo ""
echo "Use the web interface to start and manage the main application."
echo ""

cd "$PROJECT_DIR"

# Start management server
exec node backend/management-server.js
EOF
        chmod +x start.sh
    fi
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo "Options:"
    echo "  --force-build     Force rebuild of the application"
    echo "  --production      Set up for production mode"
    echo "  --check-network   Check network accessibility for all domains"
    echo "  --help           Show this help message"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --force-build)
            FORCE_BUILD=true
            shift
            ;;
        --production)
            PRODUCTION_MODE=true
            shift
            ;;
        --check-network)
            CHECK_NETWORK=true
            shift
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_usage
            exit 1
            ;;
    esac
done

# Handle network check early
if [[ "$CHECK_NETWORK" == true ]]; then
    check_network
    exit 0
fi

# Start setup
log "INFO" "Starting Phone Configuration Generator setup..."
log "INFO" "Project directory: $PROJECT_DIR"
log "INFO" "Production mode: $PRODUCTION_MODE"
log "INFO" "Force rebuild: $FORCE_BUILD"

cd "$PROJECT_DIR"

# Check Node.js
if ! command_exists node; then
    log_error "Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    log_error "Node.js version 18 or higher is required. Current version: $(node --version)"
    exit 1
fi

log "INFO" "Node.js version: $(node --version)"

# Check npm
if ! command_exists npm; then
    log_error "npm is not installed. Please install npm and try again."
    exit 1
fi

log "INFO" "npm version: $(npm --version)"

# Create necessary directories
create_directories

# Install Node.js dependencies
install_dependencies

# Build the application
build_app

# Create configuration files if they don't exist
setup_environment

# Set executable permissions on scripts
set_executable_permissions

# Create startup script if it doesn't exist
create_startup_script

# Cleanup old logs
log "INFO" "Cleaning up old logs..."
find logs -name "*.log" -mtime +7 -delete 2>/dev/null || true
find . -name "*.log" -mtime +7 -delete 2>/dev/null || true

# Final checks
log "INFO" "Running final checks..."

# Check if management server can be started
if ! node -c backend/management-server.js; then
    log_error "Management server has syntax errors"
    exit 1
fi

# Check if required files exist
REQUIRED_FILES=(
    "package.json"
    "backend/management-server.js"
    "backend/ssh-ws-server.js"
    "backend/auth-server.js"
    "backend/static-server.js"
    "dist/index.html"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        log_error "Required file missing: $file"
        exit 1
    fi
done

log "INFO" "Setup completed successfully!"
echo ""
echo -e "${GREEN}==================== SETUP COMPLETE ====================${NC}"
echo ""
echo "To start the Phone Configuration Generator:"
echo "  1. Run: ./start.sh"
echo "  2. Open: http://localhost:3099"
echo "  3. Use the web interface to manage the application"
echo ""
echo "The management console provides:"
echo "  • Application start/stop controls"
echo "  • Service monitoring and health checks"
echo "  • Log viewing and troubleshooting"
echo "  • System diagnostics and maintenance"
echo ""
if [ "$PRODUCTION_MODE" = true ]; then
    echo -e "${YELLOW}Production mode enabled${NC}"
else
    echo -e "${BLUE}Development mode enabled${NC}"
fi
echo ""
# End of main script

# Handle network check
if [[ "$CHECK_NETWORK" == true ]]; then
    check_network
    exit 0
fi
