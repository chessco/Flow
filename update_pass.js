const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
    const email = 'admin@pitayacode.io';
    const newPassword = 'pitaya123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const user = await prisma.user.update({
        where: { email },
        data: { password: hashedPassword }
    });

    console.log(`Password updated for ${user.email}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
