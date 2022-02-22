create table ucc_users (
	uid INT PRIMARY KEY
	name VARCHAR(70) NOT NULL,
	username VARCHAR(20) NOT NULL UNIQUE,
	password VARCHAR(20) NOT NULL,
	email VARCHAR(50) NOT NULL,
	gender VARCHAR(1) NOT NULL,
	CHECK (gender in ('M', 'F'))
);
insert into ucc_users (name, email, gender, username, password) values (0, 'Dummy Duck', 'dummy', 'dumdum', 'dummy@ufl.edu', 'M');
insert into ucc_users (name, email, gender, username, password) values (1, 'Buzz Lightyear', 'buzz', 'busybee', 'buzz@ufl.edu', 'M');
insert into ucc_users (name, email, gender, username, password) values (2, 'Snow White', 'snow', 'abc1234', 'snow@ufl.edu', 'F');