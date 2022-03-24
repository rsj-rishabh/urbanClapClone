API Documentation

The urbanClapClone's API is a JSON-based API. All requests are made to endpoints beginning with: 'http://localhost:3000/api'.
Requests can be made with http.


1. "/getServices" 

This API endpoint retrieves the list of services that the end-user can avail. This is a GET request.The services are be divided into the following categories:

a. Electronics
b. Household
c. Personal Care
d. Animal/Pet

The JSON returned by this API has the following form:

{
        "id": 1,
        "name": "AC Maintanence",
        "description": "Any type of AC maintanence such as filter cleaning, part replacement, etc.",
        "category": "Electronics"
}

| Parameter     | Type    | Details                            |
| ------------- |:-------:| ----------------------------------:|
| id            | Integer | Unique identifier for the service. |
| name          | String  | Name of the service.               |
| description   | String  | Description of the service.        |
| category      | String  | Category of the service.           |

2. "/createService"

This API endpoint creates a new service as specified by the end-user. This is a POST request.
The format of the JSON to be sent in this POST request is as follows:

{
        "id": 1234,
        "name": "New Service",
        "description": "New Service description",
        "category": "Electronics/Household/Personal Care/Animal/Pet"
}

3. 

"/register" - POST calls *CreateUser* function and registers new user to the database 
 
"/login" - GET takes {username} and calls *GetUser* to return the user with the given username if present in the database else return 404.

"/getBookings/{custId}" - GET takes {custId} i.e. the user ID and calls *GetBookings* function to return the user with the given username if present in the database else return 404.

"/bookService" - POST calles *CreateBooking* function to return the booking details if a service is booked or throw an error.
