import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Fixing admin password...');
    const email = 'admin@pitayacode.io';
    const hashedPassword = await bcrypt.hash('pitaya123', 10);

    const user = await prisma.user.update({
        where: { email },
        data: {
            password: hashedPassword,
            role: 'SYSTEM_ADMIN'
        }
    });

    console.log(`Password for ${email} has been updated and hashed correctly.`);
}

main()
    .catch((e) => {
        console.error('Error fixing password:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
