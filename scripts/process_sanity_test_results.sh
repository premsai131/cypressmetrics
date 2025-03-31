#!/bin/bash

total_tests=0
total_passed=0
total_failed=0

# Loop through all test result files
for file in test_results/test-results-*; do
  if [[ -f "$file" ]]; then
    tests=$(jq '.total_tests' "$file")
    passed=$(jq '.passed' "$file")
    failed=$(jq '.failed' "$file")

    total_tests=$((total_tests + tests))
    total_passed=$((total_passed + passed))
    total_failed=$((total_failed + failed))
  fi
done

echo "TOTAL TESTS: $total_tests"
echo "TOTAL PASSED: $total_passed"
echo "TOTAL FAILED: $total_failed"

# Determine Test Status
if [[ $total_failed -gt 0 ]]; then
  test_status="FAILED"
elif [[ $total_tests -eq 0 ]]; then
  test_status="NO TESTS"
else
  test_status="PASSED"
fi

echo "TEST STATUS: $test_status"

# Set GitHub outputs
echo "total_tests=$total_tests" >> $GITHUB_ENV
echo "total_passed=$total_passed" >> $GITHUB_ENV
echo "total_failed=$total_failed" >> $GITHUB_ENV
echo "test_status=$test_status" >> $GITHUB_ENV
