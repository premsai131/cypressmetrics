#!/bin/bash

echo "====== Inside process_sanity_test_results.sh ======"
echo "Current working directory inside the script:"
pwd
echo "Listing all files in the current directory:"
ls -alh
echo "Checking if test_results exists:"
ls -alh test_results || echo "test_results directory not found"
echo "Finding all test-results-*.json files:"
find . -type f -name "test-results-*.json" || echo "No test result files found"
echo "===================================================="

total_tests=0
total_passed=0
total_failed=0

# Find all JSON files inside test_results (including subdirectories)
for file in $(find test_results -type f -name "test-results-*.json"); do
  if [[ -f "$file" ]]; then
    echo "Processing file: $file"  # Debugging

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
