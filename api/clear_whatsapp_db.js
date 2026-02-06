const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Clearing WhatsApp Access Tokens in DB...');
        const updateResult = await prisma.whatsAppAccount.updateMany({
            data: { accessToken: '' } // Set to empty string so it fails the check and falls back to ENV
        });
        console.log(`Updated ${updateResult.count} accounts.`);
    } catch (e) {
        console.error('ERROR:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
