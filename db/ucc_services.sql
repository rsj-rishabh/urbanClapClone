create table ucc_services (
	name TEXT NOT NULL,
	description VARCHAR(200),
	gender VARCHAR(1),
	category VARCHAR(30) DEFAULT 'Other',
	CHECK (gender in ('M', 'F', null))
);
insert into ucc_services (name, description, gender) values ('AC Maintanance', 'Excision of Right External Jugular Vein, Open Approach', null);
insert into ucc_services (name, description, gender, category) values ('Plumbing', 'Revise of Synth Sub in Sacrococcygeal Jt, Perc Endo Approach', null, 'Household');
insert into ucc_services (name, description, gender, category) values ('Haircut', 'Removal of Infusion Device from Lum Disc, Open Approach', 'F', 'Personal Care');
insert into ucc_services (name, description, gender, category) values ('Exterminator', 'Tomo Nucl Med Imag of L Up Extrem using Oth Radionuclide', null, 'Pest Control');
insert into ucc_services (name, description, gender, category) values ('Furniture Repair', 'Removal of Ext Fix from L Ulna, Perc Approach', null, 'Household');
insert into ucc_services (name, description, gender, category) values ('Haircut', 'Fluoroscopy of Left Pulmonary Artery using H Osm Contrast', 'M', 'Personal Care');
insert into ucc_services (name, description, gender, category) values ('Chef', 'Drainage of R Sup Parathyroid with Drain Dev, Perc Approach', null, 'Catering');
insert into ucc_services (name, description, gender, category) values ('Nail Work', 'Alteration of Neck with Synthetic Substitute, Perc Approach', 'F', 'Personal Care');