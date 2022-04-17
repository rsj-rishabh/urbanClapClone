describe('Urban Clap Pro My Bookings Page Test', () => {  
  
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
    
    it('clicks on the "My Bookings" button', () => {
        cy.get('#nav ul li a[routerLink="/bookings"]').click();
    });

    it('goes to the My Bookings page', () => {
        cy.url()
        .should('include','/bookings')
        .should('equal','http://localhost:4200/bookings')
    });

    it('displays the correct page name', () => {
        cy.get('header')
        .should('have.class','bg-dark py-5 service-header')
        .find('h1')
        .should('have.class','display-4 fw-bolder')
        .should('contain.text','My Bookings')
    });

    it('displays the list of "Active" bookings correctly along with "Cancel" button for each booking', () => {
        cy.get('section .container')
        .children('h3')
        .first()
        .should('contain.text','Active Bookings')
        .parent()
        .children('section')
        .first()
        .should('have.id','active-main')
        .children('div')
        .should('have.class','row')
        .find('section')
        .should('have.length.at.least', 1)
        .each(($el, index, $list) => {
                cy.wrap($el)
                .parent()
                .should('have.class','col-6 col-12-narrower')
                .find('section')
                .should('have.class','box special')
                .children('h3')
                .parent()
                .children('h5')
                .parent()
                .children('p')
                .parent()
                .find('ul li a')
                .should('have.class','button alt btn btn-danger')
                .should('contain.text','Cancel')
        })
        
    });

    it('clicks "Cancel" button for one of the bookings', () => {
        cy.get('#active-main')
        .find('.row .col-6')
        .first()
        .find('section ul li a')
        .click()
    });

    it('displays the list of "Cancelled" bookings correctly', () => {
        cy.get('section .container')
        .children('h3')
        .eq(1)
        .should('contain.text','Cancelled bookings')
        .next()
        .should('have.id','cancel-main')
        .children('div')
        .find('section')
        .should('have.length.at.least', 1)
        .each(($el, index, $list) => {
                cy.wrap($el)
                .parent()
                .should('have.class','col-6 col-12-narrower')
                .find('section')
                .should('have.class','box special')
                .children('h3')
                .parent()
                .children('h5')
                .parent()
                .children('p')
        })
        
    });

    it('displays the "Book a Service" button', () => {
        cy.get('section .container')
        .children()
        .eq(4)
        .should('have.class','center-align book-btn')
        .find('button')
        .find('a')
        .should('have.attr','href','/services')
        .should('contain.text','Book a Service')
    });

    it('clicks the "Book a Service" button', () => {
        cy.get('section .container')
        .children()
        .eq(4)
        .find('button')
        .click()
    });

    it('goes to the Services List page', () => {
        cy.url()
        .should('include','/services')
        .should('equal','http://localhost:4200/services')
    });

});