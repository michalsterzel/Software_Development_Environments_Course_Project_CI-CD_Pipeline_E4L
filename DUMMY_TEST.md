# Dummy CI/CD Test Infrastructure

## Overview

This document explains the temporary dummy CI/CD test infrastructure that validates the entire pipeline works end-to-end **without** requiring implementation of backend/frontend code.

The dummy test proves:
1. ✅ GitLab CI/CD pipeline structure is correct
2. ✅ Docker image building, tagging, and pushing work
3. ✅ GitLab Container Registry is configured correctly
4. ✅ Docker Compose can pull images and start services
5. ✅ Port mappings and networking are correct
6. ✅ Integration tests can query deployed services
7. ✅ Full pipeline flow (build → test → deploy_staging → integration_test → deploy_prod) works

**Important:** This is a **temporary test harness**. Once backend and frontend teams implement their code and build working Docker images, these dummy jobs should be removed.

---

## How the Dummy Test Works

### Step 1: Dummy Image Creation
Two jobs in `.gitlab-ci.yml` create dummy images using nginx:alpine as a placeholder:

- **`dummy_backend_image`** (stage: image)
  - Pulls `nginx:alpine` from Docker Hub
  - Tags it as `${CI_REGISTRY_IMAGE}/e4l-backend:dummy`
  - Pushes to GitLab Container Registry

- **`dummy_frontend_image`** (stage: image)
  - Pulls `nginx:alpine` from Docker Hub
  - Tags it as `${CI_REGISTRY_IMAGE}/e4l-frontend:dummy`
  - Pushes to GitLab Container Registry

### Step 2: Staging Deployment
Job `deploy_staging_dummy` (stage: deploy_staging):
- Sets environment variables:
  - `BACKEND_IMAGE=${CI_REGISTRY_IMAGE}/e4l-backend:dummy`
  - `FRONTEND_IMAGE=${CI_REGISTRY_IMAGE}/e4l-frontend:dummy`
- Runs `docker compose pull` in `infra/staging/` directory
- Runs `docker compose up -d` to start services
- Services start with dummy nginx:alpine images

Docker Compose file (`infra/staging/docker-compose.yml`) uses:
```yaml
image: ${BACKEND_IMAGE:-registry.gitlab.com/e4l/platform/e4l-backend:dummy}
image: ${FRONTEND_IMAGE:-registry.gitlab.com/e4l/platform/e4l-frontend:dummy}
```

### Step 3: Integration Testing
Job `integration_test_dummy` (stage: integration_test):
- Waits for services to stabilize (5-second sleep)
- Runs HTTP tests:
  - `curl -v http://localhost:8081/` (backend on port 8081)
  - `curl -v http://localhost:3001/` (frontend on port 3001)
- Since nginx:alpine responds with HTTP 200 to `/`, tests pass

### Step 4: Production Deployment
Job `deploy_prod_dummy` (stage: deploy_prod, manual trigger):
- Same process as staging, but for `infra/prod/` directory
- Validates production ports:
  - Backend on 8082
  - Frontend on 3002
- Requires manual approval in GitLab CI/CD UI

---

## Running the Dummy Test

### Prerequisites
1. **GitLab Runner** must be configured and connected to your GitLab instance
2. **Docker and Docker Compose** must be installed on the runner
3. **GitLab Container Registry** must be enabled (configured in Ansible playbook)
4. Backend and frontend teams have NOT yet implemented their real code

### Execution

Push a commit to trigger the pipeline:

```bash
git add .
git commit -m "Test dummy CI/CD infrastructure"
git push origin develop
```

In GitLab UI:
1. Navigate to **Project → CI/CD → Pipelines**
2. Watch the pipeline progress:
   - ✓ `ci_smoke_test` (validates runner connectivity)
   - ✓ `dummy_backend_image` (build/push dummy backend)
   - ✓ `dummy_frontend_image` (build/push dummy frontend)
   - ✓ `deploy_staging_dummy` (deploy to staging)
   - ✓ `integration_test_dummy` (run integration tests)
   - **Awaiting manual approval** for `deploy_prod_dummy`
3. Click "Play" button on `deploy_prod_dummy` job to trigger production deployment

All jobs should complete successfully with green checkmarks.

---

## Port Assignments (Dummy Test)

### Staging Environment (infra/staging)
- Backend service: `localhost:8081` (container port 8080)
- Frontend service: `localhost:3001` (container port 80)
- MySQL database: `localhost:3307` (container port 3306)

### Production Environment (infra/prod)
- Backend service: `localhost:8082` (container port 8080)
- Frontend service: `localhost:3002` (container port 80)
- MySQL database: `localhost:3308` (container port 3306)

**Note:** If testing from your local machine, replace `localhost` with the Vagrant VM IP or hostname.

---

## What the Dummy Test DOES NOT Validate

These areas require real backend/frontend implementations:

- ✗ **Backend functionality**: The dummy backend is just nginx; it doesn't implement any Java code
- ✗ **Frontend UI**: The dummy frontend is just nginx; it doesn't serve real React/Vue code
- ✗ **API endpoints**: The dummy backend doesn't respond to `/api/*` routes
- ✗ **Database integration**: The dummy images don't read from MySQL
- ✗ **Unit tests**: Backend and frontend unit tests are not run with dummy images
- ✗ **Health checks**: The `/health` endpoint doesn't exist in dummy nginx

---

## Removing the Dummy Test

Once backend and frontend teams have:
1. Fixed their Dockerfiles
2. Implemented build/test commands in `.ci/backend.yml` and `.ci/frontend.yml`
3. Built real Docker images
4. Their jobs push to `${CI_REGISTRY_IMAGE}`

**Remove dummy jobs** in a single edit:

### Step 1: Remove dummy jobs from `.gitlab-ci.yml`
Delete lines between:
```
# BEGIN DUMMY CI TEST - Infrastructure Validation Only
```
and
```
# END DUMMY CI TEST
```

### Step 2: Restore original image defaults in docker-compose files

**In `infra/staging/docker-compose.yml`:**
Replace:
```yaml
# Original production image (commented for dummy test validation):
# image: ${BACKEND_IMAGE:-registry.gitlab.com/e4l/platform/backend:latest}
# BEGIN DUMMY CI TEST
image: ${BACKEND_IMAGE:-registry.gitlab.com/e4l/platform/e4l-backend:dummy}
# END DUMMY CI TEST
```
With:
```yaml
image: ${BACKEND_IMAGE:-registry.gitlab.com/e4l/platform/backend:latest}
```

Do the same for `frontend` service in staging, and repeat for both services in `infra/prod/docker-compose.yml`.

### Step 3: Uncomment real deployment jobs (if commented)
If `.ci/deploy.yml` jobs are commented to avoid conflicts, uncomment them:
```yaml
# deploy_staging:  →  deploy_staging:
# deploy_prod:     →  deploy_prod:
```

### Step 4: Commit and push
```bash
git add .gitlab-ci.yml infra/*/docker-compose.yml
git commit -m "Remove dummy CI/CD test infrastructure - backend/frontend implementation complete"
git push origin develop
```

---

## Troubleshooting

### Pipeline Fails at `dummy_backend_image` or `dummy_frontend_image`
**Symptom:** Jobs can't pull nginx:alpine or push to registry

**Diagnosis:**
- Check GitLab Runner has Docker access: `docker ps` on runner
- Check Container Registry is configured: `docker login ${CI_REGISTRY}`
- Check network connectivity to docker.io and GitLab registry

**Fix:**
- Restart Docker daemon: `systemctl restart docker`
- Check Ansible playbook ran successfully: `vagrant provision`
- Verify GitLab CI variables in project:
  - `CI_REGISTRY` (should be `registry.gitlab.com` or your GitLab hostname)
  - `CI_REGISTRY_IMAGE` (should be `registry.gitlab.com/e4l/platform`)

### Pipeline Fails at `deploy_staging_dummy`
**Symptom:** `docker compose pull` times out or fails

**Diagnosis:**
- Check GitLab Runner can reach Container Registry from within Docker daemon
- Check images were pushed successfully from previous job

**Fix:**
- Add `docker logout` and re-login in deploy script
- Check Container Registry credentials in runner config
- Verify docker-compose version supports `docker compose` (not `docker-compose`)

### Integration Tests Fail with "Connection refused"
**Symptom:** `curl http://localhost:8081/` returns "Connection refused"

**Diagnosis:**
- Services didn't start properly
- Port mapping issue
- Network connectivity problem

**Fix:**
- Check `docker compose ps` shows services running
- Check port forwarding if testing from local machine (not on runner)
- Verify `infra/staging/docker-compose.yml` has correct port mappings
- Add `docker compose logs` to deployment script for debugging

---

## Key Files Modified for Dummy Test

1. **`.gitlab-ci.yml`**
   - Added 5 new jobs: `dummy_backend_image`, `dummy_frontend_image`, `deploy_staging_dummy`, `integration_test_dummy`, `deploy_prod_dummy`
   - All marked with `BEGIN/END DUMMY CI TEST` comments
   - Easily removed in single edit

2. **`infra/staging/docker-compose.yml`**
   - Backend image: commented old default, added dummy default
   - Frontend image: commented old default, added dummy default
   - Database and other services unchanged

3. **`infra/prod/docker-compose.yml`**
   - Same changes as staging
   - Database and other services unchanged

---

## Next Steps After Dummy Test Succeeds

### For Backend Team (Jabin)
1. Fix `backend/Dockerfile` to properly build Java application
2. Uncomment/implement build commands in `.ci/backend.yml`
3. Ensure built image responds to HTTP (implements `/health` endpoint)
4. Update `backend_image` job to push to `${CI_REGISTRY_IMAGE}/backend`
5. Ensure unit tests pass in `unit_test_backend` job

### For Frontend Team (Maksym)
1. Fix `frontend/Dockerfile` to properly build Node.js application
2. Uncomment/implement build commands in `.ci/frontend.yml`
3. Ensure built image serves frontend (port 80 returns HTML)
4. Update `frontend_image` job to push to `${CI_REGISTRY_IMAGE}/frontend`
5. Ensure unit tests pass in `unit_test_frontend` job

### For Infrastructure Team (Michal)
1. Monitor pipeline execution with real images
2. Update `.ci/deploy.yml` if staging/prod deployment scripts need adjustments
3. Configure production CI/CD variables (different from staging)
4. Set up proper rollback procedures
5. Document deployment procedures for ops team

### Final Cleanup
1. Remove dummy test jobs from `.gitlab-ci.yml`
2. Restore image defaults in docker-compose files
3. Update project documentation with real deployment instructions
4. Archive this file or update with lessons learned

---

## Dummy Test Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        GitLab CI/CD Pipeline                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Stage: image                                                   │
│  ├─ dummy_backend_image  [pull nginx:alpine → tag → push]      │
│  ├─ dummy_frontend_image [pull nginx:alpine → tag → push]      │
│  └─ (real jobs commented out until backend/frontend ready)     │
│                                                                 │
│  Stage: deploy_staging                                          │
│  └─ deploy_staging_dummy [docker compose pull → up -d]          │
│     └─ infra/staging/docker-compose.yml                        │
│        ├─ backend (nginx:alpine, port 8081)                    │
│        ├─ frontend (nginx:alpine, port 3001)                   │
│        └─ MySQL (port 3307)                                    │
│                                                                 │
│  Stage: integration_test                                        │
│  └─ integration_test_dummy [curl http://localhost:8081/]       │
│                             [curl http://localhost:3001/]      │
│                                                                 │
│  Stage: deploy_prod                                             │
│  └─ deploy_prod_dummy (manual trigger)                          │
│     └─ infra/prod/docker-compose.yml                           │
│        ├─ backend (nginx:alpine, port 8082)                    │
│        ├─ frontend (nginx:alpine, port 3002)                   │
│        └─ MySQL (port 3308)                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Summary

The dummy CI/CD test infrastructure proves the DevOps pipeline is correctly configured without requiring backend/frontend implementation. It validates:

- ✅ Dockerfile building and Docker image management
- ✅ Image tagging and registry integration
- ✅ Environment configuration and deployment orchestration
- ✅ Port mappings and service networking
- ✅ Integration test execution
- ✅ Full CI/CD flow from commit to production deployment

Once real images are ready, remove the dummy jobs and the pipeline will use actual backend/frontend Docker images instead.

**Document updated:** When infrastructure team (Michal) completes dummy test
**Next review:** After backend/frontend teams complete their implementations
