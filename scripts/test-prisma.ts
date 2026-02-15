
import { PrismaClient } from '../prisma/generated/client';
import { withAccelerate } from '@prisma/extension-accelerate';

console.log('Testing Prisma Connection...');

try {
    const prisma = new PrismaClient({
        accelerateUrl: process.env.DATABASE_URL
    }).$extends(withAccelerate());

    const accounts = await prisma.account.findMany();
    console.log('Successfully fetched accounts:', accounts.length);
    process.exit(0);
} catch (error) {
    console.error('Prisma Test Failed:', error);
    process.exit(1);
}
