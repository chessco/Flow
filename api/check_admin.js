const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findUnique({
        where: { email: 'admin@pitayacode.io' }
    });
    console.log('User found:', user);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
