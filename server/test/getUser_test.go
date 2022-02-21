package app

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gorilla/mux"
	"github.com/jinzhu/gorm"

	"github.com/rsj-rishabh/urbanClapClone/server/app"
)

// App has router and db instances
type App struct {
	Router *mux.Router
	DB     *gorm.DB
}

func TestGetUser(t *testing.T) {
	req, err := http.NewRequest("GET", "/user/dummy1", nil)
	if err != nil {
		t.Fatal(err)
	}
	rr := httptest.NewRecorder()
	app := &app.App{}
	//handler := http.HandlerFunc(app.GetUser)
	app.Router.ServeHTTP(rr, req)
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v",
			status, http.StatusOK)
	}

	// Check the response body is what we expect.
	expected := `{
		"ID": 1,
		"CreatedAt": "0001-01-01T00:00:00Z",
		"UpdatedAt": "0001-01-01T00:00:00Z",
		"DeletedAt": null,
		"name": "Dummy Duck",
		"email": "dummy@gmail.com",
		"gender": "M",
		"username": "dummy1",
		"password": "dummy#1"
	}`
	if rr.Body.String() != expected {
		t.Errorf("handler returned unexpected body: got %v want %v",
			rr.Body.String(), expected)
	}
}
