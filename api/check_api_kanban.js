const axios = require('axios');

async function main() {
    try {
        const response = await axios.get('http://localhost:3001/kanban', {
            headers: {
                'x-tenant-id': 'edd1ac37-5ff9-4e46-bc7f-fff3c414d718',
                'Authorization': 'Bearer YOUR_TOKEN' // We might not need this if there's no auth guard on this endpoint or if we can bypass it
            }
        });
        console.log(JSON.stringify(response.data, null, 2));
    } catch (e) {
        console.error('API ERROR:', e.message);
    }
}

// Since I don't have a token easily, I'll just use the service directly in a script
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkService() {
    const tenantId = 'edd1ac37-5ff9-4e46-bc7f-fff3c414d718';
    const pipeline = await prisma.pipeline.findFirst({
        where: { tenantId },
        include: {
            stages: {
                orderBy: { order: 'asc' },
                include: {
                    cards: {
                        include: { contact: true, lead: true }
                    }
                }
            }
        }
    });
    console.log(JSON.stringify(pipeline, null, 2));
}

checkService();
