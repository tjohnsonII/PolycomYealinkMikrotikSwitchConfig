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
