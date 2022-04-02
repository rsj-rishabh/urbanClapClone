# UrbanClapClone

<b>Course</b>: CEN5035 - Software Engineering <br>
<b>Institute</b>: Unviersity of Florida <br>
<b>Semester</b>: Spring 2022 <br>
<b>Instructor</b>: Dr. Alin Dobra <br>
<b>Team</b>: 
* Prateek Kumar Goel ([Github](https://github.com/pkgprateek)) - Backend
* Rishabh Jaiswal ([Github](https://github.com/rsj-rishabh)) - Backend
* Raghunandhan Vaidy ([Github](https://github.com/Skillic-Kaiser)) - Frontend
* Madhuri Uppu ([Github](https://github.com/MadhuriUppu)) - Frontend

## Project Description:
The <strong>“UrbanClapClone”</strong> (name to be finalized) web application aims to aggregate utility services that consumers can access based on their current location. The application would enable the end-user to select their preferred service, book an appointment at a convenient time, pay the resultant charge and give feedback (for future reference). While, the primary criterion for listing the services would be the user’s location, the web application would also facilitate filtering based on service type, availability, cost, past experience (if they have utilized the service before) and user ratings. The application aims to be a one stop shop that caters to all the utility needs for the end user at a given location.

#

## Technology Stack:
* Framework : Angular
* Backend : GoLang
* Database : SQL (GORM Library)
* Version Control: Git
* Code Editor : Visual Studio Code

#

## Development Methodology:
* Each contributor pushes code in their own branch (mostly named after them).
* A pull request is created to merge the code to `master` branch which is our development branch.
* After each sprint, the final code is merged with `main` branch which is our final working product.
* A checkpoint branch is also created after each sprint for the purpose of tracking changes between two sprints.

#

## Running Backend Server:
* Clone the repository
```
git clone https://github.com/rsj-rishabh/urbanClapClone.git
```
* Make sure you have mysql installed and correctly set up.
* Create a new database in MySQL called "urbanClap" using:
```
mysql -u root -p
```
Enter mysql password, then run:
```
create database urbanClap;
```
* Goto config.go and update your mysql password
```
cd server/config/
code config.go
```
* Now navigate to server folder and run go server:
```
cd ./server/
go run main.go
```
Ignore any errors as it will check for required datatables (show the error), then automatically creates the datatables.

#

## Running Frontend Server:
* Clone the repository
```
git clone https://github.com/rsj-rishabh/urbanClapClone.git
```
* Install NodeJS LTS version from https://nodejs.org/en/ for your Operating System.
* Navigate to client folder and install required libraries:
```
cd ./client/
npm install
```
* In case of any error run audit and install once more:
```
npm audit fix --force && npm install
```
* Run the Angular Server:
```
npm start
```