var hour = Math.floor(Math.random() * 14 + 10)
var serviceNum = Math.floor(Math.random() * 5)

describe('Urban Clap Pro Service Booking Page Test', () => { 

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
    
    
    it('clicks "Book Now" button for one of the services', () => {
        cy.get('section')
        .find('.row .col-6')
        .eq(serviceNum)
        .find('section ul li a')
        .click()
    });

    it('goes to the Service Booking page', () => {
        cy.url()
        .should('include','/bookService')
        .should('include','service_id')
        .should('include','service_name')
        .should('include','service_price')
    });

    it('displays the correct Service Booking image', () => {
        cy.get('.container .row .col-md-6')
        .first()
        .find('img')
        .should('have.class','img-fluid booking-img')
        .should('have.attr','src')
        .should('include','undraw_booking.svg')
    });

    it('displays the service name and price', () => {
        cy.get('.container .row .col-md-6')
        .next()
        .should('have.class','col-md-6 contents')
        .find('.col-md-8 .mb-4 p')
        .each(($el, index, $list) => {
            if(index === 0) {
                cy.wrap($el)
                .should('have.class','mb-4 center-align booking-service-name')
                .get('strong')
            } else {
                cy.wrap($el)
                .should('have.class','mb-4 center-align booking-service-price')
                .find('strong')
                .should('contain.text', 'Price:')
            }
        });
    });

    it('displays the correct service booking form', () => {
        cy.get('.container .row .col-md-6')
        .next()
        .find('.col-md-8 .mb-4')
        .nextAll()
        .first()
        .get('form .form-group')
        .each(($el, index, $list) => {
            if (index === 0) {
                cy.wrap($el)
                .prev()
                .should('contain.text','Enter date for service')
                .next()
                .should('have.class','form-group mb-4')
                .find('input')
                .should('have.attr','type','date')
                .should('have.attr','formControlName','date')
            } else {
                cy.wrap($el)
                .prev()
                .should('contain.text','Enter time for service')
                .next()
                .should('have.class','form-group mb-4')
                .find('input')
                .should('have.attr','type','time')
                .should('have.attr','formControlName','time')
            }
        })
    });

    it('displays the service booking form submit button', () => {
        cy.get('.container .row .col-md-6')
        .next()
        .find('.col-md-8 .mb-4')
        .nextAll()
        .first()
        .get('form .center-align')
        .find('input')
        .should('have.attr','type','submit')
        .should('have.value','Book')
        .should('have.class','btn btn-block btn-primary')
    });

    it('fills the service booking form correctly', () => {
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
                .type('2022-04-22')
                .should('have.value','2022-04-22')
            } else {
                cy.wrap($el)
                .find('input')
                .type(hour + ':45')
                .should('have.value',hour + ':45')
            }
        })
    });

    it('clicks the service booking form submit button', () => {
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