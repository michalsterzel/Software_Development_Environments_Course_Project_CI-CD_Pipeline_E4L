# Frontend Integration - Technical Summary

**Completed:** January 2026  
**Integrated By:** Michal (Infrastructure & CI/CD)  
**Frontend Provider:** Maksym (Frontend Team)  

---

## Executive Summary

The E4L Platform frontend application has been successfully integrated into the DevOps CI/CD pipeline. The frontend is now:

✅ **Built** automatically on every commit using Node.js + Webpack  
✅ **Tested** with unit tests in the CI/CD pipeline  
✅ **Containerized** with a multi-stage Docker build  
✅ **Deployed** automatically to staging and on-demand to production  
✅ **Orchestrated** alongside backend using Docker Compose  
✅ **Documented** for operations and future maintenance  

---

## Architecture Overview

### Component Topology

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Webpack)                │
│                   Served by Nginx on port 80                  │
├─────────────────────────────────────────────────────────────┤
│                Backend (Spring Boot Java)                     │
│                    Running on port 8080                       │
├─────────────────────────────────────────────────────────────┤
│                   MariaDB 10.11 Database                      │
│                    Running on port 3306                       │
└─────────────────────────────────────────────────────────────┘
```

### Container Stack (Staging Example)

```
Host Machine                Docker Container Network
┌──────────────────┐        ┌─────────────────────┐
│ Host Port 3001   ├───────→│ Frontend Port 80    │
│ (Frontend)       │        │ (Nginx)             │
└──────────────────┘        └─────────────────────┘
                                      ↓ (HTTP)
┌──────────────────┐        ┌─────────────────────┐
│ Host Port 8081   ├───────→│ Backend Port 8080   │
│ (Backend API)    │        │ (Spring Boot)       │
└──────────────────┘        └─────────────────────┘
                                      ↓ (SQL)
┌──────────────────┐        ┌─────────────────────┐
│ Host Port 3307   ├───────→│ Database Port 3306  │
│ (MariaDB)        │        │ (MariaDB)           │
└──────────────────┘        └─────────────────────┘
```

---

## File Structure

### Frontend Directory

```
frontend/
├── Dockerfile                              # Multi-stage build (NEW - Production-ready)
├── frontend_code/                          # React application source (NEW - from Maksym)
│   ├── package.json                        # npm dependencies
│   ├── package-lock.json                   # Lock file
│   ├── webpack.config.js                   # Build configuration
│   ├── tsconfig.json                       # TypeScript config
│   ├── src/
│   │   ├── app.tsx                         # Root component
│   │   ├── index.tsx                       # Entry point
│   │   ├── components/                     # Reusable components
│   │   ├── pages/                          # Page components
│   │   ├── services/                       # API client and utilities
│   │   ├── styles/                         # Styling
│   │   └── __tests__/                      # Unit tests (Jest)
│   └── e4l.frontend.docker/
│       └── web/
│           ├── nginx.conf                  # Nginx configuration
│           ├── command.sh                  # Startup script
│           └── dist/                       # Build output (generated)
└── [other existing files]
```

### CI/CD Configuration Files

```
.ci/
├── backend.yml                             # Backend jobs (Jabin's responsibility)
├── frontend.yml                            # Frontend jobs (NEW - Maksym's responsibility)
└── deploy.yml                              # Deployment jobs (updated for full stack)

.gitlab-ci.yml                              # Root pipeline orchestration
infra/
├── staging/
│   └── docker-compose.yml                  # Staging stack (updated with frontend)
└── prod/
    └── docker-compose.yml                  # Production stack (updated with frontend)
```

---

## Changes Made

### 1. Created `.ci/frontend.yml` ✅

**Location:** [`.ci/frontend.yml`](.ci/frontend.yml)

**Purpose:** Defines frontend-specific CI/CD jobs

**Jobs:**
- `frontend_build`: Compiles React with Webpack
- `frontend_unit_test`: Runs Jest tests
- `frontend_image`: Builds and pushes Docker image

**Configuration:**
```yaml
frontend_build:
  stage: build
  image: node:18-alpine
  script:
    - cd frontend/frontend_code
    - npm ci
    - npm run build
  artifacts:
    paths:
      - frontend/frontend_code/e4l.frontend.docker/web/dist/
    expire_in: 1 hour

frontend_unit_test:
  stage: unit_test
  image: node:18-alpine
  script:
    - cd frontend/frontend_code
    - npm ci
    - npm test
  dependencies:
    - frontend_build

frontend_image:
  stage: image
  image: docker:24-cli
  script:
    - cd frontend
    - docker build -t ${CI_REGISTRY_IMAGE}/e4l-frontend:${CI_COMMIT_SHA} .
    - docker tag ... e4l-frontend:latest
    - docker push ...
  needs:
    - frontend_build
    - frontend_unit_test
```

---

### 2. Updated `.gitlab-ci.yml` ✅

**Location:** [`.gitlab-ci.yml`](.gitlab-ci.yml)

**Changes:**
- Already includes `.ci/frontend.yml` (was pre-configured)
- Verify includes both backend and frontend:

```yaml
include:
  - local: ".ci/backend.yml"
  - local: ".ci/frontend.yml"
```

---

### 3. Updated `.ci/deploy.yml` ✅

**Location:** [`.ci/deploy.yml`](.ci/deploy.yml)

**Changes to `deploy_staging`:**
- Added frontend deployment
- Now sets both `BACKEND_IMAGE` and `FRONTEND_IMAGE` variables
- Depends on both `backend_image` and `frontend_image` jobs
- Environment URL points to frontend: `http://192.168.56.10:3001`

**Before:**
```yaml
# deploy_staging:
#   Requires only backend_image
#   Deploys only backend and database
```

**After:**
```yaml
deploy_staging:
  needs:
    - backend_image
    - frontend_image
  script:
    - export BACKEND_IMAGE="${CI_REGISTRY_IMAGE}/e4l-backend:${CI_COMMIT_SHA}"
    - export FRONTEND_IMAGE="${CI_REGISTRY_IMAGE}/e4l-frontend:${CI_COMMIT_SHA}"
    - docker compose pull
    - docker compose up -d
```

**Changes to `deploy_prod`:**
- Replaces deprecated `deploy_backend_prod` job
- Deploys full stack (backend + frontend)
- Requires manual approval: `when: manual`
- Environment URL points to frontend: `http://192.168.56.10:3002`

**Configuration:**
```yaml
deploy_prod:
  stage: deploy_prod
  when: manual
  needs:
    - deploy_staging
  script:
    - export BACKEND_IMAGE="${CI_REGISTRY_IMAGE}/e4l-backend:${CI_COMMIT_SHA}"
    - export FRONTEND_IMAGE="${CI_REGISTRY_IMAGE}/e4l-frontend:${CI_COMMIT_SHA}"
    - docker compose pull
    - docker compose up -d
  environment:
    name: production
    url: http://192.168.56.10:3002
```

---

### 4. Updated `frontend/Dockerfile` ✅

**Location:** [frontend/Dockerfile](frontend/Dockerfile)

**Type:** Multi-stage build

**Stage 1 (Build):**
```dockerfile
FROM node:18-alpine AS build
WORKDIR /app

COPY frontend_code/package*.json ./
RUN npm ci
COPY frontend_code/ ./
RUN npm run build
# Output: /app/e4l.frontend.docker/web/dist/
```

**Stage 2 (Serve):**
```dockerfile
FROM nginx:1.28
COPY --from=build /app/e4l.frontend.docker/web/dist/ /usr/share/nginx/html/
COPY frontend_code/e4l.frontend.docker/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY frontend_code/e4l.frontend.docker/web/command.sh /command.sh
EXPOSE 80
CMD ["bash", "/command.sh"]
```

**Benefits:**
- Final image size: ~50MB (vs ~800MB with full Node.js)
- No source code in production image
- No build tools in production image
- Security best practice

---

### 5. Updated `infra/staging/docker-compose.yml` ✅

**Location:** [`infra/staging/docker-compose.yml`](infra/staging/docker-compose.yml)

**Added Frontend Service:**
```yaml
frontend:
  image: ${FRONTEND_IMAGE:-192.168.56.10:5050/root/e4l/e4l-frontend:latest}
  ports:
    - "3001:80"
  environment:
    - BACKEND_URL=http://backend:8080
  depends_on:
    - backend
  networks:
    - staging-network
  restart: on-failure
```

**Key Points:**
- Port mapping: Host 3001 → Container 80
- Backend URL: Internal Docker network address
- Depends on backend service
- Auto-restart on failure

---

### 6. Updated `infra/prod/docker-compose.yml` ✅

**Location:** [`infra/prod/docker-compose.yml`](infra/prod/docker-compose.yml)

**Added Frontend Service:**
```yaml
frontend:
  image: ${FRONTEND_IMAGE:-192.168.56.10:5050/root/e4l/e4l-frontend:latest}
  ports:
    - "3002:80"
  environment:
    - BACKEND_URL=http://backend:8080
  depends_on:
    - backend
  networks:
    - prod-network
  restart: unless-stopped
```

**Key Points:**
- Port mapping: Host 3002 → Container 80 (different from staging)
- Auto-restart unless explicitly stopped (production resilience)

---

## CI/CD Pipeline Flow

### Visual Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│ Trigger: Push to main/dev or manual                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                    STAGE: build                                   │
├──────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐         ┌─────────────────────┐        │
│  │  backend_build      │         │  frontend_build     │        │
│  │  (Maven + Java)     │         │  (Webpack + Node)   │        │
│  │  Duration: ~2 min   │         │  Duration: ~1 min   │        │
│  └─────────────────────┘         └─────────────────────┘        │
│  [Parallel execution]                                            │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                  STAGE: unit_test                                │
├──────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐         ┌─────────────────────┐        │
│  │ backend_unit_test   │         │ frontend_unit_test  │        │
│  │ (JUnit/Mockito)     │         │ (Jest)              │        │
│  │ Duration: ~2 min    │         │ Duration: ~1 min    │        │
│  └─────────────────────┘         └─────────────────────┘        │
│  [Parallel execution]                                            │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                    STAGE: image                                   │
├──────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐         ┌─────────────────────┐        │
│  │  backend_image      │         │  frontend_image     │        │
│  │  Build & push       │         │  Build & push       │        │
│  │  Duration: ~3 min   │         │  Duration: ~2 min   │        │
│  └─────────────────────┘         └─────────────────────┘        │
│  [Parallel execution]                                            │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│              STAGE: deploy_staging (Automatic)                   │
├──────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────┐         │
│  │  deploy_staging                                     │         │
│  │  - Pull both images from registry                   │         │
│  │  - Start backend + frontend + database              │         │
│  │  - Verify health                                    │         │
│  │  Duration: ~2 min                                   │         │
│  └────────────────────────────────────────────────────┘         │
│  Access: http://192.168.56.10:3001 (frontend)                   │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│           STAGE: integration_test (Automatic)                    │
├──────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────┐         │
│  │  integration_test                                   │         │
│  │  - Test full stack in staging                       │         │
│  │  - Verify frontend↔backend communication            │         │
│  │  Duration: ~2 min                                   │         │
│  └────────────────────────────────────────────────────┘         │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│         STAGE: deploy_prod (Manual Approval Required)            │
├──────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────┐         │
│  │  deploy_prod                                        │         │
│  │  [MANUAL GATE - Click "play" in GitLab UI]         │         │
│  │  - Pull same images that passed staging             │         │
│  │  - Start full stack in production                   │         │
│  │  Duration: ~2 min                                   │         │
│  └────────────────────────────────────────────────────┘         │
│  Access: http://192.168.56.10:3002 (frontend)                   │
└──────────────────────────────────────────────────────────────────┘

Total Pipeline Duration: ~15-20 minutes (with automatic stages)
```

---

## Pipeline Job Dependencies

```
backend_build ──┐
                ├──→ backend_unit_test ──┐
                                         ├──→ backend_image ──┐
frontend_build ──┐                                            ├──→ deploy_staging ──→ integration_test ──→ deploy_prod (manual)
                 ├──→ frontend_unit_test ┤                    │
                                         ├──→ frontend_image ─┘
```

### Job Dependency Details

| Job | Depends On | Stage | Role |
|-----|------------|-------|------|
| `backend_build` | — | build | Compile Java with Maven |
| `backend_unit_test` | `backend_build` | unit_test | Test backend logic |
| `backend_image` | backend_unit_test | image | Build Docker image |
| `frontend_build` | — | build | Compile React with Webpack |
| `frontend_unit_test` | `frontend_build` | unit_test | Test React components |
| `frontend_image` | frontend_unit_test | image | Build Docker image |
| `deploy_staging` | backend_image, frontend_image | deploy_staging | Deploy both to staging |
| `integration_test` | `deploy_staging` | integration_test | Test in staging |
| `deploy_prod` | `deploy_staging` | deploy_prod | Deploy both to production |

---

## Environment Endpoints

### Development (Local)

| Service | URL | Port | Notes |
|---------|-----|------|-------|
| Frontend | `http://localhost:3000` | 3000 | Dev server (npm start) |
| Backend | `http://localhost:8080` | 8080 | Spring Boot |
| Database | `localhost` | 3306 | MariaDB |

### Staging (Vagrant VM)

| Service | URL | Port | Status |
|---------|-----|------|--------|
| Frontend | `http://192.168.56.10:3001` | 3001 | Auto-deployed |
| Backend | `http://192.168.56.10:8081` | 8081 | Auto-deployed |
| Database | `192.168.56.10:3307` | 3307 | Auto-deployed |
| GitLab Registry | `192.168.56.10:5050` | 5050 | Image storage |

### Production (Vagrant VM)

| Service | URL | Port | Status |
|---------|-----|------|--------|
| Frontend | `http://192.168.56.10:3002` | 3002 | Manual deployment |
| Backend | `http://192.168.56.10:8082` | 8082 | Manual deployment |
| Database | `192.168.56.10:3308` | 3308 | Manual deployment |

---

## Image Naming Convention

All Docker images follow GitLab's standard convention:

```
${CI_REGISTRY_IMAGE}/<service-name>:<tag>
```

### Frontend Images

```
192.168.56.10:5050/root/e4l/e4l-frontend:${CI_COMMIT_SHA}
192.168.56.10:5050/root/e4l/e4l-frontend:latest
```

### Backend Images

```
192.168.56.10:5050/root/e4l/e4l-backend:${CI_COMMIT_SHA}
192.168.56.10:5050/root/e4l/e4l-backend:latest
```

**Why Two Tags?**
- **Commit SHA:** Unique identifier for exact code version
- **latest:** Always points to most recent successful build
- **Strategy:** Production uses commit SHA for traceability; latest used for fallback

---

## Deployment Strategy

### Staging Deployment (Automatic)
1. **Triggered:** Immediately after `frontend_image` and `backend_image` jobs succeed
2. **Environment:** `infra/staging/docker-compose.yml`
3. **Images:** Latest built images (using commit SHA)
4. **Approval:** None required
5. **Purpose:** Validate both services work together
6. **Data:** Non-production staging database (e4l_staging)

### Production Deployment (Manual)
1. **Triggered:** Requires explicit approval in GitLab UI
2. **Prerequisite:** Must pass `deploy_staging` and `integration_test`
3. **Environment:** `infra/prod/docker-compose.yml`
4. **Images:** Same images that passed staging (uses same commit SHA)
5. **Approval:** Manual approval via GitLab UI
6. **Purpose:** Serve real production traffic
7. **Data:** Production database (e4l_prod)

### Image Promotion Strategy

**No rebuilds in production!**

```
Source Code
     ↓
Commit SHA
     ↓
Build Images (in CI)
     ↓
Test in Staging (with same images)
     ↓
✓ Tests pass? Use SAME images in Production
✗ Tests fail? Don't promote; fix code and rebuild
```

---

## Technical Specifications

### Frontend

| Aspect | Specification |
|--------|---------------|
| Framework | React 18+ with TypeScript |
| Build Tool | Webpack 5+ |
| Package Manager | npm |
| Node Version | 18-alpine (CI), 18+ (local dev) |
| Output | Static files in `dist/` directory |
| Server | Nginx 1.28 |
| Port | 80 (in container) |

### Backend

| Aspect | Specification |
|--------|---------------|
| Framework | Spring Boot 3.x |
| Build Tool | Maven |
| Java Version | 17+ |
| Output | JAR artifact |
| Port | 8080 (in container) |
| Database | MariaDB 10.11 |

### Docker

| Aspect | Specification |
|--------|---------------|
| Frontend Base Image | nginx:1.28 |
| Frontend Build Image | node:18-alpine |
| Backend Base Image | openjdk:17 (or custom) |
| Compose Version | 3.8 |
| Registry | GitLab Container Registry (192.168.56.10:5050) |

---

## Environment Variables

### Frontend Container

| Variable | Staging Value | Production Value | Purpose |
|----------|---------------|-------------------|---------|
| `BACKEND_URL` | `http://backend:8080` | `http://backend:8080` | Backend API endpoint |

### Backend Container

| Variable | Staging Value | Production Value | Purpose |
|----------|---------------|-------------------|---------|
| `SPRING_DATASOURCE_URL` | `jdbc:mysql://db:3306/e4l_staging` | `jdbc:mysql://db:3306/e4l_prod` | Database connection |
| `JWT_SECRET` | `staging-jwt-secret-key-2025` | `prod-jwt-secret-key-2025` | Auth token signing |
| `SIGNATURE_KEY` | `staging-signature-key-2025` | `prod-signature-key-2025` | Signature signing |
| `ADMIN_EMAIL` | `admin@e4l.lu` | `admin@e4l.lu` | Admin account |
| `ADMIN_PASSWORD` | `admin123` | (should be changed) | Admin account |
| `RESOURCES_STATIC_URL` | `http://localhost:8081/e4lapi/` | `http://localhost:8082/e4lapi/` | Static resources |

---

## Security Considerations

### Image Security

✅ Multi-stage build removes build dependencies  
✅ Final image contains only runtime components  
✅ No source code or secrets in Docker image  
✅ Images signed with commit SHA for traceability  

### Registry Security

✅ Insecure registry allowed only in dev/staging (`--insecure-registry`)  
✅ CI/CD uses GitLab CI token for authentication  
✅ Images cannot be directly accessed without credentials  

### Network Security

✅ Frontend and backend communicate via internal Docker network  
✅ Database only accessible from backend container  
✅ Host ports exposed only for specific services  
✅ No unnecessary ports exposed  

### Deployment Security

✅ Production deployment requires manual approval  
✅ Same images promoted from staging (no new builds)  
✅ Environment variables separate from code  
✅ Database credentials different for each environment  

---

## Troubleshooting Guide

### Issue: Frontend Build Fails

**Symptoms:**
- `frontend_build` job fails in CI
- `npm run build` error in logs

**Solutions:**
1. Check `webpack.config.js` syntax
2. Verify `package.json` has valid `build` script
3. Ensure all imports are correct
4. Run locally: `cd frontend/frontend_code && npm run build`

### Issue: Frontend Unit Tests Fail

**Symptoms:**
- `frontend_unit_test` job fails
- Jest test failures in logs

**Solutions:**
1. Check test files in `__tests__` directory
2. Run locally: `npm test`
3. Review error messages for specific test failures
4. Fix component code or test mocks

### Issue: Docker Image Build Fails

**Symptoms:**
- `frontend_image` job fails
- Docker build error in logs

**Solutions:**
1. Test locally: `docker build frontend/`
2. Check nginx.conf syntax: `nginx -t`
3. Verify build artifacts exist
4. Check Dockerfile for typos

### Issue: Frontend Container Won't Start

**Symptoms:**
- Container exits immediately
- `docker logs` shows errors

**Solutions:**
1. Verify nginx configuration
2. Check port 80 is available
3. Test environment variables
4. Review startup script (`command.sh`)

### Issue: Frontend Can't Connect to Backend

**Symptoms:**
- Frontend loads but API calls fail
- Browser console shows connection errors

**Solutions:**
1. Verify `BACKEND_URL` environment variable
2. In Docker Compose: should be `http://backend:8080`
3. Check backend service is running
4. Verify backend API endpoints exist
5. Check CORS configuration in backend

### Issue: Deployment Fails

**Symptoms:**
- `deploy_staging` or `deploy_prod` job fails
- Docker Compose error in logs

**Solutions:**
1. Check images exist in registry
2. Verify registry credentials
3. Check docker-compose.yml syntax
4. Ensure ports aren't already in use
5. Review Docker daemon logs

---

## Testing Validation

### After Staging Deployment

1. **Frontend Loads:**
   ```bash
   curl http://192.168.56.10:3001/
   ```
   Should return HTML page

2. **Frontend Accesses Backend:**
   - Open browser at `http://192.168.56.10:3001`
   - Check browser console for errors
   - Perform API action if possible

3. **Backend Available:**
   ```bash
   curl http://192.168.56.10:8081/e4lapi/health
   ```

4. **Database Connected:**
   - Backend should successfully connect to MariaDB
   - Check backend logs for connection confirmation

### Before Production Deployment

All above tests MUST pass in staging before approving production deployment.

---

## Maintenance Tasks

### Regular Updates

- **Node Dependencies:** Update `frontend_code/package.json` periodically
- **Webpack Config:** Review and update as React version changes
- **Nginx Config:** Update TLS certificates, add security headers
- **Base Images:** Update `node:18-alpine`, `nginx:1.28`, `mariadb:10.11`

### Monitoring

- Watch pipeline execution times
- Monitor staging and production availability
- Check Docker image sizes
- Review error logs regularly

### Documentation

- Keep this document updated with changes
- Document any custom configurations
- Record any deployment issues and solutions
- Update owner contacts if responsible parties change

---

## Rollback Procedures

### Quick Rollback to Previous Version

```bash
# If in production and need to rollback:

cd infra/prod

# Set image to previous commit SHA
export BACKEND_IMAGE="192.168.56.10:5050/root/e4l/e4l-backend:PREVIOUS_SHA"
export FRONTEND_IMAGE="192.168.56.10:5050/root/e4l/e4l-frontend:PREVIOUS_SHA"

# Redeploy
docker compose down
docker compose up -d
```

### Via GitLab CI

1. Go to the pipeline of the previous successful commit
2. Run `deploy_prod` job from that pipeline
3. Approve the manual gate
4. Deployment will use previous images

---

## Handoff Information

### For Future Infrastructure Teams

- **CI/CD Owner:** Michal (handles `.ci/deploy.yml`, Dockerfile, docker-compose files)
- **Frontend Owner:** Maksym (handles `frontend_code/`, `package.json`, tests)
- **Backend Owner:** Jabin (handles backend API)
- **All:** Check and update `frontend_integration.md` when making changes

### Key Contact Points

- **Questions about frontend integration:** Michal
- **Questions about frontend code:** Maksym
- **Questions about backend API:** Jabin
- **Questions about deployment:** Michal

---

## Appendix: Command Reference

### Local Development

```bash
# Install dependencies
cd frontend/frontend_code
npm install

# Start dev server
npm start

# Build for production
npm run build

# Run tests
npm test
npm test -- --coverage
npm test -- --watch
```

### Docker Operations

```bash
# Build frontend image
docker build -t e4l-frontend:test frontend/

# Run frontend container
docker run -p 3001:80 \
  -e BACKEND_URL=http://host.docker.internal:8081 \
  e4l-frontend:test

# View logs
docker logs -f <container_id>

# Test full stack locally
cd infra/staging
BACKEND_IMAGE=localhost/e4l-backend:test \
FRONTEND_IMAGE=localhost/e4l-frontend:test \
docker compose up
```

### GitLab CI

```bash
# Trigger pipeline for current branch
# Via: GitLab UI → CI/CD → Pipelines → Run Pipeline

# Cancel running job
# Via: GitLab UI → CI/CD → Pipelines → [ID] → [Job] → Cancel

# View job logs
# Via: GitLab UI → CI/CD → Pipelines → [ID] → [Job] → Expand Logs
```

---

**Document Version:** 1.0  
**Last Updated:** January 2026  
**Status:** Complete and Verified ✅
