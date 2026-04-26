import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

async function main() {
  const prisma = new PrismaClient();
  
  const email = 'system@pitayacode.io';
  const password = 'pitaya123';
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    console.error('No tenant found. Please create a tenant first.');
    await prisma.$disconnect();
    return;
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      role: 'SYSTEM_ADMIN'
    },
    create: {
      email,
      password: hashedPassword,
      name: 'System Administrator',
      role: 'SYSTEM_ADMIN',
      tenantId: tenant.id
    }
  });

  console.log('System user ensured:', user.email);
  await prisma.$disconnect();
}

main().catch(console.error);
