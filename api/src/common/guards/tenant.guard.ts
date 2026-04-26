import { CanActivate, ExecutionContext, Injectable, BadRequestException } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class TenantGuard implements CanActivate {
    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
        const request = context.switchToHttp().getRequest();
        let tenantId = request.headers['x-tenant-id'];
        const queryTenantId = request.query.tenantId;
        const user = request.user;

        // Superadmin override
        if (queryTenantId && (user?.email === 'system@pitayacode.io' || user?.email === 'admin@pitayacode.io')) {
            tenantId = queryTenantId;
        }

        if (!tenantId) {
            throw new BadRequestException('X-Tenant-ID header is missing');
        }

        request['tenantId'] = tenantId;

        return true;
    }
}
