import { PrismaClient } from '@prisma/client';

const globalForPrisma = global;

// Create Prisma client with optimized connection settings
export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

// Pre-warm the connection pool
if (!globalForPrisma.prisma) {
  prisma.$connect().catch(console.error);
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;