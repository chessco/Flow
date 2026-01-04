const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const leadId = 'b08ea9a1-080e-45f6-bc82-f042b1176b22';
        const cardId = 'd329cd12-36c6-4ad0-9592-a52ac3963d1a';

        await prisma.lead.update({
            where: { id: leadId },
            data: { name: 'chessco' }
        });

        await prisma.card.update({
            where: { id: cardId },
            data: { title: 'chessco' }
        });

        console.log('Fixed name to "chessco" for lead and card.');
    } catch (e) {
        console.error('ERROR:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
