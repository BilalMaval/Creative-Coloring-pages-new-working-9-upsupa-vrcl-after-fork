import { PrismaClient } from '@prisma/client';

// One Prisma client per server process, reused by every request that process handles.
//
// Production should connect through the Supabase TRANSACTION pooler (port 6543, ?pgbouncer=true) so that many short-lived
// serverless instances share a small set of real database connections; see PROJECT_DOCUMENTATION.md for the exact
// DATABASE_URL / DIRECT_URL values. DIRECT_URL (port 5432) is only used by Prisma CLI commands such as migrations.
//
// The client connects lazily on its first query. (It used to connect eagerly on import, which opened a connection in every
// build worker and every cold start even for requests that never touch the database.)
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

// Keep the instance in every environment: it survives dev hot reloads and warm serverless instances
globalForPrisma.prisma = prisma;

export default prisma;
