package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/jinzhu/gorm"
	"github.com/rsj-rishabh/urbanClapClone/server/app/model"
)

func CreateBooking(db *gorm.DB, w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/x-www-form-urlencoded")
	w.Header().Set("Access-Control-Allow-Methods", "POST")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	fmt.Println("Logged CreateUser:POST")
	booking := model.Booking{}

	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&booking); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	defer r.Body.Close()

	if err := db.Save(&booking).Error; err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusCreated, booking)
}

func GetBookings(db *gorm.DB, w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)

	custId := vars["custId"]
	i, err := strconv.Atoi(custId)
	if err == nil {
		fmt.Print("Good")
	}
	booking := getBookingOr404(db, i, w, r)
	if booking == nil {
		return
	}
	respondJSON(w, http.StatusOK, booking)
}

// getUserOr404 gets a booking instance if exists, or respond the 404 error otherwise
func getBookingOr404(db *gorm.DB, custId int, w http.ResponseWriter, r *http.Request) *model.Booking {
	booking := model.Booking{}
	if err := db.First(&booking, custId).Error; err != nil {
		respondError(w, http.StatusNotFound, err.Error())
		return nil
	}
	return &booking
}
