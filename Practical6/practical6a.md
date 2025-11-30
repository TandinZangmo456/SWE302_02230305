# Practical 6a: Learning Report on Git-based Deployment Workflow

## Overview
This practical taught me to automate deployments using Git and GitHub as the deployment source, extending Practical 6's infrastructure concepts with version-controlled deployment workflows. I learned that modern deployment isn't about manually uploading files—it's about treating Git commits as deployment triggers, enabling reproducible, trackable, and reversible deployments through automation.

## Key Concepts Learned

### 1. Git as Single Source of Truth

This practical fundamentally changed how I think about deployments:

**Traditional Deployment** (Manual):
```bash
# 1. Make changes locally
vim app/page.tsx

# 2. Build locally
npm run build

# 3. Manually upload
scp -r out/* server:/var/www/
```

**Problems**:
- What version is deployed? Unknown
- How to rollback? Manual backup needed
- Who deployed? No audit trail
- How to replicate? Hope you documented steps

**Git-based Deployment** (Automated):
```bash
# 1. Make changes
vim app/page.tsx

# 2. Commit and push
git commit -m "Update homepage"
git push origin main

# 3. Automated deployment
./scripts/deploy-from-github.sh
```

**Benefits**:
- **Version tracking**: Git commit = deployed version
- **Rollback**: `git checkout <commit>` + redeploy
- **Audit trail**: Git log shows who deployed what when
- **Reproducibility**: Same commit = same deployment

**Critical Insight**: Git becomes the deployment control plane. Every deployment is a Git commit, making infrastructure changes as trackable as code changes.

### 2. Deployment Automation Script Architecture

Learning to automate the complete deployment pipeline:

**Manual Steps** (Before automation):
1. Clone/pull repository
2. Install dependencies
3. Build application
4. Upload to S3
5. Verify deployment

**Automated Script** (After):
```bash
#!/bin/bash
# scripts/deploy-from-github.sh

# 1. Clone/update from GitHub
git clone https://github.com/$REPO.git
cd repo && git pull

# 2. Install dependencies
npm ci  # Clean install from package-lock.json

# 3. Build application
npm run build

# 4. Deploy to S3
awslocal s3 sync out/ s3://$BUCKET/ --delete

# 5. Verify
curl $WEBSITE_URL
```

**What the Script Encapsulates**:
- Error handling (set -e stops on failure)
- Status messages (colored output)
- Configuration (environment variables)
- Verification (check deployment succeeded)

**Key Learning**: Deployment scripts codify institutional knowledge. New team members run one command instead of following 10-step document.

### 3. Environment Variables for Configuration

Making scripts flexible through externalized configuration:

**Hardcoded** (Inflexible):
```bash
# scripts/deploy.sh
REPO="myusername/myrepo"  # Only works for me
BUCKET="my-specific-bucket"  # Only this bucket
```

**Configurable** (Flexible):
```bash
# scripts/deploy.sh
REPO="${GITHUB_REPO:-default-user/default-repo}"
BUCKET="${DEPLOYMENT_BUCKET:-default-bucket}"
BRANCH="${BRANCH:-main}"
```

**Usage**:
```bash
# Use defaults
./scripts/deploy.sh

# Override for different repo
GITHUB_REPO="otheruser/otherrepo" ./scripts/deploy.sh

# Deploy different branch
BRANCH="develop" ./scripts/deploy.sh
```

**Benefits**:
- Same script works for multiple repos/environments
- No code changes for different configurations
- Secrets stay out of version control
- Easy CI/CD integration

**Key Insight**: Scripts should be generic; configuration should be external. One script, infinite configurations.

### 4. Git Clone Strategies for Deployment

Understanding how to manage repository clones:

**Strategy 1: Fresh Clone Every Time**:
```bash
rm -rf /tmp/deploy
git clone https://github.com/$REPO /tmp/deploy
cd /tmp/deploy
```
- **Pros**: Always clean state
- **Cons**: Slow (re-downloads everything)

**Strategy 2: Update Existing Clone**:
```bash
if [ -d /tmp/deploy ]; then
  cd /tmp/deploy
  git fetch origin
  git checkout $BRANCH
  git pull origin $BRANCH
else
  git clone https://github.com/$REPO /tmp/deploy
fi
```
- **Pros**: Fast (only fetches new commits)
- **Cons**: Potential state issues if interrupted

**Best Practice** (Hybrid):
```bash
# Update existing or clone fresh
git fetch origin || git clone https://github.com/$REPO
git reset --hard origin/$BRANCH  # Discard any local changes
```

**Key Learning**: Production deployments should prefer fresh clones (consistency) while development can reuse clones (speed).

### 5. Deployment Verification: Trust but Verify

Automated deployment verification ensures success:

**Naive Approach**:
```bash
# Deploy and hope it worked
awslocal s3 sync out/ s3://$BUCKET/
echo "Deployed!"
```

**Robust Approach**:
```bash
# Deploy
awslocal s3 sync out/ s3://$BUCKET/

# Verify
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $WEBSITE_URL)
if [ "$HTTP_CODE" = "200" ]; then
  echo "Deployment successful"
else
  echo "Deployment failed: HTTP $HTTP_CODE"
  exit 1
fi
```

**What to Verify**:
1. **HTTP Status**: Website responds with 200
2. **File Count**: Expected number of files deployed
3. **Index File**: index.html exists
4. **Content**: Key elements present in HTML

**Why This Matters**:
- Deployment can succeed but website broken
- Catch issues before users do
- Enable automatic rollback on failure

**Key Insight**: Successful deployment ≠ working website. Always verify the actual user experience.

### 6. Rollback Capability: Time Travel for Deployments

Learning to undo deployments safely:

**The Problem**:
```
Deploy new version → Breaks production → Panic!
```

**The Solution: Git-based Rollback**:
```bash
# scripts/rollback.sh
COMMIT=$1  # Previous working commit

cd /tmp/deploy
git checkout $COMMIT
npm run build
awslocal s3 sync out/ s3://$BUCKET/ --delete

echo "Rolled back to commit: $COMMIT"
```

**Usage**:
```bash
# View recent commits
git log --oneline -5

# Rollback to specific commit
./scripts/rollback.sh abc1234
```

**Rollback Workflow**:
1. Identify last known good commit
2. Checkout that commit
3. Rebuild application
4. Deploy old version
5. Verify rollback worked

**Key Learning**: Git history enables instant rollback. Any commit can become "production" again.

### 7. Feature Branch Workflow for Deployments

Professional Git workflow for teams:

**Direct to Main** (Risky):
```bash
# Make changes directly on main
git checkout main
vim app/page.tsx
git commit -m "Fix bug"
git push origin main
```
- **Risk**: Untested code goes live
- **Problem**: No review process

**Feature Branch Workflow** (Safe):
```bash
# 1. Create feature branch
git checkout -b feature/add-footer

# 2. Make changes
vim app/components/Footer.tsx
git commit -m "Add footer component"

# 3. Push feature branch
git push origin feature/add-footer

# 4. Create pull request on GitHub
# - Team reviews code
# - CI runs tests
# - Approval required

# 5. Merge to main after approval
git checkout main
git merge feature/add-footer
git push origin main

# 6. Deploy merged code
./scripts/deploy-from-github.sh
```

**Benefits**:
- Code review before deployment
- Testing before merging
- Multiple developers work simultaneously
- Cleaner Git history

**Key Insight**: Feature branches protect production. Main branch should always be deployable.

### 8. CI/CD Concepts: Local vs Cloud

Understanding continuous integration/deployment:

**Continuous Integration (CI)**:
- Automatically build/test on every push
- Catch errors early
- Ensure code quality

**Continuous Deployment (CD)**:
- Automatically deploy tested code
- Fast delivery of features
- Reduce manual errors

**Local CI/CD** (This Practical):
```bash
# Manual trigger
./scripts/deploy-from-github.sh
```
- Developer-initiated
- Runs on local machine
- Good for: Development, learning

**Cloud CI/CD** (Production):
```yaml
# .github/workflows/deploy.yml (automatic trigger)
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run build
      - run: aws s3 sync out/ s3://$BUCKET/
```
- Automatically triggered
- Runs on GitHub servers
- Good for: Production

**Key Learning**: This practical teaches CI/CD concepts locally. Same principles apply to cloud systems like GitHub Actions, GitLab CI, Jenkins.

### 9. Deployment Logging and Audit Trails

Tracking deployment history:

**Without Logging**:
```
Question: "What's deployed in production?"
Answer: "Uh... I think version 2.3?"
```

**With Logging**:
```bash
# scripts/log-deployment.sh
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
COMMIT=$(git rev-parse --short HEAD)
MESSAGE=$(git log -1 --pretty=%B)
DEPLOYER=$(git config user.name)

echo "$TIMESTAMP | $DEPLOYER | $COMMIT | $MESSAGE" >> deployments.log
```

**Log Output** (`deployments.log`):
```
2024-11-25 10:30:45 | Alice | abc1234 | Add footer component
2024-11-25 11:15:22 | Bob   | def5678 | Fix mobile navigation
2024-11-25 14:20:10 | Alice | ghi9012 | Update homepage copy
```

**Audit Questions This Answers**:
- What version is deployed? → Check last log entry
- Who deployed it? → See deployer name
- When was it deployed? → Timestamp
- Why was it deployed? → Commit message

**Key Insight**: Deployment logs provide accountability and debugging information. Essential for production systems.

### 10. The `--delete` Flag: Complete Synchronization

Understanding S3 sync behavior:

**Without `--delete`**:
```bash
awslocal s3 sync out/ s3://$BUCKET/
```
- Uploads new files
- Updates changed files
- **Leaves old files** (orphans accumulate)

**Problem Scenario**:
```
Deploy 1: Creates about.html
Deploy 2: Renames to about-us.html (but doesn't delete about.html)
Result: Both files exist, broken links to about.html
```

**With `--delete`**:
```bash
awslocal s3 sync out/ s3://$BUCKET/ --delete
```
- Uploads new files
- Updates changed files
- **Removes files not in source** (clean state)

**Result**:
```
Deploy 2: Only about-us.html exists (about.html deleted)
```

**Key Learning**: `--delete` ensures S3 exactly matches source. Critical for clean deployments.

## Practical Skills Acquired

1. **GitHub Repository Management**: Created and configured repos for deployment
2. **Git Workflows**: Implemented feature branch strategies
3. **Bash Scripting**: Wrote deployment automation scripts
4. **Environment Configuration**: Used variables for flexible scripts
5. **Deployment Verification**: Automated health checks
6. **Rollback Procedures**: Implemented version recovery
7. **Deployment Logging**: Created audit trails
8. **S3 Sync Strategies**: Mastered synchronization patterns
9. **Error Handling**: Built robust scripts with failure handling
10. **CI/CD Concepts**: Understood continuous deployment principles

## Real-World Deployment Workflow

This practical taught professional deployment workflow:

**Developer Workflow**:
```
1. Developer creates feature branch
   git checkout -b feature/new-button

2. Makes changes locally
   vim src/Button.tsx

3. Tests locally
   npm run dev

4. Commits and pushes
   git commit -m "Add new button"
   git push origin feature/new-button

5. Creates pull request on GitHub
   - Team reviews code
   - CI runs automated tests
   - Tests pass → Ready to merge

6. Merges to main
   git checkout main
   git merge feature/new-button
   git push origin main

7. Automated deployment runs
   (Triggered by push to main)

8. Deployment verified
   - HTTP checks
   - Smoke tests
   - Monitoring alerts

9. If issues found → Rollback
   ./scripts/rollback.sh <previous-commit>
```

**Key Stages**:
1. **Development**: Feature branches
2. **Review**: Pull requests
3. **Testing**: Automated CI
4. **Deployment**: Automated CD
5. **Verification**: Health checks
6. **Recovery**: Rollback capability

## Challenges and Solutions

**Challenge**: Deployment script failed with "repository not found."

**Root Cause**: Wrong GitHub username in repository URL.

**Solution**:
```bash
# Verify repository URL
git remote -v

# Update script with correct URL
export GITHUB_REPO="correct-user/correct-repo"
```

**Learning**: Always verify configuration before running automated scripts.

---

**Challenge**: Deployment succeeded but website showed old version.

**Root Cause**: Browser cached old files, not a deployment issue.

**Solution**:
```bash
# Hard refresh browser: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

# Or verify directly with curl (no cache)
curl http://website-url.com
```

**Learning**: Distinguish between deployment issues and client-side caching.

---

**Challenge**: Rollback deployed but didn't fix the issue.

**Root Cause**: Rolled back to wrong commit—issue existed in that version too.

**Solution**:
```bash
# Review commit history carefully
git log --oneline --graph

# Find last known good commit
# Test locally before deploying
git checkout <commit>
npm run build && npm start

# Then rollback
./scripts/rollback.sh <correct-commit>
```

**Learning**: Verify rollback target before deploying. Test locally first.

## Understanding the Complete Deployment Picture

This practical completed deployment knowledge:

**Infrastructure** (Practical 6):
- Terraform provisions S3 buckets
- Infrastructure as Code principles
- LocalStack for local testing

**Application** (Practical 6):
- Next.js builds static site
- Configuration for static export
- Deployment to S3

**Deployment Automation** (Practical 6a):
- Git-based workflow
- Automated deployment scripts
- Rollback capabilities
- Deployment verification

**Together**: Complete deployment pipeline from infrastructure definition to automated deployment with version control and rollback.

## Conclusion

This practical taught me that modern deployment is inseparable from version control. Git isn't just for code—it's the foundation of deployment workflows, providing versioning, audit trails, and rollback capabilities.

The most valuable lesson was understanding that automation isn't about saving time—it's about eliminating errors and creating reproducibility. Manual deployments are error-prone; automated deployments from Git are consistent.

Learning to write deployment scripts taught me that infrastructure operations should be codified just like application logic. Scripts capture institutional knowledge and ensure consistent execution.

The rollback capability was empowering. Knowing I can instantly revert to any previous commit reduces deployment anxiety and enables confident iteration.

Feature branch workflows taught me that deployment process extends beyond the deployment script itself—it includes code review, testing, and approval processes that ensure only quality code reaches production.

Most importantly, this practical showed that Git-based deployments aren't just a technical pattern—they're a cultural shift. When Git commits become deployments, version control becomes the control plane for infrastructure changes, not just code changes.

Combined with infrastructure provisioning (P6) and server deployment (P6 EC2), I now understand the complete deployment spectrum: defining infrastructure, deploying applications, and automating the deployment process through version-controlled workflows.

The skills gained here—deployment automation, Git workflows, rollback procedures, deployment verification—are fundamental to modern DevOps and enable the rapid, reliable, reversible deployments that professional software development demands.