import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

async function main() {
  const prisma = new PrismaClient();
  const tenantId = 'edd1ac37-5ff9-4e46-bc7f-fff3c414d718';
  
  const account = await prisma.whatsAppAccount.findFirst({
    where: { tenantId },
    include: { phoneNumbers: true }
  });

  if (!account) {
    console.log('No account found for tenant:', tenantId);
  } else {
    console.log('Account found:');
    console.log('WABA ID:', account.wabaId);
    console.log('Phone ID:', account.phoneNumbers?.[0]?.phoneNumberId);
    
    // Decrypt token to see if it looks valid
    const rawKey = 'pitaya_default_encryption_key_32'; // Assuming default for now
    const secretKey = crypto.createHash('sha256').update(rawKey).digest();
    const algorithm = 'aes-256-ctr';

    try {
      const [iv, content] = account.accessToken.split(':');
      const decipher = crypto.createDecipheriv(algorithm, secretKey, Buffer.from(iv, 'hex'));
      const decrypted = Buffer.concat([decipher.update(Buffer.from(content, 'hex')), decipher.final()]);
      const token = decrypted.toString();
      console.log('Token:', token);
    } catch (e) {
      console.log('Token decryption failed. Maybe key is different.');
    }
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);
