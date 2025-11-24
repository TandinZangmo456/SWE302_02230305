# Practical 2: Learning Report on Software Testing & Quality Assurance

## Overview
This practical introduced me to unit testing and code coverage analysis in Go, focusing on testing HTTP handlers for a CRUD (Create, Read, Update, Delete) API. I learned how to write effective tests using Go's standard library without relying on external testing frameworks.

## Key Concepts Learned

### 1. Understanding Unit Testing in Go

I learned that Go has built-in support for testing through the `testing` package. The key conventions include:

- Test files must end with `_test.go`
- Test functions must start with `Test` and accept `*testing.T` as a parameter
- Tests are run using the `go test` command

This built-in approach makes testing feel like a natural part of Go development rather than an afterthought.

### 2. Testing HTTP Handlers

The most valuable learning was how to test HTTP handlers without running an actual server. I discovered two critical tools:

**httptest.NewRequest()**: Creates mock HTTP requests where I can specify:
- HTTP method (GET, POST, PUT, DELETE)
- URL path
- Request body

**httptest.NewRecorder()**: Acts as a fake response writer that captures:
- Status codes
- Response headers
- Response body

This approach allows me to test my handlers in isolation, making tests fast and deterministic.

### 3. Project Structure and Organization

I learned the importance of separating concerns:

- `main.go`: Entry point and server setup
- `handlers.go`: Core business logic
- `handlers_test.go`: All test cases

This separation makes the codebase more maintainable and allows testing without starting the entire application.

### 4. Testing Patterns and Best Practices

Several important patterns emerged from this practical:

**State Management**: The `resetState()` helper function taught me that tests should be independent and not affect each other. Resetting the in-memory database before each test ensures isolation.

**Test Organization**: Using subtests with `t.Run()` allows grouping related test cases, like testing both "User Found" and "User Not Found" scenarios within the same test function.

**Assertion Patterns**: I learned to verify both:
- Response metadata (status codes, headers)
- Response content (JSON body parsing and validation)

### 5. Code Coverage Analysis

Understanding code coverage was eye-opening. I learned three ways to analyze coverage:

**Basic Coverage** (`go test -cover`): Provides a percentage showing how much code was executed during tests.

**Coverage Profile** (`go test -coverprofile=coverage.out`): Generates detailed data about which lines were executed.

**Visual Coverage Report** (`go tool cover -html=coverage.out`): Creates an HTML report with color-coded source code:
- Green: Code executed by tests
- Red: Code not covered by tests
- Grey: Non-executable code

This visual feedback helps identify untested code paths, especially error handling scenarios.

### 6. Working with Chi Router in Tests

I learned how to set up routing in tests using the Chi router:
```go
router := chi.NewRouter()
router.Post("/users", createUserHandler)
router.ServeHTTP(rr, req)
```

This mimics the actual routing behavior while keeping tests focused on handler logic.

### 7. Testing Different HTTP Methods

The practical covered all major CRUD operations:

- **POST**: Testing user creation and ID assignment
- **GET**: Testing both successful retrieval and 404 errors
- **PUT**: Testing updates to existing resources
- **DELETE**: Testing deletion and verifying state changes

Each method required different verification strategies, teaching me to think about what constitutes a successful test for each operation.

### 8. Concurrency Awareness

The use of `sync.Mutex` in the handlers taught me about thread safety. While not directly testing concurrency, I learned that in-memory data structures need protection when handling concurrent HTTP requests.

## Practical Skills Acquired

1. **Setting up Go test environments**: Creating test files and organizing test code
2. **Writing effective assertions**: Checking status codes, parsing JSON responses, and verifying data integrity
3. **Using httptest package**: Simulating HTTP requests and capturing responses
4. **Interpreting coverage reports**: Understanding which code paths need more testing
5. **Debugging test failures**: Using verbose output (`-v` flag) to identify issues

## Challenges and Solutions

**Challenge**: Understanding how httptest.NewRecorder() works without a real network connection.

**Solution**: I realized it implements the `http.ResponseWriter` interface but stores data in memory instead of sending it over a network, making it perfect for testing.

**Challenge**: Ensuring tests don't interfere with each other.

**Solution**: The `resetState()` function taught me to always start with a clean slate, preventing test pollution.

## Real-World Applications

This knowledge is directly applicable to:

- Building reliable REST APIs
- Implementing continuous integration pipelines where tests must pass before deployment
- Refactoring code with confidence, knowing tests will catch regressions
- Demonstrating code quality to team members or during code reviews

## Conclusion

This practical transformed my understanding of testing in Go. I moved from viewing testing as a chore to seeing it as an integral part of development. The visual coverage reports especially help me identify gaps in my testing strategy. Most importantly, I learned that good tests act as documentation, showing how the code should behave in different scenarios.

The combination of Go's standard library tools and clear testing patterns makes writing tests straightforward and effective. I now understand why Go developers emphasize testing so heavily—the tooling makes it easy to do the right thing.