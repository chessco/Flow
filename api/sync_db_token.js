const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const tenantId = 'edd1ac37-5ff9-4e46-bc7f-fff3c414d718';
        const account = await prisma.whatsAppAccount.findFirst({
            where: { tenantId }
        });

        if (account) {
            console.log('ACCOUNT_FOUND: updating token in DB...');
            await prisma.whatsAppAccount.update({
                where: { id: account.id },
                data: { accessToken: "EAA6q6nIZAcZAQBQSLvQNCz8ME7vBKlXsiO0CCY4XnVApeXgGWDKZByZAIkCzOMPbVgEvVZAQTZCBoSassnoKk8VDT2ZAqKHDjJ3KJy3ADiXJkq8KyVCySbfYM1shbWME7U6eRzt8vMJVHJr7ZBy0vNgn9kj02T6RKZBzjs6eXYikQYvfu3hg6ZBy3xKybH4txB98XbqKyXZBpBt2izBGgCAKGj4oalOI8AjjW8ZCCVgrDVk6yBm36FmNLxScjWkTmxuaFnOZCw9uW8i48NOTEc0jAYMFMigZDZD" }
            });
            console.log('DB_TOKEN_UPDATED');
        } else {
            console.log('NO_ACCOUNT_IN_DB: system should be using .env fallback.');
        }

    } catch (e) {
        console.error('ERROR:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
