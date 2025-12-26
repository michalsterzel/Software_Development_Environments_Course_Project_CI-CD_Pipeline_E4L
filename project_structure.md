# Project Structure

This document describes the complete project structure, including the purpose and contents of each directory and key files.

## Directory Tree

```
DevOpsProject/
├── backend/                          # Backend application code & Dockerfile
│   └── Dockerfile                    # Multi-stage build for backend (Java/JVM)
├── frontend/                         # Frontend application code & Dockerfile
│   └── Dockerfile                    # Multi-stage build for frontend (Node.js → Nginx)
├── infra/                            # Infrastructure & deployment configurations
│   ├── dev/                          # Development environment
│   │   └── docker-compose.yml        # Local dev environment with all services
│   ├── staging/                      # Staging environment (production-like)
│   │   └── docker-compose.yml        # Staging deployment using CI-built images
│   └── prod/                         # Production environment
│       └── docker-compose.yml        # Production deployment with same images as staging
├── ci/                               # CI/CD deployment & testing scripts
│   ├── deploy_staging.sh             # Script to deploy to staging environment
│   ├── test_staging.sh               # Integration/system tests for staging
│   ├── deploy_prod.sh                # Script to deploy to production
│   └── README.md                     # Documentation for CI/CD scripts
├── .ci/                              # GitLab CI job definitions (included by root .gitlab-ci.yml)
│   ├── backend.yml                   # Backend build, unit tests, Docker image creation
│   ├── frontend.yml                  # Frontend build, unit tests, Docker image creation
│   └── deploy.yml                    # Staging & production deployment jobs
├── ansible/                          # Ansible provisioning for VM setup
│   ├── playbook.yml                  # Main Ansible playbook (installs Docker, GitLab, runner, DB)
│   └── roles/                        # Ansible roles directory (for future modularization)
├── vagrant/                          # Vagrant VM configuration directory (currently unused)
├── .gitlab-ci.yml                    # Root GitLab CI/CD pipeline configuration
├── Vagrantfile                       # Vagrant VM definition (6GB RAM, 4 cores, ubuntu/jammy64)
├── project_overview.md               # High-level project description and team responsibilities
├── project_structure.md              # This file - detailed project structure documentation
└── README.md                         # Quick start guide and project overview
```

---

## Detailed Descriptions

### Backend (`backend/`)

**Purpose**: Contains the backend application source code.

**Contents**:
- **Dockerfile** - Multi-stage Docker build configuration
  - Build stage: Compiles the application (e.g., `./gradlew build`)
  - Runtime stage: Runs the compiled JAR file
  - Exposes backend container port (defined as `<BE_CONTAINER_PORT>`)
  - Responsible: Jabin

**Key Information**:
- Should contain your actual backend code (Spring Boot, Node.js, etc.)
- Build process is triggered by CI during the `build` stage
- Unit tests run during the `unit_test` stage
- Docker image is built during the `build` stage and tagged with commit SHA

---

### Frontend (`frontend/`)

**Purpose**: Contains the frontend application source code.

**Contents**:
- **Dockerfile** - Multi-stage Docker build configuration
  - Build stage: Installs dependencies and builds the project (e.g., `npm run build`)
  - Serve stage: Uses Nginx to serve the built files
  - Exposes frontend container port (defined as `<FE_CONTAINER_PORT>`)
  - Responsible: Maksym

**Key Information**:
- Should contain your React, Vue, Angular, or other frontend framework code
- Includes `package.json` for Node.js dependency management
- Build process is triggered by CI during the `build` stage
- Unit tests (e.g., Jest) run during the `unit_test` stage
- Docker image is built during the `build` stage and tagged with commit SHA

---

### Infrastructure (`infra/`)

**Purpose**: Contains environment-specific Docker Compose configurations for all deployment environments.

#### Development (`infra/dev/`)

**Purpose**: Local development environment for developers.

**Contents**:
- **docker-compose.yml** - Development environment configuration
  - Services: Backend, Frontend, PostgreSQL database
  - Ports: Dev-specific host ports (`<DEV_FE_HOST_PORT>`, `<DEV_BE_HOST_PORT>`, `<DEV_DB_HOST_PORT>`)
  - Database: `<DEV_DB_NAME>` (separate from staging/prod)
  - Network: `dev-network` bridge network
  - Volumes: `dev-db-data` for database persistence

**Key Information**:
- NOT part of CI/CD pipeline - manual startup only
- Developers run: `docker compose -f infra/dev/docker-compose.yml up -d`
- Dev-friendly configuration with relaxed resource constraints
- Responsible: Maksym (creates and explains dev environment)

#### Staging (`infra/staging/`)

**Purpose**: Production-like testing environment where CI-built images are deployed first.

**Contents**:
- **docker-compose.yml** - Staging environment configuration
  - Services: Backend, Frontend, PostgreSQL database
  - Ports: Staging-specific host ports (`<STAGE_FE_HOST_PORT>`, `<STAGE_BE_HOST_PORT>`, `<STAGE_DB_HOST_PORT>`)
  - Database: `e4l_staging` (separate from production)
  - Network: `staging-network` bridge network
  - Volumes: `staging-db-data` for database persistence
  - Images: Uses `${BACKEND_IMAGE}` and `${FRONTEND_IMAGE}` variables set by CI

**Key Information**:
- Deployed automatically by CI after unit tests pass
- Uses exact images built in CI (tagged with commit SHA)
- Integration tests run against staging endpoints
- If staging integration tests pass, same images promoted to production
- Responsible: Jabin + Michal (glue work)

#### Production (`infra/prod/`)

**Purpose**: Live production environment serving real users.

**Contents**:
- **docker-compose.yml** - Production environment configuration
  - Services: Backend, Frontend, PostgreSQL database
  - Ports: Production-specific host ports (`<PROD_FE_HOST_PORT>`, `<PROD_BE_HOST_PORT>`, `<PROD_DB_HOST_PORT>`)
  - Database: `e4l_prod` (separate from staging)
  - Network: `prod-network` bridge network
  - Volumes: `prod-db-data` for database persistence
  - Images: Uses same `${BACKEND_IMAGE}` and `${FRONTEND_IMAGE}` that passed staging
  - Restart policy: `unless-stopped` for high availability

**Key Information**:
- Deployed ONLY if staging deployment succeeds AND staging integration tests pass
- Uses exact same images as staging (no rebuild)
- Automatically replaces old containers with new ones
- Includes restart policies for reliability
- Responsible: Michal (ensures safe promotion from staging)

---

### CI/CD Scripts (`ci/`)

**Purpose**: Contains deployment and testing shell scripts executed by the GitLab CI pipeline.

**Contents**:

- **deploy_staging.sh** - Deploys to staging environment
  - Stops existing staging containers
  - Sets image variables (`BACKEND_IMAGE`, `FRONTEND_IMAGE`) using commit SHA
  - Navigates to `infra/staging/` and runs `docker compose up -d`
  - Waits for services to stabilize (10 seconds)
  - Responsible: Michal

- **test_staging.sh** - Integration/system tests for staging
  - Tests backend health endpoint: `curl -f http://localhost:<STAGE_BE_HOST_PORT>/health`
  - Tests frontend availability: `curl -f http://localhost:<STAGE_FE_HOST_PORT>/`
  - Optional: Tests database connectivity through backend
  - Fails pipeline if any test fails
  - Responsible: Michal

- **deploy_prod.sh** - Deploys to production
  - Uses same image tags as staging (from `${CI_COMMIT_SHA}`)
  - Navigates to `infra/prod/` and runs `docker compose up -d`
  - Waits for new containers to stabilize (15 seconds)
  - Verifies production backend and frontend are responding
  - Includes basic rollback on failure (stops containers)
  - Responsible: Michal

- **README.md** - Documentation explaining:
  - What each script does
  - How to use them (they're called by CI automatically)
  - Environment variables they expect

---

### GitLab CI Definitions (`.ci/`)

**Purpose**: Modular CI/CD job definitions included by the root `.gitlab-ci.yml`.

**Contents**:

- **backend.yml** - Backend build and Docker image creation
  - Jobs:
    - `backend_build`: Compiles backend code
    - `backend_unit_test`: Runs unit tests (e.g., `./gradlew test`)
    - `backend_image`: Builds and pushes Docker image to registry
  - Responsible: Jabin

- **frontend.yml** - Frontend build and Docker image creation
  - Jobs:
    - `frontend_build`: Installs dependencies and builds frontend
    - `frontend_unit_test`: Runs unit tests (e.g., Jest)
    - `frontend_image`: Builds and pushes Docker image to registry
  - Responsible: Maksym

- **deploy.yml** - Deployment and testing orchestration
  - Jobs:
    - `deploy_staging`: Calls `ci/deploy_staging.sh`
    - `test_staging`: Calls `ci/test_staging.sh` (runs integration tests)
    - `deploy_prod`: Calls `ci/deploy_prod.sh` (manual approval required)
  - Pipeline rules: Staging deploys automatically; production requires manual trigger
  - Responsible: Michal

---

### Ansible Provisioning (`ansible/`)

**Purpose**: Contains Ansible playbooks to automatically provision the VM with all required tools.

**Contents**:

- **playbook.yml** - Main Ansible playbook that:
  - Updates system packages
  - Installs Docker and Docker Compose
  - Installs PostgreSQL database engine
  - Installs GitLab CE (Community Edition)
  - Installs GitLab Runner for CI/CD
  - Configures services to start on boot
  - Adds vagrant user to docker group (for Docker access without sudo)
  - Displays completion message with GitLab access instructions

- **roles/** - Directory for future Ansible roles (currently empty)
  - Can be used to modularize provisioning (e.g., `roles/docker/`, `roles/gitlab/`)

**Key Information**:
- Runs automatically when `vagrant up` is executed
- Uses ansible_local provisioner (Ansible runs inside the VM)
- Responsible: Michal

---

### Root Configuration Files

#### `.gitlab-ci.yml`

**Purpose**: Root GitLab CI/CD pipeline orchestration file.

**Contents**:
- Defines pipeline stages:
  - `build` - Backend and frontend compilation, Docker image creation
  - `unit_test` - Backend and frontend unit tests
  - `deploy_staging` - Deploy to staging environment
  - `integration_test` - Run integration tests on staging
  - `deploy_prod` - Deploy to production
- Includes modular CI definitions: `.ci/backend.yml`, `.ci/frontend.yml`, `.ci/deploy.yml`
- Default pipeline rules: Runs for main, develop branches and MRs
- Default retry policy: Retries failed jobs on system failures

**Key Information**:
- Single source of truth for entire CI/CD pipeline
- Stages ensure proper execution order and dependencies
- Failures block progression to next stage
- Responsible: Michal (orchestration)

#### `Vagrantfile`

**Purpose**: Defines the development VM configuration.

**Contents**:
- **Box**: `ubuntu/jammy64` (Ubuntu 22.04 LTS)
- **Resources**:
  - Memory: 6GB (6144 MB)
  - CPUs: 4 cores
  - Video memory: 128MB
- **Network**:
  - Private network: 192.168.56.10
  - Port forwarding: GitLab (8080 → 80), SSH, dev ports (3000, 8000, 5432)
- **Provisioning**: Runs `ansible/playbook.yml` via ansible_local
- **VirtualBox optimizations**:
  - Nested virtualization enabled (for Docker)
  - DNS proxy enabled
  - I/O APIC enabled for multi-core support

**Key Information**:
- Responsible: Michal (VM and infrastructure setup)
- Run `vagrant up` to create and provision the VM
- Run `vagrant ssh` to access the VM

#### `project_overview.md`

**Purpose**: High-level project documentation with team responsibilities and architecture decisions.

**Contents**:
- Team roles and responsibilities
- Big picture architecture overview
- Repository structure rules (must be followed)
- Port and endpoint configuration guidelines
- Detailed responsibilities for each team member
- Pipeline responsibilities and execution flow
- Minimal working definition ("Done" criteria)

**Key Information**:
- Reference document for understanding the project
- Contains all architectural decisions and rationale

#### `README.md`

**Purpose**: Quick start guide and project overview for developers.

**Contents**:
- Team member list
- Quick start instructions (vagrant up, GitLab access)
- Architecture overview
- Development workflow
- Project structure summary
- Port configuration placeholders
- Troubleshooting guide

**Key Information**:
- First document new team members should read
- Contains troubleshooting tips for common issues
- Links to detailed documentation

#### `project_structure.md`

**Purpose**: Detailed documentation of the complete project structure (this file).

**Contents**:
- Complete directory tree
- Purpose and contents of each directory
- File descriptions and responsibilities
- Key information and guidelines

---

## File Naming & Location Reference

| Purpose | Location | Owner |
|---------|----------|-------|
| Backend code & Docker build | `backend/` | Jabin |
| Frontend code & Docker build | `frontend/` | Maksym |
| Dev environment compose | `infra/dev/docker-compose.yml` | Maksym |
| Staging environment compose | `infra/staging/docker-compose.yml` | Jabin + Michal |
| Production environment compose | `infra/prod/docker-compose.yml` | Michal |
| Deployment scripts | `ci/*.sh` | Michal |
| Backend CI jobs | `.ci/backend.yml` | Jabin |
| Frontend CI jobs | `.ci/frontend.yml` | Maksym |
| Deployment CI jobs | `.ci/deploy.yml` | Michal |
| Pipeline orchestration | `.gitlab-ci.yml` | Michal |
| VM provisioning | `ansible/playbook.yml` | Michal |
| VM definition | `Vagrantfile` | Michal |

---

## Key Principles

1. **One Repository, One Pipeline**
   - Single GitLab project and repository
   - All code and configurations in one place

2. **Docker Images Move Forward, Containers Do Not**
   - Same Docker images built in CI are promoted through staging to production
   - No rebuilding in production
   - Containers are created fresh from images at each deployment

3. **Environment Separation**
   - Dev: Manual, developer-friendly
   - Staging: Production-like, automated
   - Production: Live, protected

4. **Automated Gating**
   - Unit tests must pass to build images
   - Images must pass staging to go to production
   - Production only reached through successful staging

5. **Clear Ownership**
   - Each team member owns their component
   - If a job fails due to your component, you fix it

---

## Getting Started

1. **Review** `project_overview.md` for architecture and responsibilities
2. **Review** `README.md` for quick start instructions
3. **Run** `vagrant up` to create and provision the VM
4. **Access** GitLab at http://localhost:8080
5. **Create** your GitLab project and push this code
6. **Configure** dev environment placeholders (ports, database names)
7. **Start** implementing backend, frontend, and tests

---

## Configuration Placeholders to Fill In

Throughout the compose files and scripts, you'll find placeholders like:

- `<DEV_FE_HOST_PORT>` - Dev frontend host port
- `<DEV_BE_HOST_PORT>` - Dev backend host port
- `<DEV_DB_HOST_PORT>` - Dev database host port
- `<DEV_DB_NAME>` - Dev database name
- `<STAGE_FE_HOST_PORT>` - Staging frontend host port
- `<STAGE_BE_HOST_PORT>` - Staging backend host port
- `<STAGE_DB_HOST_PORT>` - Staging database host port
- `<PROD_FE_HOST_PORT>` - Production frontend host port
- `<PROD_BE_HOST_PORT>` - Production backend host port
- `<PROD_DB_HOST_PORT>` - Production database host port
- `<BE_CONTAINER_PORT>` - Backend container port (internal)
- `<FE_CONTAINER_PORT>` - Frontend container port (internal)
- `<DB_CONTAINER_PORT>` - Database container port (internal, typically 5432)

**Before running the system, replace these placeholders with actual port numbers.**

For example:
```bash
# Replace all placeholders
sed -i 's/<DEV_FE_HOST_PORT>/3000/g' infra/dev/docker-compose.yml
sed -i 's/<DEV_BE_HOST_PORT>/8000/g' infra/dev/docker-compose.yml
# ... and so on
```

Or use your editor's find and replace feature.
