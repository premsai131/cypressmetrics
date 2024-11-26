describe('Sample Test', () => {
    it('Visits the Cypress example site', () => {
      cy.visit('https://example.cypress.io');
      cy.contains('type').click();
      cy.url().should('include', '/commands/actions');
      cy.get('.action-email').type('test@example.com').should('have.value', 'test@example.com');
      expect(false).eq(true)
    });
  });
  
