================================================================================
E4L PLATFORM - CI/CD DEPLOYMENT PIPELINE
README AND SETUP GUIDE
================================================================================

PROJECT OVERVIEW
--------------------------------------------------------------------------------

This project implements a complete CI/CD deployment pipeline for the E4L 
(Energy for Life) platform, a web-based application consisting of:

- Backend: Spring Boot 2.4.2 (Java 21) REST API with JPA/Hibernate
- Frontend: React single-page application built with Webpack
- Database: MariaDB 10.11 for persistent data storage

The pipeline automates building, testing, containerization, and deployment 
across staging and production environments using industry-standard DevOps tools.


TECHNOLOGIES USED
--------------------------------------------------------------------------------

Infrastructure & Orchestration:
- Vagrant 2.x - VM provisioning and lifecycle management
- Ansible 2.x - Automated VM configuration
- VirtualBox - Hypervisor for VM hosting

CI/CD & Version Control:
- GitLab CE (self-hosted) - Git repository and CI/CD orchestration
- GitLab Runner - CI/CD job execution engine (Docker executor)

Containerization & Deployment:
- Docker 24.x - Container runtime
- Docker Compose 3.8 - Multi-container orchestration
- Docker Registry (GitLab integrated) - Private image storage

Application Stack:
- Java 21 + Gradle 8.5 - Backend build system
- Node.js 18 + npm - Frontend build system
- nginx 1.28 - Frontend web server
- MariaDB 10.11 - Production database


SYSTEM REQUIREMENTS
--------------------------------------------------------------------------------

Host Machine:
- Windows 10/11 (or macOS/Linux with adjustments)
- VirtualBox 6.x or newer
- Vagrant 2.x or newer
- Minimum 8GB RAM (16GB recommended)
- 20GB free disk space
- Git for Windows (or equivalent)

Network:
- Host-only network adapter configured in VirtualBox
- IP range: 192.168.56.0/24
- VM assigned static IP: 192.168.56.10


INITIAL SETUP - STEP BY STEP
--------------------------------------------------------------------------------

STEP 1: Prepare the Environment
--------------------------------

1. Ensure VirtualBox and Vagrant are installed on your host machine
2. Extract the project deliverable .zip file to a working directory
3. Open PowerShell (or terminal) and navigate to the project root directory


STEP 2: Start the Virtual Machine
----------------------------------

1. From the project root directory, run:
   
   vagrant up

2. This will:
   - Download Ubuntu 22.04 base box (if not cached)
   - Create VM with 4GB RAM, 2 CPUs
   - Configure networking (192.168.56.10)
   - Provision VM using Ansible playbook

3. Provisioning installs:
   - Docker and Docker Compose
   - GitLab Community Edition
   - GitLab Runner
   - PostgreSQL (for GitLab metadata)
   - Python and other dependencies

4. Wait for completion
   - GitLab initialization takes up to ~10 minutes after VM boots
   - Watch for "VM Provisioning Complete!" message


STEP 3: Access GitLab
----------------------

1. Open a web browser and navigate to:
   
   http://localhost:8080

   OR

   http://192.168.56.10

2. If GitLab shows 502 error, wait 2-3 more minutes for services to start

3. Retrieve the initial root password:
   
   vagrant ssh
   sudo cat /etc/gitlab/initial_root_password
   exit

   IMPORTANT: This password expires after 24 hours. Change it immediately via the GitLab user settings.

4. Log in with:
   - Username: root
   - Password: (from the file above)

5. Change the password when prompted


STEP 4: Create GitLab Project
------------------------------

1. After logging into GitLab, click "Projects" in the left sidebar
2. Click "New project"
3. Select "Create blank project"
4. Configure the project:
   - Project name: E4L
   - Project URL namespace: root
   - Visibility: Private
   - UNCHECK "Initialize repository with a README"
5. Click "Create project"


STEP 5: Push Project Code to GitLab
------------------------------------

1. On your host machine, open a terminal in the project root directory

2. Add GitLab as a remote repository:
   
   git remote add gitlab http://localhost:8080/root/e4l.git

3. Push all branches to GitLab:
   
   git push gitlab main
   git push gitlab production-deploy

   (Use branches that exist in your repository)

4. When prompted for credentials:
   - Username: root
   - Password: (your GitLab password)

5. Verify the push succeeded by refreshing the GitLab project page


STEP 6: Register GitLab Runner
-------------------------------

1. In GitLab web UI, click the wrench icon (Admin Area) in top-right corner

2. Navigate to: CI/CD → Runners

3. Click "New instance runner"

4. Configure the runner:
   - Operating systems: Linux
   - Check "Run untagged jobs"
   - Click "Create runner"

5. Copy the registration command shown in Step 1 (starts with gitlab-runner register)

6. SSH into the VM:
   
   vagrant ssh

7. Paste and run the registration command

8. Answer the prompts:
   - GitLab instance URL: Press Enter (accepts default http://192.168.56.10)
   - Runner name: test_docker_runner (or any name)
   - Executor: docker
   - Default Docker image: alpine:latest

9. Configure the runner for privileged mode:
   
   sudo nano /etc/gitlab-runner/config.toml

10. Find the line containing:
    
    privileged = false

11. Change it to:
    
    privileged = true

12. Save the file (Ctrl+O, Enter, Ctrl+X)

13. Restart the runner:
    
    sudo gitlab-runner restart

14. Exit the VM:
    
    exit

15. Verify runner status in GitLab: Admin Area → CI/CD → Runners
    - Runner should show as "Online" with a green indicator


STEP 7: Trigger the Pipeline
-----------------------------

1. Make a trivial change to any file (or use an empty commit):
   
   git commit --allow-empty -m "Trigger pipeline"
   git push gitlab main

2. In GitLab, navigate to: Build → Pipelines

3. You should see a new pipeline running with stages:
   - build
   - unit_test
   - image
   - deploy_staging
   - integration_test
   - deploy_prod (manual)

4. Click on the pipeline to view detailed job status


PIPELINE ARCHITECTURE
--------------------------------------------------------------------------------

Pipeline Stages (in order):
----------------------------

1. BUILD
   - Compiles backend using Gradle (creates JAR)
   - Builds frontend using npm + Webpack (creates static assets)
   - Artifacts: build outputs stored for 1 hour

2. UNIT_TEST
   - Runs backend JUnit tests
   - Runs frontend Jest unit tests
   - Reports: JUnit XML stored as artifacts

3. IMAGE
   - Builds Docker images for backend and frontend
   - Tags with commit SHA and 'latest'
   - Pushes to GitLab Container Registry (192.168.56.10:5050)

4. DEPLOY_STAGING
   - Automatically deploys to staging environment
   - Pulls images from registry
   - Starts containers via Docker Compose
   - Staging endpoints:
     * Frontend: http://192.168.56.10:3001
     * Backend:  http://192.168.56.10:8081
     * Database: 192.168.56.10:3307

5. INTEGRATION_TEST
   - Runs backend integration tests against staging
   - Runs frontend E2E tests against staging
   - Validates full stack functionality

6. DEPLOY_PROD (MANUAL APPROVAL REQUIRED)
   - Only accessible via GitLab UI "Play" button
   - Intended to deploy to production environment
   - Production endpoints:
     * Frontend: http://192.168.56.10:9002
     * Backend:  http://192.168.56.10:9082
     * Database: 192.168.56.10:9308


ENVIRONMENT DETAILS
--------------------------------------------------------------------------------

Staging Environment:
--------------------
- Purpose: Pre-production testing and integration validation
- Deployment: Automated after successful image builds
- Location: infra/staging/docker-compose.yml
- Database: e4l_staging (isolated from production)
- Port Mapping:
  * Frontend: Host 3001 → Container 80
  * Backend:  Host 8081 → Container 8080
  * MariaDB:  Host 3307 → Container 3306

Production Environment:
-----------------------
- Purpose: Live deployment (simulated in this project)
- Deployment: Manual script execution (see IMPORTANT NOTE below)
- Location: infra/prod/docker-compose.yml
- Database: e4l_prod (persistent volume: prod-db-data)
- Port Mapping:
  * Frontend: Host 9002 → Container 80
  * Backend:  Host 9082 → Container 8080
  * MariaDB:  Host 9308 → Container 3306

IMPORTANT NOTE ON PRODUCTION DEPLOYMENT:
-----------------------------------------
Due to Docker-in-Docker limitations in the CI pipeline, the deploy_prod job
successfully validates deployment but does NOT persist containers on the VM host.

To actually deploy production after the pipeline completes:

Method 1 - Using the provided script (RECOMMENDED):
   
   vagrant ssh -c "bash /vagrant/start_production.sh"

Method 2 - Manual command:
   
   vagrant ssh
   cd /vagrant/infra/prod
   export BACKEND_IMAGE=192.168.56.10:5050/root/e4l/e4l-backend:latest
   export FRONTEND_IMAGE=192.168.56.10:5050/root/e4l/e4l-frontend:latest
   docker compose up -d
   exit

After deployment, verify services:
   
   vagrant ssh -c "cd /vagrant/infra/prod && docker compose ps"


TROUBLESHOOTING
--------------------------------------------------------------------------------

Pipeline Fails with "Runner not found":
- Ensure runner is registered and online in GitLab Admin → CI/CD → Runners
- Check runner status: vagrant ssh -c "sudo gitlab-runner status"

Pipeline Fails on Image Build with Registry Errors:
- Verify insecure registry configuration in VM
- Check: vagrant ssh -c "cat /etc/docker/daemon.json"
- Should contain: "insecure-registries": ["192.168.56.10:5050"]

GitLab Shows 502 Bad Gateway:
- GitLab is still starting up, wait 2-3 minutes
- Check status: vagrant ssh -c "sudo gitlab-ctl status"

Cannot Access Staging/Production Endpoints:
- Verify containers are running: vagrant ssh -c "docker ps"
- Check port forwarding in Vagrantfile (should forward 3001, 8081, 9002, 9082)

VM Fails to Start:
- Ensure VirtualBox is running
- Check available system resources (RAM, disk)
- Try: vagrant destroy -f && vagrant up


MAINTENANCE COMMANDS
--------------------------------------------------------------------------------

View Pipeline Logs:
- GitLab UI: Build → Pipelines → Click pipeline → Click job → View log

View Container Logs:
   vagrant ssh
   cd /vagrant/infra/staging  # or /vagrant/infra/prod
   docker compose logs backend
   docker compose logs frontend
   docker compose logs db
   exit

Stop Staging Environment:
   vagrant ssh -c "cd /vagrant/infra/staging && docker compose down"

Stop Production Environment:
   vagrant ssh -c "cd /vagrant/infra/prod && docker compose down"

Restart VM:
   vagrant reload

Stop VM (preserves data):
   vagrant halt

Destroy VM (deletes all data):
   vagrant destroy -f

SSH into VM:
   vagrant ssh


FILE STRUCTURE OVERVIEW
--------------------------------------------------------------------------------

DevOpsProject/
├── .ci/                          # CI/CD job definitions
│   ├── backend.yml              # Backend build, test, image jobs
│   ├── frontend.yml             # Frontend build, test, image jobs
│   └── deploy.yml               # Staging and production deployment
├── .gitlab-ci.yml               # Main pipeline orchestration
├── ansible/
│   └── playbook.yml             # VM provisioning automation
├── backend/
│   ├── backend_code/            # Spring Boot source code
│   │   ├── src/                 # Java application code
│   │   └── build.gradle         # Gradle build configuration
│   └── Dockerfile               # Backend container image definition
├── frontend/
│   ├── frontend_code/           # React source code
│   │   ├── src/                 # JavaScript application code
│   │   ├── __tests__/           # Jest unit and integration tests
│   │   └── package.json         # npm dependencies
│   └── Dockerfile               # Frontend container image definition
├── infra/
│   ├── staging/
│   │   └── docker-compose.yml   # Staging environment definition
│   └── prod/
│       └── docker-compose.yml   # Production environment definition
├── Vagrantfile                  # VM configuration
├── start_production.sh          # Manual production deployment script
└── README.md                    # Project documentation


ASSUMPTIONS AND LIMITATIONS
--------------------------------------------------------------------------------

1. This is a development/demonstration environment, NOT production-grade
2. Secrets (database passwords, JWT keys) are hardcoded for simplicity
3. HTTP used instead of HTTPS (no SSL certificates)
4. Container registry is insecure (no authentication beyond GitLab tokens)
5. Database data persists in Docker volumes but is not backed up
6. No load balancing, redundancy, or high availability
7. Single VM hosts all services (GitLab, Runner, Registry, Deployments)
8. Production deployment requires manual script execution
9. Integration tests depend on staging environment being accessible
10. No monitoring, alerting, or log aggregation implemented


NEXT STEPS AFTER SETUP
--------------------------------------------------------------------------------

1. Verify the entire pipeline runs successfully on a test commit
2. Check that staging environment is accessible and functional
3. Run the production deployment script to validate production setup
4. Test application functionality in both staging and production
5. Review pipeline logs for any warnings or optimization opportunities


SUPPORT AND REFERENCES
--------------------------------------------------------------------------------

GitLab CI/CD Documentation:
   https://docs.gitlab.com/ee/ci/

Docker Compose Reference:
   https://docs.docker.com/compose/

Vagrant Documentation:
   https://www.vagrantup.com/docs

================================================================================
END OF README
================================================================================
