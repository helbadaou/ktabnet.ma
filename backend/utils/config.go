package utils

import (
	"os"
	"path/filepath"
)

var DataDir string

func init() {
	// Use /data in production (Fly.io volume), otherwise use current directory
	if _, err := os.Stat("/data"); err == nil {
		DataDir = "/data"
	} else {
		DataDir = "."
	}
}

// GetDBPath returns the path for the SQLite database
func GetDBPath() string {
	return filepath.Join(DataDir, "social.db") + "?charset=utf8"
}

// GetUploadPath returns the path for uploads
func GetUploadPath(subpath string) string {
	return filepath.Join(DataDir, "uploads", subpath)
}

// GetUploadURL returns the URL path for serving uploads
func GetUploadURL(filename string) string {
	return "/uploads/" + filename
}
