describe('Urban Clap Pro Services List Page Test', () => {

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
    
    
    
    it('displays the correct page name', () => {
        cy.get('header')
        .should('have.class','bg-dark py-5 service-header')
        .find('h1')
        .should('have.class','display-4 fw-bolder')
        .should('contain.text','Services List')
    });

    it('displays the list of services correctly along with "Book Now" button for each service', () => {
        cy.get('section')
        .should('have.id','main')
        .should('have.class','container service-main')
        .find('.row .col-6')
        .each(($el, index, $list) => {
                cy.wrap($el)
                .should('have.class','col-6 col-12-narrower')
                .find('section span')
                .should('have.class','image featured')
                .find('img')
                .should('have.class','image-padding')
                .parent()
                .next()                
                .get('h3')
                .next()
                .get('p')
                .next()
                .should('have.class','actions special')
                .find('li a')
                .should('have.class','button alt')
                .should('contain.text','Book Now')
        })
    });

});