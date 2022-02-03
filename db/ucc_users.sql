create table ucc_users (
	first_name VARCHAR(50) NOT NULL,
	last_name VARCHAR(50) NOT NULL,
	email VARCHAR(50) NOT NULL,
	gender VARCHAR(50) NOT NULL,
	username VARCHAR(50) PRIMARY KEY,
	password VARCHAR(50) NOT NULL,
	CHECK (gender in ('M', 'F'))
);
insert into ucc_users (first_name, last_name, email, gender, username, password) values ('Beilul', 'Ecles', 'becles0@home.pl', 'Female', 'becles0', 'FRg85m9fwsQi');
insert into ucc_users (first_name, last_name, email, gender, username, password) values ('Brendin', 'De Cleen', 'bdecleen1@va.gov', 'Male', 'bdecleen1', 'qWQu6PU0');
insert into ucc_users (first_name, last_name, email, gender, username, password) values ('Roda', 'Iacovielli', 'riacovielli2@seattletimes.com', 'Male', 'riacovielli2', 'sY0Gr445I');
insert into ucc_users (first_name, last_name, email, gender, username, password) values ('Natala', 'Rameaux', 'nrameaux3@github.com', 'Male', 'nrameaux3', 'KiqXt96');
insert into ucc_users (first_name, last_name, email, gender, username, password) values ('Bastien', 'Cornbill', 'bcornbill4@pcworld.com', 'Female', 'bcornbill4', 'H0hYYq');
insert into ucc_users (first_name, last_name, email, gender, username, password) values ('Aila', 'Milington', 'amilington5@de.vu', 'Male', 'amilington5', 'YLI3mb3xj');
insert into ucc_users (first_name, last_name, email, gender, username, password) values ('Kristos', 'Simic', 'ksimic6@altervista.org', 'Male', 'ksimic6', 'Llbvz13WsV5');
insert into ucc_users (first_name, last_name, email, gender, username, password) values ('Marielle', 'Egan', 'megan7@thetimes.co.uk', 'Female', 'megan7', '9yikyJqP');
insert into ucc_users (first_name, last_name, email, gender, username, password) values ('Joice', 'Jaquiss', 'jjaquiss8@cornell.edu', 'Male', 'jjaquiss8', 'yjkvFmqQGd40');
insert into ucc_users (first_name, last_name, email, gender, username, password) values ('Nollie', 'Vernazza', 'nvernazza9@friendfeed.com', 'Female', 'nvernazza9', 'tWqrU1C');
insert into ucc_users (first_name, last_name, email, gender, username, password) values ('Sydney', 'Doubrava', 'sdoubravaa@craigslist.org', 'Male', 'sdoubravaa', 'C6ey7K5fk4XQ');