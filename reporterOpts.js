const matrixContainer = process.env.MATRIX_CONTAINER || 'default'; // Add MATRIX_CONTAINER fallback

module.exports = {
  reporterEnabled: "cypress-mochawesome-reporter",
  cypressMochawesomeReporterReporterOptions: {
    reportDir: `cypress/reports/mocha/Regression/${matrixContainer}`, // Use matrixContainer for directory
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
