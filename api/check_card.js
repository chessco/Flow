const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const cardId = 'd329cd12-36c6-4ad0-9592-a52ac3963d1a';
        const card = await prisma.card.findUnique({
            where: { id: cardId },
            include: { stage: true }
        });
        console.log('Card details:', JSON.stringify(card, null, 2));
    } catch (e) {
        console.error('ERROR:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
