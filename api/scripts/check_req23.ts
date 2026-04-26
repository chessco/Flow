import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const reqs = await prisma.purchaseRequest.findMany({
    where: { externalId: 23 },
    orderBy: { createdAt: 'desc' }
  });
  console.log(JSON.stringify(reqs, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
