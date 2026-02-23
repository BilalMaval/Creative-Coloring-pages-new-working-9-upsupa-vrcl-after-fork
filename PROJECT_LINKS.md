# Creative Coloring Pages - Complete Project Documentation

## 🚀 Quick Start

**Live Website:** https://coloring-perf-fix.preview.emergentagent.com

## 📋 All Working Links

### Public Website
- **Homepage:** https://coloring-perf-fix.preview.emergentagent.com
- **Collection Page (Coloring Pages):** https://coloring-perf-fix.preview.emergentagent.com/collection/coloring-pages
- **Collection Page (Calendars):** https://coloring-perf-fix.preview.emergentagent.com/collection/calendars
- **Collection Page (Printables):** https://coloring-perf-fix.preview.emergentagent.com/collection/printables
- **Category Page (Animals & Pets):** https://coloring-perf-fix.preview.emergentagent.com/category/animals-pets
- **Product Page (Cute Cat):** https://coloring-perf-fix.preview.emergentagent.com/product/cute-cat-coloring-page
- **Product Page (Dog):** https://coloring-perf-fix.preview.emergentagent.com/product/happy-dog-coloring-page
- **Product Page (Butterfly):** https://coloring-perf-fix.preview.emergentagent.com/product/butterfly-garden-coloring
- **Product Page (Rabbit):** https://coloring-perf-fix.preview.emergentagent.com/product/cute-rabbit-coloring

### Admin Panel
- **Admin Login:** https://coloring-perf-fix.preview.emergentagent.com/admin/login
  - **Email:** admin@printables.com
  - **Password:** admin123
- **Admin Dashboard:** https://coloring-perf-fix.preview.emergentagent.com/admin
- **Manage Categories:** https://coloring-perf-fix.preview.emergentagent.com/admin/categories
- **Manage Products:** https://coloring-perf-fix.preview.emergentagent.com/admin/printables

## 🗄️ Database Information

### PostgreSQL Database
- **Database Name:** coloring_pages
- **User:** postgres
- **Password:** postgres
- **Port:** 5432

### Current Data
- **Collections:** 3 (Coloring Pages, Calendars, Printables)
- **Categories:** 36 (12 per collection)
- **Products:** 4 test products in Animals & Pets category
- **Users:** 1 admin user

## 🔄 Restoration & Backup

### If PostgreSQL Stops or Data is Lost

Simply run the restoration script:
```bash
bash /app/RESTORE_PROJECT.sh
```

This script will:
1. Start PostgreSQL
2. Recreate the database
3. Apply Prisma schema
4. Restore data from latest backup OR seed fresh data
5. Restart Next.js

### Manual Database Backup

Create a new backup:
```bash
sudo -u postgres pg_dump coloring_pages > /app/backups/database_backup_$(date +%Y%m%d_%H%M%S).sql
```

### Manual Database Restore

Restore from a specific backup:
```bash
sudo -u postgres psql coloring_pages < /app/backups/database_backup_YYYYMMDD_HHMMSS.sql
```

## 🛠️ Technical Stack

- **Frontend:** Next.js 14, React, TailwindCSS, shadcn/ui
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL 15
- **ORM:** Prisma
- **Authentication:** JWT-style with HTTP-only cookies
- **File Uploads:** Local storage

## 📁 Project Structure

```
/app/
├── app/                          # Next.js App Router
│   ├── page.js                   # Homepage
│   ├── collection/[slug]/        # Collection pages
│   ├── category/[slug]/          # Category pages  
│   ├── product/[slug]/           # Product detail pages
│   ├── admin/                    # Admin panel
│   │   ├── login/
│   │   ├── categories/
│   │   └── printables/
│   └── api/                      # API routes
│       ├── auth/                 # Authentication
│       ├── categories/           # Category CRUD
│       ├── printables/           # Product CRUD
│       ├── download/             # Download handler
│       ├── cart/                 # Shopping cart
│       └── stripe/               # Stripe checkout
├── components/                   # React components
│   ├── Header.js
│   ├── Footer.js
│   ├── AdminLayout.js
│   └── DownloadButton.js
├── lib/
│   ├── prisma.js                 # Prisma client
│   └── auth.js                   # Authentication utilities
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── seed.js                   # Seed script
├── backups/                      # Database backups
│   └── database_backup_*.sql
├── RESTORE_PROJECT.sh            # Full restoration script
└── PROJECT_LINKS.md              # This file
```

## 🔧 Service Management

### Check Services Status
```bash
sudo supervisorctl status
```

### Restart Next.js
```bash
sudo supervisorctl restart nextjs
```

### Start PostgreSQL
```bash
sudo service postgresql start
```

### Check PostgreSQL
```bash
sudo -u postgres psql -c "SELECT version();"
```

### View Next.js Logs
```bash
tail -f /var/log/supervisor/nextjs.out.log
```

## 🧪 Database Queries

### Check Data Counts
```bash
sudo -u postgres psql coloring_pages -c "
SELECT 
    (SELECT COUNT(*) FROM categories WHERE parent_id IS NULL) as collections,
    (SELECT COUNT(*) FROM categories WHERE parent_id IS NOT NULL) as categories,
    (SELECT COUNT(*) FROM products) as products,
    (SELECT COUNT(*) FROM users) as users;
"
```

### View All Collections
```bash
sudo -u postgres psql coloring_pages -c "SELECT name, slug FROM categories WHERE parent_id IS NULL;"
```

### View All Products
```bash
sudo -u postgres psql coloring_pages -c "SELECT title, slug, is_free FROM products;"
```

## 🎯 Features Implemented

### ✅ Public Website
- [x] Beautiful homepage with 3 collections
- [x] Collection pages showing 12 categories each
- [x] Category pages displaying products
- [x] Product detail pages with images and descriptions
- [x] Download buttons for free products
- [x] Related products section
- [x] Breadcrumb navigation
- [x] Responsive design
- [x] SEO-friendly URLs

### ✅ Admin Panel
- [x] Secure admin login
- [x] Dashboard with statistics
- [x] Category management (CRUD)
- [x] Product management (CRUD)
- [x] Image upload system
- [x] Slug auto-generation

### ✅ E-commerce Backend
- [x] User authentication system
- [x] Download tracking
- [x] Shopping cart API
- [x] Order management
- [x] Purchase verification

## 🚧 Pending Features (Phase 4)

- [ ] User login/register pages (frontend)
- [ ] User dashboard page
- [ ] Shopping cart page
- [ ] Stripe payment integration (frontend)
- [ ] Wishlist functionality
- [ ] Social sharing
- [ ] Search functionality
- [ ] Pagination for products

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login (admin/customer)
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Products
- `GET /api/printables` - List products
- `POST /api/printables` - Create product (admin)
- `PUT /api/printables` - Update product (admin)
- `DELETE /api/printables` - Delete product (admin)

### Categories
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category (admin)
- `PUT /api/categories` - Update category (admin)
- `DELETE /api/categories` - Delete category (admin)

### Downloads & Cart
- `POST /api/download` - Download product
- `GET /api/cart` - Get cart items
- `POST /api/cart` - Add to cart
- `DELETE /api/cart` - Remove from cart

### Checkout
- `POST /api/stripe/create-checkout` - Create order

## 💾 Backup Locations

All backups are stored in `/app/backups/`:
- Database backups: `database_backup_YYYYMMDD_HHMMSS.sql`

## 🆘 Troubleshooting

### Website Not Loading
1. Check if Next.js is running: `sudo supervisorctl status nextjs`
2. Restart if needed: `sudo supervisorctl restart nextjs`
3. Check logs: `tail -f /var/log/supervisor/nextjs.out.log`

### No Data Showing
1. Check if PostgreSQL is running: `sudo service postgresql status`
2. Start if needed: `sudo service postgresql start`
3. Run restoration script: `bash /app/RESTORE_PROJECT.sh`

### Admin Login Not Working
1. Ensure database has admin user
2. Run seed script: `node /app/prisma/seed.js`
3. Default credentials: admin@printables.com / admin123

## 📤 Saving to GitHub

To save this project to GitHub:

```bash
cd /app
git add .
git commit -m "Complete Creative Coloring Pages project with PostgreSQL"
git push origin main
```

**Important Files to Commit:**
- All source code
- `/app/RESTORE_PROJECT.sh`
- `/app/PROJECT_LINKS.md`
- `/app/prisma/schema.prisma`
- `/app/prisma/seed.js`
- Database backup files in `/app/backups/`

## 🎉 Success Checklist

- [x] PostgreSQL installed and running
- [x] Database created and seeded
- [x] Next.js running successfully
- [x] Homepage loading correctly
- [x] Admin panel accessible
- [x] All links working
- [x] Backup script created
- [x] Documentation complete

---

**Last Updated:** $(date)
**Status:** ✅ Fully Operational
