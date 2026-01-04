const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'pitaya_secret_prod_key';

async function main() {
    try {
        const tenantId = 'edd1ac37-5ff9-4e46-bc7f-fff3c414d718';
        const email = 'admin@pitaya.com';
        const password = 'admin123';

        console.log(`Checking if user ${email} exists...`);
        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            console.log('User not found. Creating admin user...');
            const hashedPassword = await bcrypt.hash(password, 10);
            user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name: 'System Admin',
                    role: 'TENANT_ADMIN',
                    tenantId
                }
            });
            console.log('Admin user created successfully.');
        } else {
            console.log('User already exists. Updating role to TENANT_ADMIN just in case...');
            user = await prisma.user.update({
                where: { id: user.id },
                data: { role: 'TENANT_ADMIN' }
            });
            console.log('User updated.');
        }

        // Generate Token manually to verify
        const payload = {
            email: user.email,
            sub: user.id,
            tenantId: user.tenantId,
            role: user.role
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' }); // Long expiry for dev

        console.log('\n======================================================');
        console.log('ADMIN USER READY');
        console.log('------------------------------------------------------');
        console.log('Email:    ', email);
        console.log('Password: ', password);
        console.log('TenantID: ', tenantId);
        console.log('------------------------------------------------------');
        console.log('JWT TOKEN (Add this to localStorage as "auth_token"):');
        console.log(token);
        console.log('======================================================\n');

    } catch (e) {
        console.error('ERROR:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
