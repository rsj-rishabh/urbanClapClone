package handler

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/jinzhu/gorm"
	"github.com/rsj-rishabh/urbanClapClone/server/app/model"
)

func CreateUser(db *gorm.DB, w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/x-www-form-urlencoded")
	w.Header().Set("Access-Control-Allow-Methods", "POST")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	fmt.Println("Logged CreateUser:POST")
	user := model.User{}

	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&user); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	defer r.Body.Close()

	if err := db.Save(&user).Error; err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusCreated, user)
}

func Login(db *gorm.DB, w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/x-www-form-urlencoded")
	w.Header().Set("Access-Control-Allow-Methods", "POST")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	userFromReqBody := model.User{}

	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&userFromReqBody); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	username := userFromReqBody.Username
	password := userFromReqBody.Password
	fmt.Printf("username : %s", username)
	fmt.Printf("password : %s", password)

	user := getUserOr404(db, username, password, w, r)
	if user == nil {
		return
	}
	respondJSON(w, http.StatusOK, user)
}

// getUserOr404 gets a user instance if exists, or respond the 404 error otherwise
func getUserOr404(db *gorm.DB, username string, password string, w http.ResponseWriter, r *http.Request) *model.User {
	user := model.User{}

	if err := db.Where("username = ? AND password = ?", username, password).First(&user).Error; err != nil {
		respondError(w, http.StatusNotFound, err.Error())
		return nil
	}

	return &user
}
