# Practical 3: Learning Report on Specification-Based Testing in Go

## Github Repository: https://github.com/TandinZangmo456/SWE302p3.git

## Overview
This practical introduced me to specification-based testing, also known as black-box testing, where I learned to design comprehensive test cases based solely on system requirements without examining the internal code implementation. I explored three powerful testing techniques: Equivalence Partitioning, Boundary Value Analysis, and Decision Table Testing.

## Key Concepts Learned

### 1. Black-Box Testing Philosophy

I learned that effective testing doesn't always require knowledge of the code's internal workings. Instead, by carefully analyzing the specification (business rules and requirements), I can design tests that:

- Validate expected behavior from a user's perspective
- Remain valid even when the implementation changes
- Focus on what the system should do, not how it does it

This approach mirrors real-world testing scenarios where testers often work from requirement documents rather than source code.

### 2. Equivalence Partitioning

This was a game-changing concept for me. I learned that testing every possible input value is impossible and unnecessary.

**The Core Principle**: Group all possible inputs into partitions where every value in a partition should behave identically. Test just one representative value from each partition.

**Practical Application**:
For the weight input with a valid range of (0, 50]:
- **Partition 1 (Invalid - Too Small)**: weight ≤ 0 (tested with -5)
- **Partition 2 (Valid)**: 0 < weight ≤ 50 (tested with 10)
- **Partition 3 (Invalid - Too Large)**: weight > 50 (tested with 100)

For the zone input:
- **Partition 4 (Valid)**: "Domestic", "International", "Express"
- **Partition 5 (Invalid)**: Any other string

This systematic approach reduced potentially infinite test cases to a manageable, representative set while maintaining comprehensive coverage.

### 3. Boundary Value Analysis (BVA)

I discovered that bugs frequently hide at the edges of valid ranges—the boundaries. BVA taught me to focus testing efforts where they matter most.

**Key Insight**: For any boundary, test:
- The boundary value itself
- The value just inside the valid range
- The value just outside the valid range

**Practical Example for weight range (0, 50]**:
- **Lower boundary**: Test 0 (invalid), 0.1 (valid)
- **Upper boundary**: Test 50 (valid), 50.1 (invalid)

This technique catches "off-by-one" errors, which are among the most common programming mistakes (e.g., using `>=` instead of `>`).

### 4. Decision Table Testing

This technique transformed how I approach complex business logic with multiple interacting conditions.

**The Process**:
1. **Identify Conditions**: What inputs affect the outcome?
2. **Identify Actions**: What are possible results?
3. **Map Combinations**: Create a table showing which conditions trigger which actions

**Example from the shipping fee calculator**:

| Weight Valid? | Zone Type | Expected Action |
|---------------|-----------|-----------------|
| False | (any) | Return weight error |
| True | Domestic | Calculate domestic fee |
| True | International | Calculate international fee |
| True | Express | Calculate express fee |
| True | Invalid | Return zone error |

This systematic mapping ensures no scenario is overlooked, especially important when conditions interact in complex ways.

### 5. Table-Driven Testing in Go

I learned that Go's approach to testing multiple scenarios is elegant and maintainable.

**Key Pattern**:
```go
testCases := []struct {
    name        string
    input1      type1
    input2      type2
    expected    type3
    expectError bool
}{
    {"descriptive name", value1, value2, expected, false},
    // ... more cases
}

for _, tc := range testCases {
    t.Run(tc.name, func(t *testing.T) {
        // test logic here
    })
}
```

**Benefits I discovered**:
- Easy to add new test cases without duplicating test logic
- Clear, self-documenting test structure
- Subtests with `t.Run()` provide granular failure reporting
- Excellent for implementing BVA and decision tables

### 6. Systematic Test Design Process

The practical taught me a repeatable workflow:

1. **Read the specification carefully** - Identify all business rules
2. **Identify inputs and their constraints** - What can vary?
3. **Apply Equivalence Partitioning** - Group inputs into partitions
4. **Apply Boundary Value Analysis** - Identify critical edge cases
5. **Create Decision Tables** - Map complex rule interactions
6. **Implement as table-driven tests** - Translate analysis into code

This structured approach prevents the common pitfall of writing random, incomplete tests.

### 7. Error Handling Testing

I learned that testing error conditions is as important as testing success cases. The specification explicitly defined error scenarios:

- Invalid weight ranges trigger specific errors
- Invalid zones trigger specific errors
- Error conditions should be tested independently and in combination

**Testing Pattern**:
```go
if tc.expectError && err == nil {
    t.Errorf("Expected an error, but got nil")
}
if !tc.expectError && err != nil {
    t.Errorf("Expected no error, but got: %v", err)
}
```

### 8. Advanced Requirements Analysis (Exercise)

The Version 2 exercise introduced more complex requirements:

**New Complexities**:
- **Weight Tiers**: Different behavior for 0-10kg vs 10-50kg
- **Surcharges**: Additional fees based on weight tier
- **Insurance Flag**: Boolean parameter affecting final calculation
- **Percentage Calculations**: Insurance as 1.5% of subtotal

This required identifying:
- New boundary at 10kg (mid-range boundary)
- Additional partitions for the boolean `insured` parameter
- Combined scenarios testing interactions between all three inputs

## Practical Skills Acquired

1. **Specification Analysis**: Reading requirements and extracting testable conditions
2. **Partition Identification**: Systematically grouping inputs into equivalence classes
3. **Boundary Detection**: Finding critical edge cases in numeric ranges
4. **Decision Table Construction**: Mapping complex business rules systematically
5. **Test Case Design**: Creating minimal but comprehensive test sets
6. **Go Table-Driven Testing**: Implementing elegant, maintainable test code
7. **Test Naming**: Writing descriptive test names that serve as documentation

## Challenges and Solutions

**Challenge**: Determining how many test cases are "enough" without testing everything.

**Solution**: Equivalence Partitioning provides the answer—one representative from each partition plus boundary values gives optimal coverage with minimal redundancy.

**Challenge**: Ensuring all combinations of inputs are tested in complex scenarios.

**Solution**: Decision tables provide a visual, systematic way to ensure complete coverage of rule combinations.

**Challenge**: Understanding when to use each technique.

**Solution**: 
- Use Equivalence Partitioning as the foundation for all inputs
- Apply BVA to numeric ranges, dates, and sizes
- Use Decision Tables when multiple inputs interact to determine outcomes

## Real-World Applications

This knowledge is invaluable for:

- **Requirements Validation**: Testing helps verify that requirements are complete and unambiguous
- **API Testing**: Black-box testing is perfect for testing REST APIs and external interfaces
- **Regression Testing**: Specification-based tests remain valid through code refactoring
- **Documentation**: Test cases serve as executable documentation of system behavior
- **Quality Assurance**: Systematic testing increases confidence in software reliability

## Key Takeaways from Version 2 Exercise

The advanced exercise reinforced that:

1. **New boundaries require new tests**: The 10kg threshold creates a mid-range boundary requiring tests at 10, 10.1, and 9.9
2. **Boolean parameters create binary partitions**: `insured` true/false doubles the number of scenarios
3. **Percentage calculations need verification**: The 1.5% insurance calculation must be tested with known values
4. **Weight tiers affect boundaries**: The transition from Standard to Heavy packages at 10kg is critical
5. **Combined scenarios matter**: Testing `insured=true` with both Standard and Heavy packages ensures the calculation works for both tiers

## Comparison: Ad-hoc vs. Systematic Testing

**Before this practical** (Ad-hoc approach):
- Random test cases based on gut feeling
- Likely to miss edge cases and error conditions
- Hard to know when testing is "complete"
- Tests may focus on implementation details

**After this practical** (Systematic approach):
- Structured test design based on requirements
- Comprehensive coverage with minimal tests
- Clear completion criteria (all partitions and boundaries covered)
- Tests validate behavior, not implementation

## Conclusion

This practical fundamentally changed how I approach testing. I moved from viewing testing as "trying different inputs until it seems to work" to a structured, engineering discipline with clear methodologies.

The three techniques—Equivalence Partitioning, Boundary Value Analysis, and Decision Table Testing—provide a complete toolkit for specification-based testing. Together, they ensure comprehensive coverage while keeping test suites maintainable and efficient.

Most importantly, I learned that good testing starts before writing code. By analyzing requirements systematically and designing tests first, I can identify ambiguities in specifications early and ensure the implementation truly meets business needs.

The skills gained here are universal—applicable to any programming language, any domain, and any level of system complexity. Specification-based testing is not just about finding bugs; it's about building confidence that software behaves exactly as intended.


## Proof

![alt text](<Screenshot from 2025-11-30 13-46-39.png>)

![alt text](<Screenshot from 2025-11-30 14-02-11.png>)