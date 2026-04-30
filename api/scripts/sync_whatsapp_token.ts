import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

async function main() {
  const prisma = new PrismaClient();
  const tenantId = process.env.TENANT_ID || 'edd1ac37-5ff9-4e46-bc7f-fff3c414d718';
  
  // Read token from environment variable — NEVER hardcode tokens
  const envToken = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!envToken) {
    console.error('ERROR: Set WHATSAPP_ACCESS_TOKEN environment variable before running this script.');
    process.exit(1);
  }
  
  const rawKey = process.env.ENCRYPTION_KEY || 'pitaya_default_encryption_key_32';
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
