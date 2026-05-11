#!/usr/bin/env bash
set -e

echo "🚀 La Familia Sanjur NAS - Build"
echo "================================"
echo ""

# 1. Build frontend
echo "📦 Building frontend..."
cd frontend
bun install --frozen-lockfile 2>/dev/null || bun install
bun run build
cd ..

# 2. Copy frontend dist to backend
echo "📋 Copying frontend to backend..."
mkdir -p backend/frontend
rm -rf backend/frontend/dist
cp -r frontend/dist backend/frontend/dist

# 3. Build Go backend
echo "🔧 Building Go backend..."
cd backend
go build -ldflags="-s -w" -o ../nas-familia .
cd ..

echo ""
echo "✅ Build complete!"
echo "📁 Output: ./nas-familia (single binary)"
echo ""
echo "Usage:"
echo "  ./nas-familia"
echo ""
echo "Environment variables:"
echo "  PORT              - Server port (default: 8080)"
echo "  DB_PATH           - SQLite database path (default: ./data/nas-familia.db)"
echo "  NAS_STORAGE_PATH  - File storage path (default: ./storage/files)"
echo ""
echo "The frontend is embedded in the binary. Just run it!"
