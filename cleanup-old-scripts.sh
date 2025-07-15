#!/bin/bash

# Archive old startup scripts to clean up the project
# This is a one-time cleanup script

echo "🧹 Cleaning up old startup scripts..."

# Create archive directory
mkdir -p archive/old-startup-scripts

# Move all the old start scripts (keep only start.sh)
echo "📦 Moving old startup scripts to archive..."

# List of old scripts to archive
old_scripts=(
    "start-app.sh"
    "start-enhanced.sh"
    "start-robust.sh"
    "start-https.sh"
    "start-https-443.sh"
    "start-https-production.sh"
    "start-timsablab.sh"
    "start-123hostedtools.sh"
    "start-local-dev.sh"
    "start-webapp-root.sh"
    "start-robust-wrapper.sh"
    "start-management-first.sh"
    "start-helper.sh"
    "start-robust-menu.sh"
    "launch-webui.sh"
    "stop-https.sh"
    "stop-robust.sh"
    "port-monitor.sh"
)

# Move scripts to archive
for script in "${old_scripts[@]}"; do
    if [ -f "$script" ]; then
        echo "  📁 Archiving $script"
        mv "$script" archive/old-startup-scripts/
    fi
done

# Also move any other start-* scripts that might exist
for script in start-*.sh; do
    if [ -f "$script" ] && [ "$script" != "start.sh" ]; then
        echo "  📁 Archiving $script"
        mv "$script" archive/old-startup-scripts/
    fi
done

# Archive old proxy scripts
echo "📦 Archiving old proxy scripts..."
mkdir -p archive/old-proxy-scripts

old_proxy_scripts=(
    "backend/simple-proxy.js"
    "backend/simple-proxy-https.js"
    "backend/simple-proxy-https-robust.js"
)

for script in "${old_proxy_scripts[@]}"; do
    if [ -f "$script" ]; then
        echo "  📁 Archiving $script"
        mv "$script" archive/old-proxy-scripts/
    fi
done

# Archive old documentation
echo "📦 Archiving old documentation..."
mkdir -p archive/old-docs

old_docs=(
    "ENHANCED-PROXY-SYSTEM.md"
    "SSL-CERTIFICATES.md"
    "WEB_CONSOLE_GUIDE.md"
    "STARTUP_README.md"
    "HTTPS_SETUP.md"
    "ENHANCED_MANAGER_README.md"
)

for doc in "${old_docs[@]}"; do
    if [ -f "$doc" ]; then
        echo "  📁 Archiving $doc"
        mv "$doc" archive/old-docs/
    fi
done

# Archive old config files
echo "📦 Archiving old config files..."
old_configs=(
    "proxy-config.json"
    "check-ssl-certs.sh"
)

for config in "${old_configs[@]}"; do
    if [ -f "$config" ]; then
        echo "  📁 Archiving $config"
        mv "$config" archive/old-docs/
    fi
done

# Create a README for the archive
cat > archive/README.md << 'EOF'
# Archive Directory

This directory contains old startup scripts and configuration files that have been replaced by the simplified startup system.

## New Simplified System

The new system uses only:
- `start.sh` - Starts the web management console
- Management console web interface - Controls all services

## What's Archived

- `old-startup-scripts/` - All the old startup scripts (start-*.sh)
- `old-proxy-scripts/` - Old proxy implementations
- `old-docs/` - Old documentation and config files

## Migration

The old complex startup system has been replaced with a simple two-step process:
1. Run `./start.sh` to start the web management console
2. Use the web interface to start/stop the webapp and services

This eliminates the complexity of multiple startup scripts and port conflicts.
EOF

echo "✅ Cleanup complete!"
echo ""
echo "📊 Summary:"
echo "  • Archived old startup scripts to archive/old-startup-scripts/"
echo "  • Archived old proxy scripts to archive/old-proxy-scripts/"
echo "  • Archived old documentation to archive/old-docs/"
echo "  • Kept only start.sh as the main startup script"
echo ""
echo "🚀 New Usage:"
echo "  ./start.sh                    # Start web management console"
echo "  # Then use web interface to manage services"
echo ""
