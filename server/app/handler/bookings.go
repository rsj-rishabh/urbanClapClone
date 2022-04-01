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

	fmt.Println("Logged CreateBooking:POST")
	booking := model.Booking{}

	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&booking); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	defer r.Body.Close()

	var bookings []model.Booking
	db.Where("service_id = ? ", booking.ServiceId).Find(&bookings)

	for _, b := range bookings {
		start := b.StartTime
		end := b.EndTime
		if !(booking.EndTime < start || booking.StartTime > end) {
			respondError(w, http.StatusInternalServerError, "Time slot unavailable")
			return
		}
	}

	if err := db.Save(&booking).Error; err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusCreated, booking)
}

func CancelBooking(db *gorm.DB, w http.ResponseWriter, r *http.Request) {
	booking := model.Booking{}

	err := r.ParseForm()
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	b := model.Booking{}

	decoder := json.NewDecoder(r.Body)

	if err := decoder.Decode(&b); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	defer r.Body.Close()

	db.Where("service_id = ? AND user_id = ?", b.ServiceId, b.UserId).Find(&booking)

	if booking.IsCancelled == true {
		respondJSON(w, http.StatusAlreadyReported, "Booking already cancelled")
		return
	}

	db.Model(&booking).Where("service_id = ? AND user_id = ?", b.ServiceId, b.UserId).Update("is_cancelled", true)
	respondJSON(w, http.StatusOK, "Booking is cancelled")

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
