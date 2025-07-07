#!/bin/bash

# Start the authentication server in the background
echo "Starting authentication server..."
cd backend
node auth-server.js &
AUTH_PID=$!

# Wait a moment for the auth server to start
sleep 2

# Start the main Vite development server
echo "Starting main application..."
cd ..
npm run dev &
VITE_PID=$!

# Function to cleanup processes when script exits
cleanup() {
    echo "Shutting down servers..."
    kill $AUTH_PID 2>/dev/null
    kill $VITE_PID 2>/dev/null
    exit
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

echo "Both servers are running!"
echo "Authentication server: http://localhost:3001"
echo "Main application: http://localhost:5173"
echo "Press Ctrl+C to stop both servers"

# Wait for both processes
wait
