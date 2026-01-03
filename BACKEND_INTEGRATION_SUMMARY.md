# Backend Integration Summary

**Date:** January 2, 2026  
**Integrator:** Michal (Infrastructure & CI/CD)  
**Backend Developer:** Jabin

---

## 1. Files Modified

| File | Category | Action |
|------|----------|--------|
| `backend/Dockerfile` | Dockerfile | **Replaced** - Multi-stage build with proper structure |
| `backend/gitlab-ci.yml` | CI config | **Disabled** - Commented out, redirected to .ci/backend.yml |
| `.ci/backend.yml` | CI config | **Updated** - Real Gradle build, tests, Docker image with SHA tag |
| `.gitlab-ci.yml` | CI config | **Updated** - Enabled .ci/backend.yml include |
| `infra/dev/docker-compose.yml` | Infrastructure | **Updated** - MariaDB, Spring datasource env vars |
| `infra/staging/docker-compose.yml` | Infrastructure | **Updated** - MariaDB, CI-built backend image |
| `infra/prod/docker-compose.yml` | Infrastructure | **Updated** - MariaDB, CI-built backend image |
| `ansible/playbook.yml` | Infrastructure | **Updated** - MariaDB client instead of MySQL |

---

## 2. What Was Kept from Backend Developer

### ✅ Kept (Integrated)

1. **Backend application source code** (`backend/backend_code/`)
   - All Java source files, Gradle configuration, tests preserved
   - No modifications to application logic

2. **Multi-stage Dockerfile concept**
   - Gradle 8.5 + JDK 17 build stage
   - Eclipse Temurin 21 runtime stage
   - Non-root user for security
   - Health check configuration
   - Port 8080 exposure

3. **Build configuration**
   - `bootJar` task producing `e4l-server.jar`
   - Test skipping in Docker build (tests run in CI)
   - Gradle wrapper support

4. **Environment variable requirements**
   - `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`
   - `JWT_SECRET`, `SIGNATURE_KEY`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`
   - `RESOURCES_STATIC_URL`, `DEV_RESOURCES_STATIC_URL`

---

## 3. What Was Discarded and Why

### ❌ Discarded

| Item | Reason |
|------|--------|
| `backend/gitlab-ci.yml` (standalone pipeline) | **Violates single-pipeline rule.** All CI must go through root `.gitlab-ci.yml` with includes. Commented out for reference. |
| `backend/backend_code/docker/` compose files | **Bypass centralized infra.** Backend-local docker-compose stacks conflict with `infra/` structure and use different ports (8084 vs 8081). |
| `backend/backend_code/docker/.env` | **Hardcoded credentials.** Contains root passwords and non-standard registry image names. |
| `backend/backend_code/docker/init/01-databases.sql` | **Different user/password scheme.** Uses `staging_user/prod_user` which conflicts with root auth used elsewhere. |
| Image tag `:latest` | **Immutability violation.** Replaced with `${CI_COMMIT_SHA}` for reproducible deployments. |
| Deployment jobs in backend CI | **Wrong location.** Deployment belongs in `.ci/deploy.yml`, not backend CI. |
| MariaDB 10.4.7 | **Outdated.** Replaced with MariaDB 10.11 LTS for modern features and security. |

---

## 4. Database Engine Decision Rationale

### Decision: Standardize on MariaDB 10.11 LTS

**Previous State:**
- Infrastructure compose files used MySQL 8.0
- Backend developer used MariaDB 10.4.7
- Mixed versions caused compatibility risk

**Reasons for MariaDB:**

1. **Compatibility** - Backend code uses `mysql-connector-java` which works with MariaDB (MySQL-compatible)
2. **Backend preference** - Developer already tested with MariaDB; less migration risk
3. **LTS Support** - MariaDB 10.11 is Long Term Support (until 2028)
4. **Licensing** - MariaDB is fully open source (no Oracle licensing concerns)
5. **Performance** - MariaDB has better defaults for containerized environments

**Changes Made:**
- All `image: mysql:8.0` → `image: mariadb:10.11`
- Added `MARIADB_*` env vars alongside legacy `MYSQL_*` for compatibility
- Ansible: `mysql-client` → `mariadb-client`
- Removed `--default-authentication-plugin=mysql_native_password` (not needed in MariaDB)

---

## 5. Integration Risks and Mitigations

### ⚠️ Remaining Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Frontend not integrated** | Medium | Frontend CI remains commented out. Enable `.ci/frontend.yml` when Maksym provides working Dockerfile. |
| **Deployment jobs disabled** | Medium | `.ci/deploy.yml` is commented out. Real deployment requires both backend and frontend images. Dummy test jobs remain for infrastructure validation. |
| **Database volume migration** | Low | Existing MySQL volumes may not be compatible with MariaDB. Run `docker compose down -v` to clear volumes before first MariaDB deployment. |
| **Hardcoded secrets in compose** | Low | Dev/staging secrets are placeholders. Production should use GitLab CI/CD variables or secrets management. |
| **Sleep-based DB wait** | Low | Backend entrypoint uses `sleep 15` to wait for DB. Consider implementing proper health check dependency. |
| **Build context path** | Low | Dockerfile expects `backend_code/` subdirectory. Ensure CI runs `docker build` from `backend/` directory. |

### ✅ Risks Mitigated

| Former Risk | Resolution |
|-------------|------------|
| Duplicate pipeline definitions | Backend CI consolidated into `.ci/backend.yml` |
| Image tag overwriting | Using `${CI_COMMIT_SHA}` for immutable tags |
| Port conflicts (8084 vs 8081) | Using standard ports from infra compose |
| Mixed MySQL/MariaDB versions | Standardized on MariaDB 10.11 everywhere |
| Backend-local compose bypassing infra | Removed; using centralized `infra/` compose files |

---

## 6. Verification Checklist

Before considering integration complete:

- [ ] Run `vagrant reload --provision` to apply MariaDB client changes
- [ ] Push changes to GitLab and verify CI pipeline runs
- [ ] Verify `backend_build` job compiles successfully
- [ ] Verify `backend_unit_test` job runs tests
- [ ] Verify `backend_image` job builds and pushes image with SHA tag
- [ ] Test staging deployment with `docker compose -f infra/staging/docker-compose.yml up -d`
- [ ] Confirm backend connects to MariaDB and starts successfully

---

## 7. Next Steps

1. **Frontend Integration** - When Maksym provides working frontend:
   - Enable `.ci/frontend.yml` in root pipeline
   - Update infra compose files with real frontend images

2. **Deployment Automation** - Once both images are building:
   - Uncomment `.ci/deploy.yml` include
   - Remove or keep dummy test jobs based on need

3. **Secrets Management** - For production:
   - Move sensitive variables to GitLab CI/CD Variables
   - Consider HashiCorp Vault or similar for secrets

4. **Health Check Improvements** - Replace sleep-based waits:
   - Add `depends_on.condition: service_healthy` in compose
   - Implement Spring Boot Actuator health endpoint

---

*This document was generated as part of the backend integration task. All changes are reversible by checking out the previous commit.*
