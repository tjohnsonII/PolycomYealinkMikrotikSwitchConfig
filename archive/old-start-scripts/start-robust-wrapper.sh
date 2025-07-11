#!/bin/bash
# Wrapper script to ensure start-robust.sh runs from correct directory
cd /home/tim2/v3_PYMSC/PolycomYealinkMikrotikSwitchConfig
exec ./start-robust.sh "$@"
