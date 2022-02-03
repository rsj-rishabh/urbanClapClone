package handler

import (
	"encoding/json"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/jinzhu/gorm"
	"github.com/rsj-rishabh/urbanClapClone/server/app/model"
)

func CreateService(db *gorm.DB, w http.ResponseWriter, r *http.Request) {
	service := model.UcServices{}

	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&service); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	defer r.Body.Close()

	if err := db.Save(&service).Error; err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusCreated, service)
}

func GetService(db *gorm.DB, w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)

	serviceid := vars["serviceid"]
	service := getServiceOr404(db, serviceid, w, r)
	if service == nil {
		return
	}
	respondJSON(w, http.StatusOK, service)
}

// getServiceOr404 gets a service instance if exists, or respond the 404 error otherwise
func getServiceOr404(db *gorm.DB, serviceid string, w http.ResponseWriter, r *http.Request) *model.UccServices {
	service := model.UccServices{}
	if err := db.First(&service, model.UccUsers{ServiceID: serviceid}).Error; err != nil {
		respondError(w, http.StatusNotFound, err.Error())
		return nil
	}
	return &service
}
