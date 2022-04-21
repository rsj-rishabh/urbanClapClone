# Sprint - 2

## User stories (Goal):

The user stories selected to run through the first sprint cycle are:
* As a user, I want to book a service.
* As a user, I want to see the services booked by me.
* As a user, I should be able to log into of the application using my unique ID and password.

#

## Responsibilities: 
* Prateek Kumar Goel ([Github](https://github.com/pkgprateek)) - Frontend
* Rishabh Jaiswal ([Github](https://github.com/rsj-rishabh)) - Backend
* Raghunandhan Vaidy ([Github](https://github.com/Skillic-Kaiser)) - Frontend
* Madhuri Uppu ([Github](https://github.com/MadhuriUppu)) - Backend

#

## Running the Project:
Please check the root [repository description](https://github.com/rsj-rishabh/urbanClapClone) or main [README.md](https://github.com/rsj-rishabh/urbanClapClone/blob/master/README.md) for detailed instructions on installation and runninng the project successfully.

#

## Sprint Requirements (Review):
Frontend:
1.	Service modal
2.	Service screen
3.	User session management
4.	UI enhancements

Backend:
1.	User login API
2.	Service booking API
3.  API to list booked service

Database:
1.	Creating DB Schema for booking table
2.	Automigration

Test:
1.  Go tests for APIs
2.  Cypress tests for UI
3.  Unit tests for frontend

Additional Note:
All APIs are RESTful and contain 4 major endpoints (CRUD) create, read, update and delete. The Backend uses POST and GET and all the data is parsed in JSON.

#

## Sprint Status (Accomplished):

- Fixed Cross-Origin-Resource-Sharing
- Create Booking Database Schema
- Added auto migration for GORM
- Created postman Backend Testing json collection
- Implemented Gin for APIs
- Fixed various issues with user APIs on frontend
- Setup build action on git for auto build testing
- API Implementation Booking Service
- Changed Service model to fetch multiple services instead of single
- Added Cypress testing for Login and Registration for frontend
- Added Unit Testing for Backend APIs
- Restyling Login and Registration Pages
- Added Unit Testing for Frontend (Login, Service and Registration)

#

## Sprint Issue Status:

Below mentions issueswhich would be the primary focus at the start of Sprint 3.

- Jasmine and Karma utilized for frontend unit testing creating issue with webpack and tslib. Hence, *.spec.ts are not being found by karma_webpack. (Error was reported to main angular repository)
- Angular Cli unsupported with new node package installed doesn't works with angular-core 13. Angular would be downgraded along with node to support "types" config and "tslib__WEBPACK_IMPORTED_MODULE_3__.__decorate" errors to resolve frontend unit testing issues.

#

## API Endpoints:
"/getServices" - GET calls *GetAllServices* and returns all the services present in the database

"/createService" - POST calls *CreateService* add a new service to the application

"/register" - POST calls *CreateUser* function and registers new user to the database 
 
"/login" - GET takes {username} and calls *GetUser* to return the user with the given username if present in the database else return 404.

"/getBookings/{custId}" - GET takes {custId} i.e. the user ID and calls *GetBookings* function to return the user with the given username if present in the database else return 404.

"/bookService" - POST calles *CreateBooking* function to return the booking details if a service is booked or throw an error.
