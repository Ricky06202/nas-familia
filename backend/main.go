package main

import (
	"embed"
	"io/fs"
	"net/http"
	"os"
	"strings"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"nas-familia/database"
	"nas-familia/handlers"
)

//go:embed frontend/dist/*
var staticFiles embed.FS

func main() {
	database.Init()

	e := echo.New()

	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodOptions},
		AllowHeaders: []string{"*"},
	}))

	api := e.Group("/api")

	api.GET("/profiles", handlers.GetProfiles)
	api.POST("/profiles", handlers.CreateProfile)
	api.DELETE("/profiles/:id", handlers.DeleteProfile)
	api.POST("/profiles/select", handlers.SelectProfile)

	api.GET("/system/stats", handlers.GetSystemStats)

	api.GET("/files", handlers.GetFiles)
	api.POST("/files/upload", handlers.UploadFile)
	api.DELETE("/files/:id", handlers.DeleteFile)
	api.GET("/files/:id/download", handlers.DownloadFile)
	api.GET("/files/:id/thumbnail", handlers.GetThumbnail)
	api.GET("/files/:id/view", handlers.ViewFile)
	api.PUT("/files/:id/move", handlers.MoveFile)
	api.POST("/files/:id/copy", handlers.CopyFile)
	api.POST("/files/batch/delete", handlers.BatchDelete)
	api.POST("/files/batch/move", handlers.BatchMove)
	api.POST("/files/batch/copy", handlers.BatchCopy)

	api.GET("/folders", handlers.GetFolders)
	api.POST("/folders", handlers.CreateFolder)
	api.PUT("/folders/:id", handlers.RenameFolder)
	api.DELETE("/folders/:id", handlers.DeleteFolder)

	subFS, err := fs.Sub(staticFiles, "frontend/dist")
	if err != nil {
		e.Logger.Fatal("failed to get sub filesystem: ", err)
	}

	e.Use(middleware.StaticWithConfig(middleware.StaticConfig{
		Root:       ".",
		Index:      "index.html",
		HTML5:      true,
		Filesystem: http.FS(subFS),
		Skipper: func(c echo.Context) bool {
			return strings.HasPrefix(c.Request().URL.Path, "/api")
		},
	}))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	e.Logger.Infof("🚀 La Familia Sanjur NAS running on http://0.0.0.0:%s", port)
	e.Logger.Fatal(e.Start(":" + port))
}
