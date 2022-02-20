CREATE TABLE ucc_bookings (
    custID INT UNSIGNED, 
    serviceID INT UNSIGNED, 
    date DATE, startTime TIME, 
    endTime TIME, 
    FOREIGN KEY (custID) REFERENCES ucc_users(id), 
    FOREIGN KEY (serviceID) REFERENCES ucc_services(id), 
    CONSTRAINT unique_row UNIQUE (custID, serviceID, date, startTime, endTime), 
    CONSTRAINT unique_service_slot UNIQUE (serviceID, date, startTime, endTime)
);

insert into ucc_bookings values(2,2,'2022-02-15','12:00:00','01:00:00');
insert into ucc_bookings values(1,1,'2022-02-15','12:00:00','01:00:00');
insert into ucc_bookings values(1,3,'2022-02-15','11:00:00','01:00:00');