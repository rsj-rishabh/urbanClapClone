package handler

import (
	"encoding/json"
	"net/http"

	"github.com/jinzhu/gorm"
	"github.com/rsj-rishabh/urbanClapClone/server/app/model"
)

func GetAllServices(db *gorm.DB, w http.ResponseWriter, r *http.Request) {
	services := []model.Service{}
	db.Find(&services)
	respondJSON(w, http.StatusOK, services)
}

func CreateService(db *gorm.DB, w http.ResponseWriter, r *http.Request) {
	services := model.Service{}

	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&services); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	defer r.Body.Close()

	if err := db.Save(&services).Error; err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusCreated, services)
}
