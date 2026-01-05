#!/bin/bash
# Manual Production Deployment Script
# Run this after the pipeline completes to start production containers on the VM host

set -e

echo "=== Manual Production Deployment ==="

# Get the latest commit SHA (or specify manually)
COMMIT_SHA=${1:-latest}

echo "Using images tagged with: ${COMMIT_SHA}"

# Set image variables
export BACKEND_IMAGE="192.168.56.10:5050/root/e4l/e4l-backend:${COMMIT_SHA}"
export FRONTEND_IMAGE="192.168.56.10:5050/root/e4l/e4l-frontend:${COMMIT_SHA}"

echo "Backend image: ${BACKEND_IMAGE}"
echo "Frontend image: ${FRONTEND_IMAGE}"

# Navigate to production infrastructure
cd /vagrant/infra/prod

echo "Pulling latest images..."
docker compose pull

echo "Starting production stack..."
docker compose up -d --wait

echo ""
echo "=== Production Started Successfully ==="
echo "Frontend: http://192.168.56.10:9002"
echo "Backend:  http://192.168.56.10:9082"
echo "Database: 192.168.56.10:9308"
echo ""
echo "Check status with: docker compose ps"
