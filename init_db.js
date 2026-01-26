const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    console.log('Starting manual database initialization...');

    const tenantId = 'edd1ac37-5ff9-4e46-bc7f-fff3c414d718';
    const tenant = await prisma.tenant.upsert({
        where: { id: tenantId },
        update: {},
        create: {
            id: tenantId,
            name: 'PitayaFlow Default',
            slug: 'default'
        }
    });
    console.log('- Tenant ready:', tenant.name);

    const hashedPassword = await bcrypt.hash('pitaya123', 10);
    const user = await prisma.user.upsert({
        where: { email: 'admin@pitayacode.io' },
        update: {
            password: hashedPassword,
            role: 'SYSTEM_ADMIN'
        },
        create: {
            id: 'admin-user-001',
            email: 'admin@pitayacode.io',
            password: hashedPassword,
            name: 'Admin User',
            role: 'SYSTEM_ADMIN',
            tenantId: tenant.id
        }
    });
    console.log('- User ready:', user.email);
    console.log('Database initialization completed successfully!');
}

main()
    .catch(err => {
        console.error('Error during initialization:', err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
