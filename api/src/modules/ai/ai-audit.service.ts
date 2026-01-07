import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';

export interface AiAuditEvent {
    tenantId: string;
    userId: string;
    action: string;
    model: string;
    tokens?: number;
    latency: number;
    conversationId?: string;
    status: 'success' | 'error';
    error?: string;
}

@Injectable()
export class AiAuditService {
    private readonly logger = new Logger(AiAuditService.name);

    constructor(private prisma: PrismaService) { }

    @OnEvent('ai.interaction')
    async handleAiInteraction(event: AiAuditEvent) {
        const userId = event.userId || 'SYSTEM';
        const tenantId = event.tenantId || 'GLOBAL';

        this.logger.log(`[Audit] Action: ${event.action} | User: ${userId} | Tenant: ${tenantId} | Status: ${event.status} | Latency: ${event.latency}ms`);

        // In a real production system, we would persist this to a dedicated AiAudit table
        // For now, we log it to the console/logger as a structured event.
        // If the schema had an AuditLog model, we would do:
        /*
        await this.prisma.auditLog.create({
            data: {
                tenantId: event.tenantId,
                userId: event.userId,
                action: `AI_${event.action}`,
                metadata: JSON.stringify(event)
            }
        });
        */
    }
}
