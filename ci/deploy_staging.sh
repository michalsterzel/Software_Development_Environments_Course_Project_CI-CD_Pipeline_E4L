#!/bin/bash
# ============================================================
# Deploy to Staging Environment
# ============================================================
# Owner: Michal - Infrastructure & CI/CD
#
# PURPOSE:
# Deploys Docker images (built by CI) to the staging environment.
# This script is called automatically by the deploy_staging CI job.
#
# PREREQUISITES:
# - Backend and frontend Docker images must be built and pushed to registry
# - GitLab Container Registry must be accessible
# - Docker Compose must be installed on the runner
#
# ENVIRONMENT VARIABLES REQUIRED:
# - CI_REGISTRY_IMAGE: Base registry path (provided by GitLab)
# - CI_COMMIT_SHA: Commit SHA for image tagging (provided by GitLab)
# ============================================================

set -e  # Exit immediately if any command fails

echo "============================================"
echo "=== Deploying to Staging Environment ==="
echo "============================================"

# Set image tags from CI environment
# Using GitLab's built-in CI variables for registry and tagging
export BACKEND_IMAGE="${CI_REGISTRY_IMAGE}/backend:${CI_COMMIT_SHA}"
export FRONTEND_IMAGE="${CI_REGISTRY_IMAGE}/frontend:${CI_COMMIT_SHA}"

echo "Backend image:  ${BACKEND_IMAGE}"
echo "Frontend image: ${FRONTEND_IMAGE}"

# Navigate to staging infrastructure directory
cd infra/staging

# Stop and remove existing staging containers
echo ""
echo "Stopping existing staging containers..."
docker compose down || true

# Pull latest images from registry
echo ""
echo "Pulling images from GitLab Container Registry..."
docker compose pull

# Start new containers from CI-built images
echo ""
echo "Starting staging deployment..."
docker compose up -d

# Wait for services to be ready
echo ""
echo "Waiting for services to stabilize (10 seconds)..."
sleep 10

# Display container status
echo ""
echo "Container status:"
docker compose ps

echo ""
echo "============================================"
echo "=== Staging deployment complete ==="
echo "============================================"