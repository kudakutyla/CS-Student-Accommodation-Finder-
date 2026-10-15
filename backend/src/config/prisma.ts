import path from 'path';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const sanitizedDatabaseUrl = process.env.DATABASE_URL?.replace(/&channel_binding=require/g, '');
if (sanitizedDatabaseUrl) {
  process.env.DATABASE_URL = sanitizedDatabaseUrl;
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
