import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KanbanService {
    private readonly logger = new Logger(KanbanService.name);
    constructor(private prisma: PrismaService) { }

    async getPipeline(tenantId: string) {
        let pipeline = await this.prisma.pipeline.findFirst({
            where: { tenantId },
            include: {
                stages: {
                    orderBy: { order: 'asc' },
                    include: {
                        cards: {
                            include: { contact: true, lead: true }
                        }
                    }
                }
            }
        });

        if (!pipeline) {
            // Validate tenant existence before creating default
            const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
            if (!tenant) {
                this.logger.error(`Attempted to get/create pipeline for non-existent tenant: ${tenantId}`);
                throw new NotFoundException(`Tenant with ID ${tenantId} not found`);
            }

            this.logger.log(`No pipeline found for tenant ${tenantId}, creating default.`);
            pipeline = await this.createDefaultPipeline(tenantId);
        }

        return pipeline;
    }

    private async createDefaultPipeline(tenantId: string) {
        return this.prisma.pipeline.create({
            data: {
                name: 'Flow Board',
                tenantId,
                stages: {
                    create: [
                        { name: 'Nuevo Lead', order: 1 },
                        { name: 'En Seguimiento', order: 2 },
                        { name: 'Calificado', order: 3 },
                        { name: 'Esperando Transferencia', order: 4 },
                        { name: 'Venta Cerrada / Completado', order: 5 },
                    ],
                },
            },
            include: {
                stages: {
                    orderBy: { order: 'asc' },
                    include: {
                        cards: {
                            include: { contact: true, lead: true }
                        }
                    }
                }
            }
        });
    }

    async moveCard(tenantId: string, cardId: string, targetStageId: string) {
        const card = await this.prisma.card.findFirst({
            where: { id: cardId, tenantId }
        });

        if (!card) throw new NotFoundException('Card not found');

        return this.prisma.card.update({
            where: { id: cardId },
            data: { stageId: targetStageId }
        });
    }

    async createCard(tenantId: string, data: { title: string, contactId: string, stageId: string, value: number }) {
        return this.prisma.card.create({
            data: {
                ...data,
                tenantId
            }
        });
    }

    async updateCard(tenantId: string, cardId: string, data: { title?: string, value?: number }) {
        const card = await this.prisma.card.findFirst({
            where: { id: cardId, tenantId }
        });

        if (!card) throw new NotFoundException('Card not found');

        return this.prisma.card.update({
            where: { id: cardId },
            data
        });
    }

    async approvePayment(tenantId: string, alertId: string) {
        const alert = await this.prisma.handoverAlert.findUnique({
            where: { id: alertId, tenantId },
            include: { conversation: true }
        });

        if (!alert) throw new NotFoundException('Alert not found');

        // 1. Resolve alert
        await this.prisma.handoverAlert.update({
            where: { id: alertId },
            data: { status: 'RESOLVED' }
        });

        // 2. Find target stage "Venta Cerrada / Completado"
        const targetStage = await this.prisma.stage.findFirst({
            where: {
                pipeline: { tenantId },
                name: 'Venta Cerrada / Completado'
            }
        });

        if (!targetStage) return { success: true, message: 'Alert resolved but target stage not found' };

        // 3. Find card
        const card = await this.prisma.card.findFirst({
            where: {
                tenantId,
                OR: [
                    { contactId: alert.conversation.contactId || undefined },
                    { leadId: alert.conversation.leadId || undefined }
                ].filter(cond => Object.values(cond)[0] !== undefined)
            },
            orderBy: { createdAt: 'desc' }
        });

        if (card) {
            await this.prisma.card.update({
                where: { id: card.id },
                data: { stageId: targetStage.id }
            });
        }

        return { success: true, conversationId: alert.conversationId };
    }

    async deleteCard(tenantId: string, cardId: string) {
        this.logger.log(`Deleting card ${cardId} for tenant ${tenantId}`);
        return this.prisma.card.delete({
            where: { id: cardId, tenantId }
        });
    }
}
