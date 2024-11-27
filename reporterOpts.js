const testType = process.env.TEST_TYPE
module.exports = {
    "reporterEnabled": "cypress-mochawesome-reporter",
    "cypressMochawesomeReporterReporterOptions": {
        "reportDir": `cypress/reports/mocha/Regression`,
        "reportFilename": "report",
        "embeddedScreenshots": false,
        "ignoreVideos":true,
        "inlineAssets": false,
        "quiet": true,
        "overwrite": false,
        "html": false,
        "saveJson": true
      }
}
  
