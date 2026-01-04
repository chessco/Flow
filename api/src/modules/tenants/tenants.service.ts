import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenantsService {
    constructor(private prisma: PrismaService) { }

    async createTenant(name: string, slug: string) {
        return this.prisma.tenant.create({
            data: { name, slug }
        });
    }

    async getTenant(id: string) {
        const tenant = await this.prisma.tenant.findUnique({ where: { id } });
        if (!tenant) throw new NotFoundException('Tenant not found');
        return tenant;
    }

    async updateWhatsappAccount(tenantId: string, data: { wabaId: string, accessToken: string, name?: string }) {
        return this.prisma.whatsAppAccount.upsert({
            where: { wabaId: data.wabaId },
            update: {
                accessToken: data.accessToken,
                name: data.name,
                tenantId: tenantId
            },
            create: {
                wabaId: data.wabaId,
                accessToken: data.accessToken,
                name: data.name,
                tenantId: tenantId
            }
        });
    }
}
