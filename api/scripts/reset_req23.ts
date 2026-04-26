import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.purchaseRequest.updateMany({
    where: { externalId: 23 },
    data: { status: 'PENDING' }
  });
  console.log("Request 23 reset to PENDING in Flow.");
}
main().catch(console.error).finally(() => prisma.$disconnect());
