#!/bin/bash

set -e  

RESULTS_DIR="./report"
OUTPUT_FILE="./test_results.json"

# Read the first argument ($1) to decide whether to skip GitHub output
SKIP_GITHUB_OUTPUT="$1"

if [ ! -d "$RESULTS_DIR" ]; then
  echo "Error: Test results directory '$RESULTS_DIR' not found!"
  exit 1
fi

echo "Installing dependencies..."
rm -rf node_modules package-lock.json
npm install

echo "Running test results parser..."
node scripts/parseTestReports.js -o "$OUTPUT_FILE" || { 
  echo "Error: Test results parsing failed!"
  exit 1
}

if [ ! -f "$OUTPUT_FILE" ]; then
  echo "Error: $OUTPUT_FILE not found!"
  exit 1
fi

TOTAL_TESTS=$(jq -r '.totalTests // 0' "$OUTPUT_FILE")
FAILED_TESTS=$(jq -r '.failed // 0' "$OUTPUT_FILE")
PASSED_TESTS=$(jq -r '.passed // 0' "$OUTPUT_FILE")
TEST_STATUS=$(jq -r '.testStatus // "UNKNOWN"' "$OUTPUT_FILE")  

# Conditionally set GitHub outputs
if [ "$SKIP_GITHUB_OUTPUT" != "true" ]; then
  {
    echo "TOTAL_TESTS=$TOTAL_TESTS"
    echo "FAILED_TESTS=$FAILED_TESTS"
    echo "PASSED_TESTS=$PASSED_TESTS"
    echo "TEST_STATUS=$TEST_STATUS"
  } >> "$GITHUB_OUTPUT"
fi

echo "Test results processed successfully."
