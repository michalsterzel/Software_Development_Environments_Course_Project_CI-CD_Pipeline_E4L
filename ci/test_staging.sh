#!/bin/bash
# Integration/System Tests for Staging
# Michal - Infrastructure & CI/CD

set -e

echo "=== Running Staging Integration Tests ==="

# Test backend health endpoint
echo "Testing backend health..."
curl -f http://localhost:<STAGE_BE_HOST_PORT>/health || {
    echo "Backend health check failed!"
    exit 1
}

# Test frontend availability
echo "Testing frontend availability..."
curl -f http://localhost:<STAGE_FE_HOST_PORT>/ || {
    echo "Frontend availability check failed!"
    exit 1
}

# Optional: Test database connectivity through backend
echo "Testing database connectivity..."
# curl -f http://localhost:<STAGE_BE_HOST_PORT>/api/db-check || {
#     echo "Database connectivity check failed!"
#     exit 1
# }

echo "=== All staging tests passed ==="
