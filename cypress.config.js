const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    // Add your projectId here
    projectId: "qdjmfg",  // Replace with your actual project ID from Cypress dashboard
  },
});
