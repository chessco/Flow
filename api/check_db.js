
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const tenantId = 'edd1ac37-5ff9-4e46-bc7f-fff3c414d718';
    console.log('Checking for tenant:', tenantId);

    // Check Pipeline
    const pipeline = await prisma.pipeline.findFirst({
        where: { tenantId },
        include: { stages: true }
    });

    console.log('Pipeline:', pipeline);

    if (pipeline) {
        console.log('Stages:', pipeline.stages);
    } else {
        console.log('NO PIPELINE FOUND FOR TENANT');
    }

    // Check recent conversations
    const conversations = await prisma.conversation.findMany({
        where: { tenantId },
        take: 5,
        orderBy: { updatedAt: 'desc' },
        include: {
            lead: true,
            contact: true,
            messages: { take: 1, orderBy: { createdAt: 'desc' } }
        }
    });

    console.log('Recent Conversations:', conversations.length);
    conversations.forEach(c => {
        console.log(`ID: ${c.id}, Lead: ${c.lead?.name || c.lead?.phone}, Contact: ${c.contact?.name || c.contact?.phone}, Status: ${c.status}`);
        console.log('Last Message:', c.messages[0]);
    });

    // Check Cards
    const cards = await prisma.card.findMany({
        where: { tenantId },
        take: 5,
        orderBy: { createdAt: 'desc' }
    });
    console.log('Recent Cards:', cards);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
