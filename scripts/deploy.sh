#!/bin/bash

# GitHub Webhook Deployment Script
# This script is triggered by GitHub webhooks to automatically deploy updates

set -e  # Exit on any error

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Starting deployment at $(date)"
echo "Project directory: $PROJECT_DIR"

# Change to project directory
cd "$PROJECT_DIR"

# Pull latest changes from GitHub
echo "Pulling latest changes from GitHub..."
git pull origin main

# Install/update dependencies
echo "Installing dependencies..."
pnpm install

# Build the project
echo "Building project..."
pnpm run build

# Restart PM2 processes
echo "Restarting PM2 processes..."
pm2 restart all
pm2 reset all

echo "Deployment completed successfully at $(date)"
