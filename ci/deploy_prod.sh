#!/bin/bash
# Deploy to Production Environment
# Michal - Infrastructure & CI/CD

set -e

echo "=== Deploying to Production ==="

# Use same image tags that passed staging
export BACKEND_IMAGE="localhost:5050/backend:${CI_COMMIT_SHA}"
export FRONTEND_IMAGE="localhost:5050/frontend:${CI_COMMIT_SHA}"

# Navigate to production directory
cd infra/prod

# Deploy with zero-downtime strategy
echo "Starting production deployment..."
docker compose up -d

# Wait for new containers to be ready
echo "Waiting for new containers to stabilize..."
sleep 15

# Verify production is responding
echo "Verifying production deployment..."
curl -f http://localhost:<PROD_BE_HOST_PORT>/health || {
    echo "Production backend health check failed!"
    echo "Rolling back..."
    docker compose down
    exit 1
}

curl -f http://localhost:<PROD_FE_HOST_PORT>/ || {
    echo "Production frontend check failed!"
    echo "Rolling back..."
    docker compose down
    exit 1
}

echo "=== Production deployment successful ==="
