# Sprint - 1

## User stories (Goal):

The user stories selected to run through the first sprint cycle are:
* As a user, I want to browse all the professional home services provided.
    * I should have a list to select the service I want.
* As a user, I want to register myself to the application so that I can keep my account private.
    * I should be able to use to use email or phone along with the password.
* As a user, I should be able to log into of the application using my unique ID and password.


## Sprint Requirements (Review):
Frontend:
1.	Application Landing Screen
2.	User Registration Screen
3.	User Login Screen
4.	Page to list offered Services

Backend:
1.	User Registration API
2.	User Login/Logout API Endpoints
3.	API to list offered services

Database:
1.	Creating DB Schema
2.	Adding Dummy Data for user and services

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


## Demonstration:
Video with demo of system (Link: https://youtu.be/qFLba_CxBwM)
1. Front-end Demo (with mocked up back-end)
2. Back-end Demo (command line or Postman)


## API Endpoints:
"/services" - GET calls *GetAllServices* and returns all the services present in the database

"/services" - POST calls *CreateService* add a new service to the application

"/user" - POST calls *CreateUser* function and registers new user to the database 
 
"/user/{username}" - GET takes {username} and calls *GetUser* to return the user with the give username if prresent in the database else return 404.

