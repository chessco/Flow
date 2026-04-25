
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up WhatsApp mock accounts...');
  
  // Cascade delete or manual deletion
  await prisma.whatsAppPhoneNumber.deleteMany({});
  await prisma.whatsAppAccount.deleteMany({});
  
  console.log('✅ Cleanup complete. Flow will now use .env credentials.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
