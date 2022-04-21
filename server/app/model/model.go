package model

import (
	_ "github.com/jinzhu/gorm/dialects/mysql"
)

//User
type User struct {
	Id       uint   `gorm:"size:10;primary_key;" json:"id"`
	Name     string `gorm:"size:70" json:"name"`
	Username string `gorm:"size:20; unique" json:"username"`
	Password string `gorm:"size:20" json:"password"`
	Email    string `gorm:"size:50" json:"email"`
	Gender   string `gorm:"size:1; check:gender==M || gender==F" json:"gender"`
}

//Service
type Service struct {
	Id          uint   `gorm:"size:10;primary_key;" json:"id"`
	Name        string `gorm:"size:50" json:"name"`
	Description string `gorm:"size:200" json:"description"`
	Category    string `gorm:"size:30; default: 'Other'" json:"category"`
	ImageName   string `gorm:"size:80; default: 'default.jpg'" json:"image_name"`
	Price       int    `gorm:"default:100" json:"price"`
}

//Booking
type Booking struct {
	Id          int    `gorm:"primary_key" json:"id"`
	UserId      uint   `gorm:"not_null" json:"user_id"`
	ServiceId   uint   `gorm:"not_null" json:"service_id"`
	Date        string `gorm:"size:11" json:"date"`
	StartTime   string `gorm:"size:5" json:"start_time"`
	EndTime     string `gorm:"size:5" json:"end_time"`
	IsCancelled bool   `gorm:"type:bool;default:false" json:"is_cancelled"`
}

//City
type CityServiceMapping struct {
	Id        uint   `gorm:"size:10;unique;auto_increment:true" json:"id"`
	CityName  string `gorm:"size:200" json:"cityname"`
	ServiceId uint   `gorm:"size:10" json:"service_id"`
}
