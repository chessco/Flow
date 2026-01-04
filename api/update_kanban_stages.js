const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const pipelineName = 'Flow Board';

    try {
        const pipeline = await prisma.pipeline.findFirst({
            where: { name: pipelineName },
            include: { stages: true }
        });

        if (!pipeline) {
            console.error(`Pipeline "${pipelineName}" not found.`);
            return;
        }

        console.log(`Updating pipeline: ${pipeline.name} (${pipeline.id})`);

        const newStages = [
            { name: 'Nuevo Lead', oldNames: ['Nuevo'], order: 1 },
            { name: 'En Seguimiento', oldNames: ['Contactado'], order: 2 },
            { name: 'Calificado', oldNames: ['Calificado'], order: 3 },
            { name: 'Esperando Transferencia', oldNames: ['Cotización', 'Negociación'], order: 4 },
            { name: 'Venta Cerrada / Completado', oldNames: ['Ganado'], order: 5 }
        ];

        for (const ns of newStages) {
            // Find existing stages that match any of the old names
            const existingStages = pipeline.stages.filter(s => ns.oldNames.includes(s.name));

            if (existingStages.length > 0) {
                const primaryStage = existingStages[0];
                console.log(`Updating/Merging ${existingStages.map(s => s.name).join(', ')} into "${ns.name}"`);

                // 1. Update the first stage found
                await prisma.stage.update({
                    where: { id: primaryStage.id },
                    data: { name: ns.name, order: ns.order }
                });

                // 2. If there are other stages to merge, move their cards and delete the stages
                for (let i = 1; i < existingStages.length; i++) {
                    const extraStage = existingStages[i];
                    console.log(`  - Moving cards from ${extraStage.name} to ${ns.name}`);
                    await prisma.card.updateMany({
                        where: { stageId: extraStage.id },
                        data: { stageId: primaryStage.id }
                    });
                    console.log(`  - Deleting extra stage ${extraStage.name}`);
                    await prisma.stage.delete({ where: { id: extraStage.id } });
                }
            } else {
                console.log(`Creating new stage: "${ns.name}"`);
                await prisma.stage.create({
                    data: {
                        name: ns.name,
                        order: ns.order,
                        pipelineId: pipeline.id
                    }
                });
            }
        }

        console.log('Stages updated successfully.');
    } catch (e) {
        console.error('ERROR:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
