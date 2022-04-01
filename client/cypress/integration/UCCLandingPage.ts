describe('Urban Clap Clone Landing Page Test', () => {
    before(() => {
      cy.visit('http://localhost:4200/');
    });
  
    it('has the correct title', () => {
      cy.title().should('equal', 'UC Clone');
    });

    it('displays the correct title', () => {
        cy.get('span.title').should('contain.text','Urban Clap');
    });

    it('has the login button', () => {
        cy.get('button#login').should('contain.text','Login');
    });

    it('has the register button', () => {
        cy.get('button#register').should('contain.text','Register');
    });

  });