# Practical 5: Learning Report on Integration Testing with TestContainers

## Github repository : https://github.com/TandinZangmo456/swe302p5.git

## Overview
This practical introduced me to integration testing using TestContainers, a revolutionary approach to testing code that interacts with databases and external services. Unlike the previous practicals that focused on unit testing (Practical 2) and security testing (Practicals 4, 4a, 4b), this practical taught me to test components working together with real dependencies. I learned that effective testing requires multiple layers—unit tests for logic, integration tests for interactions, and end-to-end tests for workflows.

## Key Concepts Learned

### 1. Understanding Integration Testing vs Unit Testing

This practical clarified the distinction between different testing levels:

**Unit Testing (from Practical 2)**:
- Tests individual functions in isolation
- Uses mocks for dependencies
- Fast execution (milliseconds)
- Tests "does this function work correctly?"

**Integration Testing (this practical)**:
- Tests multiple components together
- Uses real dependencies (actual databases)
- Slower execution (seconds)
- Tests "do these components work together correctly?"

**Critical Insight**: Unit tests can pass while the integrated system fails. Example:
```go
// Unit test: Function logic is correct
func TestCalculateTotal(t *testing.T) {
    result := CalculateTotal(10, 5)
    assert.Equal(t, 15, result) // Passes
}

// Integration test: Database interaction fails
func TestSaveOrder(t *testing.T) {
    order := SaveOrder(10, 5) // Fails - SQL syntax error
}
```

The unit test passes because the calculation logic is correct, but integration testing reveals the SQL query has a syntax error. **Both levels are essential.**

### 2. The Problem with Traditional Database Testing Approaches

I learned why previous database testing methods are inadequate:

**Approach 1: In-Memory Databases (H2, SQLite)**

**Problem**: Different SQL dialects cause false confidence
```go
// Works in H2 (test database)
INSERT INTO users VALUES (DEFAULT, 'test@example.com', 'Test')

// Fails in PostgreSQL (production)
// PostgreSQL requires explicit column names
```

**Learning**: Tests pass, production fails. In-memory databases don't catch dialect-specific issues.

**Approach 2: Shared Test Database**

**Problem**: Tests interfere with each other
```
Test A: Creates user with ID=1
Test B: Expects user ID=1 to not exist
Result: Test B fails because Test A's data persists
```

**Learning**: Shared state creates flaky tests—sometimes pass, sometimes fail, depending on execution order.

**Approach 3: Mocked Databases**

**Problem**: Doesn't test actual SQL queries
```go
// Mock returns whatever you tell it to
mock.ExpectQuery("SELECT").WillReturnRows(mockRows)

// Real database might have:
// - Syntax errors in SQL
// - Constraint violations
// - Performance issues
```

**Learning**: Mocks test expectations, not reality. Real database behavior differs from assumptions.

**TestContainers Solution**: Real database in isolated containers
- Actual PostgreSQL (same as production)
- Each test gets clean state
- Tests real SQL queries
- Automatic cleanup

### 3. TestContainers Architecture and Lifecycle

Understanding how TestContainers works was fundamental:

**Lifecycle Flow**:
```
1. Test starts
   ↓
2. TestContainers pulls Docker image (if not cached)
   ↓
3. Container starts with PostgreSQL
   ↓
4. Wait strategy ensures database is ready
   ↓
5. Init scripts create schema and test data
   ↓
6. Test connects to container via dynamic port
   ↓
7. Test executes database operations
   ↓
8. Test completes
   ↓
9. Container automatically terminates
   ↓
10. All data destroyed (clean slate for next test)
```

**Key Learning**: Containers are ephemeral—they exist only during tests. This ensures:
- No leftover data between test runs
- No port conflicts (random ports)
- No manual cleanup needed
- Tests can run in parallel

### 4. The TestMain Pattern for Global Setup

I learned a powerful Go testing pattern for expensive setup:

**Problem**: Starting a container for every test function is slow:
```go
func TestUser1(t *testing.T) {
    container := startContainer() // 5 seconds
    defer container.Terminate()
    // 0.1 second test
}

func TestUser2(t *testing.T) {
    container := startContainer() // Another 5 seconds
    defer container.Terminate()
    // 0.1 second test
}
// Total: 10+ seconds for 0.2 seconds of actual testing
```

**Solution**: TestMain runs once for entire package:
```go
var testDB *sql.DB // Shared across all tests

func TestMain(m *testing.M) {
    // Setup: Start container ONCE
    container := startContainer() // 5 seconds
    testDB = connectToContainer(container)
    
    // Run ALL tests
    code := m.Run()
    
    // Teardown: Stop container ONCE
    container.Terminate()
    os.Exit(code)
}
// Total: 5 seconds setup + 0.2 seconds testing = 5.2 seconds
```

**Trade-off Understanding**:
- **Pros**: Much faster test suite
- **Cons**: Tests share database (need isolation strategies)

**Key Learning**: Balance speed vs isolation. For most cases, shared container with proper cleanup is optimal.

### 5. Wait Strategies: Ensuring Container Readiness

A critical lesson about distributed system timing:

**Problem**: Container starts before database is ready
```go
container := startContainer()
db.Connect() // Connection refused - DB still initializing
```

**Wait Strategy Solution**:
```go
wait.ForLog("database system is ready to accept connections").
    WithOccurrence(2).              // PostgreSQL logs this twice
    WithStartupTimeout(5*time.Second)
```

**Why This Matters**: Distributed systems need retry logic. Things don't happen instantly:
- Network connections take time
- Databases need initialization
- Services have startup sequences

**Real-World Parallel**: This mirrors production systems—health checks, readiness probes, circuit breakers all address the same timing issue.

### 6. Dynamic Port Mapping and Connection Strings

I learned why static ports don't work in containerized testing:

**Problem with Static Ports**:
```go
// Test tries to use port 5432
container := startContainer(5432)
// Error: Port 5432 already in use
```

**TestContainers Solution**:
```go
// Let container assign random port
container := startContainer()

// Get actual assigned port dynamically
connStr, err := container.ConnectionString(ctx, "sslmode=disable")
// connStr = "postgres://user:pass@localhost:54321/db"
//                                            ^^^^^ random port
```

**Benefits**:
- No port conflicts
- Parallel test execution possible
- Works in any environment (CI/CD, local, etc.)

**Key Learning**: Embrace dynamic configuration. Hardcoded values create brittleness; dynamic discovery creates flexibility.

### 7. Database Schema Management with Init Scripts

TestContainers' init script capability taught me about test data management:

**Configuration**:
```go
postgres.WithInitScripts("../migrations/init.sql")
```

**What This Does**:
1. Container starts
2. PostgreSQL initializes
3. `init.sql` automatically executes
4. Schema and seed data ready before tests run

**Strategic Value**: Deterministic test environment
```sql
-- init.sql creates known state
CREATE TABLE users (id SERIAL PRIMARY KEY, ...);
INSERT INTO users VALUES (1, 'alice@example.com', 'Alice');
INSERT INTO users VALUES (2, 'bob@example.com', 'Bob');
```

Now every test knows: "Users with IDs 1 and 2 exist with known data."

**Real-World Application**: This mirrors database migrations in production—version-controlled schema changes that run automatically.

### 8. Test Isolation Strategies

Managing test isolation while sharing containers was a critical learning:

**Strategy 1: Cleanup with Defer**
```go
func TestCreate(t *testing.T) {
    user := repo.Create("temp@example.com", "Temp")
    defer repo.Delete(user.ID) // Always cleanup, even if test fails
    
    // Test assertions...
}
```

**Why Defer**: Even if test panics or fails assertions, cleanup runs. This prevents test pollution.

**Strategy 2: Transaction Rollback**
```go
func TestWithTransaction(t *testing.T) {
    tx, _ := db.Begin()
    defer tx.Rollback() // Automatically undo everything
    
    // All operations in transaction
    repo := NewRepository(tx)
    repo.Create(...)
    repo.Update(...)
    
    // Test assertions...
    
    // Rollback means database unchanged after test
}
```

**Advantage**: Faster than deleting individual records. **Disadvantage**: Doesn't test transaction logic itself.

**Strategy 3: Fresh Container Per Test**
```go
func TestIsolated(t *testing.T) {
    container := startFreshContainer() // New container
    defer container.Terminate()
    
    db := connect(container)
    // Completely isolated test
}
```

**Advantage**: Perfect isolation. **Disadvantage**: Slow (5+ seconds per test).

**Key Learning**: Choose isolation strategy based on test needs. Most tests: shared container + cleanup. Critical tests: fresh container.

### 9. Testing CRUD Operations Against Real Databases

Actually writing integration tests taught me what to verify beyond unit test coverage:

**Unit Test (Practical 2 approach)**:
```go
func TestCalculateUserAge(t *testing.T) {
    age := CalculateAge("1990-01-01")
    assert.Equal(t, 34, age)
}
```

**Integration Test (This practical)**:
```go
func TestCreateUser(t *testing.T) {
    user := repo.Create("test@example.com", "Test User")
    
    // Verify database-specific behaviors
    assert.NotZero(user.ID)            // Auto-increment worked
    assert.NotZero(user.CreatedAt)     // Default timestamp worked
    
    // Verify constraints
    _, err := repo.Create("test@example.com", "Duplicate")
    assert.Error(err) // Unique constraint enforced
    
    // Verify persistence
    retrieved := repo.GetByID(user.ID)
    assert.Equal(user.Email, retrieved.Email) // Data actually saved
}
```

**What Integration Tests Catch**:
- SQL syntax errors
- Database constraints (unique, foreign key, check)
- Default values and auto-increments
- Data type mismatches
- Actual persistence (not just in-memory objects)

**Example Real Bug Found**:
```go
// Code that passes unit tests but fails integration
func Create(email, name string) (*User, error) {
    query := "INSERT INTO users (email, name) VALUES ($1, $2)"
    // Forgot RETURNING clause - ID will be zero
    db.Exec(query, email, name)
    return &User{Email: email, Name: name}, nil
}
```

Unit test doesn't catch this because it doesn't verify database behavior. Integration test immediately shows `user.ID == 0`.

### 10. Understanding Connection Pooling and Resource Management

Working with real databases taught me about resource management:

**Problem**: Database connections are limited
```go
// Bad: Creates new connection for each test
func TestSomething(t *testing.T) {
    db := sql.Open(...) // New connection
    // Use db
    // Never closed - connection leak
}
```

**Solution**: Connection pool shared across tests
```go
var testDB *sql.DB // Package-level pool

func TestMain(m *testing.M) {
    testDB = sql.Open(...) // One connection pool
    testDB.SetMaxOpenConns(25)
    defer testDB.Close()
    
    m.Run()
}

func TestSomething(t *testing.T) {
    // Use shared testDB - connection from pool
    repo := NewRepository(testDB)
    // Connection automatically returned to pool after query
}
```

**Key Concepts Learned**:
- `sql.DB` is a connection pool, not a single connection
- Connections are borrowed and returned automatically
- `SetMaxOpenConns` prevents overwhelming database
- Proper cleanup prevents connection leaks

**Real-World Relevance**: Production applications use the same pattern—connection pools are fundamental to database performance.

### 11. Error Handling in Database Testing

Integration testing revealed the importance of error handling:

**Unit Test Error Handling**:
```go
result, err := DoSomething()
assert.NoError(err)
```

**Integration Test Error Handling**:
```go
// Test success case
user, err := repo.Create("valid@example.com", "Valid")
assert.NoError(err)
assert.NotNil(user)

// Test constraint violation
_, err = repo.Create("valid@example.com", "Duplicate")
assert.Error(err) // Must handle this

// Test not found
_, err = repo.GetByID(9999)
assert.Error(err) // Must handle this too

// Test network issues (timeout)
ctx, cancel := context.WithTimeout(context.Background(), 1*time.Millisecond)
defer cancel()
_, err = repo.GetByIDWithContext(ctx, 1)
assert.Error(err) // Timeout must be handled
```

**Key Learning**: Integration tests expose error paths that unit tests miss:
- Constraint violations
- Not found scenarios
- Network timeouts
- Transaction conflicts

### 12. Table-Driven Testing for Integration Tests

Combining table-driven tests with real databases was powerful:

**Pattern**:
```go
func TestCreate_Scenarios(t *testing.T) {
    testCases := []struct {
        name        string
        email       string
        userName    string
        expectError bool
        errorMsg    string
    }{
        {"Valid", "valid@ex.com", "Valid User", false, ""},
        {"Duplicate Email", "alice@example.com", "Dup", true, "unique"},
        {"Empty Email", "", "No Email", true, "not null"},
        {"Long Name", "long@ex.com", strings.Repeat("A", 300), true, "too long"},
    }
    
    repo := NewUserRepository(testDB)
    
    for _, tc := range testCases {
        t.Run(tc.name, func(t *testing.T) {
            user, err := repo.Create(tc.email, tc.userName)
            
            if tc.expectError {
                assert.Error(t, err)
                assert.Contains(t, err.Error(), tc.errorMsg)
            } else {
                assert.NoError(t, err)
                assert.NotNil(t, user)
                defer repo.Delete(user.ID) // Cleanup
            }
        })
    }
}
```

**Benefits**:
- Tests multiple scenarios with real database
- Easy to add new cases
- Each case tests actual constraints
- Discovers database-specific error messages

### 13. Advanced: Testing Transactions

Testing transactional behavior was enlightening:

**Concept**: Multiple operations must succeed or fail together

**Test Implementation**:
```go
func TestTransactionRollback(t *testing.T) {
    // Count before
    countBefore, _ := repo.CountUsers()
    
    // Start transaction
    tx, _ := testDB.Begin()
    
    // Operations in transaction
    tx.Exec("INSERT INTO users ...")
    tx.Exec("INSERT INTO users ...")
    
    // Simulate error - rollback
    tx.Rollback()
    
    // Verify count unchanged
    countAfter, _ := repo.CountUsers()
    assert.Equal(t, countBefore, countAfter)
}
```

**What This Tests**:
- Atomicity: All or nothing
- Isolation: Other queries don't see uncommitted data
- Consistency: Database remains in valid state
- Durability: Committed data persists (ACID properties)

**Key Learning**: Transactional behavior cannot be tested with mocks. You need a real database to verify ACID properties.

## Practical Skills Acquired

1. **TestContainers Setup**: Configured PostgreSQL containers for Go testing
2. **Container Lifecycle Management**: Started, monitored, and terminated containers
3. **Wait Strategies**: Implemented readiness checks for container dependencies
4. **Connection Management**: Used connection pools effectively
5. **Schema Management**: Automated database initialization with SQL scripts
6. **Test Isolation**: Implemented multiple isolation strategies (defer, transactions, fresh containers)
7. **CRUD Testing**: Comprehensive testing of database operations
8. **Error Scenario Testing**: Tested constraint violations, not found errors, timeouts
9. **Transaction Testing**: Verified ACID properties with real databases
10. **Resource Cleanup**: Proper cleanup using defer and t.Cleanup()

## Challenges and Solutions

**Challenge**: First test run took 45 seconds because Docker image wasn't cached.

**Solution**: 
```bash
# Pre-pull image before running tests
docker pull postgres:15-alpine
```

**Learning**: First run is always slow (image download), subsequent runs are fast (cached). In CI/CD, cache Docker layers.

**Challenge**: Tests occasionally failed with "connection refused" even though container was running.

**Root Cause**: PostgreSQL container was running but database wasn't ready to accept connections yet.

**Solution**: Implemented proper wait strategy:
```go
wait.ForLog("database system is ready to accept connections").
    WithOccurrence(2) // PostgreSQL logs this twice during startup
```

**Learning**: In distributed systems, "process started" ≠ "service ready". Always implement readiness checks.

**Challenge**: Tests interfered with each other—Test B failed because Test A's data still existed.

**Solution**: Implemented cleanup with defer:
```go
user, _ := repo.Create("temp@example.com", "Temp")
defer repo.Delete(user.ID) // Always runs, even if test fails
```

**Learning**: Test isolation is critical. Each test should start with known state and clean up after itself.

**Challenge**: TestContainers couldn't find Docker on macOS.

**Root Cause**: Docker Desktop wasn't running.

**Solution**: 
```bash
# Verify Docker is running
docker ps

# If not running, start Docker Desktop
```

**Learning**: TestContainers requires Docker daemon. It's not optional—it's a prerequisite.

## Real-World Applications and Career Impact

This practical prepared me for:

1. **Microservices Testing**: Each service can be tested with its own containerized database
2. **CI/CD Pipelines**: Automated integration testing in GitHub Actions, GitLab CI, Jenkins
3. **Database Migrations**: Test migration scripts against real database before production
4. **Legacy System Testing**: Add integration tests to legacy code without touching production DB
5. **Multi-Database Support**: Test same code against PostgreSQL, MySQL, SQL Server in parallel

**Career Relevance**: According to industry surveys, integration testing is the #2 most valuable testing skill (after unit testing). TestContainers is rapidly becoming standard practice.

## Understanding the Complete Testing Pyramid

This practical completed my understanding of the testing pyramid:
```
       /\
      /  \     E2E Tests (slowest, few)
     /    \    - Full system workflow
    /      \   - UI + API + Database
   /________\  
   /        \  Integration Tests (medium speed, some)
  /          \ - Component interactions
 /            \- Real databases/services
/______________\
|              | Unit Tests (fastest, many)
|              | - Individual functions
|______________| - Mocked dependencies
```

**From Previous Practicals**:
- Practical 2: Unit Testing (bottom layer)
- Practicals 4, 4a, 4b: Security Testing (special layer)
- **Practical 5: Integration Testing (middle layer)**

**Key Insight**: Each layer serves a purpose:
- **Unit**: Is this function correct?
- **Integration**: Do these components work together?
- **E2E**: Does the entire system work?

**Balance**: 70% unit, 20% integration, 10% E2E (approximate ratio for healthy test suite)

## Cost-Benefit Analysis of Integration Testing

**Costs**:
- Slower than unit tests (5-30 seconds vs milliseconds)
- Requires Docker (infrastructure dependency)
- More complex setup (containers, wait strategies)
- Higher resource usage (memory, CPU for containers)

**Benefits**:
- Catches real integration bugs
- Tests actual SQL queries and constraints
- Validates database-specific behavior
- Provides confidence code works with real dependencies
- Enables safe refactoring of database layer

**ROI Calculation**:
- Cost: 30 seconds per test run
- Benefit: Catches bugs that would take hours to debug in production
- Break-even: Preventing one production database bug pays for hundreds of test runs

**Conclusion**: Overwhelming positive ROI. Integration tests prevent entire classes of bugs that unit tests cannot catch.

## Conclusion

This practical transformed my understanding of testing by introducing the middle layer of the testing pyramid. I learned that unit tests, while valuable, cannot verify that components work together correctly. Real integration testing requires real dependencies—mocks and in-memory databases create false confidence.

TestContainers elegantly solves the database testing problem by providing real, isolated databases in Docker containers. The automatic lifecycle management (start, wait, test, terminate) makes integration testing as simple as unit testing while maintaining realism.

The most valuable lesson was understanding test isolation strategies. Sharing containers for speed while maintaining test independence through cleanup patterns strikes the optimal balance. The defer pattern for cleanup and transaction rollback for isolation are techniques I'll use throughout my career.

Integration testing with TestContainers also taught me broader distributed systems concepts—wait strategies for service readiness, dynamic port mapping for conflict avoidance, connection pooling for resource efficiency. These patterns apply far beyond testing to production system design.

Combined with unit testing (Practical 2), security testing (Practicals 4, 4a, 4b), and integration testing (this practical), I now have comprehensive knowledge of software quality assurance. Each testing level serves a specific purpose, and professional-grade software requires all levels working together.

This practical provided both technical skills (writing integration tests, managing containers) and strategic understanding (when to integrate vs unit test, how to balance speed vs isolation). The ability to confidently test database interactions is essential for backend development, and TestContainers makes this practical and maintainable.

Most importantly, I learned that good testing isn't about achieving 100% coverage—it's about strategically applying the right testing level at the right time. Unit tests for logic, integration tests for interactions, and end-to-end tests for workflows. Together, they create confidence that software behaves correctly in production.