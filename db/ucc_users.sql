create table ucc_users (
	name VARCHAR(70) NOT NULL,
	email VARCHAR(50) NOT NULL,
	gender VARCHAR(1) NOT NULL,
	username VARCHAR(20) PRIMARY KEY,
	password VARCHAR(20) NOT NULL,
	CHECK (gender in ('M', 'F'))
);
insert into ucc_users (name, email, gender, username, password) values ('Dummy Duck', 'dummy@gmail.com', 'M', 'dummy1', 'dummy#1');
insert into ucc_users (name, email, gender, username, password) values ('Beilul Ecles', 'becles0@home.pl', 'F', 'becles0', 'FRg85m9fwsQi');
insert into ucc_users (name, email, gender, username, password) values ('Brendin De Cleen', 'bdecleen1@va.gov', 'M', 'bdecleen1', 'qWQu6PU0');
insert into ucc_users (name, email, gender, username, password) values ('Roda Iacovielli', 'riacovielli2@seattletimes.com', 'M', 'riacovielli2', 'sY0Gr445I');
insert into ucc_users (name, email, gender, username, password) values ('Natala Rameaux', 'nrameaux3@github.com', 'M', 'nrameaux3', 'KiqXt96');
insert into ucc_users (name, email, gender, username, password) values ('Bastien Cornbill', 'bcornbill4@pcworld.com', 'F', 'bcornbill4', 'H0hYYq');
insert into ucc_users (name, email, gender, username, password) values ('Aila Milington', 'amilington5@de.vu', 'M', 'amilington5', 'YLI3mb3xj');
insert into ucc_users (name, email, gender, username, password) values ('Kristos Simic', 'ksimic6@altervista.org', 'M', 'ksimic6', 'Llbvz13WsV5');
insert into ucc_users (name, email, gender, username, password) values ('Marielle Egan', 'megan7@thetimes.co.uk', 'F', 'megan7', '9yikyJqP');
insert into ucc_users (name, email, gender, username, password) values ('Joice Jaquiss', 'jjaquiss8@cornell.edu', 'M', 'jjaquiss8', 'yjkvFmqQGd40');
insert into ucc_users (name, email, gender, username, password) values ('Nollie Vernazza', 'nvernazza9@friendfeed.com', 'F', 'nvernazza9', 'tWqrU1C');
insert into ucc_users (name, email, gender, username, password) values ('Sydney Doubrava', 'sdoubravaa@craigslist.org', 'M', 'sdoubravaa', 'C6ey7K5fk4XQ');