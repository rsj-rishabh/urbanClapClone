package app


import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/rsj-rishabh/urbanClapClone/server/app/model"
	"github.com/rsj-rishabh/urbanClapClone/server/app"

	"github.com/stretchr/testify/assert"

	"github.com/jinzhu/gorm"
	"github.com/rsj-rishabh/urbanClapClone/server/app/model"
)

var dbName string = "test.db"
var app := &app.App{}
var users []model.User
var bookings []model.Booking
var user model.User
var booking model.Booking

func TestDbMigrate(a *App) *gorm.DB {
	// Connection to the database with default configuration
	app.DB.AutoMigrate().DropTable(&model.User{})
	app.DB.AutoMigrate().DropTable(&model.Service{})
	app.DB.AutoMigrate().DropTable(&model.Booking{})

	// Migrate the schema
	app.DB.AutoMigrate(&model.User{}, &model.Service{}, &model.Booking{})

	// Create users table
	app.DB.Create(&model.User{
		Id:       1,
		Name:     "Dummy Duck",
		Username: "dummy",
		Password: "dumdum",
		Email:    "dummy@ufl.edu",
		Gender:   "M",
	})
	app.DB.Create(&model.User{
		Id:       2,
		Name:     "Buzz Lightyear",
		Username: "buzz",
		Password: "busybee",
		Email:    "buzz@ufl.edu",
		Gender:   "M",
	})
	app.DB.Create(&model.User{
		Id:       3,
		Name:     "Snow White",
		Username: "snow",
		Password: "abc1234",
		Email:    "snow@ufl.edu",
		Gender:   "F",
	})

	// Create services table
	app.DB.Create(&model.Service{
		Id:          1,
		Name:        "AC Maintanence",
		Description: "Any type of AC maintanence such as filter cleaning, part replacement, etc.",
		Category:    "Electronics",
	})
	app.DB.Create(&model.Service{
		Id:          2,
		Name:        "Plumbing",
		Description: "Sanitary and household plumbing. No sewage service.",
		Category:    "Household",
	})
	app.DB.Create(&model.Service{
		Id:          3,
		Name:        "Saloon",
		Description: "Haricut, massage, nailwork, makeup, etc.",
		Category:    "Personal Care",
	})
	app.DB.Create(&model.Service{
		Id:          4,
		Name:        "Furniture Repair",
		Description: "Furniture frame repair, drilling, fitting new furniture, etc.",
		Category:    "Household",
	})
	app.DB.Create(&model.Service{
		Id:          5,
		Name:        "Exterminator",
		Description: "Pest control, wildlife evac, alligator emergency, etc.",
		Category:    "Animal/Pet",
	})

	// Create booking table
	app.DB.Create((&model.Booking{
		Id:        1,
		UserId:    1,
		ServiceId: 1,
		Date:      "2022-02-15",
		StartTime: "12:30",
		EndTime:   "13:30",
	}))
	app.DB.Create((&model.Booking{
		Id:        2,
		UserId:    2,
		ServiceId: 2,
		Date:      "2022-02-15",
		StartTime: "16:30",
		EndTime:   "17:30",
	}))
	app.DB.Create((&model.Booking{
		Id:        3,
		UserId:    3,
		ServiceId: 3,
		Date:      "2022-02-15",
		StartTime: "16:30",
		EndTime:   "17:30",
	}))
}

func TestGetAUser(t *testing.T) {

	// setup database
	app.TestDbMigrate()
	var jsonStr = []byte(`{"username":"dummy","password":"dumdum"}`)

	req, _ := http.NewRequest("POST", "/user", nil)
	req.Header().Set("Access-Control-Allow-Origin", "*")
	req.Header().Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header().Set("Access-Control-Allow-Methods", "POST")
	req.Header().Set("Access-Control-Allow-Headers", "Content-Type")


	w := httptest.NewRecorder()
	handler := http.HandlerFunc(GetUser)
	handler.ServeHTTP(w,req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v",
			status, http.StatusOK)
	}
	// assert.Equal(t, 200, w.Code)
	b, _ := json.Marshal(user)
	assert.Equal(t, string(b), w.Body.String())
}

func TestCreateAUser(t *testing.T) {

	// setup database
	app.TestDbMigrate()
	var jsonStr = []byte(`{"Id":4,"Name":"xyz","Username":"xyz","Password":"xyz@pqr.com","Email":"xyz@gmail.com","Gender":"F"}`)
	
	req, _ := http.NewRequest("POST", "/user", jsonStr)

	// req.Header.Set("Content-Type", "application/json")
	req.Header().Set("Access-Control-Allow-Origin", "*")
	req.Header().Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header().Set("Access-Control-Allow-Methods", "POST")
	req.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	w := httptest.NewRecorder()
	handler := http.HandlerFunc(CreateUser)
	handler.ServeHTTP(w,req)

	if status := rr.Code; status != http.StatusCreated {
		t.Errorf("handler returned wrong status code: got %v want %v",
			status, http.StatusCreated)
	}
	expected := `{"Id":4,"Name":"xyz","Username":"xyz","Password":"xyz@pqr.com","Email":"xyz@gmail.com","Gender":"F"}`
	if w.Body.String() != expected {
		t.Errorf("handler returned unexpected body: got %v want %v",
			w.Body.String(), expected)
	}
	// assert.Equal(t, string(b), w.Body.String())
}

func TestGetBookings(t *testing.T) {

	// setup database
	app.TestDbMigrate()
	req, _ := http.NewRequest("GET", "/bookings/{custId}",1)
	w := httptest.NewRecorder()
	handler := http.HandleFunc(GetBookings)
	handler.ServeHTTP(w,req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v",
			status, http.StatusOK)
	}
	// assert.Equal(t, 200, w.Code)
	b, _ := json.Marshal(booking)
	assert.Equal(t, string(b), w.Body.String())
}
