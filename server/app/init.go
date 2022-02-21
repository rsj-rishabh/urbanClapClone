package app

import (
	"time"

	"github.com/rsj-rishabh/urbanClapClone/server/app/model"
)

// DBMigrate will create and migrate the tables, and then make the some relationships if necessary
func (a *App) DBMigrate() {
	// Drop the table if it exists
	a.DB.AutoMigrate().DropTable(&model.User{})
	a.DB.AutoMigrate().DropTable(&model.Service{})
	a.DB.AutoMigrate().DropTable(&model.Booking{})

	// Migrate the schema
	a.DB.AutoMigrate(&model.User{}, &model.Service{}, &model.Booking{})

	// Create users table
	a.DB.Create(&model.User{
		Id:       1,
		Name:     "Dummy Duck",
		Username: "dummy",
		Password: "dumdum",
		Email:    "dummy@ufl.edu",
		Gender:   "M",
	})
	a.DB.Create(&model.User{
		Id:       2,
		Name:     "Buzz Lightyear",
		Username: "buzz",
		Password: "busybee",
		Email:    "buzz@ufl.edu",
		Gender:   "M",
	})
	a.DB.Create(&model.User{
		Id:       3,
		Name:     "Snow White",
		Username: "snow",
		Password: "abc1234",
		Email:    "snow@ufl.edu",
		Gender:   "F",
	})

	// Create services table
	a.DB.Create(&model.Service{
		Id:          1,
		Name:        "AC Maintanence",
		Description: "Any type of AC maintanence such as filter cleaning, part replacement, etc.",
		Category:    "Electronics",
	})
	a.DB.Create(&model.Service{
		Id:          2,
		Name:        "Plumbing",
		Description: "Sanitary and household plumbing. No sewage service.",
		Category:    "Household",
	})
	a.DB.Create(&model.Service{
		Id:          3,
		Name:        "Saloon",
		Description: "Haricut, massage, nailwork, makeup, etc.",
		Category:    "Personal Care",
	})
	a.DB.Create(&model.Service{
		Id:          4,
		Name:        "Furniture Repair",
		Description: "Furniture frame repair, drilling, fitting new furniture, etc.",
		Category:    "Household",
	})
	a.DB.Create(&model.Service{
		Id:          5,
		Name:        "Exterminator",
		Description: "Pest control, wildlife evac, alligator emergency, etc.",
		Category:    "Animal/Pet",
	})

	// Create booking table
	a.DB.Create((&model.Booking{
		Id:        1,
		UserId:    0,
		ServiceId: 0,
		Date:      time.Date(2022, 2, 15, 12, 30, 0, 0, time.UTC),
		StartTime: time.Date(2022, 2, 15, 12, 30, 0, 0, time.UTC),
		EndTime:   time.Date(2022, 2, 15, 13, 30, 0, 0, time.UTC),
	}))
	a.DB.Create((&model.Booking{
		Id:        2,
		UserId:    0,
		ServiceId: 3,
		Date:      time.Date(2022, 2, 15, 16, 30, 0, 0, time.UTC),
		StartTime: time.Date(2022, 2, 15, 16, 30, 0, 0, time.UTC),
		EndTime:   time.Date(2022, 2, 15, 17, 30, 0, 0, time.UTC),
	}))
	a.DB.Create((&model.Booking{
		Id:        3,
		UserId:    3,
		ServiceId: 2,
		Date:      time.Date(2022, 2, 15, 16, 30, 0, 0, time.UTC),
		StartTime: time.Date(2022, 2, 15, 16, 30, 0, 0, time.UTC),
		EndTime:   time.Date(2022, 2, 15, 17, 30, 0, 0, time.UTC),
	}))
}
