#!/bin/bash

#################################################################################
# Quick Launch Script for Enhanced Robust Production Manager
# 
# This script launches the interactive management console while keeping
# all services running in the background.
#################################################################################

echo "🚀 Launching Enhanced Phone Config Generator Manager..."
echo "   - Services will start and run in background"
echo "   - Interactive menu will be available"
echo "   - Press Ctrl+C to exit menu (services keep running)"
echo ""

# Launch the enhanced menu system
exec ./start-robust-menu.sh "$@"
