package handler

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/jinzhu/gorm"
	"github.com/rsj-rishabh/urbanClapClone/server/app/model"
)

func GetAllServices(db *gorm.DB, w http.ResponseWriter, r *http.Request) {
	services := []model.Service{}
	db.Find(&services)
	respondJSON(w, http.StatusOK, services)
}

type city struct {
	cityname string
}

func GetServicesInCity(db *gorm.DB, w http.ResponseWriter, r *http.Request) {
	cityServiceMap := []model.CityServiceMapping{}

	err := r.ParseForm()
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	// cityName := r.Form.Get("cityname")

	c := model.CityServiceMapping{}

	decoder := json.NewDecoder(r.Body)

	if err := decoder.Decode(&c); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	defer r.Body.Close()
	// fmt.Fprintf(w, "city: %+v", c)
	fmt.Printf("cityname : %s", c.CityName)

	var serviceList []model.Service

	db.Where("city_name = ?", c.CityName).Find(&cityServiceMap)

	for _, cityService := range cityServiceMap {
		service := model.Service{}
		err := db.Where("id = ?", cityService.ServiceId).First(&service).Error
		if err == nil {
			serviceList = append(serviceList, service)
		}
	}
	respondJSON(w, http.StatusOK, serviceList)
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
