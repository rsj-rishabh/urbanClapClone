describe('Urban Clap Pro Logged In Navbar Test', () => {
  
    before(() => {
      cy.visit('http://localhost:4200/');
    });  
    
    it('clicks on the "Sign In" button', () => {
        cy.get('#nav a[routerLink="/login"]').click();
    });

    it('goes to the User Login page', () => {
        cy.url()
        .should('include','/login')
        .should('equal','http://localhost:4200/login')
    });

    it('fills the login form correctly', () => {
        cy.get('.container .row .col-md-6')
        .next()
        .find('.col-md-8 .mb-4')
        .nextAll()
        .first()
        .get('form .form-group')
        .each(($el, index, $list) => {
            if (index === 0) {
                cy.wrap($el)
                .find('input')
                .type('dummy')
                .should('have.value','dummy')
            } else {
                cy.wrap($el)
                .find('input')
                .type('dumdum')
                .should('have.value','dumdum')
            }
        })
    });

    it('clicks the form submit button', () => {
        cy.get('.container .row .col-md-6')
        .next()
        .find('.col-md-8 .mb-4')
        .nextAll()
        .first()
        .get('form .center-align')
        .find('input')
        .click()
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

    it('has the Home, Book a Service, My Bookings, Profile and Logout buttons', () => {
      cy.get('#nav ul li')
      .should('have.length', 3)
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
        }  else {
          cy.wrap($el)
          .find('a')
          .each(($el, index, $list) => {
            if (index === 0) {
              cy.wrap($el)
              .should('have.attr','routerLink','/bookings')
              .should('have.attr','routerLinkActive','active')
              .should('have.text','My Bookings')
            } else if (index === 1) {
              cy.wrap($el)
              .should('have.attr','routerLink','/profile')
              .should('have.attr','routerLinkActive','active')
              .should('have.text','Profile')
            }  else {
              cy.wrap($el)
              .should('have.attr','routerLink','/logout')
              .should('have.attr','routerLinkActive','active')
              .should('have.text','Logout')
            }
          })

        }

      })

    })

})

