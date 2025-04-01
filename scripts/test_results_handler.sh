#!/bin/bash

set -e  # Exit on error

# Updated to work with root directory for output files
RESULTS_DIR="./report"  # This remains unchanged if you want to keep a separate report folder for test results.
OUTPUT_FILE="test_results.json"  # Create the output file at the root level

# Read the first argument ($1) to decide whether to skip GitHub output
SKIP_GITHUB_OUTPUT="$1"

if [ -z "$MATRIX_CONTAINER" ]; then
  echo "Warning: MATRIX_CONTAINER is not set!"
else
  echo "Using MATRIX_CONTAINER: $MATRIX_CONTAINER"
fi

# Ensure output file is stored inside the root directory
if [ -n "$MATRIX_CONTAINER" ]; then
  OUTPUT_FILE="test_results_${MATRIX_CONTAINER}.json"  # Ensure file is at root level
fi

echo "Test results will be stored at: $OUTPUT_FILE"

# Install jq if not available
if ! command -v jq &> /dev/null; then
  echo "jq is not installed. Installing..."
  sudo apt-get install -y jq
fi

echo "Installing dependencies..."
rm -rf node_modules package-lock.json
npm install

echo "Running test results parser..."
MATRIX_CONTAINER="$MATRIX_CONTAINER" npx ts-node scripts/parseTestReports.ts -o "$OUTPUT_FILE" || { 
  echo "Error: Test results parsing failed!"
  exit 1
}

# Print the current working directory for debugging
echo "Current working directory: $(pwd)"

# Check if the output file exists
if [ ! -f "$OUTPUT_FILE" ]; then
  echo "Error: $OUTPUT_FILE not found!"
  exit 1
fi


# Parse results from the JSON output
TOTAL_TESTS=$(jq -r '.totalTests // 0' "$OUTPUT_FILE")
FAILED_TESTS=$(jq -r '.failed // 0' "$OUTPUT_FILE")
PASSED_TESTS=$(jq -r '.passed // 0' "$OUTPUT_FILE")
TEST_STATUS=$(jq -r '.testStatus // "UNKNOWN"' "$OUTPUT_FILE")

# Log the extracted data for debugging purposes
echo "Extracted Test Results:"
echo "TOTAL_TESTS=$TOTAL_TESTS"
echo "FAILED_TESTS=$FAILED_TESTS"
echo "PASSED_TESTS=$PASSED_TESTS"
echo "TEST_STATUS=$TEST_STATUS"

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
