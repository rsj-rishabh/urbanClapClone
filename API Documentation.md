API Documentation

"/getServices" - GET calls *GetAllServices* and returns all the services present in the database

"/createService" - POST calls *CreateService* add a new service to the application

"/register" - POST calls *CreateUser* function and registers new user to the database 
 
"/login" - GET takes {username} and calls *GetUser* to return the user with the given username if present in the database else return 404.

"/getBookings/{custId}" - GET takes {custId} i.e. the user ID and calls *GetBookings* function to return the user with the given username if present in the database else return 404.

"/bookService" - POST calles *CreateBooking* function to return the booking details if a service is booked or throw an error.
