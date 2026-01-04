const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const leadId = 'b08ea9a1-080e-45f6-bc82-f042b1176b22';
        const lead = await prisma.lead.findUnique({ where: { id: leadId } });
        console.log('Lead details:', JSON.stringify(lead, null, 2));
    } catch (e) {
        console.error('ERROR:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
