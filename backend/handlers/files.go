package handlers

import (
	"fmt"
	"image"
	"image/jpeg"
	"image/png"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"golang.org/x/image/draw"
	"nas-familia/database"
	"nas-familia/models"
)

func getStoragePath() string {
	path := os.Getenv("NAS_STORAGE_PATH")
	if path == "" {
		exe, _ := os.Executable()
		path = filepath.Join(filepath.Dir(exe), "storage", "files")
	}
	return path
}

func getThumbPath() string {
	path := os.Getenv("NAS_THUMB_PATH")
	if path == "" {
		exe, _ := os.Executable()
		path = filepath.Join(filepath.Dir(exe), "storage", "thumbnails")
	}
	return path
}

func GetFiles(c echo.Context) error {
	profileID := c.QueryParam("profile_id")
	if profileID == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "profile_id is required"})
	}

	query := database.DB.Where("profile_id = ?", profileID)

	if folderID := c.QueryParam("folder_id"); folderID != "" {
		query = query.Where("folder_id = ?", folderID)
	} else if c.QueryParam("root") != "true" {
		query = query.Where("folder_id IS NULL")
	}

	if search := c.QueryParam("search"); search != "" {
		query = query.Where("original_name LIKE ?", "%"+search+"%")
	}

	sort := c.QueryParam("sort")
	order := c.QueryParam("order")

	if order != "asc" {
		order = "desc"
	}

	switch sort {
	case "name":
		query = query.Order("original_name " + order)
	case "size":
		query = query.Order("size " + order)
	default:
		query = query.Order("created_at " + order)
	}

	var files []models.File
	query.Find(&files)
	return c.JSON(http.StatusOK, files)
}

func UploadFile(c echo.Context) error {
	profileID := c.FormValue("profile_id")
	if profileID == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "profile_id is required"})
	}

	form, err := c.MultipartForm()
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid multipart form"})
	}

	files := form.File["files"]
	if len(files) == 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "no files provided"})
	}

	storagePath := getStoragePath()
	os.MkdirAll(storagePath, 0755)

	var uploaded []models.File

	for _, file := range files {
		src, err := file.Open()
		if err != nil {
			continue
		}

		ext := filepath.Ext(file.Filename)
		uniqueName := fmt.Sprintf("%s_%d%s", uuid.New().String(), time.Now().UnixNano(), ext)
		destPath := filepath.Join(storagePath, uniqueName)

		dst, err := os.Create(destPath)
		if err != nil {
			src.Close()
			continue
		}

		_, err = io.Copy(dst, src)
		src.Close()
		dst.Close()
		if err != nil {
			os.Remove(destPath)
			continue
		}

		fileModel := models.File{
			Name:         file.Filename,
			OriginalName: file.Filename,
			Size:         file.Size,
			MimeType:     file.Header.Get("Content-Type"),
			Path:         uniqueName,
		}
		fmt.Sscanf(profileID, "%d", &fileModel.ProfileID)

		if folderID := c.FormValue("folder_id"); folderID != "" {
			var fid uint
			fmt.Sscanf(folderID, "%d", &fid)
			fileModel.FolderID = &fid
		}

		if isImage(fileModel.MimeType) {
			thumbPath := generateThumbnail(destPath, uniqueName)
			fileModel.Thumbnail = thumbPath
		}

		database.DB.Create(&fileModel)
		uploaded = append(uploaded, fileModel)
	}

	return c.JSON(http.StatusCreated, uploaded)
}

func DeleteFile(c echo.Context) error {
	id := c.Param("id")
	var file models.File
	if err := database.DB.First(&file, id).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "file not found"})
	}

	storagePath := getStoragePath()
	os.Remove(filepath.Join(storagePath, file.Path))

	if file.Thumbnail != "" {
		os.Remove(filepath.Join(getThumbPath(), file.Thumbnail))
	}

	database.DB.Delete(&file)
	return c.NoContent(http.StatusNoContent)
}

func DownloadFile(c echo.Context) error {
	id := c.Param("id")
	var file models.File
	if err := database.DB.First(&file, id).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "file not found"})
	}

	storagePath := getStoragePath()
	filePath := filepath.Join(storagePath, file.Path)

	return c.Attachment(filePath, file.OriginalName)
}

func GetThumbnail(c echo.Context) error {
	id := c.Param("id")
	var file models.File
	if err := database.DB.First(&file, id).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "file not found"})
	}

	if file.Thumbnail == "" {
		return c.NoContent(http.StatusNotFound)
	}

	thumbPath := filepath.Join(getThumbPath(), file.Thumbnail)
	return c.File(thumbPath)
}

func isImage(mimeType string) bool {
	return strings.HasPrefix(mimeType, "image/") &&
		!strings.HasPrefix(mimeType, "image/svg+xml")
}

func generateThumbnail(srcPath, filename string) string {
	thumbDir := getThumbPath()
	os.MkdirAll(thumbDir, 0755)

	thumbName := "thumb_" + filename
	destPath := filepath.Join(thumbDir, thumbName)

	src, err := os.Open(srcPath)
	if err != nil {
		return ""
	}
	defer src.Close()

	img, _, err := image.Decode(src)
	if err != nil {
		return ""
	}

	bounds := img.Bounds()
	maxSize := 300

	newWidth := bounds.Dx()
	newHeight := bounds.Dy()

	if newWidth > maxSize || newHeight > maxSize {
		ratio := float64(maxSize) / float64(max(newWidth, newHeight))
		newWidth = int(float64(newWidth) * ratio)
		newHeight = int(float64(newHeight) * ratio)
	}

	thumb := image.NewRGBA(image.Rect(0, 0, newWidth, newHeight))
	draw.ApproxBiLinear.Scale(thumb, thumb.Bounds(), img, bounds, draw.Over, nil)

	dst, err := os.Create(destPath)
	if err != nil {
		return ""
	}
	defer dst.Close()

	if strings.HasSuffix(strings.ToLower(filename), ".png") {
		png.Encode(dst, thumb)
	} else {
		jpeg.Encode(dst, thumb, &jpeg.Options{Quality: 80})
	}

	return thumbName
}
