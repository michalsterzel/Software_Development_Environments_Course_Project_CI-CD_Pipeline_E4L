# DevOps Project - E4L CI/CD Pipeline

Complete CI/CD pipeline with GitLab, Docker, and automated deployments across Dev, Staging, and Production environments.

## Team Members

- **Michal** - Infrastructure, CI/CD, Orchestration
- **Jabin** - Backend, Database, Staging
- **Maksym** - Frontend, Dev Environment

## Quick Start

### 1. Start the VM

```bash
vagrant up
```

This will:
- Create Ubuntu 22.04 VM with 6GB RAM and 4 cores
- Install Docker, Docker Compose, GitLab CE, GitLab Runner, and PostgreSQL
- Provision the VM using Ansible

### 2. Access GitLab

```bash
# SSH into the VM
vagrant ssh

# Get the initial root password
sudo cat /etc/gitlab/initial_root_password
```

Access GitLab at: http://localhost:8080 (or the VM's IP)

### 3. Create GitLab Project

1. Login to GitLab with username `root` and the password from step 2
2. Create a new project
3. Push this repository to GitLab

### 4. Register GitLab Runner

```bash
# Inside the VM
sudo gitlab-runner register
```

Follow the prompts using your project's CI/CD settings.

## Architecture Overview

### Environments

- **Dev** - Manual, developer-friendly, separate ports and DB
- **Staging** - Automated deployment from CI, integration tests, `e4l_staging` DB
- **Production** - Deployed only after staging passes, `e4l_prod` DB

### CI/CD Flow

1. Developer pushes commit
2. Backend + Frontend unit tests run in parallel
3. Docker images built and tagged with commit SHA
4. Images deployed to Staging
5. Integration tests run against Staging
6. If tests pass, same images deployed to Production

### Key Principle

> Docker images move forward, containers do not.

## Project Structure

```
├── backend/              # Backend code + Dockerfile (Jabin)
├── frontend/             # Frontend code + Dockerfile (Maksym)
├── infra/
│   ├── dev/             # Dev docker-compose.yml
│   ├── staging/         # Staging docker-compose.yml
│   └── prod/            # Production docker-compose.yml
├── ci/                  # Deployment scripts (Michal)
├── .ci/                 # GitLab CI job definitions
├── vagrant/             # Vagrantfile
├── ansible/             # Provisioning playbooks
└── .gitlab-ci.yml       # Pipeline orchestration
```

## Development Workflow

### Running Dev Environment

```bash
docker compose -f infra/dev/docker-compose.yml up -d
```

### Working on Features

1. Create feature branch
2. Make changes to backend or frontend
3. Push to GitLab
4. CI/CD pipeline runs automatically
5. Review results in GitLab CI/CD

## Port Configuration

Ports are defined as placeholders in the compose files. Update them based on your needs:

- Dev: `<DEV_FE_HOST_PORT>`, `<DEV_BE_HOST_PORT>`, `<DEV_DB_HOST_PORT>`
- Staging: `<STAGE_FE_HOST_PORT>`, `<STAGE_BE_HOST_PORT>`, `<STAGE_DB_HOST_PORT>`
- Production: `<PROD_FE_HOST_PORT>`, `<PROD_BE_HOST_PORT>`, `<PROD_DB_HOST_PORT>`

## Additional Documentation

See [project_overview.md](project_overview.md) for detailed responsibilities and architecture decisions.

## Troubleshooting

### GitLab not accessible
- Check VM is running: `vagrant status`
- Verify GitLab service: `vagrant ssh` then `sudo gitlab-ctl status`

### Docker issues
- Verify Docker is running: `vagrant ssh` then `sudo systemctl status docker`
- Check Docker Compose version: `docker-compose --version`

### Pipeline failures
- Check GitLab Runner is registered and active
- Review job logs in GitLab CI/CD interface
- Verify Docker images are being built correctly
