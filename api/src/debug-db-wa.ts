
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const account = await prisma.whatsAppAccount.findFirst({
    include: { phoneNumbers: true }
  });
  console.log('WhatsApp Account in DB:');
  console.log(JSON.stringify(account, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
