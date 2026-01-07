const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function main() {
    try {
        const tenant = await prisma.tenant.findFirst();
        console.log('TENANT_ID:', tenant?.id);

        if (!tenant) {
            console.log('NO_TENANT_FOUND');
            return;
        }

        const account = await prisma.whatsAppAccount.findFirst({
            where: { tenantId: tenant.id },
            include: { phoneNumbers: true }
        });

        if (account) {
            console.log('ACCOUNT_ID:', account.id);
            console.log('WABA_ID:', account.wabaId);
            console.log('HAS_ACCESS_TOKEN:', !!account.accessToken);
            console.log('PHONE_NUMBERS:', JSON.stringify(account.phoneNumbers, null, 2));

            if (account.accessToken) {
                console.log('TOKEN_PREFIX:', account.accessToken.substring(0, 10) + '...');
            }
        } else {
            console.log('NO_WHATSAPP_ACCOUNT_FOUND');
        }

    } catch (e) {
        console.error('ERROR:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
