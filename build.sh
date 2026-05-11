#!/usr/bin/env bash
set -e

TARGET=${TARGET:-amd64}
OUTPUT="nas-familia"

case "$TARGET" in
  amd64)   GOARCH=amd64 GOARM=""  OUTPUT="nas-familia-amd64" ;;
  arm64)   GOARCH=arm64 GOARM=""  OUTPUT="nas-familia-arm64" ;;
  arm)     GOARCH=arm   GOARM=7   OUTPUT="nas-familia-arm"   ;;
  *)
    echo "❌ Unknown target: $TARGET"
    echo "   Options: amd64 (default), arm64, arm"
    exit 1
    ;;
esac

echo "🚀 La Familia Sanjur NAS - Build (target: $TARGET)"
echo "================================================"
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

# 3. Cross-compile Go backend
echo "🔧 Building Go backend (GOOS=linux GOARCH=$GOARCH)..."
cd backend
GOOS=linux GOARCH=$GOARCH GOARM=$GOARM go build -ldflags="-s -w" -o "../$OUTPUT" .
cd ..

echo ""
echo "✅ Build complete! Output: $OUTPUT"
echo ""
echo "Usage:"
echo "  ./$OUTPUT"
echo ""
echo "Environment variables:"
echo "  PORT              - Server port (default: 8080)"
echo "  DB_PATH           - SQLite database path (default: ./data/nas-familia.db)"
echo "  NAS_STORAGE_PATH  - File storage path (default: ./storage/files)"
echo ""
echo "The frontend is embedded in the binary. Just run it!"
