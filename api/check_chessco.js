const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const tenantId = 'edd1ac37-5ff9-4e46-bc7f-fff3c414d718';
        console.log('--- SEARCHING FOR CHESSCO ---');

        const leads = await prisma.lead.findMany({
            where: {
                tenantId,
                OR: [
                    { name: { contains: 'chessco' } },
                    { phone: { contains: 'chessco' } }
                ]
            }
        });
        console.log('Leads found:', leads.length);
        leads.forEach(l => console.log(`Lead: id=${l.id}, name=${l.name}, phone=${l.phone}`));

        const contacts = await prisma.contact.findMany({
            where: {
                tenantId,
                OR: [
                    { name: { contains: 'chessco' } },
                    { phone: { contains: 'chessco' } }
                ]
            }
        });
        console.log('Contacts found:', contacts.length);
        contacts.forEach(c => console.log(`Contact: id=${c.id}, name=${c.name}, phone=${c.phone}`));

        const cards = await prisma.card.findMany({
            where: { tenantId },
            include: { stage: true }
        });
        console.log('Total cards in tenant:', cards.length);
        cards.forEach(card => {
            console.log(`Card: id=${card.id}, title=${card.title}, stage=${card.stage.name}, leadId=${card.leadId}, contactId=${card.contactId}`);
        });

    } catch (e) {
        console.error('ERROR:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
