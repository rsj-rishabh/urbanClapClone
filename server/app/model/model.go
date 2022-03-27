package model

import (
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
	Category    string `gorm:"size:30;default:'Other'" json:"category"`
}

type Booking struct {
	Id        uint   `gorm:"size:10;unique;auto_increment:true" json:"id"`
	UserId    uint   `gorm:"size:10" json:"user_id"`
	ServiceId uint   `gorm:"primary_key;auto_increment:false;default:1" json:"service_id"`
	Date      string `gorm:"primary_key;auto_increment:false" json:"date"`
	StartTime string `gorm:"primary_key;auto_increment:false;default:'00:00'" json:"start_time"`
	EndTime   string `gorm:"primary_key;auto_increment:false;default:'00:00'" json:"end_time"`
}

type CityServiceMapping struct {
	Id        uint   `gorm:"size:10;unique;auto_increment:true" json:"id"`
	CityName  string `gorm:"size:200" json:"cityname"`
	ServiceId uint   `gorm:"size:10" json:"service_id"`
}
