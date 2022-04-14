describe('Urban Clap Pro Logged Out Navbar Test', () => {
    before(() => {
      cy.visit('http://localhost:4200/');
    });
  
    it('has the correct title', () => {
      cy.title().should('equal', 'UC Pro');
    });

    it('displays the correct title', () => {
        cy.get('header')
        .should('have.id','header')
        .find('h3')
        .find('a')
        .should('have.attr','routerLink','/home')
        .should('have.text','Urban Clap Pro')
    });

    it('has the nav element', () => {
      cy.get('#header')
      .find('nav')
      .should('have.id','nav')
    });

    it('has the Home, Book a Service, Sign In and Get Started buttons', () => {
      cy.get('#nav ul li')
      .should('have.length', 4)
      .each(($el, index, $list) => {
        if (index === 0) {
          cy.wrap($el)
          .find('a')
          .should('have.attr','href','index.html')
          .should('have.text','Home')
        } else if (index === 1) {
          cy.wrap($el)
          .find('a')
          .should('have.attr','routerLink','/services')
          .should('have.attr','routerLinkActive','active')
          .should('have.text','Book a Service')
        } else if (index === 2) {
          cy.wrap($el)
          .find('a')
          .should('have.attr','routerLink','/login')
          .should('have.attr','routerLinkActive','active')
          .should('have.text','Sign In')
        } else {
          cy.wrap($el)
          .find('a')
          .should('have.attr','routerLink','/register')
          .should('have.attr','routerLinkActive','active')
          .should('have.class','button')
          .should('have.text','Get Started')
        }
    })

  })

})

