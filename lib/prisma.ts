import { PrismaClient } from '../prisma/generated/client';
import { withAccelerate } from '@prisma/extension-accelerate';

console.log('[PRISMA] Initializing from generated local client');

const prismaClientSingleton = () => {
  console.log('[PRISMA] Creating new PrismaClient instance');
  const client = new PrismaClient({
    log: ['query', 'error', 'warn'],
    // @ts-ignore
    accelerateUrl: process.env.DATABASE_URL,
  });

  // Check if models exist on the base client before extension
  // @ts-ignore
  if (!client.account) console.error('[PRISMA] WARNING: client.account is undefined on base client!');

  return client.$extends(withAccelerate());
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prismaInstancev2: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prismaInstancev2 ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prismaInstancev2 = prisma;
