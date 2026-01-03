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

    async updateWhatsappConfig(id: string, config: any) {
        return this.prisma.tenant.update({
            where: { id },
            data: { whatsappConfig: config }
        });
    }
}
