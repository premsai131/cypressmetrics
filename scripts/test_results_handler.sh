#!/bin/bash

set -e  # Exit on error

RESULTS_DIR="./report"
OUTPUT_FILE="$GITHUB_WORKSPACE/test_results.json"

# Read the first argument ($1) to decide whether to skip GitHub output
SKIP_GITHUB_OUTPUT="$1"

if [ -z "$MATRIX_CONTAINER" ]; then
  echo "Warning: MATRIX_CONTAINER is not set!"
else
  echo "Using MATRIX_CONTAINER: $MATRIX_CONTAINER"
fi

# Ensure output file is stored inside GITHUB_WORKSPACE
if [ -n "$MATRIX_CONTAINER" ]; then
  OUTPUT_FILE="$GITHUB_WORKSPACE/test_results_${MATRIX_CONTAINER}.json"
fi

echo "Test results will be stored at: $OUTPUT_FILE"

if [ ! -d "$RESULTS_DIR" ]; then
  echo "Error: Test results directory '$RESULTS_DIR' not found!"
  exit 1
fi

echo "Installing dependencies..."
rm -rf node_modules package-lock.json
npm install

echo "Running test results parser..."
MATRIX_CONTAINER="$MATRIX_CONTAINER" npx ts-node scripts/parseTestReports.ts -o "$OUTPUT_FILE" || { 
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
