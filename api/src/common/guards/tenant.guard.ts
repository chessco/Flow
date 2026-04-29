import { CanActivate, ExecutionContext, Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../modules/prisma/prisma.service';

@Injectable()
export class TenantGuard implements CanActivate {
    constructor(private prisma: PrismaService) {}

    async canActivate(
        context: ExecutionContext,
    ): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        let tenantId = request.headers['x-tenant-id'] || request.query.tenantId;
        const user = request.user;

        // Superadmin override
        if (request.query.tenantId && (user?.email === 'system@pitayacode.io' || user?.email === 'admin@pitayacode.io')) {
            tenantId = request.query.tenantId;
        }

        if (!tenantId) {
            throw new BadRequestException('X-Tenant-ID header is missing');
        }

        // If tenantId is a slug (doesn't look like a UUID), resolve it
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(tenantId);
        
        if (!isUuid) {
            const tenant = await this.prisma.tenant.findUnique({
                where: { slug: tenantId }
            });
            if (tenant) {
                tenantId = tenant.id;
            } else {
                throw new BadRequestException(`Tenant with slug '${tenantId}' not found`);
            }
        }

        request['tenantId'] = tenantId;
        return true;
    }
}
