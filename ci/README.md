# CI/CD Deployment Scripts

This directory contains deployment and testing scripts orchestrated by Michal.

## Scripts

### deploy_staging.sh
Deploys Docker images to the staging environment:
- Stops existing staging containers
- Starts new containers from CI-built images
- Uses staging ports and `e4l_staging` database

### test_staging.sh
Runs integration/system tests against staging:
- Backend health check
- Frontend availability check
- Database connectivity (optional)

### deploy_prod.sh
Deploys to production (only after staging passes):
- Uses same images that passed staging
- Replaces old production containers
- Includes basic rollback on failure
- Uses production ports and `e4l_prod` database

## Usage

These scripts are called automatically by the GitLab CI/CD pipeline and should not be run manually unless you understand the implications.

## Environment Variables

- `CI_COMMIT_SHA`: Used for image tagging
- `BACKEND_IMAGE`: Backend Docker image with tag
- `FRONTEND_IMAGE`: Frontend Docker image with tag
