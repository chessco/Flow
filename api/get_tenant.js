const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const tenant = await prisma.tenant.findFirst();
        console.log('TENANT_ID_RESULT:', tenant?.id);
    } catch (e) {
        console.error('ERROR_QUERYING:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
