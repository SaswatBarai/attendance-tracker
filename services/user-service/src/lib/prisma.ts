import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env['DATABASE_URL'] });
const adapter = new PrismaPg(pool);

declare global {
  // eslint-disable-next-line no-var
  var __userPrisma: PrismaClient | undefined;
}

export const prisma = globalThis.__userPrisma ?? new PrismaClient({ adapter });

if (process.env['NODE_ENV'] !== 'production') {
  globalThis.__userPrisma = prisma;
}

export default prisma;
