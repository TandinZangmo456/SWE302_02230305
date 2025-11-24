# Practical 4b: Learning Report on DAST with OWASP ZAP and GitHub Actions

## Overview
This practical introduced me to Dynamic Application Security Testing (DAST) using OWASP ZAP, completing my understanding of comprehensive application security testing. While Practicals 4 and 4a taught me SAST (analyzing code at rest), this practical taught me to test running applications, simulating real-world attacks. I learned that effective security requires testing both what developers write (SAST) and how it behaves in production (DAST).

## Key Concepts Learned

### 1. Understanding DAST: Black-Box Security Testing

I discovered that DAST represents a fundamentally different security paradigm:

**Black-Box Testing Philosophy**:
- No access to source code required
- Tests the application as an attacker would see it
- Identifies runtime vulnerabilities
- Validates actual security posture, not theoretical

**Key Insight**: DAST answers the question "Can this application be exploited?" while SAST answers "Does this code contain vulnerabilities?" Both questions are critical, but different.

**Real-World Analogy**: SAST is like reviewing building blueprints for structural flaws; DAST is like stress-testing the actual building to see if it collapses under load.

### 2. SAST vs DAST: Complementary Approaches

This practical crystallized the relationship between different security testing methodologies:

**What Each Finds**:

**SAST (SonarCloud/Snyk)**:
- Potential SQL injection in code structure
- Hard-coded credentials in source
- Insecure cryptographic algorithm usage
- Code-level logic flaws
- Dependency vulnerabilities

**DAST (OWASP ZAP)**:
- Actually exploitable SQL injection in running app
- Missing security headers (X-Frame-Options, CSP)
- SSL/TLS configuration weaknesses
- Session management flaws
- Server misconfiguration issues

**Critical Learning**: A vulnerability might exist in code (SAST finds it) but not be exploitable due to other security controls (DAST confirms this). Conversely, DAST might find configuration issues that SAST cannot detect.

**Example Scenario**:
```
SAST finds: "User input concatenated into SQL query"
DAST confirms: "SQL injection successfully executed, data extracted"

Without DAST, you might not know if the vulnerability is:
- Actually exploitable in the running environment
- Blocked by WAF or input validation
- Mitigated by database permissions
```

### 3. OWASP ZAP Architecture and Capabilities

Learning ZAP's architecture taught me how DAST tools work:

**Spider Component**:
- Crawls application to discover all URLs
- Follows links automatically
- Builds site map for comprehensive testing
- Identifies parameters and endpoints

**Active Scanner**:
- Sends malicious payloads to test for vulnerabilities
- Tests for SQL injection, XSS, path traversal, etc.
- Fuzzes inputs systematically
- Simulates real attack patterns

**Passive Scanner**:
- Analyzes HTTP traffic without sending attacks
- Identifies missing security headers
- Detects information disclosure
- Finds insecure cookie configurations

**Key Learning**: ZAP combines reconnaissance (spider), passive observation, and active exploitation—mimicking a real attacker's methodology.

### 4. Three ZAP Scan Types: Strategic Testing

I learned that different scenarios require different scan depths:

#### **Baseline Scan**
**Use Case**: Pull request validation, quick security check
**Duration**: 1-2 minutes
**Approach**: Spider + Passive scanning only
**Finds**: Low-hanging fruit (missing headers, cookie issues, info disclosure)

**Strategic Value**: Fast feedback for developers without slowing down workflow

#### **Full Scan**
**Use Case**: Pre-deployment validation, scheduled security audits
**Duration**: 10-30 minutes
**Approach**: Spider + Passive + Active scanning
**Finds**: Exploitable vulnerabilities (SQL injection, XSS, command injection)

**Strategic Value**: Comprehensive security validation before production deployment

#### **API Scan**
**Use Case**: REST/GraphQL API security testing
**Duration**: 5-10 minutes
**Approach**: OpenAPI/Swagger-driven testing
**Finds**: API-specific issues (broken authentication, excessive data exposure, lack of rate limiting)

**Strategic Value**: Specialized testing for API-first architectures

**Key Insight**: Progressive security—quick scans in development, comprehensive scans before deployment, specialized scans for specific technologies.

### 5. ZAP Rules Configuration: Fine-Grained Control

The `.zap/rules.tsv` file taught me sophisticated vulnerability management:

**Configuration Format**:
```tsv
# id    threshold    action
10020   MEDIUM       FAIL    # X-Frame-Options Missing
10037   OFF          IGNORE  # Server Version Disclosure
10096   LOW          WARN    # Timestamp Disclosure
```

**Three Actions**:
- **FAIL**: Build fails if found (critical security issues)
- **WARN**: Report but don't fail (informational issues)
- **IGNORE**: Don't report (known false positives)

**Threshold Levels**:
- **OFF**: Don't scan for this
- **LOW**: Detect only obvious cases
- **MEDIUM**: Standard detection
- **HIGH**: Aggressive detection (more false positives)

**Strategic Application**:
```tsv
# Critical security - always fail
40018   MEDIUM   FAIL    # SQL Injection
40012   MEDIUM   FAIL    # XSS

# Security headers - warn initially, fail later
10020   MEDIUM   WARN    # X-Frame-Options (Phase 1)
10020   MEDIUM   FAIL    # X-Frame-Options (Phase 2 - after implementation)

# Known false positive - ignore
10037   OFF      IGNORE  # Server version - not a risk in our context
```

This taught me security is contextual—the same finding might be critical for one application but acceptable for another.

### 6. Risk Level Classification and Prioritization

ZAP's risk classification system provided a framework for prioritization:

**Risk Levels**:
- **High**: Exploitable vulnerabilities (SQL injection, RCE, XSS)
- **Medium**: Significant issues (missing headers, session management flaws)
- **Low**: Minor concerns (information disclosure, weak SSL ciphers)
- **Informational**: Best practice violations (server headers, comments)

**Prioritization Strategy I Learned**:
```
Phase 1 (Immediate): Fix all HIGH risk findings
Phase 2 (This sprint): Address MEDIUM risk issues
Phase 3 (Next sprint): Resolve LOW risk findings
Phase 4 (Backlog): Consider INFORMATIONAL improvements
```

**Key Learning**: Not all security findings are created equal. Risk-based prioritization prevents security paralysis while ensuring critical issues are addressed first.

### 7. CI/CD Integration Patterns

I learned sophisticated workflow patterns for DAST integration:

**Pattern 1: Sequential SAST → DAST**
```yaml
jobs:
  sast:
    # Code analysis first (fast)
  
  dast:
    needs: sast  # Only if SAST passes
    # Runtime testing (slower)
```

**Rationale**: Why test a running application if the code itself is fundamentally insecure?

**Pattern 2: Progressive Scan Depth**
```yaml
# On PR: Baseline scan (2 min)
if: github.event_name == 'pull_request'
  zap-baseline-scan

# On merge: API scan (10 min)
if: github.ref == 'refs/heads/master'
  zap-api-scan

# Scheduled: Full scan (30 min)
if: github.event_name == 'schedule'
  zap-full-scan
```

**Rationale**: Balance security coverage with developer velocity—quick feedback during development, comprehensive testing before production.

**Pattern 3: Environment-Specific Testing**
```yaml
strategy:
  matrix:
    environment: [staging, pre-production]
```

**Rationale**: Test the environment where the application will actually run, not just localhost.

### 8. Application Deployment for DAST Testing

A critical learning was the complexity of testing running applications in CI/CD:

**Challenge**: Application must be running for DAST to test it

**Solution Architecture**:
```yaml
1. Build application (mvn package)
2. Create Docker container
3. Start container in CI environment
4. Wait for application readiness
5. Run ZAP scan against running container
6. Stop and cleanup container
```

**Critical Wait Logic**:
```bash
timeout 60 bash -c 'until curl -f http://localhost:5000/health; do
  echo "Waiting for application..."
  sleep 2
done'
```

**Why This Matters**: Without proper wait logic, ZAP starts scanning before the application is ready, causing false "connection refused" failures.

**Key Learning**: DAST requires orchestration—deploying, monitoring, testing, and cleaning up ephemeral test environments.

### 9. Network Isolation and Docker Networking

Docker networking for security testing taught me about test environment design:

**Challenge**: ZAP container and application container need to communicate

**Solution Options**:

**Option 1: Host Network**
```yaml
docker run --network host cicd-demo:test
docker run --network host zaproxy:stable
```
**Pros**: Simple, no configuration needed
**Cons**: Less isolation, port conflicts possible

**Option 2: Custom Docker Network**
```yaml
docker network create test-network
docker run --network test-network --name app cicd-demo:test
docker run --network test-network zaproxy:stable -t http://app:5000
```
**Pros**: Proper isolation, DNS resolution works
**Cons**: More complex setup

**Option 3: Docker Compose**
```yaml
services:
  app:
    image: cicd-demo:test
  zap:
    image: zaproxy:stable
    depends_on:
      - app
```
**Pros**: Declarative, easy to understand
**Cons**: Additional tool dependency

**Key Learning**: Security testing infrastructure requires careful network design to balance isolation, communication, and simplicity.

### 10. Interpreting ZAP Security Reports

Learning to read ZAP reports taught me practical vulnerability analysis:

**Sample Alert Understanding**:
```
Alert: X-Frame-Options Header Not Set
Risk: Medium
URL: http://localhost:5000/
Description: Page can be rendered in a frame
Impact: Clickjacking attacks possible
Solution: Add X-Frame-Options: DENY header
```

**What I Learned to Ask**:
1. **Is this exploitable in our context?** (Do we use frames legitimately?)
2. **What's the actual impact?** (Can an attacker steal credentials via clickjacking?)
3. **What's the fix effort?** (One-line config vs. major refactoring?)
4. **What's the business risk?** (Public-facing vs. internal tool?)

**Example Analysis**:
- **Finding**: "Server Leaks Version Information"
- **My Initial Reaction**: High priority fix
- **After Context**: Our server is behind WAF, version disclosure doesn't enable attacks in our architecture
- **Decision**: Low priority, acceptable risk

**Key Learning**: Security reports require interpretation, not blind remediation. Context determines priority.

### 11. OWASP Top 10 Mapping

ZAP's alignment with OWASP Top 10 provided a framework for understanding web security:

**ZAP Findings → OWASP Categories**:
- **SQL Injection** → A03:2021 Injection
- **XSS** → A03:2021 Injection
- **Missing CSRF Tokens** → A01:2021 Broken Access Control
- **Missing Security Headers** → A05:2021 Security Misconfiguration
- **Session Management Issues** → A07:2021 Identification and Authentication Failures

**Strategic Value**: OWASP Top 10 provides common language for discussing security with stakeholders. "We have 2 A03 vulnerabilities" communicates more than "We have SQL injection."

**Compliance Connection**: Many security frameworks (PCI DSS, SOC 2) reference OWASP Top 10. DAST coverage of these categories demonstrates compliance.

### 12. False Positive Management

Managing false positives taught me practical security operations:

**Common False Positives**:
1. **Timestamp Disclosure**: Often harmless, used for caching
2. **Server Version Headers**: Only a risk if version is vulnerable
3. **Suspicious Comments**: Dev comments like "TODO" flagged as issues

**Management Strategy**:
```tsv
# Phase 1: Initial scan - everything enabled
# Review all findings

# Phase 2: Tune rules based on context
10096   LOW    WARN    # Timestamp - acceptable for our use case
10037   OFF    IGNORE  # Server version - behind WAF

# Phase 3: Document decisions
# Create .zap/false-positives.md explaining each ignored rule
```

**Key Learning**: Security tools are starting points, not gospel. Human judgment is essential for distinguishing real risks from false alarms.

## Practical Skills Acquired

1. **ZAP Configuration**: Set up scan rules, authentication, and custom policies
2. **Docker Orchestration**: Deployed test environments with proper networking
3. **Workflow Design**: Created progressive security scanning pipelines
4. **Report Analysis**: Interpreted vulnerability reports with context
5. **Risk Prioritization**: Classified findings by business risk
6. **Wait Logic Implementation**: Ensured application readiness before testing
7. **Network Troubleshooting**: Debugged container communication issues
8. **SARIF Conversion**: Integrated DAST results with GitHub Security
9. **Performance Optimization**: Balanced scan depth with CI/CD speed
10. **False Positive Management**: Tuned scanners for relevant findings

## Real-World Security Pipeline Understanding

This practical completed my understanding of a production security pipeline:

**Complete Security Pipeline**:
```
Development Phase:
├─ IDE Security Plugins (immediate feedback)
├─ Pre-commit Hooks (local validation)
└─ SAST on commit (SonarCloud/Snyk)
    ↓
Build Phase:
├─ Unit Tests (functional correctness)
├─ Integration Tests (component interaction)
└─ Security Tests (automated security checks)
    ↓
Testing Phase:
├─ DAST on staging (OWASP ZAP)
├─ Penetration Testing (manual security audit)
└─ Performance Testing (load/stress tests)
    ↓
Deployment Phase:
├─ Container Scanning (Docker image vulnerabilities)
├─ Infrastructure Scanning (Terraform/CloudFormation)
└─ Deployment Validation (smoke tests)
    ↓
Production Phase:
├─ Runtime Monitoring (RASP, WAF logs)
├─ Vulnerability Monitoring (new CVE alerts)
└─ Periodic Re-scanning (scheduled DAST)
```

**Key Insight**: Security is a continuous process spanning the entire software lifecycle, not a single gate before deployment.

## Challenges and Solutions

**Challenge**: ZAP scan failing with "connection refused" even though application was running.

**Root Cause**: Application takes 30 seconds to start, ZAP starts scanning immediately.

**Solution**: Implemented robust wait logic with health check endpoint:
```bash
timeout 120 bash -c 'until curl -f http://localhost:5000/health; do
  echo "Waiting (attempt $i)..."
  sleep 5
done'
```

**Learning**: Distributed systems require retry logic and patience. Fail-fast doesn't work with timing-dependent operations.

---

**Challenge**: Full ZAP scan taking 45 minutes, blocking entire CI/CD pipeline.

**Solution**: Implemented tiered scanning strategy:
- PR: Baseline scan (2 min) - blocks merge
- Master: API scan (10 min) - runs async
- Scheduled: Full scan (45 min) - nightly, doesn't block

**Learning**: Security must balance thoroughness with velocity. Use time appropriately—fast feedback in development, comprehensive testing in background.

---

**Challenge**: ZAP reporting 50+ security findings, overwhelming the team.

**Solution**: 
1. Categorized by risk (HIGH/MEDIUM/LOW)
2. Prioritized HIGH findings only
3. Created weekly "security fix" time
4. Tuned rules to reduce false positives

**Learning**: Perfect security on day one is impossible. Incremental improvement with clear priorities is the practical approach.

---

**Challenge**: DAST finding vulnerabilities that SAST missed, questioning SAST value.

**Example**: Missing X-Frame-Options header (DAST finds, SAST can't)

**Resolution**: Understood that SAST and DAST find different issue types:
- SAST: Code-level logic vulnerabilities
- DAST: Configuration and runtime issues

**Learning**: Each tool has strengths. Comprehensive security requires both, not either/or.

## Advanced Concepts Mastered

### 1. Authentication Testing with ZAP

Learned to configure ZAP for authenticated scans:

**Challenge**: Most applications require login, ZAP needs to maintain authenticated sessions.

**Solution**: Created authentication configuration:
```yaml
auth:
  type: form
  loginUrl: http://localhost:5000/login
  loginRequestData: username={%username%}&password={%password%}
  loggedInIndicator: '\QWelcome\E'
```

**Why This Matters**: Many vulnerabilities only appear after authentication (authorization flaws, data leakage). Testing only public pages misses most of the application.

### 2. API Security Testing

Discovered ZAP's specialized API testing capabilities:

**OpenAPI Integration**:
```bash
zap-api-scan.py -t http://localhost:5000 -f openapi -d openapi.json
```

**Benefits**:
- Tests all endpoints defined in spec
- Validates request/response schemas
- Tests authentication per endpoint
- Identifies API-specific vulnerabilities (BOLA, mass assignment)

**Key Learning**: Modern applications are API-first. Generic web scanning misses API-specific security issues.

### 3. SARIF Integration for Unified Security View

Learned to unify security findings across tools:

**Problem**: SonarCloud, Snyk, and ZAP all report findings differently.

**Solution**: Convert all to SARIF (Standard Format for Static Analysis Results):
```yaml
- Convert SonarCloud to SARIF
- Convert Snyk to SARIF  
- Convert ZAP to SARIF
- Upload all to GitHub Security tab
```

**Result**: Single pane of glass for all security findings, regardless of source tool.

**Strategic Value**: Unified view enables holistic security management, not tool-by-tool firefighting.

## Understanding the Complete Security Picture

This practical, combined with Practicals 4 and 4a, gave me comprehensive security coverage understanding:

**Security Coverage Matrix**:

| Tool | Tests What | Finds What | When to Run |
|------|-----------|-----------|-------------|
| **SonarCloud** | Source code | Logic vulnerabilities, code smells | Every commit |
| **Snyk** | Dependencies | Known CVEs in libraries | Every commit |
| **OWASP ZAP** | Running app | Runtime/config vulnerabilities | Before deployment |

**Coverage Gaps Without DAST**:
- Missing security headers → Only DAST finds
- SSL/TLS configuration → Only DAST validates
- Actual exploitability → Only DAST confirms
- Authentication flaws → Only DAST tests flows
- Server misconfiguration → Only DAST detects

**Key Realization**: Each tool covers different attack vectors. Complete security requires:
1. **SAST**: What you write
2. **Dependency Scanning**: What you import
3. **DAST**: What you deploy

## Cost-Benefit Analysis of DAST

I learned to think economically about security tooling:

**DAST Costs**:
- CI/CD runtime (30+ minutes for full scans)
- Infrastructure (running test environments)
- False positive investigation time
- Initial setup and tuning effort

**DAST Benefits**:
- Prevents runtime security incidents
- Validates actual security posture
- Finds configuration issues SAST cannot
- Provides compliance evidence (PCI DSS, SOC 2)
- Reduces penetration testing costs

**ROI Calculation**:
- Cost of DAST: ~$50/month + 2 hours/week tuning = ~$300/month
- Cost of security breach: $100K - $1M+ 
- Break-even: Preventing 1 incident in 3-10 years

**Conclusion**: Overwhelmingly positive ROI, even if DAST prevents only occasional incidents.

## Future Applications and Career Impact

This practical prepared me for:

1. **DevSecOps Engineering**: Implementing security automation in CI/CD
2. **Security Architecture**: Designing defense-in-depth strategies
3. **Compliance**: Meeting DAST requirements for PCI DSS, SOC 2
4. **Penetration Testing**: Understanding attacker methodologies
5. **Application Security**: Holistic view of application security testing

## Conclusion

This practical completed my security testing education by introducing DAST, the "outside-in" perspective that complements SAST's "inside-out" view. I learned that source code analysis, while valuable, cannot detect runtime configuration issues, server misconfigurations, or validate actual exploitability.

The most valuable lesson was understanding that security tools are complementary, not competitive. SonarCloud excels at finding code-level vulnerabilities; Snyk specializes in dependency management; OWASP ZAP validates runtime security. Together, they provide comprehensive coverage.

DAST integration taught me practical DevOps challenges beyond security—orchestrating test environments, managing timing dependencies, balancing scan depth with pipeline speed. These are universal challenges in CI/CD automation, applicable far beyond security.

The progressive scanning strategy—baseline in PRs, full scans scheduled—demonstrated how to balance security thoroughness with developer velocity. Perfect security immediately is impossible; continuous improvement is achievable.

Most importantly, this practical taught me to think like an attacker. DAST doesn't just report missing headers—it demonstrates actual exploitation paths. This perspective transforms security from checkbox compliance to genuine risk mitigation.

The combination of SAST (Practicals 4, 4a) and DAST (Practical 4b) provides complete security testing coverage. I now understand not just individual tools, but how to architect a comprehensive security pipeline that catches vulnerabilities at every stage—from code commit to production deployment.

This knowledge is immediately applicable and increasingly essential. As applications become more complex and attack surfaces expand, automated security testing transitions from "nice to have" to "business critical." This practical provided both the technical skills and strategic mindset to implement effective application security in any organization.