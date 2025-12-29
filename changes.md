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

**Last Updated:** December 29, 2025
**Changes Tracked:** 7
**Outstanding Issues:** None
