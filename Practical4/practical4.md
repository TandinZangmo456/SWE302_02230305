# Practical 4: Learning Report on SAST with Snyk and GitHub Actions

## Github Repository : https://github.com/TandinZangmo456/cicd-demo.git

## Overview
This practical introduced me to Static Application Security Testing (SAST) using Snyk integrated with GitHub Actions. I learned how to automate security vulnerability detection in code and dependencies, making security an integral part of the CI/CD pipeline rather than an afterthought. The hands-on experience with the cicd-demo Spring Boot project provided practical insights into implementing DevSecOps practices.

## Key Concepts Learned

### 1. Understanding SAST (Static Application Security Testing)

I learned that SAST is fundamentally different from traditional testing approaches:

**Key Characteristics**:
- Analyzes source code without executing it (white-box testing)
- Identifies security vulnerabilities early in the development cycle
- Examines code structure, data flow, and dependencies
- Provides actionable remediation advice

**SAST vs DAST**:
- **SAST**: Examines code at rest, finds issues before deployment
- **DAST**: Tests running applications, finds runtime vulnerabilities

This "shift-left" approach to security means finding and fixing vulnerabilities when they're cheapest to resolve—during development rather than in production.

### 2. Snyk as a Developer-First Security Platform

I discovered that Snyk is more than just a vulnerability scanner:

**Comprehensive Security Coverage**:
- **Dependency scanning**: Identifies vulnerable open-source libraries
- **License compliance**: Ensures legal compliance of dependencies
- **Container security**: Scans Docker images for vulnerabilities
- **Infrastructure as Code**: Validates Terraform/CloudFormation security
- **Code security**: Performs SAST on application code

**Developer-Friendly Features**:
- Clear, actionable remediation advice
- Direct integration with development workflows
- Prioritized vulnerability reports with severity levels
- Automated fix pull requests

### 3. GitHub Actions Integration Architecture

I learned how security scanning fits into the CI/CD pipeline:

**Workflow Structure**:
```yaml
jobs:
  test:           # Run tests first
  security:       # Then run security scan
    needs: test   # Dependency ensures tests pass first
```

**Key Integration Benefits**:
- Automated scanning on every push/pull request
- Early feedback on security issues
- Prevents vulnerable code from reaching production
- Historical tracking of security posture

The `needs: test` dependency taught me the importance of workflow orchestration—security scans only run if tests pass, saving resources and providing faster feedback on functional issues first.

### 4. GitHub Secrets Management

I learned the critical importance of secure credential management:

**Best Practices Learned**:
- Never commit API tokens to version control
- Use GitHub Secrets for sensitive data
- Secrets are encrypted and only exposed to workflow runners
- Access secrets using `${{ secrets.SECRET_NAME }}` syntax

**Security Implications**:
- Compromised tokens could allow unauthorized access
- Token rotation should be part of security policy
- Minimum necessary permissions principle applies

This hands-on experience with secrets management reinforced that security isn't just about code—it's about the entire development infrastructure.

### 5. Vulnerability Severity Levels and Thresholds

Understanding how to interpret and act on vulnerability reports was crucial:

**Severity Levels**:
- **Critical**: Immediate action required, exploitable vulnerabilities
- **High**: Serious vulnerabilities requiring prompt attention
- **Medium**: Important issues to address in near term
- **Low**: Minor issues for future consideration

**Configurable Thresholds**:
```yaml
args: --severity-threshold=high --fail-on=upgradable
```

I learned that different projects need different thresholds:
- Production systems: Fail on high/critical
- Development branches: More lenient thresholds
- Legacy systems: Gradual remediation approach

### 6. SARIF Integration with GitHub Security

The SARIF (Static Analysis Results Interchange Format) integration was eye-opening:

**Benefits**:
- Standardized format for security findings
- Native integration with GitHub Security tab
- Consolidated view of all security issues
- Trackable remediation progress

**Implementation**:
```yaml
- name: Upload Snyk results to GitHub Code Scanning
  uses: github/codeql-action/upload-sarif@v2
  with:
    sarif_file: snyk.sarif
```

This integration transforms security findings from ephemeral CI logs into persistent, trackable issues within GitHub's interface.

### 7. Dependency Tree Analysis

I learned how vulnerabilities propagate through dependency trees:

**Key Insights**:
- **Direct dependencies**: Libraries explicitly declared in pom.xml
- **Transitive dependencies**: Libraries your dependencies depend on
- **Dependency paths**: How a vulnerability enters your project

**Example Understanding**:
```
From: spring-boot-starter-web@3.1.2 >
      spring-web@6.0.11 >
      spring-core@6.0.11 (vulnerable)
```

This visualization helps understand that upgrading spring-boot-starter-web will fix the vulnerability in spring-core, even though spring-core isn't directly declared.

### 8. Advanced Scanning Strategies

I discovered multiple approaches to optimize security scanning:

**Matrix Strategy for Parallel Scans**:
```yaml
strategy:
  matrix:
    scan-type: [dependencies, code, container]
```

**Benefits**:
- Faster feedback (parallel execution)
- Separation of concerns (different scan types)
- Easier debugging (isolated failures)

**Conditional Scanning**:
```yaml
if: github.event_name == 'pull_request' || github.ref == 'refs/heads/master'
```

This taught me to optimize CI/CD costs by scanning only when necessary, balancing security with resource efficiency.

### 9. The .snyk Policy File

Learning to manage false positives and acceptable risks was important:

**Use Cases**:
- Ignoring false positives with documented justification
- Accepting known risks with expiration dates
- Custom configuration per project needs

**Example Policy**:
```yaml
ignore:
  "SNYK-JAVA-ORGAPACHECOMMONS-1234567":
    - "*":
        reason: "Not exploitable in our context"
        expires: "2024-12-31T23:59:59.999Z"
```

The expiration date is crucial—it ensures ignored vulnerabilities are revisited periodically.

### 10. Continuous Monitoring vs Point-in-Time Scanning

I learned the distinction between different scanning approaches:

**Snyk Test** (Point-in-Time):
- Scans current state of dependencies
- Runs during CI/CD pipeline
- Immediate feedback on current vulnerabilities

**Snyk Monitor** (Continuous):
```yaml
with:
  command: monitor
```
- Creates ongoing project snapshot in Snyk
- Alerts when new vulnerabilities are discovered
- Monitors deployed applications

This dual approach provides both immediate feedback during development and ongoing protection in production.

### 11. Scheduled Security Scans

Implementing cron-based scanning taught me about proactive security:
```yaml
on:
  schedule:
    - cron: '0 2 * * 1'  # Weekly Monday 2 AM
```

**Why This Matters**:
- New vulnerabilities are discovered daily
- Dependencies don't change, but vulnerability databases do
- Regular scans catch newly disclosed issues
- Compliance requirements may mandate periodic scanning

## Practical Skills Acquired

1. **Snyk Account Setup**: Created developer security account and generated API tokens
2. **GitHub Secrets Configuration**: Secured sensitive credentials in repository settings
3. **Workflow Integration**: Integrated security scanning into existing CI/CD pipelines
4. **Vulnerability Analysis**: Interpreted CVE reports and CVSS scores
5. **Dependency Management**: Updated dependencies to remediate vulnerabilities
6. **SARIF Configuration**: Integrated security findings with GitHub Security tab
7. **Policy Creation**: Developed .snyk files for vulnerability management
8. **Advanced Configuration**: Implemented matrix strategies and conditional scanning
9. **Monitoring Setup**: Configured continuous security monitoring
10. **Troubleshooting**: Resolved common integration and authentication issues

## Real-World Implementation Insights

### The DevSecOps Philosophy

This practical embodied the DevSecOps principle: security as code, not as a separate phase.

**Traditional Approach** (What I used to think):
- Security team scans code before release
- Vulnerabilities discovered late
- Expensive and slow to fix
- Adversarial relationship between dev and security

**DevSecOps Approach** (What I learned):
- Automated security in every commit
- Developers see issues immediately
- Cheap and fast to fix
- Collaborative security culture

### Balancing Security and Development Velocity

I learned that perfect security can paralyze development:

**Practical Balance**:
- Fail builds on critical/high vulnerabilities
- Allow medium/low with tracking
- Use ignore policies judiciously with justification
- Regular security debt review sessions

**Risk-Based Approach**:
- Public-facing APIs: Strictest thresholds
- Internal tools: More permissive
- Proof-of-concepts: Security awareness without blocking
- Production systems: Zero tolerance for known criticals

## Challenges and Solutions

**Challenge**: Initial scan revealed 20+ vulnerabilities, overwhelming to address.

**Solution**: I learned to prioritize:
1. Address critical and high severity first
2. Focus on upgradable vulnerabilities (easy wins)
3. Document acceptable risks for others
4. Create remediation roadmap with timeline

**Challenge**: Build failures slowing down development.

**Solution**: Implemented tiered approach:
- Pull requests: Fail on high/critical only
- Master branch: Strict enforcement
- Development branches: Warning mode
- Scheduled scans: Comprehensive analysis

**Challenge**: False positives in vulnerability reports.

**Solution**: Learned to:
- Verify exploitability in project context
- Document decisions in .snyk file
- Set expiration dates for review
- Collaborate with security team on edge cases

## Understanding the Complete Security Pipeline

The practical taught me to think about security as a pipeline, not a checkpoint:

**Security Pipeline Stages**:
1. **Developer Machine**: IDE plugins for immediate feedback
2. **Pull Request**: Automated scanning on proposed changes
3. **Main Branch**: Strict enforcement before merge
4. **Scheduled**: Regular scans for new vulnerabilities
5. **Production**: Continuous monitoring of deployed apps

Each stage serves a different purpose and has appropriate thresholds.

## Key Insights on Vulnerability Management

### Not All Vulnerabilities Are Equal

I learned that CVE severity doesn't always match actual risk:

**Contextual Risk Assessment**:
- Is the vulnerable code path actually used?
- Is the vulnerability exploitable in our architecture?
- What's the blast radius if exploited?
- Are there compensating controls?

### Dependency Update Strategy

Simply updating to the latest version isn't always the answer:

**Considerations**:
- Breaking changes in major version updates
- Testing requirements for dependency changes
- Compatibility with other dependencies
- Maintenance burden vs. security benefit

**Learned Approach**:
- Prefer patch/minor version updates
- Test thoroughly in staging environments
- Consider alternative libraries if maintained poorly
- Document upgrade blockers

## Broader Security Ecosystem Understanding

This practical connected to wider security practices:

**OWASP Top 10 Connections**:
- A06:2021 - Vulnerable and Outdated Components (directly addressed)
- A05:2021 - Security Misconfiguration (Snyk policies help prevent)
- A01:2021 - Broken Access Control (code scanning can detect)

**Compliance Implications**:
- SOC 2: Demonstrates security control automation
- PCI DSS: Required vulnerability scanning
- ISO 27001: Security testing procedures
- GDPR: Data protection by design

## Team Collaboration and Culture

The practical highlighted security as a team sport:

**Developer Responsibilities**:
- Review security findings in PRs
- Prioritize security debt in sprints
- Share security knowledge with team
- Contribute to security policies

**Security Team Responsibilities**:
- Configure appropriate thresholds
- Review and approve ignore policies
- Provide remediation guidance
- Train developers on security practices

## Cost-Benefit Analysis of SAST

I learned to think about security tooling economically:

**Costs**:
- Tool licensing (Snyk has free tier)
- CI/CD runtime (additional minutes)
- Developer time reviewing findings
- False positive investigation

**Benefits**:
- Prevent security incidents (potentially massive savings)
- Faster remediation (cheaper than production fixes)
- Compliance requirements (avoid fines)
- Customer trust and reputation protection

The ROI is overwhelmingly positive when security issues are prevented early.

## Future Applications and Next Steps

Based on this practical, I can now:

1. **Implement security scanning** in any new project from day one
2. **Extend to other tools**: CodeQL, SonarQube, Checkmarx
3. **Container security**: Apply same principles to Docker images
4. **Infrastructure security**: Scan Terraform/CloudFormation
5. **Security champions**: Evangelize these practices to team members

## Conclusion

This practical fundamentally changed my perspective on application security. I moved from viewing security as a gate to seeing it as a continuous process integrated into every development activity.

The most valuable lesson was that security doesn't have to slow down development—when automated and integrated properly, it accelerates it by catching issues when they're cheapest to fix. The immediate feedback loop of seeing vulnerabilities in pull requests creates a learning opportunity every time.

Snyk's developer-friendly approach demystified security scanning. Instead of cryptic vulnerability reports, I received actionable guidance with specific upgrade paths. The integration with GitHub Actions meant security became invisible infrastructure—always working, rarely noticed, until it prevents a critical vulnerability from reaching production.

Most importantly, I learned that perfect security is impossible and undesirable. The goal is risk management: understanding vulnerabilities, making informed decisions about acceptable risks, and maintaining continuous visibility into the security posture of applications. This practical provided both the tools and the mindset to achieve that goal.

The skills gained here are immediately applicable and increasingly essential—as software supply chain attacks grow, automated dependency scanning transitions from "nice to have" to "must have." This practical provided not just technical skills but a security-first mindset that will influence every line of code I write going forward.