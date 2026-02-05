const { PrismaClient } = require('@prisma/client');
const { withAccelerate } = require('@prisma/extension-accelerate');
const bcrypt = require('bcryptjs');

const DATABASE_URL = "prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19WVlBJczFoT19ZMWFDS2lBdHBCTW4iLCJhcGlfa2V5IjoiMDFLR0VDVDM3WkpGWUYxQ1BHMjNTSEcwS1AiLCJ0ZW5hbnRfaWQiOiI0ODhlMjNmM2ZiZGU5ZTYxYjdiMzc0MTlmOTQ0ZTdhZDQyNzAyMjdjM2U1MGU5M2MyMmMxZjgzOTMzMTdkNmUyIiwiaW50ZXJuYWxfc2VjcmV0IjoiYjI2M2YzNDktOGM1NC00YzkyLTlhZjEtNzcxYzgwMjhmNzI5In0.6ifhS9lrTPQzdaMfgggtNQjE55xIlFUBmzHny1hcOVA";

const prisma = new PrismaClient({
    accelerateUrl: DATABASE_URL
}).$extends(withAccelerate());

async function main() {
  const email = 'admin@example.com';
  const password = 'adminpassword123';
  const hashedPassword = await bcrypt.hash(password, 10);

  console.log('Seeding admin user...');
  
  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        password: hashedPassword,
        role: 'admin',
        full_name: 'System Admin'
      },
      create: {
        email,
        password: hashedPassword,
        full_name: 'System Admin',
        role: 'admin',
      },
    });
    console.log('Admin user ready:', user.email);
    console.log('Password:', password);
  } catch (e) {
    console.error('Seed error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
