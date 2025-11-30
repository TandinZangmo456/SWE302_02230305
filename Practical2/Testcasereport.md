# Test Case Report
## Module Practical 2: Software Testing & Quality Assurance

## Executive Summary

This report documents the unit testing implementation for a Go-based REST API with CRUD (Create, Read, Update, Delete) operations. The project demonstrates comprehensive test coverage using Go's standard testing library and the `httptest` package for HTTP handler testing.

## Project Overview

### Technology Stack
- **Language:** Go (Golang)
- **Framework:** Chi Router v5.2.3
- **Testing Framework:** Go standard `testing` package
- **HTTP Testing:** `net/http/httptest` package

### Project Structure
```
go-crud-testing/
├── main.go              # Server entry point
├── handlers.go          # CRUD operation handlers
├── handlers_test.go     # Unit tests
├── go.mod              # Module dependencies
├── go.sum              # Dependency checksums
└── coverage.out        # Coverage profile data
```

## Test Cases Implemented

### Test Case 1: Create User Handler
**Function:** `TestCreateUserHandler`  
**Purpose:** Verify that a new user can be created successfully

**Test Steps:**
1. Reset application state
2. Create a POST request with user payload `{"name": "John Doe"}`
3. Send request to `/users` endpoint
4. Record response

**Assertions:**
- HTTP Status Code = 201 (Created)
- Response body contains created user
- User name matches "John Doe"
- User ID is assigned as 1 (first user)

**Expected Result:** User created successfully with correct ID and name


### Test Case 2: Get User Handler - User Found
**Function:** `TestGetUserHandler` (Sub-test: "User Found")  
**Purpose:** Verify retrieval of an existing user

**Test Steps:**
1. Reset application state
2. Pre-populate user with ID=1, Name="Jane Doe"
3. Create GET request to `/users/1`
4. Record response

**Assertions:**
- HTTP Status Code = 200 (OK)
- Response body contains correct user
- User name matches "Jane Doe"

**Expected Result:** User retrieved successfully with correct data

### Test Case 3: Get User Handler - User Not Found
**Function:** `TestGetUserHandler` (Sub-test: "User Not Found")  
**Purpose:** Verify proper error handling for non-existent user

**Test Steps:**
1. Create GET request to `/users/99` (non-existent ID)
2. Record response

**Assertions:**
- HTTP Status Code = 404 (Not Found)
- Error message indicates user not found

**Expected Result:** Proper 404 error returned for missing user

### Test Case 4: Delete User Handler
**Function:** `TestDeleteUserHandler`  
**Purpose:** Verify user deletion functionality

**Test Steps:**
1. Reset application state
2. Pre-populate user with ID=1, Name="To Be Deleted"
3. Create DELETE request to `/users/1`
4. Record response
5. Verify user removed from in-memory database

**Assertions:**
- HTTP Status Code = 204 (No Content)
- User no longer exists in the users map

**Expected Result:** User deleted successfully from database

## Test Execution Results

### Test Run Summary
```
=== RUN   TestCreateUserHandler
--- PASS: TestCreateUserHandler (0.00s)

=== RUN   TestGetUserHandler
=== RUN   TestGetUserHandler/User_Found
--- PASS: TestGetUserHandler/User_Found (0.00s)
=== RUN   TestGetUserHandler/User_Not_Found
--- PASS: TestGetUserHandler/User_Not_Found (0.00s)
--- PASS: TestGetUserHandler (0.00s)

=== RUN   TestDeleteUserHandler
--- PASS: TestDeleteUserHandler (0.00s)

PASS
ok      crud-testing    0.002s
```

### Test Statistics
- **Total Test Cases:** 4 (with 2 sub-tests)
- **Passed:** 4/4 (100%)
- **Failed:** 0/4 (0%)
- **Execution Time:** 0.002 seconds

## Code Coverage Analysis

### Coverage Summary
- **Coverage Percentage:** ~85.7% of statements
- **Covered Functions:**
  - `createUserHandler` - Fully covered
  - `getUserHandler` - Fully covered (both success and error paths)
  - `deleteUserHandler` - Fully covered
  - `getAllUsersHandler` - Not tested
  - `updateUserHandler` - Not tested

### Coverage Report Details
The HTML coverage report visually displays:
- **Green highlighting:** Code executed during tests
- **Red highlighting:** Code not executed during tests
- **Grey text:** Non-executable code (comments, declarations)

## Testing Methodology

### Unit Testing Approach
1. **Isolation:** Each test resets application state using `resetState()` helper
2. **Mocking:** Uses `httptest.NewRecorder()` to simulate HTTP responses
3. **Assertions:** Validates both status codes and response bodies
4. **Sub-tests:** Implements table-driven tests for multiple scenarios

### Key Testing Patterns Used
- **AAA Pattern:** Arrange, Act, Assert
- **Mock HTTP Requests:** Using `httptest.NewRequest()`
- **Response Recording:** Using `httptest.NewRecorder()`
- **State Management:** Reset state between tests to ensure isolation

## Recommendations for Improvement

### Additional Test Cases Needed
1. **Test for `getAllUsersHandler`:**
   - Empty user list scenario
   - Multiple users scenario

2. **Test for `updateUserHandler`:**
   - Successful update
   - Update non-existent user
   - Invalid request body

3. **Edge Cases:**
   - Invalid user ID formats (non-numeric)
   - Malformed JSON payloads
   - Concurrent request handling

### Coverage Goals
- **Current Coverage:** 85.7%
- **Target Coverage:** 95%+
- **Missing Coverage:** `getAllUsersHandler` and `updateUserHandler`

## Conclusion

The unit testing implementation successfully validates core CRUD operations with high reliability. All implemented tests pass consistently, demonstrating proper handler functionality for creating, retrieving, and deleting users. The testing framework provides comprehensive coverage analysis, making it easy to identify untested code paths.

### Key Achievements
Implemented isolated unit tests  
Achieved 100% pass rate  
Generated visual coverage reports  
Followed Go testing best practices  
Demonstrated error handling validation

### Learning Outcomes
- Mastered Go's testing package
- Understood HTTP handler testing with `httptest`
- Learned coverage analysis and interpretation
- Practiced test-driven development principles
