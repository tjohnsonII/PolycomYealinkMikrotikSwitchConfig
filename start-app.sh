#!/bin/bash
# start-app.sh - Automate starting the Vite dev server and backend SSH WebSocket bridge

# Install dependencies if needed
echo "Installing dependencies..."
npm install

# Start backend SSH WebSocket bridge
if pgrep -f "node backend/ssh-ws-server.js" > /dev/null; then
  echo "SSH WebSocket backend already running."
else
  echo "Starting SSH WebSocket backend (node backend/ssh-ws-server.js) on port 3001..."
  nohup node backend/ssh-ws-server.js > backend/ssh-ws-server.log 2>&1 &
fi

# Check if port 3000 is in use and kill the process if so
PORT=3000
if lsof -i :$PORT -sTCP:LISTEN -t >/dev/null ; then
  PID=$(lsof -i :$PORT -sTCP:LISTEN -t)
  echo "Port $PORT is already in use by process $PID. Killing it..."
  kill -9 $PID
  sleep 1
else
  echo "Port $PORT is free."
fi

# Start Vite dev server
echo "Starting Vite dev server with all common network options:"
echo "  --host 0.0.0.0 (listen on all interfaces)"
echo "  --port 3000 (custom port)"
echo "  --open (open browser)"
echo "  --https (enable HTTPS if configured)"
echo "  --strictPort (fail if port is taken)"

echo "You can edit this script to change options as needed."

npm run dev -- \
  --host 0.0.0.0 \
  --port 3000 \
  --open \
  --strictPort
