# Sprint - 1

## User stories (Goal):

The user stories selected to run through the first sprint cycle are:
* As a user, I want to book a service.
* As a user, I want to see the services booked by me.
* As a user, I should be able to log into of the application using my unique ID and password.


## Sprint Requirements (Review):
Frontend:
1.	Booking modal
2.	Booking screen
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

Additional Note:
All APIs are RESTful and contain 4 major endpoints (CRUD) create, read, update and delete. The Backend uses POST and GET and all the data is parsed in JSON.

## Sprint Status (Accomplished):

- Created directory structure to seperatre client, server, and database schema.
- Compeleted Initial server setup in GoLang
- Initialized angluar using npm and webpack.
- Created landing page for the applicaiton.
- Developed registration and login pages with respective forms.
- Implemented API endpoints with GET/POST request for user forms.
- Added API endpoints for list of services.
- Created database schema for User and Services table
- Developed services page to list the services offered through the application.
- Tested APIs using Postman.
- Integrated APIs on backend server with frontend pages.
- Cleaned up repository structure and removed cached libraries.


## API Endpoints:
"/services" - GET calls *GetAllServices* and returns all the services present in the database

"/services" - POST calls *CreateService* add a new service to the application

"/user" - POST calls *CreateUser* function and registers new user to the database 
 
"/user/{username}" - GET takes {username} and calls *GetUser* to return the user with the give username if prresent in the database else return 404.
