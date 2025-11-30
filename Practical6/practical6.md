# Practical 6: Learning Report on Infrastructure as Code with Terraform and S3

## Overview
This practical introduced me to Infrastructure as Code (IaC) using Terraform to provision AWS S3 buckets and deploy a Next.js static website. I learned to define cloud infrastructure declaratively, scan for security vulnerabilities using Trivy, and understand the critical difference between secure and insecure configurations. Unlike Practical 6 EC2 which deployed to virtual servers, this practical focused on static website hosting—simpler but limited to pre-built HTML/CSS/JS files.

## Key Concepts Learned

### 1. Infrastructure as Code: Code is Infrastructure

This practical fundamentally changed how I think about infrastructure:

**Before (Manual/ClickOps)**:
- Log into AWS console
- Click buttons to create S3 bucket
- Configure settings manually
- Hope you remember what you did
- Repeat for each environment

**After (Infrastructure as Code)**:
```hcl
resource "aws_s3_bucket" "website" {
  bucket = "my-website-bucket"
}
```

**Revolutionary Insight**: Infrastructure can be version controlled like application code. I can:
- Track changes in Git
- Review infrastructure updates via pull requests
- Reproduce environments exactly
- Automate deployments
- Rollback infrastructure mistakes

**Real-World Impact**: No more "works on my machine" for infrastructure. Dev, staging, and prod can be identical except for explicit variable differences.

### 2. Declarative vs Imperative Infrastructure

Terraform taught me a different way of thinking:

**Imperative (How to do it)**:
```bash
aws s3 mb s3://my-bucket
aws s3api put-bucket-encryption --bucket my-bucket --encryption AES256
aws s3api put-bucket-website --bucket my-bucket --index index.html
```
Problem: If any step fails, state is inconsistent. Must track what succeeded.

**Declarative (What I want)**:
```hcl
resource "aws_s3_bucket" "website" {
  bucket = "my-bucket"
}

resource "aws_s3_bucket_encryption" "website" {
  bucket = aws_s3_bucket.website.id
  # ... encryption config
}
```

**Terraform's Intelligence**:
- Determines dependency order automatically
- Knows current state vs desired state
- Updates only what changed
- Handles failures gracefully (partial apply)

**Key Learning**: I describe the end goal, Terraform figures out how to get there.

### 3. S3 Static Website Hosting: Simple But Powerful

I learned S3's dual purpose—storage and web hosting:

**Traditional Web Hosting**:
- Rent a server (EC2, like Practical 6 EC2)
- Install web server software (Apache, Nginx)
- Configure, maintain, patch, scale

**S3 Static Hosting**:
```hcl
resource "aws_s3_bucket_website_configuration" "website" {
  bucket = aws_s3_bucket.deployment.id
  
  index_document {
    suffix = "index.html"
  }
  
  error_document {
    key = "404.html"
  }
}
```

**What This Enables**:
- No server management
- Automatic scaling (millions of requests)
- Global CDN integration (fast worldwide)
- Pay only for storage + bandwidth

**Limitations Learned**:
- Static files only (HTML, CSS, JS)
- No server-side processing
- No databases or APIs
- Must use `next export` (static generation)

**When to Use**:
- Documentation sites
- Blogs
- Marketing pages
- SPAs (Single Page Applications)

**When Not to Use**:
- User authentication needed
- Dynamic content from database
- Server-side rendering
- Real-time features

### 4. Next.js Static Export: Build Once, Deploy Anywhere

The `next export` workflow was eye-opening:

**Configuration**:
```javascript
// next.config.js
module.exports = {
  output: 'export'  // Creates static HTML files
}
```

**What Happens**:
```bash
npm run build
# Next.js pre-renders all pages
# Creates /out directory with static files
```

**Output Structure**:
```
out/
├── index.html
├── about.html
├── _next/
│   └── static/  (CSS, JS chunks)
└── images/
```

**Deployment**:
```bash
awslocal s3 sync out/ s3://my-bucket/ --delete
```

**Key Insight**: Next.js runs during build, not at request time. All pages are HTML files—no Node.js server needed in production.

**Trade-off Understanding**:
- Faster (pre-built HTML, no server processing)
- Cheaper (no compute costs)
- Scalable (just file serving)
- BUT: No dynamic content, no SSR, no API routes

### 5. LocalStack: AWS Without the Bills

LocalStack was a game-changer for learning:

**Problem with Real AWS**:
- Every API call might cost money
- Easy to forget resources (ongoing charges)
- Slow feedback (cloud round-trips)
- Fear of breaking things

**LocalStack Solution**:
```yaml
# docker-compose.yml
services:
  localstack:
    image: localstack/localstack
    ports:
      - "4566:4566"
```

**Benefits**:
- Free unlimited AWS emulation
- Instant feedback (local)
- Safe experimentation
- Works offline

**Terraform Integration**:
```hcl
provider "aws" {
  endpoints {
    s3 = "http://localhost:4566"
  }
  skip_credentials_validation = true
}
```

**Key Learning**: Develop locally, deploy to production with minimal config changes. The `tflocal` wrapper makes this automatic.

### 6. Security Scanning with Trivy: Shift-Left Security

Trivy introduced me to automated security scanning for infrastructure:

**Traditional Security** (Shift-Right):
```
Code → Deploy → Security audit finds issues → Fix → Redeploy
(Days/weeks later)
```

**Modern Security** (Shift-Left):
```
Code → Scan → Fix → Deploy
(Minutes, before production)
```

**Trivy Scanning**:
```bash
trivy config terraform/
```

**What Trivy Finds**:
- Unencrypted S3 buckets
- Public write access
- Missing access logs
- Wildcard IAM permissions
- Exposed secrets

**Severity Levels**:
- CRITICAL: Must fix (data breach risk)
- HIGH: Should fix soon (significant risk)
- MEDIUM: Fix when possible (best practice)
- LOW: Consider fixing (minor improvement)

**Example Finding**:
```
HIGH: Bucket does not have encryption enabled
─────────────────────────────────────────────
ID: AVD-AWS-0088
Resource: aws_s3_bucket.insecure
Line: 5
Recommendation: Add aws_s3_bucket_server_side_encryption_configuration
```

**Key Insight**: Security issues are easier and cheaper to fix before deployment than after a breach.

### 7. Secure vs Insecure Configurations: Practical Examples

Comparing secure and insecure Terraform code was illuminating:

**Insecure** (terraform-insecure/):
```hcl
resource "aws_s3_bucket" "website" {
  bucket = "my-website"
  # No encryption - data vulnerable
  # No access logging - no audit trail
  # No versioning - accidental deletes permanent
}

resource "aws_s3_bucket_public_access_block" "website" {
  bucket = aws_s3_bucket.website.id
  
  block_public_acls       = false  
  block_public_policy     = false  
  ignore_public_acls      = false  
  restrict_public_buckets = false  
}
```

**Secure** (terraform/):
```hcl
resource "aws_s3_bucket" "website" {
  bucket = "my-website"
}

# Encryption enabled
resource "aws_s3_bucket_server_side_encryption_configuration" "website" {
  bucket = aws_s3_bucket.website.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Access logging
resource "aws_s3_bucket_logging" "website" {
  bucket = aws_s3_bucket.website.id
  target_bucket = aws_s3_bucket.logs.id
  target_prefix = "access-logs/"
}

# Versioning
resource "aws_s3_bucket_versioning" "website" {
  bucket = aws_s3_bucket.website.id
  versioning_configuration {
    status = "Enabled"
  }
}
```

**Security Layers Learned**:
1. **Encryption**: Data protected at rest
2. **Logging**: Audit trail of access
3. **Versioning**: Recover from accidents
4. **Public Access Controls**: Explicit permissions

**Key Learning**: Security isn't one thing—it's layers of protection working together.

### 8. Terraform State Management

Understanding state was crucial:

**What is State?**
```
terraform.tfstate (JSON file)
{
  "resources": [
    {
      "type": "aws_s3_bucket",
      "name": "website",
      "instances": [{
        "attributes": {
          "bucket": "practical6-deployment-dev",
          "arn": "arn:aws:s3:::practical6-deployment-dev"
        }
      }]
    }
  ]
}
```

**Why State Matters**:
- Terraform knows what exists
- Can determine what changed
- Maps config to real resources
- Enables updates without recreating

**State Operations**:
```bash
terraform state list              # Show all resources
terraform state show aws_s3_bucket.website  # Details
terraform import aws_s3_bucket.website my-existing-bucket  # Import existing
```

**Key Insight**: State is the source of truth about what Terraform manages. Losing state means losing control of infrastructure.

### 9. Terraform Workflow and Commands

The practical taught me the standard Terraform workflow:

**Step 1: Init** (One-time setup)
```bash
tflocal init
# Downloads providers
# Sets up backend
# Initializes modules
```

**Step 2: Plan** (Preview changes)
```bash
tflocal plan
# Shows what will change
# No actual changes made
# Safe to run anytime
```

**Step 3: Apply** (Make changes)
```bash
tflocal apply
# Prompts for confirmation
# Applies changes
# Updates state
```

**Step 4: Destroy** (Clean up)
```bash
tflocal destroy
# Deletes all resources
# Use with caution!
```

**Best Practice Workflow**:
```bash
# 1. Make changes to .tf files
# 2. Review what will change
tflocal plan

# 3. If looks good, apply
tflocal apply

# 4. Commit to Git
git add terraform/
git commit -m "Add encryption to S3 bucket"
```

### 10. S3 Website Deployment Pipeline

Understanding the complete deployment flow:

**Build Stage**:
```bash
cd nextjs-app
npm run build
# Creates static HTML in /out
```

**Deploy Stage**:
```bash
awslocal s3 sync out/ s3://my-bucket/ --delete
```

**Key Parameters**:
- `sync`: Uploads only changed files (efficient)
- `--delete`: Removes files not in source (clean)
- No `--delete`: Leaves old files (can cause issues)

**Verification**:
```bash
# List deployed files
awslocal s3 ls s3://my-bucket/ --recursive

# Access website
curl http://my-bucket.s3-website.localhost.localstack.cloud:4566
```

**Key Learning**: Sync is smarter than copy—only uploads changes, saving time and bandwidth.

## Practical Skills Acquired

1. **Terraform Configuration**: Wrote HCL for S3, encryption, logging, versioning
2. **Security Scanning**: Used Trivy to identify vulnerabilities
3. **Vulnerability Remediation**: Fixed CRITICAL and HIGH security issues
4. **LocalStack Management**: Ran AWS services locally
5. **Static Site Deployment**: Built and deployed Next.js to S3
6. **Infrastructure Debugging**: Troubleshot Terraform and AWS issues
7. **Git Workflow**: Version controlled infrastructure changes
8. **Makefile Usage**: Used automation scripts efficiently
9. **AWS CLI Operations**: Managed S3 buckets and files
10. **Security Best Practices**: Implemented encryption, logging, versioning

## Key Insights and Takeaways

**Infrastructure as Code is a Paradigm Shift**: Moving from clickable UI to version-controlled code isn't just a tool change—it's a mindset change. Infrastructure becomes testable, reviewable, reproducible.

**Security is Code, Not Configuration**: By defining security in Terraform, it's version controlled, reviewed, and enforced. No more "I forgot to enable encryption."

**Static vs Dynamic Hosting**: S3 is perfect for static sites (fast, cheap, scalable) but can't do server logic. EC2 (Practical 6 EC2) handles dynamic needs but requires more management.

**Shift-Left Security Works**: Catching security issues during development (with Trivy) is infinitely better than discovering them in production.

**LocalStack Enables Learning**: Being able to experiment with AWS locally without cost or risk dramatically accelerates learning.

## Conclusion

This practical taught me that modern infrastructure management is about treating infrastructure like application code—version controlled, tested, automated, and secured from the start.

The contrast between secure and insecure configurations was powerful. Security isn't about remembering to click the right checkboxes; it's about building it into your infrastructure definitions so it's impossible to forget.

Terraform's declarative approach means I describe what I want, not how to achieve it. This abstraction makes infrastructure more maintainable and less error-prone than imperative scripts.

The practical demonstrated that S3 static hosting is an excellent deployment target for many websites—simpler, cheaper, and more scalable than managing servers. The trade-off is losing server-side capabilities.

Most importantly, I learned that security should be part of the development workflow from day one, not an afterthought. Trivy scanning integrated into the development process catches issues when they're cheapest to fix—before deployment.

Combined with Practical 6 EC2 (compute instances), I now understand the two fundamental AWS deployment models: static hosting (S3) for pre-built content and compute instances (EC2) for dynamic applications. Choosing between them depends on application requirements, not personal preference.

The skills gained here—Terraform, IaC principles, security scanning, AWS S3—are immediately applicable to real-world cloud infrastructure and form the foundation of modern DevOps practices.