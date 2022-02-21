package model

import (
	"time"

	_ "github.com/jinzhu/gorm/dialects/mysql"
)

type User struct {
	Id       uint   `gorm:"size:10;primary_key;" json:"id"`
	Name     string `gorm:"size:70" json:"name"`
	Username string `gorm:"size:20; unique" json:"username"`
	Password string `gorm:"size:20" json:"password"`
	Email    string `gorm:"size:50" json:"email"`
	Gender   string `gorm:"size:1; check:gender==M || gender==F" json:"gender"`
}

type Service struct {
	Id          uint   `gorm:"size:10;primary_key;" json:"id"`
	Name        string `gorm:"size:50" json:"name"`
	Description string `gorm:"size:200" json:"description"`
	Category    string `gorm:"size:30;default:'Other'" json:"username"`
}

type Booking struct {
	Id        uint      `gorm:"size:10;unique;auto_increment:true" json:"id"`
	UserId    uint      `json:"user_id"`
	ServiceId uint      `gorm:"primary_key;auto_increment:false;default:1" json:"service_id"`
	Date      time.Time `gorm:"primary_key;auto_increment:false" json:"date"`
	StartTime time.Time `gorm:"primary_key;auto_increment:false" json:"start_time"`
	EndTime   time.Time `gorm:"primary_key;auto_increment:false" json:"end_time"`
}
