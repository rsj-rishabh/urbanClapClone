package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/jinzhu/gorm"
	"github.com/rsj-rishabh/urbanClapClone/server/app/model"
)

//Booking API

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
		date := b.Date
		fmt.Println("date=" + date + " start=" + start + " end=" + end)
		fmt.Println("date=" + booking.Date + " start=" + booking.StartTime + " end=" + booking.EndTime)
		if booking.Date == date && booking.EndTime <= end && booking.StartTime > start {
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

//Booking Cancellation API
func GetCancelledBookings(db *gorm.DB, w http.ResponseWriter, r *http.Request) {
	// vars := mux.Vars(r)

	userId := r.URL.Query()["userId"]
	i, err := strconv.Atoi(userId[0])
	if err == nil {
		fmt.Print("Good")
	}
	cancelledBookings := model.Booking{}
	if err := db.Where("user_id = ? AND is_cancelled = ?", i, true).Find(&cancelledBookings).Error; err != nil {
		respondError(w, http.StatusNotFound, err.Error())
	}
	fmt.Println(cancelledBookings.UserId)
	respondJSON(w, http.StatusOK, cancelledBookings)

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
	userId := r.URL.Query()["userId"]
	i, err := strconv.Atoi(userId[0])
	if err == nil {
		fmt.Println("No error")
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
	if err := db.Where("user_id = ? AND is_cancelled = ?", custId, false).Find(&booking).Error; err != nil {
		respondError(w, http.StatusNotFound, err.Error())
	}
	return &booking
}
