import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const req = await prisma.purchaseRequest.findUnique({ where: { id: 3 } });

  console.log('--- Purchase Request #3 ---');
  console.log(JSON.stringify(req, null, 2));

  await prisma.$disconnect();
}

main().catch(console.error);
