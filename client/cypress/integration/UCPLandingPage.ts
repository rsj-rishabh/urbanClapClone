describe('Urban Clap Clone Landing Page Test', () => {
    before(() => {
      cy.visit('http://localhost:4200/');
    });
  
    it('has the correct title', () => {
      cy.title().should('equal', 'UC Pro');
    });

    it('displays the correct title', () => {
        cy.get('#banner h2').should('contain.text','Urban Clap Pro');
    });

    it('has the Banner section', () => {
      cy.get('section')
      .should('have.id','banner')
    });
    
    it('has the Sign Up button', () => {
        cy.get('#banner ul li')
        .find('a')
        .should('have.attr','href','/signup')
        .should('have.class','button primary')
        .should('contain.text','Sign Up');
    });

    it('has the Checkout Services button', () => {
      cy.get('#banner ul li')
      .next()
      .find('a')
      .should('have.attr','href','/services')
      .should('have.class','button')
      .should('contain.text','Checkout Services');
    });

    it('has the Checkout Services button', () => {
      cy.get('#banner ul li')
      .next()
      .find('a')
      .should('have.attr','href','/services')
      .should('have.class','button')
      .should('contain.text','Checkout Services');
    });

    it('has the Main section', () => {
      cy.get('#banner').next()
      .should('have.id','main')
      .should('have.class','container landing-main')
      .find('section')
      .should('have.class','box special')
      .find('header')
      .should('have.class','major')
      .next()
      .should('have.class', 'image featured')
      .find('img')
      .should('exist')
    });

    it('has Features section with four features and proper feature titles', () => {
      cy.get('#main section')
      .next()
      .should('have.class', 'box special features')
      .find('section')
      .should('have.length', 4)
      .each(($el, index, $list) => {
        if (index === 0) {
          cy.wrap($el)
          .find('span')
          .should('have.class','icon solid major accent2')
          .find('i')
          .should('have.class','bi bi-stars')
          .parent()
          .next()
          .should('have.text','Quality Assurance')
        } else if (index === 1) {
          cy.wrap($el)
          .find('span')
          .should('have.class','icon solid major accent3')
          .find('i')
          .should('have.class','bi bi-wallet2')
          .parent()
          .next()
          .should('have.text','Affordable Prices')
        } else if (index === 2) {
          cy.wrap($el)
          .find('span')
          .should('have.class','icon solid major accent4')
          .find('i')
          .should('have.class','bi bi-person-check')
          .parent()
          .next()
          .should('have.text','Trained Professionals')
        } else {
          cy.wrap($el)
          .find('span')
          .should('have.class','icon solid major accent5')
          .find('i')
          .should('have.class','bi bi-calendar-heart')
          .parent()
          .next()
          .should('have.text','Schedule Friendly')
        }
      })
      
      
    });

 

  });