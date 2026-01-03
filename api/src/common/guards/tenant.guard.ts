import { CanActivate, ExecutionContext, Injectable, BadRequestException } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class TenantGuard implements CanActivate {
    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
        const request = context.switchToHttp().getRequest();
        const tenantId = request.headers['x-tenant-id'];

        if (!tenantId) {
            throw new BadRequestException('X-Tenant-ID header is missing');
        }

        // En una implementación real, aquí validaríamos que el tenantId existe en la DB
        // y que el usuario autenticado tiene acceso a él.
        request['tenantId'] = tenantId;

        return true;
    }
}
