package handlers

import (
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
	"nas-familia/database"
	"nas-familia/models"
)

func GetProfiles(c echo.Context) error {
	var profiles []models.Profile
	database.DB.Order("created_at asc").Find(&profiles)
	return c.JSON(http.StatusOK, profiles)
}

func CreateProfile(c echo.Context) error {
	var input struct {
		Name   string `json:"name"`
		Avatar string `json:"avatar"`
		Color  string `json:"color"`
	}
	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid input"})
	}

	input.Name = strings.TrimSpace(input.Name)
	if input.Name == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "name is required"})
	}

	if input.Color == "" {
		input.Color = "#818cf8"
	}

	profile := models.Profile{
		Name:   input.Name,
		Avatar: input.Avatar,
		Color:  input.Color,
	}
	database.DB.Create(&profile)
	return c.JSON(http.StatusCreated, profile)
}

func DeleteProfile(c echo.Context) error {
	id := c.Param("id")

	var fileCount int64
	database.DB.Model(&models.File{}).Where("profile_id = ?", id).Count(&fileCount)
	if fileCount > 0 {
		return c.JSON(http.StatusConflict, map[string]string{
			"error": "profile has files, delete them first",
		})
	}

	result := database.DB.Delete(&models.Profile{}, id)
	if result.RowsAffected == 0 {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "profile not found"})
	}
	return c.NoContent(http.StatusNoContent)
}

func SelectProfile(c echo.Context) error {
	var input struct {
		ProfileID uint `json:"profile_id"`
	}
	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid input"})
	}

	var profile models.Profile
	if err := database.DB.First(&profile, input.ProfileID).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "profile not found"})
	}

	return c.JSON(http.StatusOK, profile)
}
