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
&emsp;    {  
&emsp;&emsp;        "id": 1,  
&emsp;&emsp;        "name": "AC Maintanence",  
&emsp;&emsp;        "description": "Any type of AC maintanence such as filter cleaning, part replacement, etc.",  
&emsp;&emsp;        "category": "Electronics",  
&emsp;&emsp;        "image_name": "air_conditioning.jpg",  
&emsp;&emsp;        "price": 80  
&emsp;    },  
&emsp;    {  
&emsp;&emsp;        "id": 2,  
&emsp;&emsp;        "name": "Plumbing",  
&emsp;&emsp;        "description": "Sanitary and household plumbing. No sewage service.",  
&emsp;&emsp;        "category": "Household",  
&emsp;&emsp;        "image_name": "plumbing.jpg",  
&emsp;&emsp;        "price": 100  
&emsp;    },  
&emsp;    {  
&emsp;&emsp;        "id": 3,  
&emsp;&emsp;        "name": "Saloon",  
&emsp;&emsp;        "description": "Haricut, massage, nailwork, makeup, etc.",  
&emsp;&emsp;        "category": "Personal Care",  
&emsp;&emsp;        "image_name": "saloon.jpg",  
&emsp;&emsp;        "price": 25  
&emsp;    }  
]  

*Service DB Schema:*  

| Parameter     | Type    | Details                                        |
| ------------- |:-------:| ----------------------------------------------:|
| id            | Integer | Unique identifier for the service. PRIMARY KEY |
| name          | String  | Name of the service.                           |
| description   | String  | Description of the service.                    |
| category      | String  | Category of the service.                       |  
  
  
## 2. createService

This API endpoint creates a new service as specified by the end-user. This is a POST request.
This is sent with the default "Content-Type" header of "application/x-www-form-urlencoded".

*Request type:* **POST**  
*Input body type:* **JSON Object**  
*Output type:* **JSON Object**  

*Sample request:* http://localhost:3000/api/createService  

*Sample input:*  
{  
&emsp;    "name": "Tutoring",  
&emsp;    "description": "Take help in assignments and more.",  
&emsp;    "category": "Home tution",  
&emsp;    "price": 15  
}  

*Sample output:*  
{  
&emsp;    "id": 6,  
&emsp;    "name": "Tutoring",  
&emsp;    "description": "Take help in assignments and more.",  
&emsp;    "category": "Home tution",  
&emsp;    "image_name": "default.jpg",  
&emsp;    "price": 15  
}  
  
  
## 3. register

This API endpoint registers a new user. 
This is sent with the default "Content-Type" header of "application/x-www-form-urlencoded"

*Request type:* **POST**  
*Input body type:* **JSON Object**  
*Output type:* **JSON Object**  

*Sample request:* http://localhost:3000/api/register  

*Sample input:*  
{  
&emsp;    "name": "alex",  
&emsp;    "email": "alex@ufl.edu",  
&emsp;    "gender": "F",  
&emsp;    "username": "alex",  
&emsp;    "password": "alex1"  
}  

*Sample output:*  
{  
&emsp;    "id": 4,  
&emsp;    "name": "alex",  
&emsp;    "username": "alex",  
&emsp;    "password": "alex1",  
&emsp;    "email": "alex@ufl.edu",  
&emsp;    "gender": "F"  
}  

*User DB Schema*  

| Parameter     | Type    | Details                                                                    |
| ------------- |:-------:| --------------------------------------------------------------------------:|
| id            | Integer | Unique identifier for the user. PRIMARY KEY                                |
| name          | String  | Name of the user. Must contain First and <br> Last name separated by space.|
| username      | String  | Username of the user.                                                      |
| email         | String  | Email ID of the user. Must be of the form <br> 'xxxxx@xxxxxx'              |
| gender        | String  | Gender of the user. Can be either 'M' or 'F'.                              |
| password      | String  | Password for the user. Has to be between 7 to <br> 14 characters in length and must contain <br> atleast one lower case character, one upper <br> case character and one number.                        | 


## 4. login

This API endpoint logs in a new user. This request is sent with the default 
"Content-Type" header of "application/x-www-form-urlencoded". If the user credentials match with that in the
database, it returns the user details in JSON format else it returns a *404 Not Found* error.

*Request type:* **POST**  
*Input body type:* **JSON Object**  
*Output type:* **JSON Object**  

*Sample request:* http://localhost:3000/api/login  

*Sample input:*  
{  
&emsp;    "username": "dummy",  
&emsp;    "password": "dumdum"  
}  

*Sample output:*  
{  
&emsp;    "id": 1,  
&emsp;    "name": "Dummy Duck",  
&emsp;    "username": "dummy",  
&emsp;    "password": "dumdum",  
&emsp;    "email": "dummy@ufl.edu",  
&emsp;    "gender": "M"  
}  


## 5. getBookings

This API endpoint retrieves the list of services booked by a user.
This request is sent with the parameter *userId* which is the *id* field of the user.
Returns a *404 Not Found* error if there are no bookings or if the *userId* is invalid.

*Request type:* **GET**    
*Output type:* **JSON Array**  

*Sample request:* http://localhost:3000/api/getBookings?userId=1  

*Sample output:*  
[  
&emsp;    {  
&emsp;&emsp;        "id": 1,  
&emsp;&emsp;        "user_id": 1,  
&emsp;&emsp;        "service_id": 1,  
&emsp;&emsp;        "date": "2022-02-15",  
&emsp;&emsp;        "start_time": "12:30",  
&emsp;&emsp;        "end_time": "13:30",  
&emsp;&emsp;        "is_cancelled": false  
&emsp;    },  
&emsp;    {  
&emsp;&emsp;        "id": 2,  
&emsp;&emsp;        "user_id": 1,  
&emsp;&emsp;        "service_id": 2,  
&emsp;&emsp;        "date": "2022-02-15",  
&emsp;&emsp;        "start_time": "16:30",  
&emsp;&emsp;        "end_time": "17:30",  
&emsp;&emsp;        "is_cancelled": false  
&emsp;    }  
]  

*Bookings DB Schema*

| Parameter     | Type    | Details                                                               |
| ------------- |:-------:| ---------------------------------------------------------------------:|
| id            | Integer | Unique identifier for the service booking. PRIMARY KEY                |
| user_id       | Integer | Unique identifier for the user who booked this particular service.    |
| service_id    | Integer | Unique identifier for the service booked by the user.                 |
| date          | String  | Date on which the booking was made by the user. Format: "YYYY-MM-DD". |
| start_time    | String  | Time at which the service booking commences. Format: "HH:MM".         |
| end_time      | String  | Time at which the service booking ends Format: "HH:MM".               |
| is_cancelled  | Boolean | Cancellation status of the booking. Can be true or false.             | 


## 6. bookService

This API endpoint creates a new booking for a service by the end-user.
This request is sent with the default "Content-Type" header of "application/x-www-form-urlencoded". It returns a *500 Internal Server Error* status with the message *Time slot unavailable* if it is booked by another user for the same time slot.  

*Request type:* **POST**  
*Input body type:* **JSON Object**  
*Output type:* **JSON Object**  

*Sample request:* http://localhost:3000/api/bookService  

*Sample input:*  
{  
&emsp;    "user_id": 1,  
&emsp;    "service_id": 2,  
&emsp;    "date": "2022-02-23",  
&emsp;    "start_time": "11:30",  
&emsp;    "end_time": "12:30"  
}  

*Sample output:*  
{  
&emsp;    "id": 4,  
&emsp;    "user_id": 1,  
&emsp;    "service_id": 2,  
&emsp;    "date": "2022-02-23",  
&emsp;    "start_time": "11:30",  
&emsp;    "end_time": "12:30",  
&emsp;    "is_cancelled": false  
}  

## 7. cancelBooking

This API endpoint cancels a particular booking for a service by the end-user.
This request is sent with the default "Content-Type" header of "application/x-www-form-urlencoded". The request either 
sets the *is_cancelled* field of the booking to *true* and returns a *200 OK* status along with the message 
*Booking is cancelled* or if the booking has already been cancelled it returns a *Booking already cancelled*
message. 

*Request type:* **GET**  
*Output type:* **String**  

*Sample request:* http://localhost:3000/api/cancelBooking?id=1  

*Sample output:*  
"Booking is cancelled"  

## 8. getCancelledBookings

This API endpoint retrieves the list of cancelled services by the end-user.
This matches the *user_id* of the parameter in the request URL and finds Bookings which have *is_cancelled*
field set to *true*. If the *user_id* field cannot be found, it returns a *404 Not Found* error.

*Request type:* **GET**  
*Output type:* **JSON Array**  

*Sample request:* http://localhost:3000/api/getCancelledBookings?userId=1  

*Sample output:*  
[  
&emsp;    {  
&emsp;&emsp;        "id": 1,  
&emsp;&emsp;        "user_id": 1,  
&emsp;&emsp;        "service_id": 1,  
&emsp;&emsp;        "date": "2022-02-15",  
&emsp;&emsp;        "start_time": "12:30",  
&emsp;&emsp;        "end_time": "13:30",  
&emsp;&emsp;        "is_cancelled": true  
&emsp;    }  
]  


## 9. getServiceInfo

This API endpoint returns information about a service when given its *id*.

*Request type:* **GET**  
*Output type:* **JSON Object**  

*Sample request:* http://localhost:3000/api/getServiceInfo?serviceId=1  

*Sample output:*  
{  
&emsp;        "id": 1,  
&emsp;        "name": "AC Maintanence",  
&emsp;        "description": "Any type of AC maintanence such as filter cleaning, part replacement, etc.",  
&emsp;        "category": "Electronics",  
&emsp;        "image_name": "air_conditioning.jpg",  
&emsp;        "price": 80  
}