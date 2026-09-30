import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';
import { readDatabaseUrl } from './database-url.js';

export function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg(readDatabaseUrl(), { schema: 'public' });
  return new PrismaClient({ adapter });
}
