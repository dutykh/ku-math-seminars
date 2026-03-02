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

# Restart only project-related PM2 processes (avoid affecting unrelated apps)
echo "Restarting PM2 processes for ku-math-seminars..."
pm2 restart "events-website" || echo "events-website process not found; skipping"
pm2 restart "ku-math-seminars-webhook" || echo "ku-math-seminars-webhook process not found; skipping"

echo "Deployment completed successfully at $(date)"
