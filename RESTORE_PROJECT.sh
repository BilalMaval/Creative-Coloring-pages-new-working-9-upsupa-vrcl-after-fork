#!/bin/bash
# Creative Coloring Pages - Full Project Restoration Script
# Run this script if PostgreSQL or data is lost

echo "🔄 Starting Full Project Restoration..."

# 1. Start PostgreSQL
echo "📊 Step 1: Starting PostgreSQL..."
sudo service postgresql start
sleep 3

# 2. Create database
echo "📊 Step 2: Creating database..."
sudo -u postgres psql -c "DROP DATABASE IF EXISTS coloring_pages;"
sudo -u postgres psql -c "CREATE DATABASE coloring_pages;"
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"

# 3. Apply Prisma schema
echo "📊 Step 3: Applying Prisma schema..."
cd /app
npx prisma db push --skip-generate
npx prisma generate

# 4. Restore from latest backup OR seed fresh data
echo "📊 Step 4: Restoring data..."
LATEST_BACKUP=$(ls -t /app/backups/database_backup_*.sql 2>/dev/null | head -1)

if [ -f "$LATEST_BACKUP" ]; then
    echo "   Found backup: $LATEST_BACKUP"
    sudo -u postgres psql coloring_pages < "$LATEST_BACKUP"
    echo "   ✅ Database restored from backup"
else
    echo "   No backup found, seeding fresh data..."
    node /app/prisma/seed.js
    
    # Add test products
    node << 'EOFNODE'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const category = await prisma.category.findFirst({ where: { slug: 'animals-pets' } });
  if (category) {
    const products = [
      { title: 'Cute Cat Coloring Page', slug: 'cute-cat-coloring-page', description: 'A beautiful cat coloring page perfect for kids!', tags: ['cat', 'animals', 'kids'], webpPath: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400', isFeatured: true },
      { title: 'Happy Dog Coloring Page', slug: 'happy-dog-coloring-page', description: 'A friendly dog waiting to be colored!', tags: ['dog', 'animals'], webpPath: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400' },
      { title: 'Butterfly Garden', slug: 'butterfly-garden-coloring', description: 'Beautiful butterflies flying in a garden.', tags: ['butterfly', 'nature'], webpPath: 'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=400' },
      { title: 'Cute Rabbit', slug: 'cute-rabbit-coloring', description: 'An adorable rabbit with long ears.', tags: ['rabbit', 'bunny'], webpPath: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400' }
    ];
    for (const p of products) {
      await prisma.product.create({ data: { ...p, categoryId: category.id, price: 0, isFree: true, isActive: true } });
    }
  }
  await prisma.$disconnect();
})();
EOFNODE
    echo "   ✅ Fresh data seeded"
fi

# 5. Restart Next.js
echo "📊 Step 5: Restarting Next.js..."
sudo supervisorctl restart nextjs

echo ""
echo "✅ ============================================"
echo "✅ RESTORATION COMPLETE!"
echo "✅ ============================================"
echo ""
echo "🌐 Your website is available at:"
echo "   Homepage: https://design-shop-35.preview.emergentagent.com"
echo "   Admin: https://design-shop-35.preview.emergentagent.com/admin/login"
echo "   Credentials: admin@printables.com / admin123"
echo ""
echo "📊 Database Status:"
sudo -u postgres psql coloring_pages -c "SELECT 
    (SELECT COUNT(*) FROM categories WHERE parent_id IS NULL) as collections,
    (SELECT COUNT(*) FROM categories WHERE parent_id IS NOT NULL) as categories,
    (SELECT COUNT(*) FROM products) as products,
    (SELECT COUNT(*) FROM users) as users;"
echo ""
