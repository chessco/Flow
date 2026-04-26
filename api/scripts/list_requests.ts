import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const requests = await prisma.purchaseRequest.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  console.log('--- Purchase Requests ---');
  requests.forEach(req => {
    console.log(`ID: ${req.id} | Folio: ${req.folio} | Status: ${req.status} | Phone: ${req.phone} | Created: ${req.createdAt}`);
  });

  await prisma.$disconnect();
}

main().catch(console.error);
