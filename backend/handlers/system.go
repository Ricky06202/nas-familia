package handlers

import (
	"net/http"
	"os"
	"runtime"

	"github.com/labstack/echo/v4"
	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/host"
	"github.com/shirou/gopsutil/v3/mem"
	"github.com/shirou/gopsutil/v3/net"
	"nas-familia/models"
)

func GetSystemStats(c echo.Context) error {
	storagePath := os.Getenv("NAS_STORAGE_PATH")
	if storagePath == "" {
		storagePath = "./storage/files"
	}
	os.MkdirAll(storagePath, 0755)

	cpuPercent, _ := cpu.Percent(0, false)
	cpuInfo, _ := cpu.Info()

	vmem, _ := mem.VirtualMemory()
	diskUsage, _ := disk.Usage(storagePath)
	hostInfo, _ := host.Info()
	netIO, _ := net.IOCounters(false)

	stats := models.SystemStats{
		Disk: models.DiskStats{
			MountPoint: storagePath,
		},
	}

	if hostInfo != nil {
		stats.Hostname = hostInfo.Hostname
		stats.OS = runtime.GOOS + " " + hostInfo.PlatformVersion
		stats.Uptime = hostInfo.Uptime
	}

	if len(cpuPercent) > 0 {
		stats.CPU.Percent = cpuPercent[0]
	}
	if len(cpuInfo) > 0 {
		stats.CPU.Cores = len(cpuInfo)
		stats.CPU.Model = cpuInfo[0].ModelName
	}

	if vmem != nil {
		stats.Memory.Total = vmem.Total
		stats.Memory.Used = vmem.Used
		stats.Memory.Free = vmem.Free
		stats.Memory.UsedPercent = vmem.UsedPercent
	}

	if diskUsage != nil {
		stats.Disk.Total = diskUsage.Total
		stats.Disk.Used = diskUsage.Used
		stats.Disk.Free = diskUsage.Free
		stats.Disk.UsedPercent = diskUsage.UsedPercent
	}

	if len(netIO) > 0 {
		stats.Net.BytesSent = netIO[0].BytesSent
		stats.Net.BytesRecv = netIO[0].BytesRecv
	}

	return c.JSON(http.StatusOK, stats)
}
