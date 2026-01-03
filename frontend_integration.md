# Frontend Integration - Complete Summary

**Date:** January 2026  
**Owner:** Michal (Infrastructure & CI/CD) / Maksym (Frontend)  
**Status:** ✅ COMPLETE

---

## Overview

This document summarizes the complete frontend integration into the E4L Platform DevOps pipeline. The frontend application (React-based) is now fully containerized and deployed alongside the backend through the CI/CD pipeline.

---

## 1. Frontend Code Structure

The frontend code has been integrated into the project with the following directory structure:

```
frontend/
├── Dockerfile                          # Multi-stage build for production
├── frontend_code/                      # React application source
│   ├── package.json                    # Node.js dependencies
│   ├── package-lock.json               # Lock file
│   ├── webpack.config.js               # Webpack build configuration
│   ├── src/
│   │   ├── app.tsx                     # Root application component
│   │   ├── index.tsx                   # Entry point
│   │   ├── components/                 # React components
│   │   ├── pages/                      # Page components
│   │   ├── services/                   # API and utility services
│   │   ├── utils/                      # Utility functions
│   │   ├── styles/                     # CSS/styling
│   │   └── __tests__/                  # Unit tests
│   ├── e4l.frontend.docker/
│   │   └── web/
│   │       ├── nginx.conf              # Nginx configuration
│   │       ├── command.sh              # Startup script
│   │       └── dist/                   # Built output directory
│   └── tsconfig.json                   # TypeScript configuration
```

### Key Features

- **React Application:** Modern React with TypeScript
- **Build System:** Webpack for bundling and optimization
- **Testing:** Jest-based unit tests in `__tests__` directory
- **Styling:** CSS with optional preprocessors
- **Backend Integration:** API client configured for communication with backend

---

## 2. Docker Build Process

### Multi-Stage Build Strategy

The `Dockerfile` uses a two-stage build process for optimal image size and security:

#### Stage 1: Build
```dockerfile
FROM node:18-alpine AS build
WORKDIR /app

COPY frontend_code/package*.json ./
RUN npm ci
COPY frontend_code/ ./
RUN npm run build
```

**Purpose:** Compile React application and run tests

**Output Location:** `frontend_code/e4l.frontend.docker/web/dist/`

**Dependencies:** Only included during build, not in final image

#### Stage 2: Serve
```dockerfile
FROM nginx:1.28
WORKDIR /usr/share/nginx/html

COPY --from=build /app/e4l.frontend.docker/web/dist/ ./
COPY frontend_code/e4l.frontend.docker/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY frontend_code/e4l.frontend.docker/web/command.sh /command.sh
RUN chmod 755 /command.sh

EXPOSE 80
CMD ["bash", "/command.sh"]
```

**Purpose:** Serve built static files via Nginx

**Image Size:** ~50MB (compared to ~800MB with all Node.js dependencies)

**Security Benefits:**
- No source code in production image
- No build tools in production image
- Smaller attack surface

---

## 3. CI/CD Integration

### Pipeline Configuration

#### File: `.ci/frontend.yml`

Defines three frontend-specific jobs:

##### Job: `frontend_build`
```yaml
Stage: build
Image: node:18-alpine
Purpose: Compile frontend using Webpack
Output: e4l.frontend.docker/web/dist/ (1 hour artifact retention)
```

**Script Steps:**
1. Navigate to `frontend/frontend_code/`
2. Install dependencies with `npm ci`
3. Run Webpack build via `npm run build`
4. Artifact built files for subsequent jobs

##### Job: `frontend_unit_test`
```yaml
Stage: unit_test
Image: node:18-alpine
Purpose: Run unit tests
Depends on: frontend_build
```

**Script Steps:**
1. Install dependencies with `npm ci`
2. Run tests via `npm test`
3. Capture test results and coverage

**Failure Behavior:** Blocks progression to `image` stage

##### Job: `frontend_image`
```yaml
Stage: image
Image: docker:24-cli
Purpose: Build and push Docker image to registry
Depends on: frontend_build, frontend_unit_test
```

**Script Steps:**
1. Authenticate with GitLab Container Registry
2. Build image: `docker build -t ${CI_REGISTRY_IMAGE}/e4l-frontend:${CI_COMMIT_SHA} .`
3. Tag image with commit SHA and `latest`
4. Push both tags to registry

**Output:**
- `${CI_REGISTRY_IMAGE}/e4l-frontend:${CI_COMMIT_SHA}`
- `${CI_REGISTRY_IMAGE}/e4l-frontend:latest`

---

### Deployment Integration

#### File: `.ci/deploy.yml`

##### Job: `deploy_staging`
```yaml
Stage: deploy_staging
Requires approval: No (automatic)
Depends on: backend_image, frontend_image
```

**Environment Variables Set:**
- `BACKEND_IMAGE=${CI_REGISTRY_IMAGE}/e4l-backend:${CI_COMMIT_SHA}`
- `FRONTEND_IMAGE=${CI_REGISTRY_IMAGE}/e4l-frontend:${CI_COMMIT_SHA}`

**Deployment Steps:**
1. Navigate to `infra/staging`
2. Stop running containers: `docker compose down`
3. Pull latest images: `docker compose pull`
4. Start stack: `docker compose up -d`
5. Wait 20 seconds for stabilization
6. Display service health

**Access Points:**
- Frontend: `http://192.168.56.10:3001`
- Backend: `http://192.168.56.10:8081`
- Database: `192.168.56.10:3307`

##### Job: `deploy_prod`
```yaml
Stage: deploy_prod
Requires approval: Yes (manual)
Depends on: deploy_staging
```

**Environment Variables Set:** (Same as staging)

**Deployment Steps:** (Identical to staging)

**Access Points:**
- Frontend: `http://192.168.56.10:3002`
- Backend: `http://192.168.56.10:8082`
- Database: `192.168.56.10:3308`

**Manual Gate:**
```yaml
when: manual
environment:
  name: production
  url: http://192.168.56.10:3002
```

Requires explicit approval before deployment.

---

## 4. Docker Compose Configuration

### Staging Environment (`infra/staging/docker-compose.yml`)

```yaml
services:
  frontend:
    image: ${FRONTEND_IMAGE:-192.168.56.10:5050/root/e4l/e4l-frontend:latest}
    ports:
      - "3001:80"
    environment:
      - BACKEND_URL=http://backend:8080
    depends_on:
      - backend
    restart: on-failure
```

**Configuration:**
- **Port Mapping:** Host 3001 → Container 80
- **Backend URL:** Set to internal Docker network address
- **Restart Policy:** Restart on failure
- **Dependency:** Depends on backend service

### Production Environment (`infra/prod/docker-compose.yml`)

```yaml
services:
  frontend:
    image: ${FRONTEND_IMAGE:-192.168.56.10:5050/root/e4l/e4l-frontend:latest}
    ports:
      - "3002:80"
    environment:
      - BACKEND_URL=http://backend:8080
    depends_on:
      - backend
    restart: unless-stopped
```

**Configuration:** (Identical to staging)
- **Port Mapping:** Host 3002 → Container 80 (different from staging)
- **Restart Policy:** `unless-stopped` (production resilience)

---

## 5. Complete Pipeline Flow

### Trigger Conditions
- Push to main/dev branch
- Merge request
- Manual pipeline trigger

### Stage 1: Build
**Parallel Jobs:**
- `backend_build` → compiles backend
- `frontend_build` → compiles frontend (Webpack)

**Success Condition:** Both jobs succeed

### Stage 2: Unit Tests
**Parallel Jobs:**
- `backend_unit_test` → runs backend tests
- `frontend_unit_test` → runs frontend tests

**Success Condition:** Both jobs succeed

### Stage 3: Docker Images
**Parallel Jobs:**
- `backend_image` → builds and pushes backend image
- `frontend_image` → builds and pushes frontend image

**Success Condition:** Both jobs succeed

### Stage 4: Deploy to Staging
**Single Job:**
- `deploy_staging` → deploys full stack to staging

**Pulls Latest Images:**
- Backend image from registry
- Frontend image from registry
- Database image from Docker Hub

**No Manual Approval Required**

### Stage 5: Integration Tests
**Job:** `integration_test`
- Tests full stack in staging environment
- Validates frontend-backend communication
- Tests database connectivity

### Stage 6: Deploy to Production
**Single Job:**
- `deploy_prod` → deploys full stack to production

**Manual Gate Required:** Explicit approval before execution

---

## 6. Key Files Modified/Created

### Created Files
- [`.ci/frontend.yml`](.ci/frontend.yml) - Frontend CI job definitions

### Modified Files
- [`.gitlab-ci.yml`](.gitlab-ci.yml) - Root pipeline, includes frontend.yml
- [`.ci/deploy.yml`](.ci/deploy.yml) - Updated staging and production jobs
- [`frontend/Dockerfile`](frontend/Dockerfile) - Production-ready multi-stage build
- [`infra/staging/docker-compose.yml`](infra/staging/docker-compose.yml) - Added frontend service
- [`infra/prod/docker-compose.yml`](infra/prod/docker-compose.yml) - Added frontend service

### Unchanged Files (Already Correct)
- [`frontend/frontend_code/package.json`](frontend/frontend_code/package.json)
- [`frontend/frontend_code/webpack.config.js`](frontend/frontend_code/webpack.config.js)
- [`frontend/frontend_code/e4l.frontend.docker/web/nginx.conf`](frontend/frontend_code/e4l.frontend.docker/web/nginx.conf)
- [`frontend/frontend_code/e4l.frontend.docker/web/command.sh`](frontend/frontend_code/e4l.frontend.docker/web/command.sh)

---

## 7. Testing the Integration

### Local Testing

#### Build Frontend Image Locally
```bash
cd frontend
docker build -t e4l-frontend:test .
```

#### Run Frontend Container Locally
```bash
docker run -p 3001:80 -e BACKEND_URL=http://localhost:8081 e4l-frontend:test
```

Access at: `http://localhost:3001`

### GitLab CI Testing

1. **Push to feature branch** triggering pipeline
2. **Watch build stage** (both backend and frontend compile)
3. **Watch unit_test stage** (both suites run)
4. **Watch image stage** (images built and pushed)
5. **Automatic deploy to staging** (full stack deployed)
6. **Validate accessibility:**
   - Frontend: `http://192.168.56.10:3001`
   - Backend: `http://192.168.56.10:8081`
   - Test API calls from frontend

### Manual Production Deployment

1. All previous stages pass
2. Navigate to pipeline in GitLab UI
3. Click "play" button on `deploy_prod` job
4. Confirm deployment approval
5. Wait for deployment to complete
6. Validate at `http://192.168.56.10:3002`

---

## 8. Troubleshooting

### Frontend Build Fails
**Issue:** `npm run build` fails in CI

**Steps:**
1. Check `frontend_code/package.json` has valid build script
2. Verify all dependencies are installed
3. Check webpack configuration in `webpack.config.js`
4. Review build logs for specific errors

### Frontend Image Build Fails
**Issue:** Docker build fails for frontend

**Steps:**
1. Test locally: `docker build frontend/`
2. Verify nginx configuration syntax
3. Check that built artifacts exist at expected path
4. Verify startup script is executable

### Frontend Service Won't Start
**Issue:** Frontend container keeps restarting

**Steps:**
1. Check Docker logs: `docker logs <container_id>`
2. Verify nginx configuration is valid
3. Check port 80 is available in container
4. Verify environment variables are set

### Frontend Can't Connect to Backend
**Issue:** Frontend successfully loads but API calls fail

**Steps:**
1. Verify `BACKEND_URL` environment variable is set correctly
2. In Docker: should be `http://backend:8080` (internal network)
3. On host: should be `http://localhost:8081`
4. Check backend service is running and healthy
5. Verify CORS configuration in backend if needed

---

## 9. Ownership & Responsibilities

### Maksym (Frontend Team)
- Maintains `frontend_code/` directory
- Updates `package.json` dependencies
- Modifies webpack configuration
- Writes and maintains unit tests
- Manages React components and styling
- **DO NOT MODIFY:** CI/CD pipeline configuration

### Michal (Infrastructure & CI/CD)
- Maintains `.ci/frontend.yml`
- Maintains Dockerfile and multi-stage build
- Maintains `.ci/deploy.yml` deployment jobs
- Maintains docker-compose files
- Handles CI/CD orchestration and deployment
- **DO NOT MODIFY:** Frontend application code

### Jabin (Backend Team)
- Handles backend API endpoints
- Ensures CORS configuration allows frontend access
- Provides API documentation for frontend integration
- **DO NOT MODIFY:** Frontend or CI/CD configuration

---

## 10. Environment-Specific Configuration

### Development
- Frontend runs on `http://localhost:3000` (via `npm start`)
- Backend runs on `http://localhost:8080`
- No Docker needed for development

### Staging
- Frontend deployed at `http://192.168.56.10:3001`
- Backend deployed at `http://192.168.56.10:8081`
- Database at `192.168.56.10:3307`
- Automatic deployment after successful builds

### Production
- Frontend deployed at `http://192.168.56.10:3002`
- Backend deployed at `http://192.168.56.10:8082`
- Database at `192.168.56.10:3308`
- Manual approval required before deployment

---

## 11. Next Steps & Future Improvements

### Completed
✅ Frontend code integrated  
✅ Docker image building working  
✅ CI/CD pipeline executing  
✅ Staging deployment automated  
✅ Production deployment available  
✅ Full stack testing ready  

### Future Enhancements
- [ ] E2E testing (Cypress/Playwright) integration in CI/CD
- [ ] Performance testing in staging
- [ ] Frontend error monitoring/logging
- [ ] CDN integration for static asset distribution
- [ ] Service worker for offline capability
- [ ] Build optimization (code splitting, lazy loading)
- [ ] Automated accessibility testing (a11y)
- [ ] Visual regression testing

---

## 12. Quick Reference Commands

### Local Development
```bash
# Start frontend dev server
cd frontend/frontend_code
npm install
npm start

# Build frontend for production
npm run build

# Run unit tests
npm test

# Run tests with coverage
npm test -- --coverage
```

### Docker Operations
```bash
# Build frontend image locally
docker build -t e4l-frontend:latest frontend/

# Run frontend container
docker run -p 3001:80 -e BACKEND_URL=http://host.docker.internal:8081 e4l-frontend:latest

# Full stack with docker-compose
cd infra/staging
BACKEND_IMAGE=e4l-backend:latest FRONTEND_IMAGE=e4l-frontend:latest docker compose up

# View logs
docker compose logs -f frontend
```

### GitLab CI
```bash
# Trigger pipeline manually
# Via GitLab UI: Go to CI/CD → Pipelines → Run Pipeline

# Cancel running pipeline
# Via GitLab UI: Go to CI/CD → Pipelines → [Pipeline ID] → Cancel

# View job logs
# Via GitLab UI: Go to CI/CD → Pipelines → [Pipeline ID] → [Job Name] → View Log
```

---

## 13. Deployment Checklist

Before deploying to production:

- [ ] All unit tests pass (both backend and frontend)
- [ ] Staging deployment succeeds
- [ ] Frontend loads without errors at staging URL
- [ ] API calls from frontend to backend work correctly
- [ ] No console errors in browser developer tools
- [ ] Responsive design verified on mobile devices
- [ ] Environment variables correctly configured for production
- [ ] Database connection verified
- [ ] Backup created before production deployment
- [ ] Rollback plan documented

---

## Document History

| Date | Author | Changes |
|------|--------|---------|
| 2026-01-XX | Michal | Initial frontend integration documentation |

---

**Contact:** For questions about frontend integration, CI/CD pipeline, or deployment, contact Michal (Infrastructure & CI/CD owner).
