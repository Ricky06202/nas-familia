package models

import "time"

type Profile struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"not null" json:"name"`
	Avatar    string    `gorm:"default:'default'" json:"avatar"`
	Color     string    `gorm:"default:'#818cf8'" json:"color"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type File struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	ProfileID    uint      `gorm:"index;not null" json:"profile_id"`
	Name         string    `gorm:"not null" json:"name"`
	OriginalName string    `gorm:"not null" json:"original_name"`
	Size         int64     `gorm:"not null" json:"size"`
	MimeType     string    `gorm:"not null" json:"mime_type"`
	Path         string    `gorm:"not null" json:"path"`
	Thumbnail    string    `json:"thumbnail"`
	Profile      Profile   `gorm:"foreignKey:ProfileID" json:"-"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type SystemStats struct {
	CPU      CPUStats      `json:"cpu"`
	Memory   MemoryStats   `json:"memory"`
	Disk     DiskStats     `json:"disk"`
	Uptime   uint64        `json:"uptime"`
	Hostname string        `json:"hostname"`
	OS       string        `json:"os"`
	Net      NetworkStats  `json:"network"`
}

type CPUStats struct {
	Percent float64 `json:"percent"`
	Cores   int     `json:"cores"`
	Model   string  `json:"model"`
}

type MemoryStats struct {
	Total     uint64  `json:"total"`
	Used      uint64  `json:"used"`
	Free      uint64  `json:"free"`
	UsedPercent float64 `json:"used_percent"`
}

type DiskStats struct {
	Total       uint64  `json:"total"`
	Used        uint64  `json:"used"`
	Free        uint64  `json:"free"`
	UsedPercent float64 `json:"used_percent"`
	MountPoint  string  `json:"mount_point"`
}

type NetworkStats struct {
	BytesSent   uint64 `json:"bytes_sent"`
	BytesRecv   uint64 `json:"bytes_recv"`
}
