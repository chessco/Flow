
import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'pitaya_default_encryption_key_32';
const algorithm = 'aes-256-ctr';
const secretKey = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();

function decrypt(text) {
    if (!text) return '';
    try {
        const [iv, content] = text.split(':');
        if (!content) return text;
        const decipher = crypto.createDecipheriv(algorithm, secretKey, Buffer.from(iv, 'hex'));
        const decrypted = Buffer.concat([decipher.update(Buffer.from(content, 'hex')), decipher.final()]);
        return decrypted.toString();
    } catch (e) {
        return 'FAILED_TO_DECRYPT: ' + e.message;
    }
}

async function run() {
    console.log('--- WhatsApp Account Diagnostic ---');
    const accounts = await prisma.whatsAppAccount.findMany({
        include: { phoneNumbers: true }
    });

    console.log(`Found ${accounts.length} accounts.`);

    for (const acc of accounts) {
        const decrypted = decrypt(acc.accessToken);
        console.log(`Account: ${acc.id}`);
        console.log(`- Tenant: ${acc.tenantId}`);
        console.log(`- WABA ID: ${acc.wabaId}`);
        console.log(`- Token (first 10): ${decrypted.substring(0, 10)}...`);
        console.log(`- Token has "****": ${decrypted.includes('****')}`);
        console.log(`- Phone Numbers: ${acc.phoneNumbers.map(p => p.displayPhoneNumber).join(', ')}`);
        console.log('-----------------------------------');
    }

    const messagesWithMedia = await prisma.message.findMany({
        where: { mediaUrl: { not: null } },
        take: 5,
        orderBy: { createdAt: 'desc' }
    });

    console.log('Recent Messages with Media:');
    for (const msg of messagesWithMedia) {
        console.log(`- ID: ${msg.id}, Type: ${msg.type}, URL: ${msg.mediaUrl}`);
    }
}

run().catch(console.error).finally(() => prisma.$disconnect());
