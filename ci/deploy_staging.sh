#!/bin/bash
# Deploy to Staging Environment
# Michal - Infrastructure & CI/CD

set -e

echo "=== Deploying to Staging ==="

# Set image tags from CI environment
export BACKEND_IMAGE="localhost:5050/backend:${CI_COMMIT_SHA}"
export FRONTEND_IMAGE="localhost:5050/frontend:${CI_COMMIT_SHA}"

# Navigate to staging directory
cd infra/staging

# Stop existing containers
echo "Stopping existing staging containers..."
docker compose down || true

# Start new containers from CI-built images
echo "Starting staging deployment..."
docker compose up -d

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 10

echo "=== Staging deployment complete ==="
