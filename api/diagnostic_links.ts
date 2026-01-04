import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const conversations = await prisma.conversation.findMany({
        include: { lead: true, contact: true }
    });
    console.log('Conversations Found:', conversations.length);
    conversations.forEach(c => {
        console.log(`Conv ID: ${c.id}`);
        console.log(`  Lead ID: ${c.leadId}`);
        console.log(`  Contact ID: ${c.contactId}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
