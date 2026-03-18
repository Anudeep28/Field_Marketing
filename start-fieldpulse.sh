#!/bin/bash

echo "========================================"
echo "   FieldPulse Marketing Visits App"
echo "========================================"
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org"
    echo "Minimum version required: 16.0.0"
    exit 1
fi

echo "Node.js version: $(node --version)"
echo

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install --production
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install dependencies!"
        exit 1
    fi
fi

# Build the web app if dist folder doesn't exist
if [ ! -d "dist" ]; then
    echo "Building web application..."
    npm run build:web
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to build web application!"
        exit 1
    fi
fi

echo
echo "Starting FieldPulse server..."
echo
echo "Admin Dashboard: http://localhost:3000"
echo "Field Agents: Use your computer's IP address on port 3000"
echo
echo "Press Ctrl+C to stop the server"
echo

# Start the server
node server.js
