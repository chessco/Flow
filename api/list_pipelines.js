const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const tenantId = 'edd1ac37-5ff9-4e46-bc7f-fff3c414d718';
        const pipelines = await prisma.pipeline.findMany({
            where: { tenantId },
            include: { stages: true }
        });
        console.log('Pipelines found:', pipelines.length);
        pipelines.forEach(p => {
            console.log(`Pipeline: id=${p.id}, name=${p.name}`);
            p.stages.forEach(s => console.log(`  Stage: id=${s.id}, name=${s.name}`));
        });
    } catch (e) {
        console.error('ERROR:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
