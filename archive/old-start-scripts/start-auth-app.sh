#!/bin/bash

#################################################################################
# Startup Script for Authentication-Enabled Application
# 
# This script starts both the authentication server and the main Vite dev server
# in the correct order, ensuring proper communication between them.
# 
# What this script does:
# 1. Starts the authentication server (Node.js/Express) on port 3001
# 2. Waits for the auth server to initialize
# 3. Starts the main application (Vite dev server) on port 3000
# 4. Provides cleanup when script is terminated (Ctrl+C)
# 
# Usage: ./start-auth-app.sh
# or: npm run start-full
#################################################################################

# Start the authentication server in the background
echo "🔐 Starting authentication server..."
cd backend
node auth-server.js &
AUTH_PID=$!  # Store process ID for cleanup

# Wait a moment for the auth server to start and initialize
echo "⏳ Waiting for authentication server to initialize..."
sleep 2

# Start the main Vite development server
echo "🚀 Starting main application..."
cd ..
npm run dev &
VITE_PID=$!  # Store process ID for cleanup

# Function to cleanup processes when script exits
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    
    # Kill both processes if they're still running
    if kill -0 $AUTH_PID 2>/dev/null; then
        echo "   Stopping authentication server..."
        kill $AUTH_PID 2>/dev/null
    fi
    
    if kill -0 $VITE_PID 2>/dev/null; then
        echo "   Stopping main application..."
        kill $VITE_PID 2>/dev/null
    fi
    
    echo "✅ Both servers stopped successfully"
    exit
}

# Set trap to cleanup on script exit (Ctrl+C, kill, etc.)
trap cleanup SIGINT SIGTERM

# Display status information
echo ""
echo "✅ Both servers are running!"
echo ""
echo "📍 Server URLs:"
echo "   🔐 Authentication API: http://localhost:3001"
echo "   🌐 Main Application:   http://localhost:3000"
echo ""
echo "👤 Default Admin Credentials:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "⌨️  Press Ctrl+C to stop both servers"
echo ""

# Wait for both processes to complete (or until user interrupts)
wait
