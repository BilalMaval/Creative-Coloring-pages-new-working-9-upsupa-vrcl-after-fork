#!/bin/bash
# PostgreSQL Auto-Start and Database Restoration Script
# This script ensures PostgreSQL runs with all data when container restarts

set -e

echo "=========================================="
echo "PostgreSQL Auto-Setup Script"
echo "=========================================="

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "📦 Installing PostgreSQL..."
    sudo apt-get update -qq
    sudo apt-get install -y postgresql postgresql-contrib
fi

# Start PostgreSQL if not running
if ! sudo pg_lsclusters 2>/dev/null | grep -q "online"; then
    echo "🚀 Starting PostgreSQL..."
    sudo pg_ctlcluster 15 main start 2>/dev/null || true
    sleep 2
fi

# Check if database exists
DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='coloring_pages'" 2>/dev/null || echo "0")

if [ "$DB_EXISTS" != "1" ]; then
    echo "📂 Creating database..."
    sudo -u postgres psql -c "CREATE DATABASE coloring_pages;" 2>/dev/null || true
fi

# Set postgres password
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';" 2>/dev/null || true

# Push Prisma schema
echo "🔄 Syncing Prisma schema..."
cd /app && npx prisma db push --skip-generate 2>/dev/null || true

# Check if data exists
DATA_COUNT=$(sudo -u postgres psql -tAc "SELECT COUNT(*) FROM categories" coloring_pages 2>/dev/null || echo "0")

if [ "$DATA_COUNT" = "0" ] || [ "$DATA_COUNT" = "" ]; then
    echo "📥 Restoring database from backup..."
    if [ -f /app/backups/database_backup_latest.sql ]; then
        sudo -u postgres psql coloring_pages < /app/backups/database_backup_latest.sql 2>/dev/null || true
    fi
fi

# Generate Prisma client
cd /app && npx prisma generate 2>/dev/null || true

# Show status
echo ""
echo "✅ PostgreSQL Setup Complete!"
echo "=========================================="
sudo -u postgres psql coloring_pages -c "
SELECT 
  (SELECT COUNT(*) FROM categories WHERE parent_id IS NULL) as collections,
  (SELECT COUNT(*) FROM categories WHERE parent_id IS NOT NULL) as categories,
  (SELECT COUNT(*) FROM products) as products,
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM reviews) as reviews;
" 2>/dev/null || true
echo "=========================================="
