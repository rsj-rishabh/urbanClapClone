describe('Urban Clap Pro Registration Page Test', () => {

    before(() => {
      cy.visit('http://localhost:4200/');
    });  

    it('clicks on the "Get Started" button', () => {
        cy.get('#nav a[routerLink="/register"]').click();
    });

    it('goes to the User Registration page', () => {
        cy.url()
        .should('include','/register')
        .should('equal','http://localhost:4200/register')
    });

    it('displays the correct Sign Up image', () => {
        cy.get('.container .row .col-md-6')
        .should('have.class','col-md-6 signup-img')
        .find('img')
        .should('have.class','img-fluid')
        .should('have.attr','src')
        .should('include','undraw_signup.svg')
    });

    it('displays the correct Registration form title', () => {
        cy.get('.container .row .col-md-6')
        .next()
        .should('have.class','col-md-6 contents')
        .find('.col-md-8 .mb-4 h3')
        .should('contain.text','Sign Up')
    });

    it('displays the correct Registration form and fields', () => {
        cy.get('.container .row .col-md-6')
        .next()
        .find('.col-md-8 .mb-4')
        .nextAll()
        .first()
        .get('form .form-group')
        .each(($el, index, $list) => {
            if (index === 0) {
                cy.wrap($el)
                .should('have.class','form-group mb-4 form-input-style')
                .find('input')
                .should('have.attr','type','text')
                .should('have.attr','formControlName','name')
                .should('have.attr','placeholder','Full Name')
            } else if (index === 1) {
                cy.wrap($el)
                .should('have.class','form-group mb-4 form-input-style')
                .find('input')
                .should('have.attr','type','text')
                .should('have.attr','formControlName','username')
                .should('have.attr','placeholder','Username')
            } else if (index === 2) {
                cy.wrap($el)
                .should('have.class','form-group mb-4 form-input-style')
                .find('input')
                .should('have.attr','type','email')
                .should('have.attr','formControlName','email')
                .should('have.attr','placeholder','E-mail')
            } else if (index === 3) {
                cy.wrap($el)
                .should('have.class','form-group mb-4 form-input-style')
                .find('select')
                .should('have.id','gender-select')
                .should('have.attr','formControlName','gender')
                .find('option')
                .each(($el, index, $list) => {
                    if (index === 0) {
                        cy.wrap($el)
                        .should('have.value','')
                        .should('contain.text','Select gender')
                    } else if (index === 1) {
                        cy.wrap($el)
                        .should('have.value','M')
                        .should('contain.text','Male')
                    } else {
                        cy.wrap($el)
                        .should('have.value','F')
                        .should('contain.text','Female')
                    } 
                })
            } else if (index === 4){
                cy.wrap($el)
                .should('have.class','form-group last mb-4 form-input-style')
                .find('input')
                .should('have.attr','type','password')
                .should('have.attr','formControlName','password')
                .should('have.attr','placeholder','Set Password')
            } else {
                cy.wrap($el)
                .should('have.class','form-group last mb-4 form-input-style')
                .find('input')
                .should('have.attr','type','password')
                .should('have.attr','formControlName','confirmPassword')
                .should('have.attr','placeholder','Confirm Password')
            }
        })
    });

    it('displays the registration form submit button', () => {
        cy.get('.container .row .col-md-6')
        .next()
        .find('.col-md-8 .mb-4')
        .nextAll()
        .first()
        .get('form .center-align')
        .find('input')
        .should('have.attr','type','submit')
        .should('have.value','Sign Up')
        .should('have.class','btn btn-block btn-primary')
    });

    it('fills the registration form correctly', () => {
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
                .type('Dummy User')
                .should('have.value','Dummy User')
            } else if (index === 1) {
                cy.wrap($el)
                .find('input')
                .type('dummy1')
                .should('have.value','dummy1')
            } else if (index === 2) {
                cy.wrap($el)
                .find('input')
                .type('dummy1@abc.com')
                .should('have.value','dummy1@abc.com')
            } else if (index === 3) {
                cy.wrap($el)
                .find('select')
                .select('Male')
                .should('have.value','M')
            } else if (index === 4){
                cy.wrap($el)
                .find('input')
                .type('Dummy1_123')
                .should('have.value','Dummy1_123')
            } else {
                cy.wrap($el)
                .find('input')
                .type('Dummy1_123')
                .should('have.value','Dummy1_123')
            }
        })
    });

    it('clicks the registration form submit button', () => {
        cy.get('.container .row .col-md-6')
        .next()
        .find('.col-md-8 .mb-4')
        .nextAll()
        .first()
        .get('form .center-align')
        .find('input')
        .click()
    });

    
 

  });