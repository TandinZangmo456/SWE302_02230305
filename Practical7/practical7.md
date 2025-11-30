# Practical 7: Learning Report on Performance Testing with k6

## Overview
This practical introduced me to performance testing using k6, a modern load testing tool designed for developers. I learned to measure how applications perform under different traffic conditions, identify bottlenecks, and ensure systems can handle real-world usage. Unlike previous practicals that focused on functionality (unit tests, integration tests) or security (SAST, DAST), this practical taught me to validate non-functional requirements—speed, stability, and scalability.

## Key Concepts Learned

### 1. Performance Testing: Beyond "Does It Work?"

This practical taught me a fundamental shift in testing mindset:

**Functional Testing** (Previous Practicals):
- Does the feature work correctly?
- Are there bugs in the logic?
- Does it meet requirements?

**Performance Testing** (This Practical):
- How fast does it work?
- How many users can it handle?
- Does it stay stable under load?
- Can it scale?

**Critical Insight**: An application can be functionally correct but unusable if it's too slow. Performance is a feature, not an afterthought.

**Real-World Example**:
```
Feature: User login
Functional test: Login succeeds with correct credentials
Performance test: Login takes 5 seconds under 100 concurrent users
Result: Feature works but provides terrible user experience
```

### 2. Types of Performance Tests

I learned that different test types serve different purposes:

**Smoke Test** (Sanity Check):
```javascript
vus: 1,           // Single user
duration: '30s'   // Quick verification
```
- **Purpose**: Verify application responds at all
- **When**: Before any load testing
- **Answers**: "Is it alive?"

**Load Test** (Sustained Traffic):
```javascript
stages: [
  { duration: '30s', target: 10 },  // Ramp up
  { duration: '1m', target: 10 },   // Sustain
  { duration: '30s', target: 0 }    // Ramp down
]
```
- **Purpose**: Test normal traffic levels
- **When**: Regular testing cycle
- **Answers**: "Can it handle typical usage?"

**Spike Test** (Traffic Surge):
```javascript
stages: [
  { duration: '10s', target: 50 },  // Sudden spike
  { duration: '30s', target: 50 },  // Hold
  { duration: '10s', target: 0 }    // Drop
]
```
- **Purpose**: Test response to sudden traffic increase
- **When**: Before major launches or events
- **Answers**: "What happens during flash sales or viral content?"

**Stress Test** (Breaking Point):
```javascript
stages: [
  { duration: '2m', target: 100 },  // Push to limits
  { duration: '5m', target: 100 },  // Maintain stress
  { duration: '2m', target: 0 }
]
```
- **Purpose**: Find system limits and failure modes
- **When**: Capacity planning
- **Answers**: "At what point does it break?"

**Soak Test** (Long Duration):
```javascript
stages: [
  { duration: '5m', target: 10 },
  { duration: '30m', target: 10 },  // Extended duration
  { duration: '5m', target: 0 }
]
```
- **Purpose**: Detect memory leaks and degradation
- **When**: Before production deployment
- **Answers**: "Does performance degrade over time?"

**Key Learning**: Each test type reveals different issues. Comprehensive testing requires all types.

### 3. Virtual Users (VUs): Simulating Concurrent Traffic

Understanding VUs was fundamental:

**What VUs Do**:
```javascript
export default function() {
  http.get('http://localhost:3000');
  sleep(1);
  http.get('http://localhost:3000/api/dogs');
  sleep(2);
}
```

With 10 VUs, this script runs 10 times simultaneously, each VU:
- Independently executing the function
- Creating realistic concurrent load
- Repeating until test duration ends

**VU Math**:
```
10 VUs × 60 seconds ÷ 3 seconds per iteration = ~200 total iterations
10 VUs × 2 requests per iteration = 20 concurrent requests ongoing
```

**Critical Insight**: VUs ≠ requests per second. VUs simulate users who make multiple requests with think time between them.

**Realistic vs Unrealistic Load**:
```javascript
// Unrealistic (hammering)
export default function() {
  http.get('/api');
  // No sleep - instant repeat
}

// Realistic (human behavior)
export default function() {
  http.get('/api');
  sleep(2);  // User reads response
}
```

### 4. Percentiles: Understanding User Experience Distribution

Percentiles were a revelation for understanding performance:

**Average Can Be Misleading**:
```
Scenario: 99 requests at 100ms, 1 request at 10,000ms
Average: 199ms (looks okay!)
Reality: One user waited 10 seconds (terrible!)
```

**Percentiles Tell the Truth**:
```
http_req_duration: 
  avg=199ms     (misleading)
  p(50)=100ms   (median - typical user)
  p(90)=100ms   (90% of users)
  p(95)=100ms   (95% of users)
  p(99)=10000ms (worst 1% - the problem!)
```

**Standard Targets I Learned**:
- **p(50) - Median**: Typical user experience
- **p(95)**: Good SLA target (95% of users satisfied)
- **p(99)**: Catches outliers (ensure no one has terrible experience)

**Threshold Strategy**:
```javascript
thresholds: {
  'http_req_duration': ['p(95)<500'],  // 95% under 500ms
}
```

**Key Insight**: Focus on p(95) or p(99), not average. A few slow requests can ruin user experience even if average looks good.

### 5. Checks vs Thresholds: Validation and Success Criteria

Learning the distinction between checks and thresholds was important:

**Checks** (Assertions During Test):
```javascript
check(response, {
  'status is 200': (r) => r.status === 200,
  'response time < 500ms': (r) => r.timings.duration < 500,
});
```
- Non-blocking (test continues if they fail)
- Reported as percentages
- Used for validation during execution

**Thresholds** (Pass/Fail Criteria):
```javascript
thresholds: {
  'http_req_duration': ['p(95)<500'],
  'http_req_failed': ['rate<0.01'],
}
```
- Blocking (determine test success/failure)
- Reported with success or failure
- Used for automated CI/CD decisions

**Test Results**:
```
checks........................: 98.5%  ← Good but not perfect
http_req_duration.............: p(95)=445ms (threshold < 500ms)
http_req_failed...............: 1.5% (threshold < 1%)
```

**Practical Application**:
- **Checks**: Validate individual responses during test
- **Thresholds**: Determine if system meets performance SLA
- **Both needed**: Checks show what's wrong, thresholds decide if it's acceptable

### 6. Ramping Strategies: Realistic Load Patterns

I learned that how you apply load matters as much as the load itself:

**Bad: Instant Load**:
```javascript
vus: 100,  // All 100 VUs start instantly
duration: '5m'
```
- Shocks the system
- Doesn't mimic reality
- Can cause false failures

**Good: Gradual Ramp**:
```javascript
stages: [
  { duration: '2m', target: 100 },   // Gradual increase
  { duration: '5m', target: 100 },   // Sustained
  { duration: '2m', target: 0 }      // Gradual decrease
]
```
- Mimics organic traffic growth
- Allows system to warm up (caches, connection pools)
- Shows performance degradation patterns

**Spike Pattern** (Special Case):
```javascript
stages: [
  { duration: '10s', target: 200 },  // Sudden spike
  { duration: '1m', target: 200 },
  { duration: '10s', target: 0 }
]
```
- Tests system resilience
- Simulates real events (product launches, viral content)
- Reveals scalability issues

**Key Learning**: Real users don't all arrive at once. Ramping reveals how systems behave under realistic traffic patterns.

### 7. Custom Metrics: Tracking Application-Specific Behavior

Beyond built-in metrics, I learned to track custom measurements:

**Built-in Metrics** (Automatic):
- `http_req_duration`: Total request time
- `http_req_failed`: Failed request rate
- `http_reqs`: Total requests

**Custom Metrics** (Application-Specific):
```javascript
import { Trend, Counter, Rate, Gauge } from 'k6/metrics';

const dogFetchTime = new Trend('dog_fetch_duration');
const totalDogsViewed = new Counter('total_dogs_viewed');
const errorRate = new Rate('errors');
const activeBreeds = new Gauge('active_breeds');

export default function() {
  let start = Date.now();
  let response = http.get('/api/dogs');
  dogFetchTime.add(Date.now() - start);
  
  if (response.status === 200) {
    totalDogsViewed.add(1);
  } else {
    errorRate.add(1);
  }
}
```

**Metric Types**:
- **Trend**: Calculates statistics (min, max, avg, percentiles)
- **Counter**: Cumulative sum
- **Rate**: Percentage (errors, successes)
- **Gauge**: Latest value (current state)

**Why Custom Metrics Matter**:
- Track business-specific KPIs
- Measure feature-level performance
- Correlate technical and business metrics

**Example**: "Total dogs viewed" helps product team understand user engagement, not just technical performance.

### 8. Realistic User Journeys: Think Time and Flow

Simulating actual user behavior was crucial:

**Unrealistic Test**:
```javascript
export default function() {
  http.get('/');
  http.get('/api/dogs');
  http.get('/api/breeds');
  // Instant sequence - not human behavior
}
```

**Realistic Test**:
```javascript
export default function() {
  // 1. User visits homepage
  http.get('/');
  sleep(2);  // Reads page
  
  // 2. Clicks "Get Random Dog"
  http.get('/api/dogs');
  sleep(5);  // Enjoys the dog photo
  
  // 3. Selects a breed
  http.get('/api/dogs?breed=husky');
  sleep(3);  // Views breed-specific dog
}
```

**Think Time Rationale**:
- `sleep(2)`: Reading text content
- `sleep(5)`: Viewing images/videos
- `sleep(1)`: Quick interaction (button click)
- `sleep(10+)`: Form filling, complex tasks

**Key Insight**: Tests without think time create artificial "hammering" that doesn't reflect real usage and may show performance issues that won't occur in production.

### 9. Error Rates: Speed Means Nothing If It Fails

I learned that fast responses don't matter if they're errors:

**Misleading Results**:
```
http_req_duration: avg=50ms  (very fast!)
http_req_failed: 45%         (almost half fail!)
```

**Good Performance Requires Both**:
```
http_req_duration: avg=250ms
http_req_failed: 0.5%
```

**Error Rate Targets**:
- **< 0.1%**: Excellent (99.9% success)
- **< 1%**: Good (99% success)
- **< 5%**: Acceptable for non-critical systems
- **> 5%**: Problem requiring investigation

**Threshold Configuration**:
```javascript
thresholds: {
  'http_req_duration': ['p(95)<500'],  // Speed
  'http_req_failed': ['rate<0.01'],    // Reliability
}
```

**Real-World Priority**: A slow but reliable system is often better than a fast but flaky system.

### 10. Interpreting Test Results: What to Look For

Learning to read k6 output was essential:

**Good Performance Indicators**:
```
http_req_duration.............: avg=245ms p(95)=456ms
http_req_failed...............: 0.00%
checks........................: 100.00%
```
- Response times within targets
- No failed requests
- All checks passing

**Warning Signs**:
```
http_req_duration.............: avg=245ms p(99)=3456ms
http_req_failed...............: 2.3%
checks........................: 87.5%
```
- High p(99) suggests some users have bad experience
- Some failed requests (investigate causes)
- Some checks failing (logic errors or timeouts)

**Critical Issues**:
```
http_req_duration.............: avg=5678ms p(95)=8934ms
http_req_failed...............: 23.5%
checks........................: 45.2%
```
- System is overloaded
- High failure rate
- Needs immediate investigation

**Progressive Degradation**:
```
Start: avg=200ms → Middle: avg=500ms → End: avg=1200ms
```
- Performance degrades over time
- Possible memory leak or resource exhaustion
- Common in soak tests

## Practical Skills Acquired

1. **k6 Installation**: Set up k6 on different platforms
2. **Test Script Writing**: Created JavaScript-based performance tests
3. **Test Configuration**: Used options, stages, and thresholds
4. **Smoke Testing**: Verified basic functionality before load testing
5. **Load Pattern Design**: Created realistic traffic simulations
6. **Metrics Analysis**: Interpreted percentiles and error rates
7. **Custom Metrics**: Tracked application-specific measurements
8. **User Journey Simulation**: Modeled realistic user behavior
9. **Threshold Definition**: Set appropriate pass/fail criteria
10. **Results Interpretation**: Identified performance issues from output

## Understanding Performance Testing Workflow

This practical taught me a systematic approach:

**1. Baseline (No Load)**:
```bash
# Single user, establish baseline
k6 run --vus 1 --duration 30s script.js
```
- Document baseline performance
- Verify functionality
- Set expectations

**2. Light Load**:
```bash
# 10 users, sustained
k6 run --vus 10 --duration 2m script.js
```
- Test typical traffic
- Validate thresholds
- Identify obvious issues

**3. Medium Load**:
```bash
# 50 users, sustained
k6 run --vus 50 --duration 5m script.js
```
- Push beyond typical load
- Find early warnings
- Plan capacity

**4. Stress Test**:
```bash
# 100+ users, find limits
k6 run --vus 100 --duration 10m script.js
```
- Identify breaking point
- Plan scaling strategy
- Set alerts

**Key Principle**: Start small, increase gradually. Each test informs the next.

## Real-World Applications

**Scenario 1: Pre-Launch Testing**

Before launching a new feature:
1. Smoke test: Verify it works
2. Load test: Ensure it handles expected traffic
3. Spike test: Prepare for launch day surge
4. Set monitoring alerts based on test results

**Scenario 2: Investigating Production Issues**

Users report slowness:
1. Replicate production traffic patterns in k6
2. Identify which endpoints are slow
3. Find the breaking point
4. Optimize and re-test
5. Validate fix before deploying

**Scenario 3: Capacity Planning**

Planning for growth:
1. Current traffic: 100 concurrent users
2. Expected growth: 500 users in 6 months
3. Stress test with 500 VUs
4. Identify bottlenecks before they impact users
5. Plan infrastructure scaling

## Challenges and Solutions

**Challenge**: Initial tests failed with 100% error rate.

**Root Cause**: Forgot to start Next.js dev server before running tests.

**Solution**:
```bash
# Terminal 1
pnpm dev

# Terminal 2 (wait for "Ready on http://localhost:3000")
k6 run tests/k6/smoke-test.js
```

**Learning**: Always verify application is running before testing.

---

**Challenge**: Test showed p(95)=50ms but application felt slow.

**Root Cause**: Test wasn't realistic—no think time, only API calls without page rendering.

**Solution**:
```javascript
// Added page loads, not just API calls
http.get('http://localhost:3000');  // Full page render
sleep(2);
http.get('http://localhost:3000/api/dogs');
sleep(1);
```

**Learning**: Test what users actually experience, including page rendering time.

---

**Challenge**: Soak test showed performance degradation over 30 minutes.

**Symptoms**:
```
Start: avg=200ms
10min: avg=300ms
20min: avg=500ms
30min: avg=800ms
```

**Root Cause**: Memory leak in application (not cleaning up resources).

**Learning**: Soak tests reveal issues that short tests miss. Essential for production readiness.

## Understanding the Complete Testing Picture

This practical completed my testing knowledge:

**Testing Pyramid Extended**:
```
      /\
     /  \    E2E Tests (user flows)
    /____\   
   /      \  Integration Tests (components together)
  /________\ 
 /          \ Unit Tests (individual functions)
/____________\
      |
      |       ← NEW: Performance Tests (non-functional)
      |          - How fast?
      |          - How many users?
      |          - How stable?
```

**When Each Test Type Matters**:
- **Unit**: Is the function logic correct?
- **Integration**: Do components work together?
- **E2E**: Does the user flow work?
- **Performance**: Does it work fast enough at scale?
- **Security** (P4, 4a, 4b): Is it secure?

**All Required**: Different tests catch different issues. Skip any layer at your own risk.

## Conclusion

This practical taught me that performance testing is essential, not optional. An application that works correctly but performs poorly will fail to meet user expectations.

The most valuable lesson was understanding that performance testing isn't about finding a single number—it's about understanding system behavior under different conditions. Smoke tests verify functionality, load tests validate normal usage, spike tests check resilience, stress tests find limits, and soak tests reveal degradation.

Learning to read percentiles (p95, p99) instead of averages changed how I think about performance. A fast average with a slow p99 means some users have terrible experiences, which is unacceptable even if most users are satisfied.

k6's developer-friendly approach—JavaScript tests, CLI-first, clear output—made performance testing accessible. Previously, performance testing seemed like a specialized skill requiring complex tools. Now I understand it's achievable with straightforward scripts and systematic testing.

The concept of virtual users simulating realistic behavior with think time was crucial. Tests that hammer endpoints without pause create artificial scenarios that don't reflect real usage. Realistic simulations provide actionable insights.

Most importantly, I learned that performance testing must happen before production, not after users complain. Just like unit tests prevent bugs and security scans prevent vulnerabilities, performance tests prevent poor user experiences.

Combined with previous practicals—unit testing (P2), integration testing (P5), security testing (P4, 4a, 4b), and deployment automation (P6, 6a, 6 EC2)—I now have comprehensive knowledge of software quality assurance. Each practical taught a different dimension of "quality," and performance testing completes the picture.

The skills gained here—k6 scripting, metrics interpretation, load pattern design, realistic simulation—are immediately applicable to any web application and essential for professional software development where user experience directly impacts business success.