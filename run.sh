#!/bin/bash

echo "======================================================"
echo "          LocalShare - Wi-Fi File Sharing"
echo "======================================================"
echo ""

if command -v docker &> /dev/null; then
    echo "[1] Starting via Docker Compose..."
    docker compose up --build
    exit 0
fi

if command -v npm &> /dev/null; then
    echo "[2] Starting via Node.js..."
    npm install
    npm run dev
    exit 0
fi

echo "[ERROR] Neither Docker nor Node.js was found in PATH."
echo "Please install Docker Desktop or Node.js to run LocalShare."
exit 1
