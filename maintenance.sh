#!/bin/bash

#################################################################################
# Backup and Maintenance Script
# 
# This script performs regular maintenance tasks including:
# - Database backups
# - Log rotation  
# - System cleanup
# - Configuration backups
# 
# Usage: ./maintenance.sh [--backup-only] [--cleanup-only]
#################################################################################

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="$SCRIPT_DIR/backups"
LOG_FILE="$SCRIPT_DIR/maintenance.log"
BACKUP_RETENTION_DAYS=30
LOG_RETENTION_DAYS=14

# Logging function
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [MAINTENANCE] [$level] $message" | tee -a "$LOG_FILE"
}

# Create backup directory
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        log "INFO" "Created backup directory: $BACKUP_DIR"
    fi
}

# Backup users database
backup_users_db() {
    if [ -f "backend/users.json" ]; then
        local backup_file="$BACKUP_DIR/users_$(date +%Y%m%d_%H%M%S).json"
        cp "backend/users.json" "$backup_file"
        log "SUCCESS" "Users database backed up to: $backup_file"
    else
        log "WARN" "Users database not found: backend/users.json"
    fi
}

# Backup configuration files
backup_configs() {
    local configs=(".env" "package.json" "tsconfig.json" "vite.config.ts" "eslint.config.js")
    local config_backup_dir="$BACKUP_DIR/configs_$(date +%Y%m%d_%H%M%S)"
    
    mkdir -p "$config_backup_dir"
    
    for config in "${configs[@]}"; do
        if [ -f "$config" ]; then
            cp "$config" "$config_backup_dir/"
            log "INFO" "Backed up config: $config"
        fi
    done
    
    log "SUCCESS" "Configuration files backed up to: $config_backup_dir"
}

# Backup custom templates and assets
backup_custom_assets() {
    local assets_backup_dir="$BACKUP_DIR/assets_$(date +%Y%m%d_%H%M%S)"
    
    mkdir -p "$assets_backup_dir"
    
    # Backup custom templates
    if [ -d "src/templates" ]; then
        cp -r "src/templates" "$assets_backup_dir/"
        log "INFO" "Backed up custom templates"
    fi
    
    # Backup custom assets
    if [ -d "src/assets" ]; then
        cp -r "src/assets" "$assets_backup_dir/"
        log "INFO" "Backed up custom assets"
    fi
    
    log "SUCCESS" "Custom assets backed up to: $assets_backup_dir"
}

# Rotate log files
rotate_logs() {
    local logs=("startup-robust.log" "watchdog.log" "system-monitor.log" "maintenance.log")
    local backend_logs=("backend/ssh-ws.log" "backend/auth.log" "backend/proxy.log")
    
    # Main logs
    for log_file in "${logs[@]}"; do
        if [ -f "$log_file" ] && [ -s "$log_file" ]; then
            local rotated_log="$log_file.$(date +%Y%m%d_%H%M%S)"
            mv "$log_file" "$rotated_log"
            touch "$log_file"
            gzip "$rotated_log"
            log "INFO" "Rotated log: $log_file -> $rotated_log.gz"
        fi
    done
    
    # Backend logs
    for log_file in "${backend_logs[@]}"; do
        if [ -f "$log_file" ] && [ -s "$log_file" ]; then
            local rotated_log="$log_file.$(date +%Y%m%d_%H%M%S)"
            mv "$log_file" "$rotated_log"
            touch "$log_file"
            gzip "$rotated_log"
            log "INFO" "Rotated backend log: $log_file -> $rotated_log.gz"
        fi
    done
}

# Clean old backups
clean_old_backups() {
    if [ -d "$BACKUP_DIR" ]; then
        local deleted_count=0
        while IFS= read -r -d '' file; do
            rm -rf "$file"
            ((deleted_count++))
        done < <(find "$BACKUP_DIR" -type f -mtime +$BACKUP_RETENTION_DAYS -print0 2>/dev/null)
        
        log "INFO" "Cleaned $deleted_count old backup files (older than $BACKUP_RETENTION_DAYS days)"
    fi
}

# Clean old compressed logs
clean_old_logs() {
    local deleted_count=0
    while IFS= read -r -d '' file; do
        rm -f "$file"
        ((deleted_count++))
    done < <(find . -name "*.log.*.gz" -type f -mtime +$LOG_RETENTION_DAYS -print0 2>/dev/null)
    
    log "INFO" "Cleaned $deleted_count old compressed log files (older than $LOG_RETENTION_DAYS days)"
}

# Clean node_modules and rebuild if needed
clean_node_modules() {
    if [ -d "node_modules" ]; then
        local size_before=$(du -sh node_modules | cut -f1)
        rm -rf node_modules
        log "INFO" "Cleaned node_modules (was $size_before)"
        
        # Reinstall dependencies
        npm install --production
        log "INFO" "Reinstalled production dependencies"
    fi
}

# Clean build artifacts
clean_build() {
    if [ -d "dist" ]; then
        rm -rf dist
        log "INFO" "Cleaned build directory"
    fi
    
    # Rebuild for production
    npm run build
    log "INFO" "Rebuilt application for production"
}

# System cleanup
system_cleanup() {
    log "INFO" "Starting system cleanup..."
    
    # Clean package cache
    if command -v npm >/dev/null 2>&1; then
        npm cache clean --force
        log "INFO" "Cleaned npm cache"
    fi
    
    # Clean temporary files
    find /tmp -name "*phone-config*" -type f -mtime +1 -delete 2>/dev/null || true
    log "INFO" "Cleaned temporary files"
    
    # Clean old log files
    clean_old_logs
    
    # Clean old backups
    clean_old_backups
}

# Full backup routine
perform_backup() {
    log "INFO" "Starting backup routine..."
    
    create_backup_dir
    backup_users_db
    backup_configs
    backup_custom_assets
    rotate_logs
    
    log "SUCCESS" "Backup routine completed"
}

# Full cleanup routine
perform_cleanup() {
    log "INFO" "Starting cleanup routine..."
    
    system_cleanup
    
    log "SUCCESS" "Cleanup routine completed"
}

# Main maintenance routine
perform_maintenance() {
    log "INFO" "Starting full maintenance routine..."
    
    perform_backup
    perform_cleanup
    
    # Display summary
    log "INFO" "Maintenance Summary:"
    log "INFO" "  - Backup directory: $BACKUP_DIR"
    log "INFO" "  - Disk usage: $(df -h "$SCRIPT_DIR" | tail -1 | awk '{print $5}')"
    log "INFO" "  - Available space: $(df -h "$SCRIPT_DIR" | tail -1 | awk '{print $4}')"
    
    log "SUCCESS" "Full maintenance routine completed"
}

# Parse command line arguments
case "${1:-}" in
    --backup-only)
        perform_backup
        ;;
    --cleanup-only)
        perform_cleanup
        ;;
    *)
        perform_maintenance
        ;;
esac
