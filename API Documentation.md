API Documentation

The urbanClapClone's API is a JSON-based API. All requests are made to endpoints beginning with: 'http://localhost:3000/api'.
Requests can be made with http.


1. "/getServices" 

This API endpoint retrieves the list of services that the end-user can avail. This is a GET request.
The services are be divided into the following categories:

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
This  is sent with the default "Content-Type" header of "application/x-www-form-urlencoded" 
which sends the request as a single query string with name/vale pairs separated by '&'.

The format of the JSON to be sent in this POST request is as follows:

{
        "name": "New Service",
        "description": "New Service description",
        "category": "Electronics/Household/Personal Care/Animal/Pet"
}

3. "/register"

This API endpoint registers a new user. This is a POST request. This  is sent with the default 
"Content-Type" header of "application/x-www-form-urlencoded" which sends the request as a single 
query string with name/vale pairs separated by '&'.

The format of the JSON to be sent in this POST request is as follows:

{
        "name": "New  Name",
        "username": "New Username",
        "email": "New Email"
        "gender":"M/F"
        "password":"ExPw1234"
}

| Parameter     | Type    | Details                                       |
| ------------- |:-------:| ---------------------------------------------:|
| id            | Integer | Unique identifier for the user.               |
| name          | String  | Name of the user. Must contain First and 
                            Last name separated by space.                 |
| username      | String  | Username of the user.                         |
| email         | String  | Email ID of the user. Must be of the form
                            'xxxxx@xxx.xxx'                               |
| gender        | String  | Gender of the user. Can be either 'M' or 'F'. |
| password      | String  | Password for the user. Has to be between 7 to 
                            14 characters in length and must contain 
                            atleast one lower case character, one upper 
                            case character and one number.                | 

4. "/login"

This API endpoint logs in a new user. This is a POST request. This request is sent with the default 
"Content-Type" header of "application/x-www-form-urlencoded" which sends the request as a single 
query string with name/vale pairs separated by '&'. If the user credentials match with that in the
database, it returns the user details in JSON format as mentioned in the description for "/register"
or it returns a '404 Not Found' error.

The format of the JSON to be sent in this POST request is as follows:

{
        "username": "Logging In Username",
        "password":"Logging In password"
}
 
"/login" - GET takes {username} and calls *GetUser* to return the user with the given username if present in the database else return 404.

"/getBookings/{custId}" - GET takes {custId} i.e. the user ID and calls *GetBookings* function to return the user with the given username if present in the database else return 404.

"/bookService" - POST calles *CreateBooking* function to return the booking details if a service is booked or throw an error.
