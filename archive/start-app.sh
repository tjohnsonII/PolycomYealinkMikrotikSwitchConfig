#!/bin/bash
# start-app.sh - Automate starting the Vite dev server and backend SSH WebSocket bridge

set -e  # Exit on any error

echo "🚀 Starting Hosted Phone Config Generator..."

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for required tools
echo "🔍 Checking system requirements..."
if ! command_exists node; then
    echo "❌ Error: Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command_exists npm; then
    echo "❌ Error: npm is not installed. Please install npm first."
    exit 1
fi

# Display Node.js and npm versions
echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Install dependencies if needed
echo "📦 Installing/updating dependencies..."
if ! npm install; then
    echo "❌ Error: Failed to install dependencies"
    exit 1
fi

# Start backend SSH WebSocket bridge
echo "🔧 Managing backend services..."
if pgrep -f "node backend/ssh-ws-server.js" > /dev/null; then
    echo "✅ SSH WebSocket backend already running."
else
    echo "🚀 Starting SSH WebSocket backend (node backend/ssh-ws-server.js) on port 3001..."
    if [ -f "backend/ssh-ws-server.js" ]; then
        nohup node backend/ssh-ws-server.js > backend/ssh-ws-server.log 2>&1 &
        echo "✅ Backend started successfully"
    else
        echo "⚠️ Warning: backend/ssh-ws-server.js not found. Continuing without backend."
    fi
fi

# Check if port 3000 is in use and kill the process if so
PORT=3000
echo "🔍 Checking port $PORT availability..."
if lsof -i :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    PID=$(lsof -i :$PORT -sTCP:LISTEN -t)
    echo "⚠️ Port $PORT is already in use by process $PID. Killing it..."
    if kill -9 $PID; then
        echo "✅ Process $PID terminated successfully"
        sleep 2  # Give it time to clean up
    else
        echo "❌ Failed to kill process $PID. You may need to do this manually."
        exit 1
    fi
else
    echo "✅ Port $PORT is free."
fi

# Build the project first to catch any TypeScript errors
echo "🔨 Running build check..."
if npm run build > /dev/null 2>&1; then
    echo "✅ Build check passed"
else
    echo "⚠️ Warning: Build check failed. There may be TypeScript errors."
    echo "   Continuing with dev server anyway..."
fi

# Start Vite dev server
echo "🌐 Starting Vite development server..."
echo "   Configuration:"
echo "   • Host: 0.0.0.0 (accessible from network)"
echo "   • Port: $PORT"
echo "   • Auto-open browser: Yes"
echo "   • HTTPS: Auto-configured if available"
echo "   • Strict port: Yes (fail if port unavailable)"

echo ""
echo "📝 Note: You can edit this script to change server options as needed."
echo "🔗 The app will be available at:"
echo "   • Local: http://localhost:$PORT"
echo "   • Network: http://$(hostname -I | awk '{print $1}'):$PORT"
echo ""

# Run the dev server with comprehensive options
if npm run dev -- \
    --host 0.0.0.0 \
    --port $PORT \
    --open \
    --strictPort; then
    echo "✅ Development server started successfully"
else
    echo "❌ Failed to start development server"
    echo "💡 Troubleshooting tips:"
    echo "   • Check if port $PORT is still in use: lsof -i :$PORT"
    echo "   • Try manually killing processes: pkill -f vite"
    echo "   • Check for TypeScript errors: npm run build"
    exit 1
fi
