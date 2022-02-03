package main

import (
	"github.com/rsj-rishabh/urbanClapClone/server/app"
	"github.com/rsj-rishabh/urbanClapClone/server/config"
)

func main() {
	config := config.GetConfig()

	app := &app.App{}
	app.Initialize(config)
	app.Run(":3000")
}
