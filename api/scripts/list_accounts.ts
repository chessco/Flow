import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const accounts = await prisma.whatsAppAccount.findMany({
    include: { 
      tenant: true,
      phoneNumbers: true
    }
  });

  console.log('--- WhatsApp Accounts ---');
  accounts.forEach(acc => {
    console.log(`Tenant: ${acc.tenant.name} (${acc.tenant.id})`);
    console.log(`WABA ID: ${acc.wabaId}`);
    console.log(`Phone ID: ${acc.phoneNumbers?.[0]?.phoneNumberId}`);
    console.log('---');
  });

  await prisma.$disconnect();
}

main().catch(console.error);
