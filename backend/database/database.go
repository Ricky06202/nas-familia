package database

import (
	"nas-familia/models"
	"os"
	"path/filepath"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Init() {
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		exe, _ := os.Executable()
		dbPath = filepath.Join(filepath.Dir(exe), "data", "nas-familia.db")
	}

	dir := filepath.Dir(dbPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		panic("failed to create database directory: " + err.Error())
	}

	var err error
	DB, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})
	if err != nil {
		panic("failed to connect database: " + err.Error())
	}

	DB.AutoMigrate(&models.Profile{}, &models.Folder{}, &models.File{})
}
