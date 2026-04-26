import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const tenants = await prisma.tenant.findMany();

  console.log('--- Tenants ---');
  tenants.forEach(t => {
    console.log(`ID: ${t.id} | Name: ${t.name} | Slug: ${t.slug}`);
  });

  await prisma.$disconnect();
}

main().catch(console.error);
