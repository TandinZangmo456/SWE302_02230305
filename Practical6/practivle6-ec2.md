# Practical 6 EC2: Learning Report on AWS EC2 Deployment with Terraform and Docker

## Overview
This practical introduced me to compute-based cloud deployment using AWS EC2 instances, Infrastructure as Code (IaC) with Terraform, and nested containerization. Unlike Practical 6 which deployed static files to S3, this practical taught me to provision and manage virtual servers, combining multiple technologies: LocalStack (AWS emulation), Terraform (infrastructure provisioning), Docker (containerization), and Next.js (application framework). I learned that cloud deployment isn't just about uploading files—it's about orchestrating entire server environments programmatically.

## Key Concepts Learned

### 1. Infrastructure as Code (IaC) with Terraform

This practical fundamentally changed how I think about server provisioning:

**Traditional Approach** (Manual):
- Log into AWS console
- Click through UI to create EC2 instance
- Manually configure security groups, key pairs, networking
- Document steps in a Word document (maybe)
- Repeat manually for each environment (dev, staging, prod)

**Problems**:
- Error-prone (easy to miss steps)
- Not version controlled
- Difficult to replicate
- No audit trail
- Time-consuming

**IaC Approach** (Terraform):
```hcl
resource "aws_instance" "my_instance" {
  ami           = "ami-000001"
  instance_type = "t3.micro"
  key_name      = aws_key_pair.my_key_pair.key_name
}
```

**Benefits I Discovered**:
- **Version Control**: Infrastructure stored in Git
- **Reproducibility**: Same configuration creates identical infrastructure
- **Documentation**: Code is the documentation
- **Automation**: `tflocal apply` creates everything
- **Collaboration**: Team can review infrastructure changes via pull requests

**Key Learning**: Infrastructure should be treated like application code—version controlled, reviewed, tested, and automated.

### 2. Declarative vs Imperative Infrastructure Management

Terraform taught me a different programming paradigm:

**Imperative** (How to do it):
```bash
# Step-by-step commands
aws ec2 create-key-pair --key-name my-key
aws ec2 run-instances --image-id ami-xxx --instance-type t2.micro
aws ec2 create-tags --resources i-xxx --tags Key=Name,Value=MyServer
```

**Declarative** (What you want):
```hcl
resource "aws_key_pair" "my_key" {
  key_name = "my-key"
}

resource "aws_instance" "server" {
  ami = "ami-xxx"
  instance_type = "t2.micro"
  tags = { Name = "MyServer" }
}
```

**Terraform's Intelligence**:
- Figures out the correct order (key pair before instance)
- Handles dependencies automatically
- Knows what exists vs what needs creation
- Can update existing resources without recreating

**Key Insight**: Declarative code describes the desired end state, not the steps to get there. Terraform figures out the "how."

### 3. S3 vs EC2: Static Hosting vs Compute Instances

This practical clarified when to use different AWS services:

**S3 Static Hosting (Practical 6)**:
- **What**: Object storage serving static files
- **Best For**: `next export` static sites, SPAs
- **Limitations**: No server-side rendering, no APIs, no dynamic content
- **Cost**: Very cheap (pennies per month)
- **Scaling**: Automatic, handles millions of requests

**EC2 Compute (This Practical)**:
- **What**: Virtual server running your application
- **Best For**: Full Next.js with SSR, APIs, real-time features
- **Capabilities**: Run any code, databases, background jobs
- **Cost**: More expensive (dollars per month minimum)
- **Scaling**: Manual (need load balancer, auto-scaling groups)

**Decision Framework I Learned**:
```
Does your app need server-side logic?
├─ No → Use S3 (next export)
└─ Yes → Use EC2 (or serverless like Lambda)
    ├─ Consistent traffic → EC2
    └─ Sporadic traffic → Lambda (serverless)
```

**Real-World Example**:
- **Blog**: S3 (static pages, no dynamic content)
- **E-commerce**: EC2 (user sessions, payment processing, inventory management)
- **Portfolio**: S3 (just showcasing work)
- **SaaS App**: EC2 (user authentication, database operations, real-time updates)

### 4. LocalStack: AWS Emulation for Local Development

LocalStack taught me about development environment design:

**The Problem with Real AWS**:
- Costs money (even for testing)
- Slow (EC2 takes 1-2 minutes to launch)
- Risky (accidental resource creation costs money)
- Requires internet connection
- No easy cleanup (leftover resources cost money)

**LocalStack Solution**:
- Free local AWS emulation
- Fast (containers start in seconds)
- Safe (everything local, no cloud costs)
- Works offline
- Automatic cleanup when stopped

**Key Differences Learned**:

| Aspect | LocalStack | Real AWS |
|--------|-----------|----------|
| AMI IDs | `ami-000001` | `ami-0c55b159cbfafe1f0` |
| EC2 Implementation | Docker containers | Real virtual machines |
| Networking | Requires port forwarding | Public IPs work directly |
| Speed | Instant | 1-2 minutes |
| Cost | Free | Pay per use |
| Default User | `root` | `ec2-user`, `ubuntu` |

**Production Readiness**: LocalStack config needs changes for production:
- Different AMI IDs
- Real security groups and VPC configuration
- Elastic IPs for static addresses
- IAM roles for permissions
- Monitoring and logging setup

**Key Learning**: Develop locally with LocalStack, deploy to production AWS with minor configuration changes.

### 5. Nested Container Networking: The Three-Layer Challenge

This was the most complex networking concept I've learned:

**The Architecture**:
```
Host Machine (Your Laptop)
    ↓
LocalStack Container (Docker)
    ↓
EC2 Instance Container (Docker in Docker)
    ↓
Next.js Application Container (Docker in Docker in Docker)
```

**Why This Is Challenging**:

**Layer 1 Problem**: Next.js listens on `localhost:3000`
- Only accessible within its own container
- Not accessible from EC2 container

**Layer 2 Problem**: EC2 container can access Next.js container
- Via Docker networking within EC2
- But not accessible from LocalStack container

**Layer 3 Problem**: LocalStack container might access EC2
- But not accessible from host machine
- Requires port forwarding

**Network Isolation Reality**:
```
# This doesn't work:
http://localhost:3000  (no route to Next.js)

# Need to tunnel through all layers:
Host:8080 → LocalStack:??? → EC2:3000 → Docker:3000 → Next.js
```

**Key Learning**: Containerization provides isolation (good for security), but requires explicit port forwarding for access (adds complexity).

### 6. SSH Port Forwarding: The Solution to Nested Networking

Learning SSH port forwarding was a breakthrough:

**What SSH Port Forwarding Does**:
Creates a secure tunnel from your machine to a remote port

**Command Anatomy**:
```bash
ssh -L 8080:localhost:3000 -p 54321 root@127.0.0.1
```

**Breaking It Down**:
- `-L 8080:localhost:3000`: Forward local port 8080 to remote port 3000
- `-p 54321`: Connect via SSH on port 54321
- `root@127.0.0.1`: Connect as root to localhost
- `localhost` in the command refers to the EC2 instance's localhost, not yours

**How It Works**:
```
Browser → localhost:8080
    ↓
SSH Tunnel
    ↓
EC2 Instance → localhost:3000
    ↓
Next.js Application
```

**Alternative Approaches I Considered**:

**Option 1: Docker Port Mapping** (Didn't work)
- Would require modifying LocalStack's network configuration
- Complex and fragile

**Option 2: Reverse Proxy** (Overkill)
- Could install nginx on EC2 to forward ports
- Unnecessary complexity for development

**Option 3: SSH Port Forwarding** (Winner)
- Simple, built-in SSH feature
- No additional software required
- Commonly used in production for database access

**Real-World Application**: SSH tunneling is used professionally for:
- Accessing production databases securely
- Connecting to services behind firewalls
- Remote debugging
- Secure access to internal tools

### 7. Docker Multi-Stage Builds for Next.js

The Dockerfile taught me optimization techniques:

**Single-Stage Build** (Naive approach):
```dockerfile
FROM node:20
COPY . .
RUN npm install
RUN npm run build
CMD ["npm", "start"]
```

**Problems**:
- Image includes `node_modules` with dev dependencies (huge)
- Build artifacts mixed with source code
- Image size: 1.5GB+

**Multi-Stage Build** (Optimized):
```dockerfile
# Stage 1: Install dependencies
FROM node:20-alpine AS deps
COPY package*.json ./
RUN npm ci

# Stage 2: Build application
FROM node:20-alpine AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: Production image
FROM node:20-alpine AS runner
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
CMD ["node", "server.js"]
```

**Benefits**:
- Only production dependencies in final image
- No source code in final image
- Image size: 150MB (10x smaller!)
- Security: Smaller attack surface

**Key Stages Explained**:

**deps**: Installs all dependencies
- Uses `npm ci` (clean install, faster for CI/CD)
- Creates node_modules for building

**builder**: Compiles the application
- Uses dependencies from previous stage
- Runs `next build`
- Creates optimized production bundle

**runner**: Final production image
- Only copies necessary built files
- Runs as non-root user (security)
- Smallest possible image

**Key Learning**: Each Dockerfile stage is a separate image; only the final stage matters for size. Earlier stages are discarded.

### 8. Next.js Standalone Output Mode

The `output: 'standalone'` configuration was crucial:

**Default Next.js Output**:
```
.next/
├── server/ (server code)
├── static/ (static assets)
└── ... (lots of other files)

node_modules/ (ALL dependencies, even unused ones)
```

**Problem**: You must deploy the entire `node_modules` directory (100s of MB)

**Standalone Output**:
```
.next/standalone/
├── server.js (single entry point)
├── .next/ (optimized server code)
└── node_modules/ (ONLY required dependencies)
```

**Benefits**:
- Automatically traces which dependencies are actually used
- Removes unused packages
- Creates self-contained bundle
- Significantly smaller deployment size

**Docker Integration**:
```dockerfile
# Copy only the standalone output
COPY --from=builder /app/.next/standalone ./

# Single command to run
CMD ["node", "server.js"]
```

**Key Learning**: Next.js can analyze your code and determine exactly which dependencies are needed at runtime, eliminating waste.

### 9. SSH Key Pair Authentication

Understanding SSH keys was fundamental for secure access:

**Password Authentication** (Bad):
```bash
ssh user@server
Password: ********  # Sent over network (vulnerable to interception)
```

**Problems**:
- Can be brute-forced
- Password transmitted (even if encrypted)
- Difficult to rotate securely
- Can't restrict what the password allows

**Key Pair Authentication** (Good):
```bash
ssh-keygen -t rsa -b 4096  # Creates key pair
ssh -i ~/.ssh/id_rsa user@server  # Uses private key
```

**How It Works**:
1. You generate a key pair: private key (secret) + public key (shareable)
2. Public key goes on the server (in `~/.ssh/authorized_keys`)
3. Private key stays on your machine (never transmitted)
4. Challenge-response proves you have the private key
5. Server grants access

**Key Components**:
- `id_rsa`: Private key (keep secret, never share)
- `id_rsa.pub`: Public key (safe to share)
- File permissions matter: `chmod 600 ~/.ssh/id_rsa` (owner-only read/write)

**Terraform Integration**:
```hcl
resource "aws_key_pair" "my_key" {
  key_name   = "my-terraform-key"
  public_key = file("~/.ssh/id_rsa.pub")  # Uploads public key
}
```

**Real-World Usage**: SSH keys are how CI/CD systems securely deploy code without storing passwords.

### 10. Dynamic Port Mapping in Containerized Environments

This practical taught me why hardcoding ports doesn't work in containerized environments:

**The Problem**:
```bash
# You want to expose port 5432 (PostgreSQL)
docker run -p 5432:5432 postgres

# Error: Port 5432 already in use!
# (Maybe you have PostgreSQL running locally)
```

**Dynamic Port Mapping**:
```bash
# Let Docker choose a random available port
docker run -p postgres  # No host port specified

# Docker assigns, e.g., 54321:5432
# Discover the actual port:
docker port <container-id>
# Output: 5432/tcp -> 0.0.0.0:54321
```

**Why This Matters in LocalStack**:
- Multiple EC2 instances might run simultaneously
- Each needs unique ports
- Manual port assignment would create conflicts
- Dynamic assignment prevents this

**Discovery Pattern**:
```bash
# Find the assigned port
SSH_PORT=$(docker ps --format "{{.Ports}}" | grep ec2 | cut -d':' -f2 | cut -d'-' -f1)

# Use it
ssh -p $SSH_PORT root@localhost
```

**Key Learning**: In containerized environments, embrace dynamic discovery over static configuration. Use APIs/tools to find actual ports at runtime.

## Practical Skills Acquired

1. **Terraform Configuration**: Wrote HCL code to define AWS infrastructure
2. **LocalStack Management**: Started, configured, and used AWS emulation locally
3. **EC2 Instance Provisioning**: Created virtual servers programmatically
4. **SSH Key Management**: Generated, configured, and used SSH keys for authentication
5. **Nested Container Navigation**: Accessed services through multiple container layers
6. **SSH Port Forwarding**: Created tunnels through complex network topologies
7. **Docker Multi-Stage Builds**: Optimized container images for production
8. **Next.js Standalone Mode**: Configured efficient deployment builds
9. **Port Discovery**: Found dynamically assigned ports in containerized systems
10. **Infrastructure Debugging**: Troubleshot complex multi-layer connectivity issues

## Challenges and Solutions

**Challenge**: SSH connection worked, but couldn't access Next.js on port 3000.

**Initial Assumption**: "If SSH works, other ports should too."

**Reality**: SSH port (22) was automatically forwarded by LocalStack. Port 3000 was not.

**Solution**: Implemented SSH local port forwarding:
```bash
ssh -L 8080:localhost:3000 -p 54321 root@127.0.0.1
```

**Learning**: Don't assume. Each port requires explicit forwarding in nested container architectures.

---

**Challenge**: Terraform apply succeeded but couldn't SSH to EC2 instance.

**Initial Attempt**: `ssh -i ~/.ssh/id_rsa root@localhost`
**Error**: "Connection refused"

**Root Cause**: Forgot that EC2 SSH port is dynamically mapped, not standard port 22.

**Solution**: 
```bash
# Found actual port
docker ps | grep localstack-ec2
# Output: 0.0.0.0:54321->22/tcp

# Used correct port
ssh -i ~/.ssh/id_rsa -p 54321 root@localhost
```

**Learning**: In containerized environments, always verify actual port mappings. Don't assume defaults.

---

**Challenge**: Docker build failed on EC2 with "permission denied."

**Initial Attempt**: `docker build -t my-app .`
**Error**: "Cannot connect to Docker daemon"

**Root Cause**: User not in `docker` group, Docker requires sudo.

**Solution**:
```bash
sudo usermod -aG docker $USER
newgrp docker  # Activate group without logout
docker build -t my-app .  # Now works
```

**Learning**: Docker daemon permissions are separate from sudo. Must explicitly add user to `docker` group.

**Challenge**: Next.js container started but showed 404 errors.

**Root Cause**: Forgot to set `output: 'standalone'` in `next.config.js`.

**Solution**:
```javascript
module.exports = {
  output: 'standalone'  // Added this
}
```

**Learning**: Framework-specific configuration is crucial for containerization. Next.js requires explicit standalone mode.

## Real-World Applications

**Scenario 1: Development Environment Setup**

Traditional approach:
- Install PostgreSQL locally
- Install Redis locally
- Install Elasticsearch locally
- Manage version conflicts
- Document setup steps

**Infrastructure as Code approach**:
```hcl
resource "docker_container" "postgres" { ... }
resource "docker_container" "redis" { ... }
resource "docker_container" "elasticsearch" { ... }
```

Run `terraform apply` → entire dev environment ready in seconds.

**Scenario 2: Disaster Recovery**

Traditional:
- Server crashes
- Panic! How was it configured?
- Spend hours recreating manually
- Hope you get it right

**IaC approach**:
- Server crashes
- Run `terraform apply`
- Identical server created in minutes
- Configuration version-controlled, auditable

**Scenario 3: Multi-Environment Management**

Traditional:
- Dev, staging, and prod configured differently
- "Works on my machine" syndrome
- Configuration drift between environments

**IaC approach**:
```hcl
# Same config, different variables
terraform workspace select dev
terraform apply -var-file=dev.tfvars

terraform workspace select prod
terraform apply -var-file=prod.tfvars
```

Environments are identical except for explicitly defined differences.

## Understanding the Complete Deployment Spectrum

This practical fit into a larger understanding of deployment options:

**Deployment Complexity Spectrum**:
```
Simple → Complex
Static → Dynamic

S3 Static → EC2 → Container Orchestration → Kubernetes
(P6)      (P6 EC2)   (Docker Swarm)       (Production scale)
```

**When to Use Each**:

**S3 Static** (Practical 6):
- Blog, documentation, portfolio
- No backend logic needed
- Maximum simplicity

**EC2 Single Instance** (This Practical):
- Small applications, MVPs
- Need backend logic
- Predictable traffic

**EC2 with Load Balancer**:
- Medium traffic
- Need redundancy
- Multiple instances

**Container Orchestration (ECS/Kubernetes)**:
- Large scale
- Microservices architecture
- Auto-scaling requirements

**Key Insight**: Start simple (S3 or single EC2), scale complexity only when needed.

## Conclusion

This practical transformed my understanding of cloud infrastructure from "uploading files to AWS" to "programmatically orchestrating complete server environments." The combination of Terraform, Docker, and EC2 taught me that modern infrastructure is code—version controlled, testable, and reproducible.

The most valuable lesson was understanding the trade-offs between deployment approaches. S3 is simpler but limited; EC2 provides full control but requires more management. Choosing the right tool depends on application requirements, not personal preference.

LocalStack's role in enabling local cloud development was revelatory. The ability to experiment with AWS services without cost or risk accelerates learning and reduces production mistakes. The LocalStack → Real AWS migration path teaches transferable skills while maintaining safety.

The networking challenge of accessing Next.js through three container layers taught me about network isolation, port forwarding, and troubleshooting distributed systems. These concepts apply far beyond this specific setup—they're fundamental to understanding containerized architectures.

Infrastructure as Code with Terraform demonstrated that infrastructure can be collaborative, reviewed, and tested just like application code. This is a paradigm shift from treating infrastructure as mysterious manual configuration to treating it as a first-class engineering artifact.

Most importantly, this practical taught me to think systematically about deployment architecture. Not "can I deploy this?" but "what's the appropriate deployment strategy given my requirements for scalability, cost, complexity, and maintainability?" This strategic thinking separates junior developers from senior engineers.

Combined with static deployment (Practical 6), this practical completes my understanding of the two fundamental cloud deployment models. I now know when to use each and how to implement both professionally.

The skills gained here—Terraform, Docker, SSH, networking, troubleshooting containerized systems—are immediately applicable to real-world software engineering and form the foundation of modern DevOps practices.