package handlers

import (
	"net/http"
	"path/filepath"
	"strings"

	"github.com/labstack/echo/v4"
	"nas-familia/database"
	"nas-familia/models"
)

func GetFolders(c echo.Context) error {
	profileID := c.QueryParam("profile_id")
	if profileID == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "profile_id is required"})
	}

	var folders []models.Folder
	database.DB.Where("profile_id = ?", profileID).Order("name asc").Find(&folders)
	return c.JSON(http.StatusOK, folders)
}

func CreateFolder(c echo.Context) error {
	var input struct {
		Name      string `json:"name"`
		ProfileID uint   `json:"profile_id"`
		ParentID  *uint  `json:"parent_id"`
	}
	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid input"})
	}

	input.Name = strings.TrimSpace(input.Name)
	if input.Name == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "name is required"})
	}

	folder := models.Folder{
		Name:      input.Name,
		ProfileID: input.ProfileID,
		ParentID:  input.ParentID,
	}

	if folder.ParentID != nil {
		var parent models.Folder
		if err := database.DB.First(&parent, *folder.ParentID).Error; err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "parent folder not found"})
		}
	}

	database.DB.Create(&folder)
	return c.JSON(http.StatusCreated, folder)
}

func RenameFolder(c echo.Context) error {
	id := c.Param("id")
	var input struct {
		Name string `json:"name"`
	}
	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid input"})
	}

	input.Name = strings.TrimSpace(input.Name)
	if input.Name == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "name is required"})
	}

	var folder models.Folder
	if err := database.DB.First(&folder, id).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "folder not found"})
	}

	folder.Name = input.Name
	database.DB.Save(&folder)
	return c.JSON(http.StatusOK, folder)
}

func DeleteFolder(c echo.Context) error {
	id := c.Param("id")

	var folder models.Folder
	if err := database.DB.First(&folder, id).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "folder not found"})
	}

	if folder.ParentID != nil {
		database.DB.Model(&models.File{}).Where("folder_id = ?", id).Update("folder_id", folder.ParentID)
	} else {
		database.DB.Model(&models.File{}).Where("folder_id = ?", id).Update("folder_id", nil)
	}

	database.DB.Where("parent_id = ?", id).Delete(&models.Folder{})
	database.DB.Delete(&folder)
	return c.NoContent(http.StatusNoContent)
}

func MoveFile(c echo.Context) error {
	id := c.Param("id")
	var input struct {
		FolderID *uint `json:"folder_id"`
	}
	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid input"})
	}

	var file models.File
	if err := database.DB.First(&file, id).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "file not found"})
	}

	file.FolderID = input.FolderID
	database.DB.Save(&file)
	return c.JSON(http.StatusOK, file)
}

func ViewFile(c echo.Context) error {
	id := c.Param("id")
	var file models.File
	if err := database.DB.First(&file, id).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "file not found"})
	}

	storagePath := getStoragePath()
	filePath := filepath.Join(storagePath, file.Path)
	return c.Inline(filePath, file.OriginalName)
}
