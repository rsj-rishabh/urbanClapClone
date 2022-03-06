package app

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/jinzhu/gorm"
	"github.com/rsj-rishabh/urbanClapClone/server/app/handler"
	"github.com/rsj-rishabh/urbanClapClone/server/config"
	// "gorm.io/driver/sqlite"
)

// App has router and db instances
type App struct {
	Router *mux.Router
	DB     *gorm.DB
}

// App initialize with predefined configuration
func (a *App) Initialize(config *config.Config) {
	dbURI := fmt.Sprintf("%s:%s@/%s?charset=%s&parseTime=True",
		config.DB.Username,
		config.DB.Password,
		config.DB.Name,
		config.DB.Charset)

	db, _ := gorm.Open(config.DB.Dialect, dbURI)

	a.DB = db
	a.Router = mux.NewRouter().PathPrefix("/api").Subrouter()
	a.setRouters()
}

// Set all required routers
func (a *App) setRouters() {
	// Routing for handling the projects
	a.Get("/getServices", a.GetAllServices)
	a.Post("/createService", a.CreateService)
	a.Post("/register", a.CreateUser)
	a.Post("/login", a.GetUser)
	a.Get("/getBookings/{custId}", a.GetBookings)
	a.Post("/bookService", a.CreateBooking)
}

// Wrap the router for GET method
func (a *App) Get(path string, f func(w http.ResponseWriter, r *http.Request)) {
	a.Router.HandleFunc(path, f).Methods("GET")
}

// Wrap the router for POST method
func (a *App) Post(path string, f func(w http.ResponseWriter, r *http.Request)) {
	a.Router.HandleFunc(path, f).Methods("POST")
}

// Wrap the router for PUT method
func (a *App) Put(path string, f func(w http.ResponseWriter, r *http.Request)) {
	a.Router.HandleFunc(path, f).Methods("PUT")
}

// Wrap the router for DELETE method
func (a *App) Delete(path string, f func(w http.ResponseWriter, r *http.Request)) {
	a.Router.HandleFunc(path, f).Methods("DELETE")
}

// Handlers to manage Services Data
func (a *App) GetAllServices(w http.ResponseWriter, r *http.Request) {
	handler.GetAllServices(a.DB, w, r)
}

func (a *App) CreateService(w http.ResponseWriter, r *http.Request) {
	handler.CreateService(a.DB, w, r)
}

// Handlers to manager Users Data
func (a *App) CreateUser(w http.ResponseWriter, r *http.Request) {
	fmt.Println("Called Routes: /User Method:POST")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Methods", "POST")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Accept", "application/x-www-form-urlencoded")
	handler.CreateUser(a.DB, w, r)
}

func (a *App) CreateBooking(w http.ResponseWriter, r *http.Request) {
	fmt.Println("Called Routes: /User Method:POST")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Methods", "POST")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Accept", "application/x-www-form-urlencoded")
	handler.CreateBooking(a.DB, w, r)
}

func (a *App) GetUser(w http.ResponseWriter, r *http.Request) {
	handler.GetUser(a.DB, w, r)
}

func (a *App) GetBookings(w http.ResponseWriter, r *http.Request) {
	handler.GetBookings(a.DB, w, r)
}

// Run the app on it's router
func (a *App) Run(host string) {
	log.Fatal(http.ListenAndServe(host, a.Router))
}
