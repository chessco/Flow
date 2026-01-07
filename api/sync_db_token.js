/**
 * Utility script to manually sync/update a WhatsApp Access Token in the database.
 * 
 * IMPORTANT: Meta temporary tokens expire after 24 hours.
 * To generate a PERMANENT token:
 * 1. Go to Business Settings -> System Users.
 * 2. Create a system user (or select an existing one).
 * 3. Click "Generate New Token".
 * 4. Select your App and ensure 'whatsapp_business_messaging' and 'whatsapp_business_management' are checked.
 * 5. Use that token here or in the UI Settings.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        // Find the main tenant
        const tenant = await prisma.tenant.findFirst();
        if (!tenant) {
            console.error('ERROR: No tenant found in database.');
            return;
        }

        const tenantId = tenant.id;
        const account = await prisma.whatsAppAccount.findFirst({
            where: { tenantId }
        });

        if (account) {
            console.log(`ACCOUNT_FOUND for tenant ${tenantId}: updating token in DB...`);
            // Replace the string below with a fresh permanent token if needed
            const NEW_TOKEN = "EAA6q6nIZAcZAQBQSLvQNCz8ME7vBKlXsiO0CCY4XnVApeXgGWDKZByZAIkCzOMPbVgEvVZAQTZCBoSassnoKk8VDT2ZAqKHDjJ3KJy3ADiXJkq8KyVCySbfYM1shbWME7U6eRzt8vMJVHJr7ZBy0vNgn9kj02T6RKZBzjs6eXYikQYvfu3hg6ZBy3xKybH4txB98XbqKyXZBpBt2izBGgCAKGj4oalOI8AjjW8ZCCVgrDVk6yBm36FmNLxScjWkTmxuaFnOZCw9uW8i48NOTEc0jAYMFMigZDZD";

            await prisma.whatsAppAccount.update({
                where: { id: account.id },
                data: { accessToken: NEW_TOKEN }
            });
            console.log('DB_TOKEN_UPDATED_SUCCESSFULLY');
        } else {
            console.log('NO_ACCOUNT_IN_DB: Please create an account through the UI Settings first.');
        }

    } catch (e) {
        console.error('ERROR:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
