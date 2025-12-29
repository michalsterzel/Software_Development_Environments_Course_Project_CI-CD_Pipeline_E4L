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

**Last Updated:** December 29, 2025
**Changes Tracked:** 2
**Outstanding Issues:** None
