const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const messages = await prisma.message.findMany({
            where: {
                mediaUrl: {
                    startsWith: '/api'
                }
            }
        });

        console.log(`Found ${messages.length} messages with /api prefix.`);

        for (const msg of messages) {
            const newUrl = msg.mediaUrl.replace('/api', '');
            await prisma.message.update({
                where: { id: msg.id },
                data: { mediaUrl: newUrl }
            });
            console.log(`Updated msg ${msg.id}: ${msg.mediaUrl} -> ${newUrl}`);
        }

        console.log('Cleanup finished.');
    } catch (e) {
        console.error('ERROR:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
