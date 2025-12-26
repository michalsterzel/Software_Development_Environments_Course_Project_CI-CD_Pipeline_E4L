# Project Responsibilities & CI/CD Overview

## Team Roles

- **Michal** — Infrastructure, CI/CD, Orchestration (Project Spine)  
- **Jabin** — Backend, Database, Staging  
- **Maksym** — Frontend, Dev Environment  

---

## 0) Big Picture (How Everything Fits Together)

- We use **one GitLab project (one repository)**.  
- Environments are **not** separate repositories or branches.

**CI (Commit Pipeline)**  
- Build backend & frontend  
- Run unit tests  
- Build Docker images (from Dockerfiles)

**CD (Deployment Stages)**  
- Deploy Docker images using Docker Compose to:
  - **Staging** (prod-like, automated integration/system tests)
  - **Production** (only if staging succeeds; prod containers are replaced)

**Key Rule**  
> Docker images move forward, containers do not.

Flow:  
CI creates images → staging deploy starts containers from those images → tests → prod deploy starts containers from the same images.

---

## 1) Repository Structure (Do Not Deviate)

```
repo/
├── backend/                          # Backend code + Dockerfile (Jabin)
│   ├── Dockerfile
│   └── ...backend source...
├── frontend/                         # Frontend code + Dockerfile (Maksym)
│   ├── Dockerfile
│   └── ...frontend source...
├── infra/
│   ├── dev/                          # Dev docker-compose (Maksym)
│   │   └── docker-compose.yml
│   ├── staging/                      # Staging docker-compose (Jabin + Michal glue)
│   │   └── docker-compose.yml
│   └── prod/                         # Prod docker-compose (Michal glue)
│       └── docker-compose.yml
├── ci/                               # Deploy + test scripts (Michal)
│   ├── deploy_staging.sh
│   ├── test_staging.sh
│   ├── deploy_prod.sh
│   └── README.md
├── vagrant/                          # VM creation (Michal)
│   └── Vagrantfile
├── ansible/                          # Provisioning (Michal, ansible_local)
│   ├── playbook.yml
│   └── roles/
├── .gitlab-ci.yml                    # Pipeline orchestration
└── README.md
```

---

## 2) Ports & Endpoints (Placeholders)

### Dev
- Frontend dev host port: `<DEV_FE_HOST_PORT>`
- Backend dev host port: `<DEV_BE_HOST_PORT>`
- Dev DB host port (optional): `<DEV_DB_HOST_PORT>`
- Dev DB name: `<DEV_DB_NAME>`

### Staging
- Frontend staging host port: `<STAGE_FE_HOST_PORT>`
- Backend staging host port: `<STAGE_BE_HOST_PORT>`
- Staging DB host port: `<STAGE_DB_HOST_PORT>`
- Staging DB name: `e4l_staging`

### Production
- Frontend prod host port: `<PROD_FE_HOST_PORT>`
- Backend prod host port: `<PROD_BE_HOST_PORT>`
- Prod DB host port: `<PROD_DB_HOST_PORT>`
- Prod DB name: `e4l_prod`

### Common Internal Container Ports
- Backend container port: `<BE_CONTAINER_PORT>`
- Frontend container port: `<FE_CONTAINER_PORT>`
- DB container port: `<DB_CONTAINER_PORT>`

---

## 3) Michal — Infrastructure, CI/CD, Orchestration

### VM & Provisioning
- Vagrant + Ansible Local
- Installs Docker, Docker Compose, GitLab CE, GitLab Runner, DB engine
- GitLab project creation can be manual

### CI/CD Orchestration
- Defines pipeline stages and dependencies
- Ensures deploy to prod only if staging passes

### Deployment Scripts
- `deploy_staging.sh`
- `test_staging.sh`
- `deploy_prod.sh`

### Glue Responsibilities
- Consistent image tagging (e.g. commit SHA)
- Separate ports and databases for staging/prod
- Reliable demo on single VM

---

## 4) Jabin — Backend, Database, Staging

### Backend Dockerization
- Multi-stage Dockerfile
- Exposes backend container port

### Backend Unit Tests
- Run in CI (e.g. `./gradlew test`)
- Fail pipeline on error

### Database Handling
- One DB engine
- Separate logical DBs: `e4l_staging`, `e4l_prod`
- Init via SQL scripts or migrations

### Staging Compose
- Backend + DB services
- Uses images built by CI

### Staging Tests
- At least one integration test proving backend ↔ DB works

---

## 5) Maksym — Frontend, Dev Environment

### Frontend Dockerization
- Build stage (Node)
- Serve stage (Nginx or Node)
- Exposes frontend container port

### Frontend Unit Tests
- Run in CI (e.g. Jest)

### Dev Environment
- Manual `docker compose -f infra/dev/docker-compose.yml up`
- Dev-only ports and config
- Not part of CI/CD promotion

---

## 6) Pipeline Responsibilities

- **Michal**: GitLab, Runner, pipeline orchestration, deploy scripts, final integration  
- **Jabin**: Backend build/test, Dockerfile, DB, staging backend+DB  
- **Maksym**: Frontend build/test, Dockerfile, dev compose & explanation  

If a CI job fails due to your component, you fix it.

---

## 7) Minimal Working Definition (“Done”)

- CI: backend + frontend unit tests pass; images built
- Staging: deploy succeeds; integration tests pass
- Prod: same images deployed; old containers replaced
- Dev: manual start works and is explainable
- DB: separate DBs for staging and prod

---

# GitLab CI/CD Configuration – Structure & Execution Flow

This project uses **one GitLab CI/CD pipeline** defined at the **repository root**. The pipeline is split into logical parts so each teammate can work independently while the system behaves as one coherent CI/CD flow.

## 1. Why we use a single root `.gitlab-ci.yml`

GitLab executes the pipeline configuration from a `.gitlab-ci.yml` at the repository root by default. For this project:

- We use **one root `.gitlab-ci.yml`**
- That file **includes** other CI files for clarity and ownership
- This keeps responsibilities separated without creating multiple pipelines

## 2. CI file layout

```text
.gitlab-ci.yml          # Root pipeline definition (orchestration)
.ci/
  backend.yml           # Backend build, unit tests, image build (Jabin)
  frontend.yml          # Frontend build, unit tests, image build (Maksym)
  deploy.yml            # Staging + prod deployment logic (Michal)
```

### Responsibilities

- **Root `.gitlab-ci.yml`**  
  Defines pipeline stages and includes the other files.
- **`.ci/backend.yml`**  
  Contains backend build, backend unit tests, and backend Docker image creation.
- **`.ci/frontend.yml`**  
  Contains frontend build, frontend unit tests, and frontend Docker image creation.
- **`.ci/deploy.yml`**  
  Contains staging deployment, integration/system tests, and production deployment.

## 3. Root `.gitlab-ci.yml` (conceptual structure)

```yaml
stages:
  - build
  - unit_test
  - deploy_staging
  - integration_test
  - deploy_prod

include:
  - local: ".ci/backend.yml"
  - local: ".ci/frontend.yml"
  - local: ".ci/deploy.yml"
```

This file does **not** define how backend or frontend are built. It defines **when** things are allowed to happen.

## 4. Backend & Frontend CI jobs (build + unit tests)

Backend and frontend jobs:

- run **independently**
- can execute in parallel
- do **not** depend on each other

Each side:
1. Builds the application
2. Runs **unit tests**
3. Builds a **Docker image** containing the compiled application

If **either** unit test job fails:
- the pipeline fails
- deployment does not happen

## 5. Docker images as the pipeline artifact

The **real artifact** is the Docker image (immutable, tagged), not a JAR or JS bundle.

- Built from:
  - `backend/Dockerfile`
  - `frontend/Dockerfile`
- Tagged (recommended): commit SHA (`$CI_COMMIT_SHA`)
- Reused for staging and production

> CI produces Docker images. CD deploys Docker images.

## 6. Deployment to Staging (CD)

If **both** backend and frontend unit tests pass, the pipeline deploys to staging:

- Uses `infra/staging/docker-compose.yml`
- Starts **new containers** from the images built in CI
- Connects frontend ↔ backend ↔ database
- Exposes staging ports

Important:
- CI containers are **not reused**
- staging containers are started fresh each deployment

## 7. Staging integration/system tests

After staging deployment:

- integration/system tests run against the staging endpoints
- tests validate:
  - backend reachable (e.g., `/health`)
  - frontend reachable (e.g., `/`)
  - optional: backend can access DB

If these tests fail:
- pipeline stops
- production is not deployed

## 8. Deployment to Production

Production deploy happens only if:

- backend unit tests passed
- frontend unit tests passed
- staging deploy succeeded
- staging integration tests passed

Production deploy:
- uses `infra/prod/docker-compose.yml`
- starts **new prod containers**
- replaces the currently running prod containers
- uses separate ports + `e4l_prod` DB

Important:
- the **same images** that passed staging are deployed to production
- no rebuild happens in production

## 9. Dev environment (outside CI/CD)

Dev is required but **manual** and **not part of promotion**:

```bash
docker compose -f infra/dev/docker-compose.yml up -d
```

Dev exists to demonstrate environment separation and dev-friendly configuration (it does not block staging/prod).

## 10. Full pipeline workflow (step-by-step)

1. Developer pushes a commit
2. GitLab starts the pipeline
3. Backend build + unit tests run
4. Frontend build + unit tests run
5. Docker images are created (backend + frontend), tagged by commit
6. Images are deployed to **staging** via Docker Compose
7. Integration/system tests run against staging
8. If staging passes, the same images are deployed to **production**
9. Old production containers are replaced with new ones

## 11. Key rules to remember

- One repository, one pipeline
- Docker images move forward, containers do not
- Dev is manual; staging and prod are automated
- Production is only reached through staging
- Failures must block promotion

