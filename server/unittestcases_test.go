package main

import (
	"os"
	"testing"

	"github.com/rsj-rishabh/urbanClapClone/server/app"
	"github.com/rsj-rishabh/urbanClapClone/server/app/model"
	"github.com/rsj-rishabh/urbanClapClone/server/config"
)

// var a main.App

var a = &app.App{}
var dbName string = "test.db"

var users []model.User
var bookings []model.Booking
var user model.User
var booking model.Booking

func setUpTestDb() {
	// Connection to the database with default configuration
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
	a.DB.Create(&model.Service{
		Id:          1,
		Name:        "AC Maintanence",
		Description: "Any type of AC maintanence such as filter cleaning, part replacement, etc.",
		Category:    "Electronics",
		ImageName:   "air_conditioning.jpg",
	})
	a.DB.Create(&model.Service{
		Id:          2,
		Name:        "Plumbing",
		Description: "Sanitary and household plumbing. No sewage service.",
		Category:    "Household",
		ImageName:   "plumbing.jpg",
	})
	a.DB.Create(&model.Service{
		Id:          3,
		Name:        "Saloon",
		Description: "Haricut, massage, nailwork, makeup, etc.",
		Category:    "Personal Care",
		ImageName:   "saloon.jpg",
	})
	a.DB.Create(&model.Service{
		Id:          4,
		Name:        "Furniture Repair",
		Description: "Furniture frame repair, drilling, fitting new furniture, etc.",
		Category:    "Household",
		ImageName:   "furniture_repair.jpg",
	})
	a.DB.Create(&model.Service{
		Id:          5,
		Name:        "Exterminator",
		Description: "Pest control, wildlife evac, alligator emergency, etc.",
		Category:    "Animal/Pet",
		ImageName:   "pest_control.jpg",
	})

	// Create booking table
	a.DB.Create((&model.Booking{
		Id:          1,
		UserId:      1,
		ServiceId:   1,
		Date:        "2022-02-15",
		StartTime:   "12:30",
		EndTime:     "13:30",
		IsCancelled: false,
	}))
	a.DB.Create((&model.Booking{
		Id:          2,
		UserId:      2,
		ServiceId:   2,
		Date:        "2022-02-15",
		StartTime:   "16:30",
		EndTime:     "17:30",
		IsCancelled: false,
	}))
	a.DB.Create((&model.Booking{
		Id:          3,
		UserId:      3,
		ServiceId:   3,
		Date:        "2022-02-15",
		StartTime:   "16:30",
		EndTime:     "17:30",
		IsCancelled: false,
	}))
	a.DB.Create((&model.CityServiceMapping{
		CityName:  "Newyork",
		ServiceId: 3,
	}))
	a.DB.Create((&model.CityServiceMapping{
		CityName:  "Newyork",
		ServiceId: 2,
	}))
	a.DB.Create((&model.CityServiceMapping{
		CityName:  "LA",
		ServiceId: 2,
	}))
	a.DB.Create((&model.CityServiceMapping{
		CityName:  "LA",
		ServiceId: 3,
	}))
	a.DB.Create((&model.CityServiceMapping{
		CityName:  "Boston",
		ServiceId: 1,
	}))
	a.DB.Create((&model.CityServiceMapping{
		CityName:  "Boston",
		ServiceId: 2,
	}))
}

func TestMain(m *testing.M) {
	config := config.GetConfig()
	a.Initialize(config)
	setUpTestDb()
	code := m.Run()
	os.Exit(code)
}
