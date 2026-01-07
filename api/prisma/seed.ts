import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // 1. Create Default Tenant
    const tenantId = 'edd1ac37-5ff9-4e46-bc7f-fff3c414d718';
    const tenant = await prisma.tenant.upsert({
        where: { id: tenantId },
        update: {},
        create: {
            id: tenantId,
            name: 'PitayaFlow Default',
            slug: 'default',
        },
    });

    console.log(`- Tenant created: ${tenant.name}`);

    // 2. Create Default User
    const adminId = 'admin-user-001';
    const hashedPassword = await bcrypt.hash('pitaya123', 10);

    await prisma.user.upsert({
        where: { id: adminId },
        update: {
            email: 'admin@pitayacode.io',
            password: hashedPassword,
        },
        create: {
            id: adminId,
            email: 'admin@pitayacode.io',
            password: hashedPassword,
            name: 'Admin User',
            role: 'SYSTEM_ADMIN',
            tenantId: tenant.id,
        },
    });

    console.log('- User created: admin@pitayacode.io');

    // 3. Create Default Pipeline & Stages
    const pipeline = await prisma.pipeline.upsert({
        where: { id: 'default-pipeline' },
        update: {},
        create: {
            id: 'default-pipeline',
            name: 'Ventas Estándar',
            tenantId: tenant.id,
            stages: {
                create: [
                    { id: 'stage-1', name: 'Nuevo Lead (Meta)', order: 1 },
                    { id: 'stage-2', name: 'En Seguimiento / Info Enviada', order: 2 },
                    { id: 'stage-3', name: 'Calificado / Interesado', order: 3 },
                    { id: 'stage-4', name: 'Esperando Transferencia', order: 4 },
                    { id: 'stage-5', name: 'Pago por Verificar', order: 5 },
                    { id: 'stage-6', name: 'Venta Cerrada / Completado', order: 6 },
                ],
            },
        },
    });

    console.log('- Pipeline and stages created');

    // 4. Create Initial WhatsApp Account (Mock)
    await prisma.whatsAppAccount.upsert({
        where: { wabaId: 'mock-waba-id' },
        update: {},
        create: {
            wabaId: 'mock-waba-id',
            name: 'Account Principal',
            accessToken: 'EAADEG...',
            tenantId: tenant.id,
            phoneNumbers: {
                create: [
                    {
                        phoneNumberId: 'mock-phone-id',
                        displayPhoneNumber: '+1234567890',
                    },
                ],
            },
        },
    });

    console.log('- WhatsApp account mock created');

    // 5. Create a Sample Contact & Conversation
    const contact = await prisma.contact.upsert({
        where: { tenantId_phone: { tenantId: tenant.id, phone: '525512345678' } },
        update: {},
        create: {
            name: 'Juan Pérez',
            phone: '525512345678',
            email: 'juan@example.com',
            avatar: 'https://i.pravatar.cc/150?u=juan',
            tenantId: tenant.id,
        },
    });

    const existingConv = await prisma.conversation.findFirst({
        where: {
            tenantId: tenant.id,
            contactId: contact.id
        }
    });

    if (!existingConv) {
        await prisma.conversation.create({
            data: {
                contactId: contact.id,
                tenantId: tenant.id,
                status: 'OPEN',
                messages: {
                    create: [
                        {
                            senderType: 'CONTACT',
                            content: 'Hola, me interesa información sobre sus servicios.',
                            type: 'TEXT',
                            createdAt: new Date(),
                        },
                        {
                            senderType: 'AGENT',
                            senderId: adminId,
                            content: '¡Hola Juan! Claro, con gusto te ayudamos. ¿Qué tipo de servicios buscas?',
                            type: 'TEXT',
                            createdAt: new Date(),
                        },
                    ],
                },
            },
        });
    }

    console.log('- Sample contact and conversation created');
    console.log('Seeding finished successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
