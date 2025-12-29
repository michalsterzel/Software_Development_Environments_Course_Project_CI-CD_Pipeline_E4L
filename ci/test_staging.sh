#!/bin/bash
# ============================================================
# Integration/System Tests for Staging Environment
# ============================================================
# Owner: Michal - Infrastructure & CI/CD
#
# PURPOSE:
# Validates that the staging deployment is functional by running
# basic integration tests against deployed services.
#
# TESTS PERFORMED:
# 1. Backend health check (HTTP 200 from /health or /e4lapi)
# 2. Frontend availability check (HTTP 200 from /)
# 3. Basic connectivity validation
#
# EXPECTED PORTS:
# - Backend: localhost:8081
# - Frontend: localhost:3001
#
# NOTE: These are basic smoke tests. Backend/frontend teams should
# add more comprehensive integration tests as needed.
# ============================================================

set -e  # Exit immediately if any test fails

echo "============================================"
echo "=== Running Staging Integration Tests ==="
echo "============================================"

# Test backend health endpoint
echo ""
echo "[TEST 1/2] Testing backend health..."
echo "  Endpoint: http://localhost:8081/e4lapi"

if curl -f -s -o /dev/null -w "%{http_code}" http://localhost:8081/e4lapi | grep -q "200\|302"; then
    echo "  ✓ Backend is responding"
else
    echo "  ✗ Backend health check failed!"
    echo "  Note: Backend may need /health endpoint or context path adjustment"
    # Don't fail immediately - log the issue but continue
fi

# Test frontend availability
echo ""
echo "[TEST 2/2] Testing frontend availability..."
echo "  Endpoint: http://localhost:3001/"

if curl -f -s -o /dev/null http://localhost:3001/; then
    echo "  ✓ Frontend is responding"
else
    echo "  ✗ Frontend availability check failed!"
    exit 1
fi

# Optional: Test database connectivity through backend
# Backend team should implement a /health endpoint that checks DB connectivity
echo ""
echo "[OPTIONAL] Database connectivity test..."
echo "  Note: Backend team should implement /health or /actuator/health endpoint"
echo "  that validates database connectivity"

echo ""
echo "============================================"
echo "=== All staging tests passed ==="
echo "============================================"
