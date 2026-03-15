# Creative Coloring Pages

A full-stack e-commerce platform for coloring pages, calendars, printables, and eBooks built with Next.js and PostgreSQL.

## 🗄️ Database

This application uses **PostgreSQL** as its only database. All data is stored in PostgreSQL using Prisma ORM.

### Database Configuration
- **Database URL**: `postgresql://postgres:postgres@localhost:5432/coloring_pages`
- **ORM**: Prisma
- **Schema**: `/app/prisma/schema.prisma`

### Automatic Database Restoration

When the container restarts or the agent wakes up, run the restoration script:

```bash
/app/scripts/restore-postgres.sh
```

This script will:
1. Install PostgreSQL if not present
2. Start PostgreSQL service
3. Create the database if it doesn't exist
4. Apply Prisma schema
5. Restore data from the latest backup

### Manual Restoration Steps

If automatic restoration fails, follow these steps:

```bash
# 1. Install PostgreSQL
sudo apt-get update && sudo apt-get install -y postgresql postgresql-contrib

# 2. Start PostgreSQL
sudo pg_ctlcluster 15 main start

# 3. Create database
sudo -u postgres psql -c "CREATE DATABASE coloring_pages;"
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"

# 4. Apply Prisma schema
cd /app && npx prisma db push

# 5. Restore data from backup
sudo -u postgres psql coloring_pages < /app/backups/database_backup_latest.sql

# 6. Restart Next.js
sudo supervisorctl restart nextjs
```

## 🏗️ Tech Stack

- **Frontend**: Next.js 14 with React
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS + shadcn/ui
- **File Storage**: Local uploads

## 📁 Project Structure

```
/app/
├── app/                    # Next.js app directory
│   ├── api/               # API routes (all use Prisma/PostgreSQL)
│   ├── admin/             # Admin dashboard pages
│   ├── category/          # Category pages
│   ├── collection/        # Collection pages
│   ├── product/           # Product detail pages
│   └── page.js            # Homepage
├── components/            # React components
├── lib/
│   ├── prisma.js         # Prisma client
│   └── seo.js            # SEO utilities
├── prisma/
│   └── schema.prisma     # Database schema
├── backups/              # Database backup files
├── scripts/
│   └── restore-postgres.sh  # Auto-restoration script
└── .env                  # Environment variables
```

## 🔐 Admin Access

- **URL**: `/admin/login`
- **Email**: `admin@printables.com`
- **Password**: `admin123`

## 📊 Database Tables

| Table | Description |
|-------|-------------|
| categories | Collections and categories (hierarchical) |
| products | Coloring pages, books, printables |
| users | Admin users |
| reviews | Product reviews with star ratings |
| pages | Static content pages (About, Privacy, Terms) |
| orders | Purchase orders |
| downloads | Download tracking |
| cart_items | Shopping cart |

## 🚀 Quick Start

1. Ensure PostgreSQL is running:
```bash
sudo pg_lsclusters
```

2. If not running, start it:
```bash
sudo pg_ctlcluster 15 main start
```

3. Restart Next.js:
```bash
sudo supervisorctl restart nextjs
```

## 📝 Environment Variables

```env
# PostgreSQL Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/coloring_pages?schema=public"

# Next.js
NEXT_PUBLIC_BASE_URL=https://design-shop-35.preview.emergentagent.com

# Authentication
JWT_SECRET=creative-coloring-pages-secret-key-2024
```

## ⚠️ Important Notes

- **MongoDB is NOT used** - All functionality uses PostgreSQL
- Database backups are stored in `/app/backups/`
- Always run the restoration script after container restart
- The latest backup file is `database_backup_latest.sql`
