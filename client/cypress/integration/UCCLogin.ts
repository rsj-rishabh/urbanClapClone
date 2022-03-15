describe('Urban Clap Clone Login Modal Test', () => {
    before(() => {
      cy.visit('http://localhost:4200/');
    });
  
    it('clicks the login button', () => {
        cy.get('button#login')
        .should('contain.text','Login')
        .should('be.enabled').click();
    });

    it('displays the login modal', () => {
        cy.get('body')
        .should('have.attr','class','modal-open');
        
        cy.get('body')
        .should('have.attr','class','modal-open')
        .find('div.modal')
        .should('have.id','loginModal');
        
        cy.get('div#loginModal')
        .should('have.attr','aria-modal','true')
        .and('have.attr','class','modal fade show');
    });

    it('displays the login form fields', () => {
        cy.get('div#loginModal')
        .should('contain.html','form');
        
        cy.get('div#loginModal')
        .find('form')
        .should('have.attr','class','login-form');
        
        cy.get('div#loginModal').find('form').within(($form) => {
            cy.get('h2')
            .should('contain.text','User Login')
            
            cy.get('input.form-control[name="email"]')
            .should('have.attr','type','email')
            .and('have.attr','placeholder','Email')

            cy.get('input.form-control[name="password"]')
            .should('have.attr','type','password')
            .and('have.attr','placeholder','Password')
          });
    });

    it('displays the login form submit button', () => {    
        cy.get('div#loginModal').find('form').within(($form) => {
            cy.get('button[type="submit"]')
            .should('have.attr','routerLinkActive','active')
            .should('contain.text','Log In')
          });
    });

    it('displays the link to Register in login modal', () => {    
        cy.get('div#loginModal').find('form').within(($form) => {
            cy.get('a')
            .should('have.attr','class','sign-up')
            .should('have.attr','routerLinkActive','active')
            .should('contain.text',"Don't have an account? Sign Up.")
          });
    });
    
    it('redirects to Services page on clicking login form button', () => {    
        cy.get('div#loginModal').find('form').within(($form) => {
            cy.get('button[type="submit"]')
            .click();
          });
          
        cy.on("url:changed", (newUrl) => {
            expect(newUrl).to.contain("/services")
          });
    });

    it('clicks the login button', () => {
        cy.get('button#login')
        .should('contain.text','Login')
        .should('be.enabled')
        .click();
    });

    it('redirects to User Registration page on clicking register link in login modal', () => {    
        cy.get('div#loginModal').find('form').within(($form) => {
            cy.get('a.sign-up')
            .click();
          });
          
        cy.on("url:changed", (newUrl) => {
            expect(newUrl).to.contain("/register")
          });
    });


  });