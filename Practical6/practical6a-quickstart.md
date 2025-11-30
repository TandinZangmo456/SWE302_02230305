# Practical 6a: Learning Report on GitHub-based Deployment Automation

## Overview
This practical extended Practical 6 by introducing automated deployment from GitHub to S3, teaching me about continuous deployment workflows, version control integration, and deployment automation. I learned to connect Git repositories with infrastructure, enabling automatic deployment when code changes—a fundamental DevOps practice that bridges development and operations.

## Key Concepts Learned

### 1. Git as Deployment Source: Beyond Version Control

This practical showed me Git's role extends beyond code management:

**Traditional Deployment**:
```bash
# Manual steps every time
npm run build
awslocal s3 sync out/ s3://my-bucket/
```

**Git-Based Deployment**:
```bash
# Push to GitHub
git push origin main

# Automated deployment
./scripts/deploy-from-github.sh
# Clones repo → Builds → Deploys
```

**Key Insight**: Git becomes the single source of truth. What's in the repository is what's deployed. No local build artifacts, no "it works on my machine."

### 2. Deployment Pipeline Automation

I learned the anatomy of an automated deployment:

**Pipeline Stages**:
```bash
1. Clone repository from GitHub
   ↓
2. Install dependencies (npm ci)
   ↓
3. Build application (npm run build)
   ↓
4. Deploy to S3 (s3 sync)
   ↓
5. Verify deployment
   ↓
6. Log deployment details
```

**Script Implementation**:
```bash
#!/bin/bash
# Clone repo
git clone https://github.com/$GITHUB_REPO ./temp-build

# Install dependencies
cd temp-build
npm ci

# Build
npm run build

# Deploy
awslocal s3 sync out/ s3://$BUCKET_NAME/ --delete

# Cleanup
cd ..
rm -rf temp-build
```

**Benefits Learned**:
- **Reproducibility**: Same process every time
- **Traceability**: Git commit = deployed version
- **Rollback**: Can redeploy any previous commit
- **Collaboration**: Team members deploy same way

**Key Learning**: Automation eliminates human error and ensures consistent deployments.

### 3. Environment Variables for Configuration

Managing deployment configuration without hardcoding:

**Problem with Hardcoding**:
```bash
# Bad: Hardcoded in script
GITHUB_REPO="myusername/myrepo"
BUCKET_NAME="my-specific-bucket"
```

**Solution with Environment Variables**:
```bash
# Flexible configuration
export GITHUB_REPO="YOUR_USERNAME/practical6-nextjs-app"
export BUCKET_NAME="practical6-deployment-dev"

# Script reads these
./scripts/deploy-from-github.sh
```

**Benefits**:
- Different repos/buckets per environment
- No code changes for different users
- Secrets kept out of version control
- Easy CI/CD integration

**Makefile Integration**:
```makefile
deploy-github:
	GITHUB_REPO=${GITHUB_REPO} ./scripts/deploy-from-github.sh
```

**Key Insight**: Configuration belongs outside code—environment variables enable flexible, secure deployments.

### 4. Git Remote URLs and Authentication

Understanding how Git connects to GitHub:

**HTTPS vs SSH**:
```bash
# HTTPS (with token)
git remote add origin https://USER:TOKEN@github.com/USER/repo.git

# SSH (with key pair)
git remote add origin git@github.com:USER/repo.git
```

**When Each is Used**:
- **HTTPS**: CI/CD systems, tokens for automation
- **SSH**: Developer machines, key-based auth

**Personal Access Tokens**:
- Created in GitHub Settings → Developer settings → Personal access tokens
- Used instead of password for HTTPS
- Can be scoped (limited permissions)
- Can be revoked without changing password

**Key Learning**: Automated deployments need non-interactive authentication—tokens or SSH keys, never passwords.

### 5. Deployment Verification and Health Checks

Learning to verify deployments succeeded:

**Basic Verification**:
```bash
# Check files deployed
awslocal s3 ls s3://my-bucket/ --recursive

# Test website endpoint
curl http://my-bucket.s3-website.localhost.localstack.cloud:4566

# Verify HTML content
curl -I http://... | grep "HTTP/1.1 200"
```

**Comprehensive Health Check**:
```bash
# 1. Verify index.html exists
awslocal s3 ls s3://$BUCKET/index.html

# 2. Check file count (should match build output)
FILE_COUNT=$(awslocal s3 ls s3://$BUCKET --recursive | wc -l)

# 3. Test actual HTTP response
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $WEBSITE_URL)
if [ "$RESPONSE" -eq "200" ]; then
    echo "✓ Website accessible"
else
    echo "✗ Website returned $RESPONSE"
fi
```

**Why Verification Matters**:
- Build might succeed but deployment fail
- Files might upload but website misconfigured
- Automated checks catch issues immediately

**Key Learning**: Always verify deployments—"it worked last time" isn't enough.

### 6. Deployment Logging and Audit Trail

Tracking deployments over time:

**Log Structure**:
```
deployments.log:
2024-11-25 10:30:45 | abc1234 | "Update homepage" | SUCCESS
2024-11-25 11:15:22 | def5678 | "Add contact page" | SUCCESS
2024-11-25 14:20:10 | ghi9012 | "Fix styling" | FAILED
```

**What Gets Logged**:
- Timestamp
- Git commit hash
- Commit message
- Deployment status
- Deployer (optional)

**Value of Logs**:
- Debugging: "When did this break?"
- Audit: "Who deployed what when?"
- Rollback: "Which commit should I restore?"
- Compliance: Required for SOC 2, ISO 27001

**Implementation**:
```bash
echo "$(date '+%Y-%m-%d %H:%M:%S') | $COMMIT | $MESSAGE | SUCCESS" >> deployments.log
```

**Key Learning**: Logs are the historical record. Without them, troubleshooting is guesswork.

### 7. Rollback Capability: Time Travel for Deployments

Learning to undo deployments:

**Rollback Process**:
```bash
# Deploy current commit (abc1234)
./scripts/deploy-from-github.sh

# Something breaks!

# Rollback to previous commit (def5678)
make rollback COMMIT=def5678
```

**How Rollback Works**:
```bash
# 1. Clone repo
git clone $REPO ./rollback-temp

# 2. Checkout specific commit
cd rollback-temp
git checkout $COMMIT

# 3. Build and deploy that version
npm ci && npm run build
awslocal s3 sync out/ s3://$BUCKET/ --delete

# 4. Log the rollback
echo "ROLLBACK to $COMMIT" >> deployments.log
```

**When Rollback is Critical**:
- Production bug discovered
- Failed deployment
- Performance regression
- Security issue introduced

**Rollback Limitations**:
- Only works for application code
- Database migrations can't be easily rolled back
- External API changes persist

**Key Learning**: Git history enables time travel. Any commit can become "production" again.

### 8. Watch Mode: Continuous Deployment Simulation

Understanding automated deployment triggers:

**Watch Mode Concept**:
```bash
# Continuously monitor for changes
make watch

# Behind the scenes:
while true; do
    git fetch origin
    LOCAL=$(git rev-parse HEAD)
    REMOTE=$(git rev-parse origin/main)
    
    if [ "$LOCAL" != "$REMOTE" ]; then
        echo "Changes detected, deploying..."
        ./scripts/deploy-from-github.sh
    fi
    
    sleep 30  # Check every 30 seconds
done
```

**What This Simulates**:
- GitHub Actions workflow
- Jenkins polling
- GitLab CI/CD pipelines

**Production Watch Systems**:
- **Webhooks**: GitHub notifies system instantly
- **Polling**: System checks periodically (slower)
- **Manual Trigger**: Deploy button in CI/CD UI

**Key Insight**: Watch mode teaches the concept, but production uses webhooks for instant deployment.

### 9. Clean Builds vs Incremental Builds

Understanding build reproducibility:

**Incremental Build** (npm install):
```bash
npm install  # Updates package-lock.json, installs new versions
```
- Faster
- Might get different versions
- "Works on my machine" syndrome

**Clean Build** (npm ci):
```bash
npm ci  # Clean install from package-lock.json
```
- Slower
- Exact same versions every time
- Reproducible builds

**Why `npm ci` in Automation**:
```bash
# Developer machine (fast iteration)
npm install

# CI/CD deployment (reproducibility)
npm ci
```

**Key Learning**: Production deployments need reproducibility. `npm ci` ensures the same dependencies every build.

### 10. The `--delete` Flag in S3 Sync

Understanding complete synchronization:

**Without `--delete`**:
```bash
awslocal s3 sync out/ s3://bucket/
# Uploads new files
# Updates changed files
# Leaves old files (orphans accumulate)
```

**With `--delete`**:
```bash
awslocal s3 sync out/ s3://bucket/ --delete
# Uploads new files
# Updates changed files
# Removes files not in source
```

**Example Problem Without `--delete`**:
```
Deploy 1: about.html uploaded
Deploy 2: Renamed to about-us.html
Result without --delete: Both files exist (broken links)
Result with --delete: Only about-us.html (clean)
```

**Key Learning**: `--delete` ensures S3 matches source exactly, preventing orphaned files.

## Practical Skills Acquired

1. **GitHub Repository Setup**: Created deployment-ready repos
2. **Deployment Scripting**: Wrote automated deployment scripts
3. **Environment Configuration**: Used variables for flexible config
4. **Git Authentication**: Configured tokens and SSH keys
5. **Health Check Implementation**: Verified deployment success
6. **Deployment Logging**: Created audit trails
7. **Rollback Procedures**: Restored previous deployments
8. **Watch Mode Configuration**: Monitored for changes
9. **Clean Build Practices**: Used `npm ci` for reproducibility
10. **Makefile Automation**: Created convenient deployment commands

## Real-World Workflow Simulation

This practical simulated a professional workflow:

**Developer Workflow**:
```bash
# 1. Make changes locally
vim app/page.tsx

# 2. Test locally
npm run dev

# 3. Commit to Git
git add .
git commit -m "Add new feature"

# 4. Push to GitHub
git push origin main

# 5. Automated deployment runs
# (triggered by push or watch mode)

# 6. Verify in production
curl https://my-site.com
```

**Key Stages**:
1. **Develop**: Local changes
2. **Commit**: Version control
3. **Deploy**: Automation
4. **Verify**: Health checks
5. **Monitor**: Logs and metrics

**Production Systems Add**:
- **Tests**: Run before deploy
- **Code Review**: PRs must be approved
- **Staging**: Deploy to test environment first
- **Rollback**: Automatic on failure
- **Notifications**: Slack/email on deploy

## Challenges and Solutions

**Challenge**: First deployment failed with "repository not found."

**Root Cause**: Used wrong GitHub username in repository URL.

**Solution**:
```bash
# Verify correct URL
git remote -v

# Update if wrong
git remote set-url origin https://github.com/CORRECT_USER/repo.git
```

**Learning**: Always verify remote URLs before deploying.

---

**Challenge**: Deployment succeeded but website showed old version.

**Root Cause**: Browser caching old files.

**Solution**:
```bash
# Hard refresh in browser: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

# Or verify directly with curl (no cache)
curl http://website-url.com

# For production, implement cache busting:
# - Version URLs (_next/static/v123/)
# - Short TTL cache headers
```

**Learning**: Caching is powerful but can hide deployment issues.

---

**Challenge**: Rollback deployed but introduced new bugs.

**Root Cause**: Rolled back to commit with dependencies that changed since then.

**Solution**:
```bash
# Always verify package-lock.json is committed
git status

# Ensure clean build
npm ci  # Not npm install
```

**Learning**: Rollback requires complete version information, including dependencies.

## Understanding CI/CD Concepts

This practical introduced fundamental CI/CD concepts:

**Continuous Integration (CI)**:
- Code changes merged frequently
- Automated testing on each commit
- Quick feedback on breaks

**Continuous Deployment (CD)**:
- Automated deployment to production
- Every commit (that passes tests) goes live
- Reduces deployment friction

**Our Implementation**:
```
Push to GitHub → Clone → Build → Deploy → Verify
     ↓            ↓       ↓       ↓        ↓
    Git        GitHub   npm     S3     Health
   Commit      Action   Build   Sync   Check
```

**Production Additions**:
- Automated tests between build and deploy
- Staging environment before production
- Approval gates for critical environments
- Rollback automation on failures

**Key Learning**: CI/CD isn't about tools—it's about workflow automation that enables frequent, reliable deployments.

## Makefile as Deployment Interface

Learning Makefile patterns for DevOps:

**Benefits**:
```makefile
# Simple interface hides complexity
make deploy-github
# vs
./scripts/deploy-from-github.sh with correct env vars

# Consistent commands across team
make rollback COMMIT=abc123
# Everyone uses same interface

# Self-documenting
make help
# Shows all available commands
```

**Pattern Learned**:
```makefile
.PHONY: target-name
target-name:
	@echo "Doing something..."
	./scripts/actual-work.sh
```

**Key Insight**: Makefile provides standard interface—implementation details hidden in scripts.

## Conclusion

This practical taught me that deployment isn't just "uploading files"—it's an automated, trackable, reversible process. Git integration makes every deployment auditable and recoverable.

The most valuable lesson was understanding the deployment pipeline: source control → build → deploy → verify. Each stage serves a purpose, and automation ensures consistency.

Learning to rollback deployments was powerful. Knowing I can undo mistakes in seconds, not hours, reduces deployment anxiety and enables faster iteration.

The watch mode concept introduced me to continuous deployment thinking—deployments should be so automated and reliable that they happen constantly without manual intervention.

Environment variables, clean builds with `npm ci`, and the `--delete` flag seem like details but prevent entire classes of deployment issues. Professional deployments require this attention to detail.

Most importantly, this practical showed that Git isn't just for code—it's the foundation of modern deployment workflows. Commits become deployments, branches become environments, and tags become releases.

Combined with Practical 6 (infrastructure provisioning) and Practical 6 EC2 (server deployment), I now understand the complete deployment spectrum: infrastructure definition, server provisioning, and application deployment—all automated, version controlled, and secure.

The skills gained here—deployment automation, Git workflows, health checks, rollback procedures—are fundamental to DevOps and enable the rapid, reliable deployments that modern software demands.