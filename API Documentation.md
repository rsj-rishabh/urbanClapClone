# API Documentation

The urbanClapClone's API is a JSON-based API. All requests are made to endpoints beginning with: 'http://localhost:3000/api'.
Requests can be made with http.


## 1. getServices

This API endpoint retrieves the list of services that the end-user can avail. 

*Request type:* **GET**  
*Output type:* **JSON Array**  

*Sample request:* http://localhost:3000/api/getServices  

*Sample output:*  
[  
&ensp;    {  
&ensp;&ensp;        "id": 1,  
&ensp;&ensp;        "name": "AC Maintanence",  
&ensp;&ensp;        "description": "Any type of AC maintanence such as filter cleaning, part replacement, etc.",  
&ensp;&ensp;        "category": "Electronics",  
&ensp;&ensp;        "image_name": "air_conditioning.jpg",  
&ensp;&ensp;        "price": 80  
&ensp;    },  
&ensp;    {  
&ensp;&ensp;        "id": 2,  
&ensp;&ensp;        "name": "Plumbing",  
&ensp;&ensp;        "description": "Sanitary and household plumbing. No sewage service.",  
&ensp;&ensp;        "category": "Household",  
&ensp;&ensp;        "image_name": "plumbing.jpg",  
&ensp;&ensp;        "price": 100  
&ensp;    },  
&ensp;    {  
&ensp;&ensp;        "id": 3,  
&ensp;&ensp;        "name": "Saloon",  
&ensp;&ensp;        "description": "Haricut, massage, nailwork, makeup, etc.",  
&ensp;&ensp;        "category": "Personal Care",  
&ensp;&ensp;        "image_name": "saloon.jpg",  
&ensp;&ensp;        "price": 25  
&ensp;    }  
]  

*Service DB Schema:*  
| Parameter     | Type    | Details                            |
| ------------- |:-------:| ----------------------------------:|
| id            | Integer | Unique identifier for the service. |
| name          | String  | Name of the service.               |
| description   | String  | Description of the service.        |
| category      | String  | Category of the service.           |  
  
  
## 2. createService

This API endpoint creates a new service as specified by the end-user. This is a POST request.
This  is sent with the default "Content-Type" header of "application/x-www-form-urlencoded" 
which sends the request as a single query string with inline parameters.

*Request type:* **POST**  
*Input body type:* **JSON Object**  
*Output type:* **JSON Object**  

*Sample request:* http://localhost:3000/api/createService  

*Sample input:*  
{  
&ensp;    "name": "Tutoring",  
&ensp;    "description": "Take help in assignments and more.",  
&ensp;    "category": "Home tution",  
&ensp;    "price": 15  
}  

*Sample output:*  
{  
&ensp;    "id": 6,  
&ensp;    "name": "Tutoring",  
&ensp;    "description": "Take help in assignments and more.",  
&ensp;    "category": "Home tution",  
&ensp;    "image_name": "default.jpg",  
&ensp;    "price": 15  
}  
  
  
3. "/register"

This API endpoint registers a new user. This is a POST request. This  is sent with the default 
"Content-Type" header of "application/x-www-form-urlencoded" which sends the request as a single 
query string with name/value pairs separated by '&'.

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
query string with name/value pairs separated by '&'. If the user credentials match with that in the
database, it returns the user details in JSON format as mentioned in the description for "/register"
or it returns a '404 Not Found' error.

The format of the JSON to be sent in this POST request is as follows:

{
        "username": "Logging In Username",
        "password":"Logging In password"
}

5. "/getBookings/{custId}"

This API endpoint retrieves the list of service bookings a user has made. This is a GET request.
This request is sent with the parameter "custId" which id the "id" field of the logged-in user.
Returns a '404 Not Found' error if there are no bookings or if the "custId" is invalid.

The format of the JSON returned by this GET request is as follows:

{
    "id": 1,
    "user_id": 1,
    "service_id": 1,
    "date": "2022-02-15",
    "start_time": "12:30",
    "end_time": "13:30",
    "is_cancelled": false
}

| Parameter     | Type    | Details                                       |
| ------------- |:-------:| ---------------------------------------------:|
| id            | Integer | Unique identifier for the service booking.    |
| user_id       | Integer | Unique identifier for the user who booked this 
                            particular service.                           |
| service_id    | Integer | Unique identifier for the service booked by  
                            the user.                                     |
| date          | String  | Date on which the booking was made by the 
                            user. Format: "YYYY-MM-DD".                   |
| start_time    | String  | Time at which the service booking commences.
                            Format: "HH:MM".                              |
| end_time      | String  | Time at which the service booking ends.
                            Format: "HH:MM".                              |
| is_cancelled  | Boolean | Cancellation status of the booking. Can be 
                            true or false.                                | 

6. "/bookService"

This API endpoint creates a new booking for a service by the end-user. This is a POST request.
This request is sent with the default "Content-Type" header of "application/x-www-form-urlencoded"
which sends the request as a single query string with name/value pairs separated by '&'. If the "start_time"
field is greater than the "end_time" field, it returns a '500 Internal Server Error' status with the message
'Time slot unavailable'.

The format of the JSON to be sent in this POST request is as follows:

{
    "user_id": "User ID of the user",
    "service_id": "ID of the service",
    "date": "YYYY-MM-DD",
    "start_time": "HH:MM",
    "end_time": "HH:MM",
    "is_cancelled": true
}

7. "/getServicesOfCity"

This API endpoint returns the list of particular type of services offered in a city. This is a POST request.
This request is sent with the default "Content-Type" header of "application/x-www-form-urlencoded"
which sends the request as a single query string with name/value pairs separated by '&'.

The format of the JSON to be sent in this POST request is as follows:

{
	"city_name":  "xyzw"
	"service_id": 1
}

| Parameter     | Type    | Details                            |
| ------------- |:-------:| ----------------------------------:|
| id            | Integer | Unique identifier for the 
                            city-service mapping.              |
| city_name     | String  | Name of the city where the service
                            is offered.                        |
| service_id    | String  | Unique identifier for the service. |

8. "/cancelBooking"

This API endpoint cancels a particular booking for a service by the end-user. This is a POST request.
This request is sent with the default "Content-Type" header of "application/x-www-form-urlencoded"
which sends the request as a single query string with name/value pairs separated by '&'. The request either 
sets the "is_cancelled" field of the booking to true and returns a '200 OK' status along with the message 
'Booking is cancelled' or if the booking has already been cancelled it returns a 'Booking already cancelled'
message. 

The format of the JSON to be sent in this POST request is as follows:

{
    "user_id": "User ID of the user",
    "service_id": "ID of the service"
}

9. "/getCancelledBookings"

This API endpoint retrieves the list of cancelled services by the end-user. This is a GET request.
This matches the "user_id" of the JSON in the request and finds Bookings which have "is_cancelled"
field set to true along with a '200 OK' status. If the "user_id" field cannot be found, it returns 
a '404 Not Found' error.

The format of the JSON returned by this GET request is as follows:

{
    "id": "ID of the booking",
    "user_id": "User ID of the user",
    "service_id": "ID of the service",
    "date": "YYYY-MM-DD",
    "start_time": "HH:MM",
    "end_time": "HH:MM",
    "is_cancelled": true
}


