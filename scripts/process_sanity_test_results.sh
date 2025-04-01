#!/bin/bash

echo "====== Inside process_sanity_test_results.sh ======"
echo "Current working directory inside the script:"
pwd
echo "Listing all files in the current directory:"
ls -alh
echo "Checking if test_results exists:"
ls -alh test_results || echo "test_results directory not found"

# List all directories and files inside test_results
echo "Listing all directories and files inside 'test_results':"
for dir in test_results/*; do
  if [[ -d "$dir" ]]; then
    echo "Directory: $dir"
    ls -alh "$dir"  # List files inside the directory
  fi
done

echo "===================================================="

# Initialize counters for total tests, passed, and failed
total_tests=0
total_passed=0
total_failed=0

# Find all JSON files inside test_results (including subdirectories)
echo "Searching for test-results-*.json files..."
for file in $(find test_results -type f -name "test_results_*.json"); do
  if [[ -f "$file" ]]; then
    echo "Processing file: $file"  # Debugging

    # Make sure jq is parsing the JSON correctly
    tests=$(jq '.total_tests' "$file")
    passed=$(jq '.passed' "$file")
    failed=$(jq '.failed' "$file")

    if [[ $? -eq 0 ]]; then
      total_tests=$((total_tests + tests))
      total_passed=$((total_passed + passed))
      total_failed=$((total_failed + failed))
    else
      echo "Error parsing JSON file: $file"
    fi
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
