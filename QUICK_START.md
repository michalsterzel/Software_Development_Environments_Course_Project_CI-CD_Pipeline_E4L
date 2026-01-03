# Frontend Integration - Quick Start Guide

**Last Updated:** January 2026  
**Status:** ✅ Ready for Production  

---

## TL;DR - What Changed?

Frontend is now fully integrated into the CI/CD pipeline:

1. ✅ **Frontend code** is in `frontend/frontend_code/` directory
2. ✅ **Docker image** is built and pushed to registry automatically
3. ✅ **Automatic staging deployment** after successful builds
4. ✅ **Manual production deployment** with approval gate
5. ✅ **Complete documentation** in three detailed files

---

## For Different Roles

### Frontend Developer (Maksym)

**What You Need to Know:**

Your React code changes automatically trigger the pipeline!

```bash
# 1. Make changes to React code
cd frontend/frontend_code/src/
# ... edit components ...

# 2. Update dependencies if needed
npm install <package>

# 3. Commit and push
git add .
git commit -m "Your message"
git push origin feature-branch

# 4. Pipeline runs automatically
# - Webpack builds your code
# - Jest tests run
# - Docker image created
# - Staging deployment happens
```

**If Build Fails:**
- Check webpack config: `frontend_code/webpack.config.js`
- Run locally: `npm run build`
- Check tests: `npm test`

**Reference Docs:** [frontend_integration.md](frontend_integration.md)

---

### DevOps/Infrastructure (Michal)

**Your Responsibilities:**

You own the CI/CD pipeline and deployments.

**Monitor These Jobs:**
- `.ci/frontend.yml` - Frontend jobs (don't modify logic, only yaml structure)
- `.ci/deploy.yml` - Deployment jobs (you own entirely)
- `infra/*/docker-compose.yml` - Environment configs (you own)

**Standard Operations:**

```bash
# View pipeline
GitLab → CI/CD → Pipelines

# Deploy to staging (automatic)
# Happens automatically after all tests pass

# Deploy to production (manual)
1. Go to GitLab UI
2. Find latest pipeline in CI/CD → Pipelines
3. Click "play" button on deploy_prod job
4. Confirm approval
5. Wait for deployment

# Emergency rollback
cd infra/prod
export BACKEND_IMAGE="192.168.56.10:5050/root/e4l/e4l-backend:PREVIOUS_SHA"
export FRONTEND_IMAGE="192.168.56.10:5050/root/e4l/e4l-frontend:PREVIOUS_SHA"
docker compose down && docker compose up -d
```

**Reference Docs:** [INTEGRATION_SUMMARY.md](INTEGRATION_SUMMARY.md)

---

### Backend Developer (Jabin)

**Your Coordination Points:**

1. **Frontend needs your API:** Make sure CORS allows frontend requests
2. **Data structure:** Document your REST API endpoints
3. **Authentication:** Ensure JWT tokens work with frontend
4. **Health checks:** `/health` endpoint should be accessible

**No Changes Needed:** Your backend integration remains unchanged!

**Reference Docs:** None specific to you, but frontend will call your API

---

### Project Manager / Team Lead

**Key Metrics:**

| Metric | Value | Status |
|--------|-------|--------|
| Build time | ~5-10 min | ✅ Acceptable |
| Test pass rate | Should be 100% | ⚠️ Monitor |
| Staging deployment | Automatic | ✅ Working |
| Production deployment | Manual approval | ✅ Secure |
| Rollback time | ~2 minutes | ✅ Fast |

**Approval Gate:**
- Production requires manual approval
- Look for `deploy_prod` job in pipeline
- Click "play" button to proceed
- No automatic production deployments

**Reference Docs:** [INTEGRATION_CHECKLIST.md](INTEGRATION_CHECKLIST.md)

---

## Environmental Endpoints

### Development (Your Local Machine)

```
Frontend: http://localhost:3000
Backend:  http://localhost:8080
```

### Staging (Vagrant VM)

```
Frontend: http://192.168.56.10:3001
Backend:  http://192.168.56.10:8081
Database: 192.168.56.10:3307
```

### Production (Vagrant VM)

```
Frontend: http://192.168.56.10:3002
Backend:  http://192.168.56.10:8082
Database: 192.168.56.10:3308
```

---

## Common Tasks

### Deploy to Production

1. Navigate to GitLab → CI/CD → Pipelines
2. Find the pipeline you want to deploy (usually latest)
3. Scroll to `deploy_prod` job
4. Click the blue play button ▶️
5. Click "Deploy" to confirm
6. Wait ~2 minutes for deployment
7. Access frontend at `http://192.168.56.10:3002`

### Check Deployment Status

```bash
# Option 1: GitLab UI
GitLab → CI/CD → Pipelines → [Pipeline ID] → View logs

# Option 2: SSH into Vagrant VM
vagrant ssh
docker ps  # See running containers
docker logs <container_id>  # See container logs

# Option 3: Check via curl
curl http://192.168.56.10:3001/  # Staging
curl http://192.168.56.10:3002/  # Production
```

### Rollback to Previous Version

**If production is broken:**

```bash
1. Find working commit SHA in Git history
2. Go to GitLab → Commits → Find the SHA
3. Go to that commit's pipeline
4. Run deploy_prod from that pipeline
5. Approve the rollback deployment
```

### Debug Frontend Issues

```bash
# Access container
docker ps  # Find frontend container ID
docker exec -it <container_id> sh

# Inside container
cd /usr/share/nginx/html
ls -la  # See files
cat /etc/nginx/conf.d/default.conf  # Check nginx config

# Check logs
docker logs <container_id> -f
```

---

## Pipeline Quick Reference

### What Happens When You Push Code?

```
Your Code
    ↓
Webhook to GitLab
    ↓
Pipeline Starts
    ├─ STAGE: build
    │  ├─ backend_build (Maven)
    │  └─ frontend_build (Webpack) ← Your code compiled here
    │
    ├─ STAGE: unit_test
    │  ├─ backend_unit_test
    │  └─ frontend_unit_test ← Tests run here
    │
    ├─ STAGE: image
    │  ├─ backend_image (Docker build & push)
    │  └─ frontend_image (Docker build & push) ← Image created here
    │
    ├─ STAGE: deploy_staging (Automatic)
    │  └─ Full stack deploys to staging
    │
    ├─ STAGE: integration_test
    │  └─ Tests run in staging
    │
    └─ STAGE: deploy_prod (Manual)
       └─ Requires human approval
```

**Total time:** ~15-20 minutes for all automatic stages

---

## File Structure You Need to Know

### If You're Frontend Developer:

```
frontend/
└── frontend_code/          ← YOUR CODE HERE
    ├── src/                ← React components
    ├── __tests__/          ← Your tests
    ├── package.json        ← Dependencies
    └── webpack.config.js   ← Build config
```

### If You're DevOps:

```
.ci/
├── frontend.yml            ← Frontend CI jobs
├── backend.yml             ← Backend CI jobs
└── deploy.yml              ← Deployment jobs

infra/
├── staging/
│   └── docker-compose.yml  ← Staging stack
└── prod/
    └── docker-compose.yml  ← Production stack

frontend/
└── Dockerfile              ← Frontend image definition
```

---

## Troubleshooting Quick Fixes

### Frontend Doesn't Load

**Check 1: Is the container running?**
```bash
docker ps | grep frontend
# Should show a running container
```

**Check 2: Is nginx working?**
```bash
curl http://localhost:3001/  # Or 3002 for prod
# Should return HTML
```

**Check 3: Check logs**
```bash
docker logs <container_id>
# Look for errors
```

### Frontend Can't Connect to Backend

**Check:** `BACKEND_URL` environment variable

In Docker Compose:
```yaml
environment:
  - BACKEND_URL=http://backend:8080  # ← Must be this
```

On your machine:
```bash
# Frontend should use
http://192.168.56.10:8081  # Staging
http://192.168.56.10:8082  # Production
```

### Build Fails

**Check 1: Local build works?**
```bash
cd frontend/frontend_code
npm install
npm run build
```

**Check 2: Tests pass?**
```bash
npm test
```

**Check 3: Docker build works?**
```bash
cd frontend
docker build -t test .
```

---

## Documentation Overview

### Three Main Documents:

1. **[frontend_integration.md](frontend_integration.md)**
   - Comprehensive reference guide
   - Detailed step-by-step instructions
   - Troubleshooting guide
   - Best for: Looking up specific information

2. **[INTEGRATION_SUMMARY.md](INTEGRATION_SUMMARY.md)**
   - Technical architecture overview
   - Complete file changes
   - Pipeline flow diagrams
   - Best for: Understanding the system

3. **[INTEGRATION_CHECKLIST.md](INTEGRATION_CHECKLIST.md)**
   - Verification checklist
   - Ownership matrix
   - Testing procedures
   - Best for: Verifying everything works

---

## Get Help

### For Frontend Code Issues
→ Ask **Maksym** (Frontend Team)

### For CI/CD and Deployment Issues
→ Ask **Michal** (Infrastructure & CI/CD)

### For Backend API Issues
→ Ask **Jabin** (Backend Team)

---

## Key Numbers to Remember

| Item | Value |
|------|-------|
| Frontend port (staging) | 3001 |
| Frontend port (production) | 3002 |
| Backend port (staging) | 8081 |
| Backend port (production) | 8082 |
| DB port (staging) | 3307 |
| DB port (production) | 3308 |
| Registry | 192.168.56.10:5050 |
| Node version | 18-alpine |
| Nginx version | 1.28 |
| Build time | ~10 min |

---

## Success Indicators

✅ **Pipeline is working if:**
- `frontend_build` succeeds
- `frontend_unit_test` succeeds
- `frontend_image` succeeds
- `deploy_staging` runs automatically
- Frontend loads at staging URL

✅ **Deployment is successful if:**
- Frontend accessible at endpoint
- No console errors in browser
- API calls to backend work
- Database is responsive

---

## What NOT to Do

❌ Don't modify `.ci/frontend.yml` without knowing the impact  
❌ Don't modify Dockerfile without testing  
❌ Don't manually deploy images; use the pipeline  
❌ Don't skip testing before production approval  
❌ Don't modify frontend code then commit to main (use feature branches)  

---

## Next Steps

1. ✅ Read this quick start guide (you're here!)
2. ⏭️ Bookmark the three documentation files
3. ⏭️ Run a test deployment to staging
4. ⏭️ Verify frontend loads correctly
5. ⏭️ Deploy to production when ready

---

**Questions?** Refer to the full documentation or ask the team owner for your component.

**Status:** ✅ Ready to Use  
**Verified:** January 2026  
**Maintained By:** Michal (Infrastructure & CI/CD)
