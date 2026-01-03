import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KanbanService {
    constructor(private prisma: PrismaService) { }

    async getPipeline(tenantId: string) {
        return this.prisma.pipeline.findFirst({
            where: { tenantId },
            include: {
                stages: {
                    orderBy: { order: 'asc' },
                    include: {
                        cards: {
                            include: { contact: true }
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
}
