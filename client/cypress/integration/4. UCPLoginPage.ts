describe('Urban Clap Pro Login Page Test', () => {

    before(() => {
      cy.visit('http://localhost:4200/');
    });  

    it('clicks on the "Get Started" button', () => {
        cy.get('#nav a[routerLink="/login"]').click();
    });

    it('goes to the User Login page', () => {
        cy.url()
        .should('include','/login')
        .should('equal','http://localhost:4200/login')
    });

    it('displays the correct Sign In image', () => {
        cy.get('.container .row .col-md-6')
        .should('have.class','col-md-6 div-mar')
        .find('img')
        .should('have.class','img-fluid')
        .should('have.attr','src')
        .should('include','undraw_sign_in.svg')
    });

    it('displays the correct login form title', () => {
        cy.get('.container .row .col-md-6')
        .next()
        .should('have.class','col-md-6 contents div-mar')
        .find('.col-md-8 .mb-4 h3')
        .should('contain.text','Sign In')
    });

    it('displays the correct login form and fields', () => {
        cy.get('.container .row .col-md-6')
        .next()
        .find('.col-md-8 .mb-4')
        .nextAll()
        .first()
        .get('form .form-group')
        .each(($el, index, $list) => {
            if (index === 0) {
                cy.wrap($el)
                .should('have.class','form-group first')
                .find('input')
                .should('have.attr','type','text')
                .should('have.attr','formControlName','username')
                .should('have.attr','placeholder','Username')
            } else {
                cy.wrap($el)
                .should('have.class','form-group last mb-4')
                .find('input')
                .should('have.attr','type','password')
                .should('have.attr','formControlName','password')
                .should('have.attr','placeholder','Password')
            }
        })
    });

    it('displays the login form submit button', () => {
        cy.get('.container .row .col-md-6')
        .next()
        .find('.col-md-8 .mb-4')
        .nextAll()
        .first()
        .get('form .center-align')
        .find('input')
        .should('have.attr','type','submit')
        .should('have.value','Log In')
        .should('have.class','btn btn-block btn-primary')
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

    it('goes to the Services List page', () => {
        cy.url()
        .should('include','/services')
        .should('equal','http://localhost:4200/services')
    });

});