package main

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/rsj-rishabh/urbanClapClone/server/app"
	"github.com/rsj-rishabh/urbanClapClone/server/app/model"
	"github.com/rsj-rishabh/urbanClapClone/server/config"
	"github.com/stretchr/testify/assert"
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

func TestGetAUser(t *testing.T) {

	var jsonStr = []byte(`{"username":"dummy","password":"dumdum"}`)

	req, _ := http.NewRequest("POST", "/login", bytes.NewBuffer(jsonStr))
	req.Header.Set("Access-Control-Allow-Origin", "*")
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Access-Control-Allow-Methods", "POST")
	req.Header.Set("Access-Control-Allow-Headers", "Content-Type")

	w := httptest.NewRecorder()
	handler := http.HandlerFunc(a.GetUser)
	handler.ServeHTTP(w, req)

	if status := w.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v",
			status, http.StatusOK)
	}
	assert.Equal(t, 200, w.Code)
}

func TestCreateAUser(t *testing.T) {

	var jsonStr = []byte(`{"Id":4,"Name":"xyz","Username":"xyz","Password":"xyz@pqr.com","Email":"xyz@gmail.com","Gender":"F"}`)

	req, _ := http.NewRequest("POST", "/user", bytes.NewBuffer(jsonStr))

	req.Header.Set("Access-Control-Allow-Origin", "*")
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Access-Control-Allow-Methods", "POST")
	req.Header.Set("Access-Control-Allow-Headers", "Content-Type")

	w := httptest.NewRecorder()
	handler := http.HandlerFunc(a.CreateUser)
	handler.ServeHTTP(w, req)

	if status := w.Code; status != http.StatusCreated {
		t.Errorf("handler returned wrong status code: got %v want %v",
			status, http.StatusCreated)
	}
	expected := `{"id":4,"name":"xyz","username":"xyz","password":"xyz@pqr.com","email":"xyz@gmail.com","gender":"F"}`
	if w.Body.String() != expected {
		t.Errorf("handler returned unexpected body: got %v want %v",
			w.Body.String(), expected)
	}

}

func TestGetBookings(t *testing.T) {

	req, _ := http.NewRequest("GET", "/getBookings", nil)
	q := req.URL.Query()
	q.Add("userId", "1")
	req.URL.RawQuery = q.Encode()
	w := httptest.NewRecorder()
	handler := http.HandlerFunc(a.GetBookings)
	handler.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
}

func TestCancelBooking(t *testing.T) {

	var jsonStr = []byte(`{"user_id":1,"service_id":1}`)
	req, _ := http.NewRequest("POST", "/cancelBooking", bytes.NewBuffer(jsonStr))
	w := httptest.NewRecorder()
	handler := http.HandlerFunc(a.CancelBooking)
	handler.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)

}

func TestGetCancelledBookings(t *testing.T) {

	req, _ := http.NewRequest("GET", "/getCancelledBookings", nil)
	q := req.URL.Query()
	q.Add("userId", "1")
	req.URL.RawQuery = q.Encode()
	w := httptest.NewRecorder()
	handler := http.HandlerFunc(a.GetCancelledBookings)
	handler.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
}
