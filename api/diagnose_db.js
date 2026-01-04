const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const tenantId = 'edd1ac37-5ff9-4e46-bc7f-fff3c414d718';
        console.log('--- DIAGNOSTIC DATA ---');

        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        console.log('Tenant:', tenant ? 'FOUND' : 'NOT FOUND');

        const conversations = await prisma.conversation.findMany({
            where: { tenantId },
            include: { messages: true }
        });
        console.log('Conversations count:', conversations.length);

        conversations.forEach((c, i) => {
            console.log(`Conv ${i}: id=${c.id}, leadId=${c.leadId}, contactId=${c.contactId}, msgs=${c.messages.length}`);
            if (c.messages.length > 0) {
                console.log(`  Last msg: ${c.messages[c.messages.length - 1].content}`);
            }
        });

        const messagesTotal = await prisma.message.count();
        console.log('Total messages in DB:', messagesTotal);

    } catch (e) {
        console.error('DIAGNOSTIC ERROR:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
