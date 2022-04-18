describe('Urban Clap Pro Footer Test', () => {

    before(() => {
      cy.visit('http://localhost:4200/');
    });
    
    it('has the footer element', () => {
      cy.get('.footer-dark')
      .find('footer')
    });

    it('has the About, Services, Urban Clap Pro and Social media sections with relevant links', () => {
      cy.get('footer')
      .children('.container')
      .children('.row')
      .children()
      .each(($el, index, $list) => {
        if (index === 0) {
          cy.wrap($el)
          .should('have.class','col-sm-6 col-md-3 item')
          .find('h3')
          .should('have.text','Services')
          .next()
          .children()
          .each(($el, index, $list) => {
                if (index === 0) {
                    cy.wrap($el)
                    .find('a')
                    .should('have.attr','href','#')
                    .should('contain.text','Home')
                } else if (index === 1) {
                    cy.wrap($el)
                    .find('a')
                    .should('have.attr','href','#')
                    .should('contain.text','Terms')
                } else if (index === 2) {
                    cy.wrap($el)
                    .find('a')
                    .should('have.attr','href','#')
                    .should('contain.text','Privacy Policy')
                } else {
                    cy.wrap($el)
                    .find('a')
                    .should('have.attr','href','#')
                    .should('contain.text','Returns & Refunds')
                }
          })
        } else if (index === 1) {
            cy.wrap($el)
            .should('have.class','col-sm-6 col-md-3 item')
            .find('h3')
            .should('have.text','About')
            .next()
            .children()
            .each(($el, index, $list) => {
                  if (index === 0) {
                      cy.wrap($el)
                      .find('a')
                      .should('have.attr','href','https://github.com/rsj-rishabh/urbanClapClone')
                      .should('contain.text','Project')
                  } else if (index === 2) {
                      cy.wrap($el)
                      .find('a')
                      .should('have.attr','href','#')
                      .should('contain.text','Careers')
                  }
            })
        } else if (index === 2) {
            cy.wrap($el)
            .should('have.class','col-md-6 item text')
            .find('h3')
            .should('have.text','Urban Clap Pro')
            .parent()
            .find('p')
            .should('contain.text','The platform helps customers book realiable & high quality services for your home on demand. The services are delivered by highly trained professionals at your time and schedule.')
        } else {
            cy.wrap($el)
            .should('have.class','col item social')
            .children()
            .each(($el, index, $list) => {
                  if (index === 0) {
                      cy.wrap($el)
                      .should('have.attr','href','#')
                      .find('i')
                      .should('have.class','bi bi-facebook fb-icon')
                  } else if (index === 1) {
                      cy.wrap($el)
                      .should('have.attr','href','#')
                      .find('i')
                      .should('have.class','bi bi-twitter')
                } else if (index === 2) {
                      cy.wrap($el)
                      .should('have.attr','href','#')
                      .find('i')
                      .should('have.class','bi bi-snapchat')
                } else {
                      cy.wrap($el)
                      .should('have.attr','href','#')
                      .find('i')
                      .should('have.class','bi bi-instagram')
                  }
            })
        }
      })
    })

    it('has the Copyright statement', () => {
        cy.get('footer')
        .children('.container')
        .children()
        .eq(1)
        .should('have.class','copyright')
        .should('contain.text','Copyright UrbanClapPro @ Spring 2022')
    });

})

