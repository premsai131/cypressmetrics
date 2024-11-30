describe('Sample Test', () => {
    it('Spec file 2 Visits the Cypress example site from so', () => {
      cy.visit('https://example.cypress.io');
      cy.contains('type').click();
      cy.url().should('include', '/commands/actions');
      cy.get('.action-email').type('test@example.com').should('have.value', 'test@example.com');
    });
  });
  
