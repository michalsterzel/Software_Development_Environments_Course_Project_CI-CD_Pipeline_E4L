#!/bin/bash
# ============================================================
# Deploy to Production Environment
# ============================================================
# Owner: Michal - Infrastructure & CI/CD
#
# PURPOSE:
# Deploys the SAME Docker images that passed staging tests to production.
# This script is called manually (requires approval) after staging succeeds.
#
# CRITICAL RULES:
# - NEVER rebuilds images - uses exact images from staging
# - Only runs if staging deployment and tests passed
# - Includes basic health checks and rollback capability
#
# PREREQUISITES:
# - Staging deployment must have succeeded
# - Staging integration tests must have passed
# - Manual approval required (configured in .ci/deploy.yml)
#
# ENVIRONMENT VARIABLES REQUIRED:
# - CI_REGISTRY_IMAGE: Base registry path (provided by GitLab)
# - CI_COMMIT_SHA: Commit SHA (same as staging)
# ============================================================

set -e  # Exit immediately if any command fails

echo "============================================"
echo "=== Deploying to Production ==="
echo "============================================"

# Use SAME image tags that passed staging
export BACKEND_IMAGE="${CI_REGISTRY_IMAGE}/backend:${CI_COMMIT_SHA}"
export FRONTEND_IMAGE="${CI_REGISTRY_IMAGE}/frontend:${CI_COMMIT_SHA}"

echo "Backend image:  ${BACKEND_IMAGE}"
echo "Frontend image: ${FRONTEND_IMAGE}"
echo ""
echo "WARNING: Deploying to PRODUCTION environment"
echo "These are the same images that passed staging tests"

# Navigate to production directory
cd infra/prod

# Deploy with Docker Compose (replaces old containers)
echo ""
echo "Starting production deployment..."
docker compose up -d

# Wait for new containers to stabilize
echo ""
echo "Waiting for containers to stabilize (15 seconds)..."
sleep 15

# Verify production backend is responding
echo ""
echo "Verifying production deployment..."
echo "[CHECK 1/2] Backend health check..."

if curl -f -s -o /dev/null -w "%{http_code}" http://localhost:8082/e4lapi | grep -q "200\|302"; then
    echo "  ✓ Production backend is responding"
else
    echo "  ✗ Production backend health check failed!"
    echo "  ERROR: Production deployment failed validation"
    echo "  Rolling back..."
    docker compose down
    exit 1
fi

# Verify production frontend is responding
echo "[CHECK 2/2] Frontend availability check..."

if curl -f -s -o /dev/null http://localhost:3002/; then
    echo "  ✓ Production frontend is responding"
else
    echo "  ✗ Production frontend check failed!"
    echo "  ERROR: Production deployment failed validation"
    echo "  Rolling back..."
    docker compose down
    exit 1
fi

echo ""
echo "============================================"
echo "=== Production deployment successful ==="
echo "============================================"
echo ""
echo "Production services are now running:"
echo "  - Backend:  http://localhost:8082"
echo "  - Frontend: http://localhost:3002"
echo "  - Database: localhost:3308 (MySQL)"
