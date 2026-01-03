import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
    private readonly logger = new Logger('AUDIT_LOG');

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const { method, url, body, user, tenantId } = request;
        const startTime = Date.now();

        return next.handle().pipe(
            tap(() => {
                const duration = Date.now() - startTime;
                const auditLog = {
                    tenantId: tenantId || user?.tenantId || 'SYSTEM',
                    userId: user?.userId || 'GUEST',
                    action: `${method} ${url}`,
                    timestamp: new Date().toISOString(),
                    duration: `${duration}ms`,
                    // En producción, esto se guardaría en una tabla 'AuditLogs' de la DB
                };

                this.logger.log(JSON.stringify(auditLog));
            }),
        );
    }
}
