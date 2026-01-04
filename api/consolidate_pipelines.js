const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const tenantId = 'edd1ac37-5ff9-4e46-bc7f-fff3c414d718';
        const targetPipelineId = 'cfcae8b3-3b9f-4462-9240-1e34fbbb2b91'; // Flow Board
        const sourcePipelineId = 'default-pipeline';

        console.log(`Moving cards from ${sourcePipelineId} to ${targetPipelineId}...`);

        const sourceStages = await prisma.stage.findMany({ where: { pipelineId: sourcePipelineId } });
        const targetStages = await prisma.stage.findMany({ where: { pipelineId: targetPipelineId } });

        for (const sStage of sourceStages) {
            const tStage = targetStages.find(ts => ts.name === sStage.name);
            if (tStage) {
                const updated = await prisma.card.updateMany({
                    where: { stageId: sStage.id },
                    data: { stageId: tStage.id }
                });
                console.log(`Moved ${updated.count} cards from stage "${sStage.name}"`);
            } else {
                console.log(`Target stage not found for "${sStage.name}"`);
            }
        }

        // Delete redundant pipeline
        await prisma.stage.deleteMany({ where: { pipelineId: sourcePipelineId } });
        await prisma.pipeline.delete({ where: { id: sourcePipelineId } });
        console.log('Redundant pipeline deleted.');

    } catch (e) {
        console.error('ERROR:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
