# Backend Audit

## 1. Files Modified
- [updated_project/Software_Development_Environments_Course_Project_CI-CD_Pipeline_E4L/backend/Dockerfile](updated_project/Software_Development_Environments_Course_Project_CI-CD_Pipeline_E4L/backend/Dockerfile#L1-L23) — Dockerfile (backend application image)
- [updated_project/Software_Development_Environments_Course_Project_CI-CD_Pipeline_E4L/backend/gitlab-ci.yml](updated_project/Software_Development_Environments_Course_Project_CI-CD_Pipeline_E4L/backend/gitlab-ci.yml#L1-L76) — CI config (backend-specific pipeline)
- [updated_project/Software_Development_Environments_Course_Project_CI-CD_Pipeline_E4L/backend/backend_code/docker/.env](updated_project/Software_Development_Environments_Course_Project_CI-CD_Pipeline_E4L/backend/backend_code/docker/.env#L1-L8) — Infrastructure/DB config
- [updated_project/Software_Development_Environments_Course_Project_CI-CD_Pipeline_E4L/backend/backend_code/docker/docker-compose.db.yml](updated_project/Software_Development_Environments_Course_Project_CI-CD_Pipeline_E4L/backend/backend_code/docker/docker-compose.db.yml#L1-L23) — Database compose
- [updated_project/Software_Development_Environments_Course_Project_CI-CD_Pipeline_E4L/backend/backend_code/docker/docker-compose.backend.staging.yml](updated_project/Software_Development_Environments_Course_Project_CI-CD_Pipeline_E4L/backend/backend_code/docker/docker-compose.backend.staging.yml#L1-L26) — Infra (staging backend compose)
- [updated_project/Software_Development_Environments_Course_Project_CI-CD_Pipeline_E4L/backend/backend_code/docker/init/01-databases.sql](updated_project/Software_Development_Environments_Course_Project_CI-CD_Pipeline_E4L/backend/backend_code/docker/init/01-databases.sql#L1-L10) — Database init script

## 2. Dockerization Review
- Multi-stage Dockerfile builds with `gradle:8.3-jdk17`, runs `gradle bootJar -x test`, then copies `build/libs/e4l-server.jar` into `openjdk:17-slim` runtime and exposes port 8080 ([Dockerfile](updated_project/Software_Development_Environments_Course_Project_CI-CD_Pipeline_E4L/backend/Dockerfile#L1-L23)).
- Image/tag expectations: backend CI pushes `${CI_REGISTRY_IMAGE}/e4l-backend:latest` (see CI section), not commit-SHA tags. Exposed port 8080 matches compose files; hardcoded JAR name `e4l-server.jar` assumes build output exists.
- Hardcoded assumptions: port 8080, JAR name, and no healthcheck/entrypoint override beyond `java -jar app.jar`.

## 3. CI Configuration Review
- Added backend-only pipeline file [backend/gitlab-ci.yml](updated_project/Software_Development_Environments_Course_Project_CI-CD_Pipeline_E4L/backend/gitlab-ci.yml#L1-L76); it is **not included** by the root [.gitlab-ci.yml](.gitlab-ci.yml), so it will not run in the main pipeline.
- Jobs:
  - `backend_unit_tests` runs Gradle tests in `backend/backend_code` (JUnit reports) ([backend/gitlab-ci.yml#L31-L47](updated_project/Software_Development_Environments_Course_Project_CI-CD_Pipeline_E4L/backend/gitlab-ci.yml#L31-L47)).
  - `backend_image_build` builds/pushes `${CI_REGISTRY_IMAGE}/e4l-backend:latest` with DinD, insecure registry flag, and no commit tagging ([backend/gitlab-ci.yml#L49-L63](updated_project/Software_Development_Environments_Course_Project_CI-CD_Pipeline_E4L/backend/gitlab-ci.yml#L49-L63)).
  - `deploy_backend_staging` and `backend_staging_integration_check` run bespoke docker-compose stacks, independent of infra/staging ([backend/gitlab-ci.yml#L65-L75](updated_project/Software_Development_Environments_Course_Project_CI-CD_Pipeline_E4L/backend/gitlab-ci.yml#L65-L75)).
- Anti-patterns/conflicts:
  - Not integrated with root pipeline; duplicate stage names could confuse contributors.
  - Pushes `:latest` instead of commit SHA → image immutability/regression risk.
  - Hardcoded DB credentials (`MYSQL_ROOT_PASSWORD=12345678`) and registry settings in CI variables.
  - DinD insecure-registry flags but registry URL assumes same host; may diverge from main pipeline’s variables.

## 4. Database Configuration Review
- DB image: `mariadb:10.4.7` ([docker-compose.db.yml#L4](updated_project/Software_Development_Environments_Course_Project_CI-CD_Pipeline_E4L/backend/backend_code/docker/docker-compose.db.yml#L4)). Main infra uses MySQL 8.0, so version/vendor mismatch.
- Init scripts: mounts `./init` with [01-databases.sql](updated_project/Software_Development_Environments_Course_Project_CI-CD_Pipeline_E4L/backend/backend_code/docker/init/01-databases.sql#L1-L10) creating `e4l_staging` and `e4l_prod`, users `staging_user/prod_user`.
- Env defaults (.env): root user/password `12345678`, DB name `e4l`, datasource URL `jdbc:mysql://e4l-db:3306/e4l`, dump dir `/tmp` ([.env#L1-L8](updated_project/Software_Development_Environments_Course_Project_CI-CD_Pipeline_E4L/backend/backend_code/docker/.env#L1-L8)).
- Compose compatibility: staging compose points backend to `jdbc:mysql://e4l-db:3306/e4l_staging` with root creds and hardcoded JWT/admin secrets ([docker-compose.backend.staging.yml#L10-L24](updated_project/Software_Development_Environments_Course_Project_CI-CD_Pipeline_E4L/backend/backend_code/docker/docker-compose.backend.staging.yml#L10-L24)). Infra/staging uses MySQL 8 with users `staginguser/produser` and host ports 8081/3307; current backend stack uses port 8084, external network `e4l-db-net`, and different creds → incompatible without alignment.

## 5. Infra Boundary Violations
- Introduced a backend-local pipeline ([backend/gitlab-ci.yml](updated_project/Software_Development_Environments_Course_Project_CI-CD_Pipeline_E4L/backend/gitlab-ci.yml)) that bypasses the root CI orchestration and deploys its own compose stacks. This conflicts with the single-pipeline rule and the shared infra compose in `infra/` (**BLOCKING** until integrated or removed).
- Added separate docker-compose stacks and networks under `backend/backend_code/docker` that do not align with `infra/staging` and `infra/prod` (ports 8084 vs 8081/8082, MariaDB vs MySQL 8, different users/URLs) (**BLOCKING** for promotion flow).

## 6. Integration Risks
- Images tagged `:latest` will overwrite and break reproducibility; not compatible with commit-SHA promotion used elsewhere.
- MariaDB 10.4.7 + users/DB names differ from infra MySQL 8.0 configs; init script users (`staging_user/prod_user`) differ from infra (`staginguser/produser`). Likely connection/auth errors when mixing stacks.
- Backend staging compose exposes 8084 and uses external network `e4l-db-net`, while infra expects 8081 and its own compose network; health checks in main pipeline will miss these services.
- Hardcoded secrets (JWT, admin creds) and root DB password in env compose; security and drift risk.
- `backend/gitlab-ci.yml` is orphaned (not included) so backend changes won’t run in root pipeline; alternatively, if included, it would duplicate stages and compete for DinD resources.
