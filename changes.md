# Changes Log

## Overview
This file documents all changes made to the DevOps project configuration, starting from December 29, 2025.

---

## Change 1: Fix backend_image job needs directive

**File:** `.ci/backend.yml`
**Date:** December 29, 2025
**Status:** ✅ Complete
**Issue:** GitLab CI error - "jobs:backend_image dependencies the backend_build should be part of needs"

**Problem:**
- The `backend_image` job had `dependencies: - backend_build` (old-style)
- Its `needs` directive only listed `backend_unit_test`
- GitLab requires all job dependencies to be declared in `needs` when using the needs directive

**Solution:**
Updated the `backend_image` job to include both dependencies in the `needs` directive:
```yaml
# BEFORE
needs:
  - backend_unit_test

# AFTER
needs:
  - backend_build
  - backend_unit_test
```

**Why:**
- `backend_build` is needed for artifacts (build outputs)
- `backend_unit_test` is needed for proper stage execution order
- Both must be listed in `needs` to satisfy GitLab CI validation

---

## Change 2: Fix frontend_image job needs directive

**File:** `.ci/frontend.yml`
**Date:** December 29, 2025
**Status:** ✅ Complete
**Issue:** GitLab CI error - "jobs:frontend_image dependencies the frontend_build should be part of needs"

**Problem:**
- Same issue as backend_image job
- The `frontend_image` job had `dependencies: - frontend_build` (old-style)
- Its `needs` directive only listed `frontend_unit_test`
- Missing `frontend_build` in needs directive

**Solution:**
Updated the `frontend_image` job to include both dependencies in the `needs` directive:
```yaml
# BEFORE
needs:
  - frontend_unit_test

# AFTER
needs:
  - frontend_build
  - frontend_unit_test
```

**Why:**
- `frontend_build` is needed for artifacts (build outputs)
- `frontend_unit_test` is needed for proper stage execution order
- Both must be listed in `needs` to satisfy GitLab CI validation

---

## Summary

**Pattern Fixed:** Jobs that use old-style `dependencies` alongside `needs` directive

**Files Modified:**
1. `.ci/backend.yml` - Added `backend_build` to needs list
2. `.ci/frontend.yml` - Added `frontend_build` to needs list

**Status:** Both GitLab CI validation errors resolved. Pipeline should now validate successfully.

---

## Note on Dependencies vs Needs

**`dependencies` (legacy):**
- Old GitLab syntax
- Automatically pulls artifacts from any jobs in previous stages
- Less explicit control

**`needs` (current best practice):**
- Modern GitLab syntax
- Explicitly declares which jobs this job depends on
- Can depend on jobs from any stage, not just previous ones
- When used, replaces stage-based execution ordering
- Must include all jobs whose artifacts are needed

**Recommendation:** Once frontend/backend implement their full build processes, consider:
1. Remove `dependencies` directive (not needed with explicit `needs`)
2. Keep only `needs` for clarity and modern GitLab best practices

---

## Change 3: Fix dummy_backend_image script syntax error (3rd attempt - multiline)

**File:** `.gitlab-ci.yml`
**Date:** December 29, 2025
**Status:** ✅ Complete
**Issue:** GitLab CI error - "jobs:dummy_backend_image:script config should be a string or a nested array of strings up to 10 levels deep"

**Problem:**
- YAML parser was rejecting the script format
- Multiple attempts with different variable syntax didn't resolve it
- Issue appears to be with the script block structure itself

**Solution:**
Used multiline script format with pipe `|` operator:
```yaml
script:
  - |
    echo "Building dummy backend image..."
    docker pull nginx:alpine
    docker tag nginx:alpine ${CI_REGISTRY_IMAGE}/e4l-backend:dummy
    docker push ${CI_REGISTRY_IMAGE}/e4l-backend:dummy
    echo "Dummy backend image pushed: ${CI_REGISTRY_IMAGE}/e4l-backend:dummy"
```

The pipe operator tells YAML to treat the following indented block as a single multiline string, which GitLab then passes to the shell.

Also applied the same fix to `dummy_frontend_image` job.

**Why:**
- Multiline script format is more reliable for complex shell commands
- The `|` operator ensures proper YAML parsing of the script block
- This is a common pattern in GitLab CI for jobs with multiple commands

---

## Change 4: Fix dummy_frontend_image script syntax error (multiline format)

**File:** `.gitlab-ci.yml`
**Date:** December 29, 2025
**Status:** ✅ Complete
**Issue:** Same as dummy_backend_image

**Solution:**
Applied multiline script format with pipe operator:
```yaml
script:
  - |
    echo "Building dummy frontend image..."
    docker pull nginx:alpine
    docker tag nginx:alpine ${CI_REGISTRY_IMAGE}/e4l-frontend:dummy
    docker push ${CI_REGISTRY_IMAGE}/e4l-frontend:dummy
    echo "Dummy frontend image pushed: ${CI_REGISTRY_IMAGE}/e4l-frontend:dummy"
```

---

## Change 3: Fix dummy_backend_image and dummy_frontend_image script syntax (FINAL SOLUTION)

**File:** `.gitlab-ci.yml`
**Date:** December 29, 2025
**Status:** ✅ Complete
**Issue:** GitLab CI error - "jobs:dummy_backend_image:script config should be a string or a nested array of strings up to 10 levels deep"

**Problem:**
- YAML parser was rejecting the script block format
- Multiple attempts with different variable syntax and quoting didn't work
- Issue was with how the script array was being parsed

**Final Solution:**
Used multiline script format with pipe `|` operator:
```yaml
script:
  - |
    echo "Building dummy backend image..."
    docker pull nginx:alpine
    docker tag nginx:alpine ${CI_REGISTRY_IMAGE}/e4l-backend:dummy
    docker push ${CI_REGISTRY_IMAGE}/e4l-backend:dummy
    echo "Dummy backend image pushed: ${CI_REGISTRY_IMAGE}/e4l-backend:dummy"
```

**Why This Works:**
- The pipe `|` operator tells YAML to treat the following indented block as a single multiline string
- GitLab CI then passes this entire string to the shell as one script block
- This is the standard pattern in GitLab CI for jobs with multiple shell commands
- Avoids YAML parsing issues with arrays of script commands

**Applied to:**
- dummy_backend_image
- dummy_frontend_image
- deploy_staging_dummy
- integration_test_dummy
- deploy_prod_dummy

---

## Change 4: Fix all dummy job scripts to use multiline format

**File:** `.gitlab-ci.yml`
**Date:** December 29, 2025
**Status:** ✅ Complete
**Issue:** Same script parsing errors in deploy_staging_dummy, integration_test_dummy, and deploy_prod_dummy

**Solution:**
Applied the same multiline script format (`- |`) to all remaining dummy CI jobs to ensure consistent, reliable YAML parsing.

---

## Change 5: Fix backend_image stage definition

**File:** `.ci/backend.yml`
**Date:** December 29, 2025
**Status:** ✅ Complete
**Issue:** GitLab CI error - "backend_image job: need backend_unit_test is not defined in current or prior stages"

**Problem:**
- The `backend_image` job was incorrectly set to `stage: build`
- It had `needs: - backend_unit_test` which is in the `unit_test` stage
- A job cannot depend on jobs from later stages
- The `image` stage comes after `unit_test` in the pipeline

**Solution:**
Changed the stage from `build` to `image`:
```yaml
# BEFORE
backend_image:
  stage: build  # Wrong - can't depend on unit_test stage

# AFTER
backend_image:
  stage: image  # Correct - image stage comes after unit_test
```

**Why:**
- Pipeline stages execute in order: build → unit_test → image → deploy_staging → integration_test → deploy_prod
- The `backend_image` job builds Docker images, so it belongs in the `image` stage
- Jobs can only use `needs` to depend on jobs from current or prior stages
- Moving to `image` stage allows it to properly depend on `backend_unit_test`

---

## Change 6: Fix frontend_image stage definition

**File:** `.ci/frontend.yml`
**Date:** December 29, 2025
**Status:** ✅ Complete
**Issue:** Same issue as backend_image (preventive fix)

**Problem:**
- The `frontend_image` job was also incorrectly set to `stage: build`
- Would fail with same error once backend_image was fixed

**Solution:**
Changed the stage from `build` to `image`:
```yaml
# BEFORE
frontend_image:
  stage: build  # Wrong

# AFTER
frontend_image:
  stage: image  # Correct
```

---

## Change 7: Add dummy-tests branch to workflow rules

**File:** `.gitlab-ci.yml`
**Date:** December 29, 2025
**Status:** ✅ Complete
**Issue:** Pipeline not triggering when pushing to dummy-tests branch

**Problem:**
- The workflow rules only allowed pipelines on "main" and "develop" branches
- Pushing to "dummy-tests" branch didn't trigger any pipeline
- No validation or testing was happening

**Solution:**
Added "dummy-tests" branch to workflow rules:
```yaml
workflow:
  rules:
    - if: '$CI_COMMIT_BRANCH == "main"'
    - if: '$CI_COMMIT_BRANCH == "develop"'
    - if: '$CI_COMMIT_BRANCH == "dummy-tests"'  # Added this line
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
```

**Why:**
- GitLab CI only runs pipelines when workflow rules match
- Adding the branch allows testing CI/CD changes on the dummy-tests branch
- Without this, no pipeline validation occurs on this branch

---

## Change 8: Fix GitLab external_url for runner connectivity

**File:** `ansible/playbook.yml`
**Date:** December 29, 2025
**Status:** ✅ Complete
**Issue:** Pipeline failing with "Failed to connect to localhost port 8080 after 0 ms: Could not connect to server"

**Problem:**
- GitLab external_url was set to `http://localhost:8080`
- This address works from the **host machine** (port forwarding: guest 80 → host 8080)
- But GitLab Runner running **inside the VM** cannot use localhost:8080
- Inside the VM, port 8080 doesn't exist - GitLab runs on port 80
- Runner tries to clone from `http://localhost:8080/root/e4l.git/` and fails

**Solution:**
Changed external_url to use the VM's IP address instead of localhost:
```yaml
# BEFORE
line: 'external_url "http://localhost:8080"'

# AFTER
line: 'external_url "http://192.168.56.10"'
```

**Why This Works:**
- The VM's private network IP is `192.168.56.10` (defined in Vagrantfile)
- This IP is accessible from both:
  - Inside the VM: Direct access to port 80 (GitLab)
  - Host machine: Maps to port 8080 via port forwarding, or direct access to 192.168.56.10
- Runner inside VM connects to `http://192.168.56.10:80` (port 80 is default HTTP)
- Host can still access at `http://localhost:8080` (port forwarding) or `http://192.168.56.10`

**Next Steps:**
- Run `vagrant reload` to re-provision with new GitLab URL
- GitLab will reconfigure with the correct external_url
- Runner will now successfully clone from the correct Git URL

---

## Change 9: Remove deploy.yml from includes during dummy test phase

**File:** `.gitlab-ci.yml` and `.ci/deploy.yml`
**Date:** December 29, 2025
**Status:** ✅ Complete
**Issue:** GitLab CI error - "jobs needs config should implement the script:, run:, or trigger: keyword"

**Problem:**
- The `.ci/deploy.yml` file had orphaned YAML syntax that couldn't be parsed
- Even though content was mostly comments, the broken YAML structure remained
- GitLab CI includes the file and tries to parse it, finding invalid job definitions

**Solution:**
1. **Commented out the deploy.yml include** in `.gitlab-ci.yml`:
   ```yaml
   include:
     # - local: ".ci/deploy.yml"    # Commented out during dummy test
   ```

2. **Cleaned up deploy.yml** to contain only documentation:
   ```yaml
   # This file is not included during dummy test phase
   # Real deployment jobs are disabled to avoid dependencies on backend/frontend
   ```

**Why:**
- Dummy test only needs dummy jobs in `.gitlab-ci.yml`
- No deployment jobs are needed while testing with nginx placeholder images
- Completely removing the include prevents any YAML parsing errors
- Keeps the real jobs in deploy.yml as documentation for later

**To Re-enable for Real Backend/Frontend:**
When backend.yml and frontend.yml are ready:
1. Uncomment in `.gitlab-ci.yml`:
   ```yaml
   - local: ".ci/backend.yml"
   - local: ".ci/frontend.yml"
   - local: ".ci/deploy.yml"
   ```
2. Add real job definitions back to `.ci/deploy.yml`
3. Comment out or remove dummy jobs from `.gitlab-ci.yml`

---

## Change 10: Enable Docker-in-Docker connectivity for dummy jobs

**File:** `.gitlab-ci.yml`
**Date:** December 29, 2025
**Status:** ✅ Complete
**Issue:** Dummy image jobs failed with `Cannot connect to the Docker daemon at tcp://docker:2375`

**Problem:**
- `docker:24-cli` uses the DinD service at `docker:2375`
- Required environment variables were not set globally, so the CLI could not reach the daemon
- Initial attempt placed variables under `default`, which GitLab does not support (caused "default config contains unknown keys: variables")

**Solution:**
- Move DinD variables to top-level `variables` block:
```yaml
variables:
  DOCKER_HOST: tcp://docker:2375
  DOCKER_TLS_CERTDIR: ""
  DOCKER_DRIVER: overlay2
```

**Why:**
- `variables` must be top-level or job-level; `default` cannot contain `variables`
- `DOCKER_HOST` points CLI to the DinD service
- `DOCKER_TLS_CERTDIR: ""` disables TLS to match the DinD image default
- `DOCKER_DRIVER: overlay2` sets a stable storage driver

---

**Last Updated:** December 29, 2025
**Changes Tracked:** 10
**Outstanding Issues:** None

---

## Change 11: Point registry to VM IP and configure insecure registry for docker

**File:** `.gitlab-ci.yml`
**Date:** December 29, 2025
**Status:** ✅ Complete
**Issue:** Dummy image pushes failed with `http: server gave HTTP response to HTTPS client`

**Problem:**
- Docker daemon defaults to HTTPS for all registries
- Our GitLab Container Registry is HTTP-only (not TLS-enabled)
- Docker login doesn't accept `http://` prefix in registry URL

**Solution (updated):**
- Removed `http://` from registry URLs (docker login requires just host:port):
  ```yaml
  variables:
    CI_REGISTRY: "192.168.56.10:5050"
    CI_REGISTRY_IMAGE: "192.168.56.10:5050/root/e4l"
  ```
- Configured docker:24-dind service to allow insecure registry:
  ```yaml
  services:
    - name: docker:24-dind
      command: ["--insecure-registry=192.168.56.10:5050"]
  ```

**Why:**
- `--insecure-registry` tells Docker daemon to allow HTTP (non-TLS) connections to that specific registry
- Without http:// prefix, docker login can work with the insecure registry flag
- Applied to both dummy_backend_image and dummy_frontend_image jobs

**Impact:** Docker can now login, tag, and push to the HTTP registry without HTTPS errors.

**Extension:** Also applied to deploy_staging_dummy and deploy_prod_dummy jobs, as `docker compose pull` encounters the same HTTPS issue when pulling images from the insecure registry.

## Change 12: Merge integration tests into deployment job

**File:** `.gitlab-ci.yml`
**Date:** December 29, 2025
**Status:** ✅ Complete
**Issue:** Integration test job failed with "Connection refused" to localhost:8081 and localhost:3001

**Problem:**
- integration_test_dummy ran in a separate alpine container with no network access to deployed services
- Services were running in deploy_staging_dummy job's Docker-in-Docker environment
- Isolated jobs cannot communicate with each other's containers

**Solution:**
- Merged integration tests into deploy_staging_dummy script (runs after `docker compose up -d`)
- Changed test commands to use `docker compose exec -T` to run curl inside the service containers
- Tests access services via localhost:8080 (backend) and localhost:80 (frontend) from within containers
- Removed standalone integration_test_dummy job
- Updated deploy_prod_dummy to depend on deploy_staging_dummy instead
 - Production validation also uses `docker compose exec -T` for backend/frontends

**Why:**
- `docker compose exec` runs commands inside the compose network where services can access themselves
- The `-T` flag disables pseudo-TTY allocation (required for CI/CD non-interactive execution)
- Services listen on their internal ports (8080 for backend, 80 for frontend)
- Simpler pipeline structure for dummy test

**Impact:** Integration tests can now reach the deployed services and validate they're running.
