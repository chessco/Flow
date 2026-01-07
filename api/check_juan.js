
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const tenantId = 'edd1ac37-5ff9-4e46-bc7f-fff3c414d718';

    // Find conversation for Juan Pérez (from previous output ID ending in 024f)
    const conversationId = '3b0553bd-c7ca-4709-abb0-c29dfbff024f';

    const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { lead: true, contact: true }
    });

    if (!conversation) {
        console.log('Conversation not found');
        return;
    }

    console.log('Conversation found:', conversation.id);
    const personId = conversation.leadId || conversation.contactId;
    console.log('Person ID:', personId);

    if (!personId) {
        console.log('No person linked');
        return;
    }

    const cards = await prisma.card.findMany({
        where: {
            tenantId,
            OR: [
                { leadId: personId },
                { contactId: personId }
            ]
        }
    });

    console.log('Cards for Juan Pérez:', cards);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
