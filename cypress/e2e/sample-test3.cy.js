describe('Sample Test', () => {
    it('Visits the Cypress example site', () => {
      cy.visit('https://www.amazon.in');
      cy.wait('5000')
    });
  });
  
