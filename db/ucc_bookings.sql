CREATE TABLE ucc_bookings (
    cust_id INT UNSIGNED, 
    service_id INT UNSIGNED, 
    date DATE, 
    start_time TIME, 
    end_time TIME, 
    FOREIGN KEY (cust_id) REFERENCES ucc_users(id), 
    FOREIGN KEY (service_id) REFERENCES ucc_services(id), 
    CONSTRAINT unique_row UNIQUE (cust_id, service_id, date, start_time, end_time), 
    CONSTRAINT unique_service_slot UNIQUE (service_id, date, start_time, end_time)
);

insert into ucc_bookings values(2,2,'2022-02-15','12:00:00','01:00:00');
insert into ucc_bookings values(1,1,'2022-02-15','12:00:00','01:00:00');
insert into ucc_bookings values(1,3,'2022-02-15','11:00:00','01:00:00');