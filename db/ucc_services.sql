create table ucc_services (
	code INT PRIMARY KEY,
	name TEXT NOT NULL,
	description VARCHAR(200),
	gender VARCHAR(1),
	category VARCHAR(30) DEFAULT 'Other',
	CHECK (gender in ('M', 'F', null))
);
insert into ucc_services (code, name, description, gender) values (1, 'AC Maintanance', 'Excision of Right External Jugular Vein, Open Approach', null);
insert into ucc_services (code, name, description, gender, category) values (2, 'Plumbing', 'Revise of Synth Sub in Sacrococcygeal Jt, Perc Endo Approach', null, 'Household');
insert into ucc_services (code, name, description, gender, category) values (3, 'Haircut', 'Removal of Infusion Device from Lum Disc, Open Approach', 'F', 'Personal Care');
insert into ucc_services (code, name, description, gender, category) values (4, 'Exterminator', 'Tomo Nucl Med Imag of L Up Extrem using Oth Radionuclide', null, 'Pest Control');
insert into ucc_services (code, name, description, gender, category) values (5, 'Furniture Repair', 'Removal of Ext Fix from L Ulna, Perc Approach', null, 'Household');
insert into ucc_services (code, name, description, gender, category) values (6, 'Haircut', 'Fluoroscopy of Left Pulmonary Artery using H Osm Contrast', 'M', 'Personal Care');
insert into ucc_services (code, name, description, gender, category) values (7, 'Chef', 'Drainage of R Sup Parathyroid with Drain Dev, Perc Approach', null, 'Catering');
insert into ucc_services (code, name, description, gender, category) values (8, 'Nail Work', 'Alteration of Neck with Synthetic Substitute, Perc Approach', 'F', 'Personal Care');