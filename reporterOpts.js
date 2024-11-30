const testType = process.env.TEST_TYPE || 'DefaultTestType'; // Default to avoid undefined
const matrixContainer = process.env.MATRIX_CONTAINER || 'default'; // Add MATRIX_CONTAINER

module.exports = {
  reporterEnabled: "cypress-mochawesome-reporter",
  cypressMochawesomeReporterReporterOptions: {
    reportDir: `cypress/reports/mocha/Regression-${matrixContainer}`, // Unique directory
    reportFilename: "report",
    embeddedScreenshots: false,
    ignoreVideos: true,
    inlineAssets: false,
    quiet: true,
    overwrite: false,
    html: false,
    saveJson: true,
  },
};
