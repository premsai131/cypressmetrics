import * as fs from "fs";
import * as path from "path";

// Resolving paths to the root of the project
const REPORT_DIR = path.join(__dirname, "report"); // Path to test reports
const OUTPUT_JSON_FILE = path.join(__dirname, "test_results.json"); // Output file

// Get the container name from an environment variable
const MATRIX_CONTAINER = process.env.MATRIX_CONTAINER || ""; 

// If MATRIX_CONTAINER is set, generate a unique file name
const MATRIX_OUTPUT_JSON_FILE = MATRIX_CONTAINER
  ? path.resolve(__dirname, `../test_results_${MATRIX_CONTAINER}.json`)  // Writes to the root level
  : OUTPUT_JSON_FILE;

async function getAllJsonFilesAsync(dir: string): Promise<string[]> {
  let results: string[] = [];

  try {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        results = results.concat(await getAllJsonFilesAsync(fullPath));
      } else if (entry.isFile() && entry.name.endsWith(".json")) {
        results.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory: ${dir}, ${error}`);
  }

  return results;
}

async function processTestReports(): Promise<void> {
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  let testStatus: string = "passed";

  if (!fs.existsSync(REPORT_DIR)) {
    console.error("Report directory not found.");
    return;
  }

  const reportFiles: string[] = await getAllJsonFilesAsync(REPORT_DIR);

  if (reportFiles.length === 0) {
    console.error("No test reports found.");
  } else {
    console.info(`Found ${reportFiles.length} test reports.`);

    for (const filePath of reportFiles) {
      console.info(`Processing file: ${filePath}`);

      try {
        const data = await fs.promises.readFile(filePath, "utf8");
        const report = JSON.parse(data);

        if (!report || typeof report !== "object") {
          console.error(`Invalid JSON structure in: ${filePath}`);
          continue;
        }

        if (Array.isArray(report.TestsPassed)) {
          const validPassedTests = report.TestsPassed.filter(
            (test: any) =>
              test.TestName.trim() !== "" &&
              test.RequestID.trim() !== ""
          );
          passedTests += validPassedTests.length;
          totalTests += validPassedTests.length;
        }

        if (Array.isArray(report.TestsFailed)) {
          const validFailedTests = report.TestsFailed.filter(
            (test: any) =>
              test.TestName.trim() !== "" &&
              test.RequestID.trim() !== ""
          );
          failedTests += validFailedTests.length;
          totalTests += validFailedTests.length;
        }

        if (!report.SuiteSucceeded) {
          testStatus = "failed";
        }
      } catch (error) {
        console.error(`Error processing ${filePath}: ${error}`);
      }
    }
  }

  console.info("\nTest Summary:");
  console.info(`Total Tests: ${totalTests}`);
  console.info(`Passed Tests: ${passedTests}`);
  console.info(`Failed Tests: ${failedTests}`);
  console.info(`Test Status: ${testStatus}`);

  const results = {
    container: MATRIX_CONTAINER || "default",
    totalTests,
    passed: passedTests,
    failed: failedTests,
    testStatus,
  };

  // Writing the output file directly to the root level
  await fs.promises.writeFile(
    MATRIX_OUTPUT_JSON_FILE,
    JSON.stringify(results, null, 2)
  );
  console.info(`Test results successfully written to ${MATRIX_OUTPUT_JSON_FILE}`);
}

processTestReports();
