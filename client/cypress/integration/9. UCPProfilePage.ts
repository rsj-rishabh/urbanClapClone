describe('Urban Clap Pro Profile Page Test', () => {

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
    
    it('clicks on the "Profile" button', () => {
        cy.get('#nav a[routerLink="/profile"]').click();
    });

    it('goes to the User Profile page', () => {
        cy.url()
        .should('include','/profile')
        .should('equal','http://localhost:4200/profile')
    });

    it('displays the correct profile image, profile username and email', () => {
        cy.get('.rounded')
        .children('.row')
        .children()
        .first()
        .should('have.class','col-md-3 border-right')
        .children('div')
        .children()
        .eq(1)
        .should('have.class','font-weight-bold')
        .next()
        .should('have.class','text-black-50')
        .parent()
        .find('img')
        .should('have.class','rounded-circle mt-5')
        .should('have.attr','width','150px')
        .should('have.attr','src')
        .should('include','depositphotos_179308454-stock-illustration-unknown-person-silhouette-glasses-profile.jpg')
    });

    it('displays the correct page name, user full name, user gender and user city', () => {
        cy.get('.rounded')
        .children('.row')
        .children()
        .eq(1)
        .should('have.class','col-md-5 border-right')
        .children('div')
        .should('have.class','p-3 py-5')
        .children()
        .each(($el, index, $list) => {
            if (index === 0) {
                cy.wrap($el)
                .should('have.class','d-flex justify-content-between align-items-center mb-3')
                .find('h4')
                .should('have.class','text-right')
                .should('contain.text','Profile Settings')
            } else if(index === 1) {
                cy.wrap($el)
                .should('have.class','row mt-2')
                .find('label')
                .should('have.class','labels')
                .should('contain.text','Name')
                .next()
                .should('have.class','form-control')
                .should('have.attr','placeholder','Full name')
                .should('have.attr', 'readonly', 'readonly')
            } else if (index === 2) {
                cy.wrap($el)
                .should('have.class','row mt-3')
                .find('label')
                .should('have.class','labels')
                .should('contain.text','Gender')
                .next()
                .should('have.class','form-control')
                .should('have.attr','placeholder','Gender')
                .should('have.attr', 'readonly', 'readonly')
            } else {
                cy.wrap($el)
                .should('have.class','row mt-3')
                .find('label')
                .should('have.class','labels')
                .should('contain.text','City')
                .next()
                .should('have.class','form-control')
                .should('have.attr','placeholder','City')
                .should('have.attr', 'readonly', 'readonly')
            }
        })
    });

});