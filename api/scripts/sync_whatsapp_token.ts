import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

async function main() {
  const prisma = new PrismaClient();
  const tenantId = 'edd1ac37-5ff9-4e46-bc7f-fff3c414d718';
  
  // From .env
  const envToken = "EAA6q6nIZAcZAQBRfDV7Wuj7OsKgSmeMtlrbnm7KSOAZCe58dQO8dVLhfg4tZAyZB9QRoFnR9aYsRsrBueWfCIVd5iptZCt7Xwl23LCyhFHfALVPfO7buNaSslqDUTZCpipNuX70Qi19UYCoQ0F3tLwc8PoK9elLK8Njlowj4v8JDkKLiVbERhqbiJikZA9eb1zrwWglLA2HRdCNsni3QRLtgmZBKak2zPr7UoETTA3zfZCQQ7jRnlkK6zQVUGldEVGB8dF2KQbKW7oLrEfFSFQ1QZDZD";
  
  const rawKey = 'pitaya_default_encryption_key_32';
  const secretKey = crypto.createHash('sha256').update(rawKey).digest();
  const algorithm = 'aes-256-ctr';

  // Encrypt
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
  const encrypted = Buffer.concat([cipher.update(envToken), cipher.final()]);
  const encryptedToken = `${iv.toString('hex')}:${encrypted.toString('hex')}`;

  const account = await prisma.whatsAppAccount.findFirst({
    where: { tenantId }
  });

  if (account) {
    await prisma.whatsAppAccount.update({
      where: { id: account.id },
      data: { accessToken: encryptedToken }
    });
    console.log('WhatsApp token updated in DB for tenant:', tenantId);
  } else {
    console.log('No WhatsApp account found for tenant:', tenantId);
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);
