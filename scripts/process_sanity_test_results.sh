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
    ls -alh "$dir"
  fi
done

echo "===================================================="

# Initialize counters
total_tests=0
total_passed=0
total_failed=0

echo "Searching for test_results_*.json files..."
while IFS= read -r -d '' file; do
  if [[ -f "$file" ]]; then
    echo "Processing file: $file"
    
    tests=$(jq '.totalTests' "$file")
    passed=$(jq '.passed' "$file")
    failed=$(jq '.failed' "$file")

    tests=${tests:-0}
    passed=${passed:-0}
    failed=${failed:-0}

    if [[ "$tests" =~ ^[0-9]+$ && "$passed" =~ ^[0-9]+$ && "$failed" =~ ^[0-9]+$ ]]; then
      total_tests=$((total_tests + tests))
      total_passed=$((total_passed + passed))
      total_failed=$((total_failed + failed))
    else
      echo "Invalid values in $file – skipping"
    fi
  fi
done < <(find test_results -type f -name "test_results_*.json" -print0)

echo "TOTAL TESTS: $total_tests"
echo "TOTAL PASSED: $total_passed"
echo "TOTAL FAILED: $total_failed"

if [[ $total_failed -gt 0 ]]; then
  test_status="FAILED"
elif [[ $total_tests -eq 0 ]]; then
  test_status="NO TESTS"
else
  test_status="PASSED"
fi

echo "TEST STATUS: $test_status"

# Set GitHub Action outputs for downstream jobs
echo "TEST_STATUS=$test_status" >> "$GITHUB_OUTPUT"
echo "TOTAL_TESTS=$total_tests" >> "$GITHUB_OUTPUT"
echo "PASSED_TESTS=$total_passed" >> "$GITHUB_OUTPUT"
echo "FAILED_TESTS=$total_failed" >> "$GITHUB_OUTPUT"

