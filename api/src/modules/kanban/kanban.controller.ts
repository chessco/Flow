import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { KanbanService } from './kanban.service';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Controller('kanban')
@UseGuards(TenantGuard)
export class KanbanController {
    constructor(
        private readonly kanbanService: KanbanService,
        private readonly whatsappService: WhatsappService
    ) { }

    @Get()
    async getBoard(@Request() req: any) {
        return this.kanbanService.getPipeline(req.tenantId);
    }

    @Post('move')
    async moveCard(
        @Request() req: any,
        @Body() body: { cardId: string, stageId: string }
    ) {
        return this.kanbanService.moveCard(req.tenantId, body.cardId, body.stageId);
    }

    @Post('card')
    async createCard(
        @Request() req: any,
        @Body() body: { title: string, contactId?: string, leadId?: string, stageId: string, value: number }
    ) {
        return this.kanbanService.createCard(req.tenantId, body as any);
    }

    @Patch('card/:id')
    async updateCard(
        @Request() req: any,
        @Param('id') cardId: string,
        @Body() body: { title?: string, value?: number }
    ) {
        return this.kanbanService.updateCard(req.tenantId, cardId, body);
    }

    @Post('approve-payment')
    async approvePayment(
        @Request() req: any,
        @Body() body: { alertId: string }
    ) {
        const result = await this.kanbanService.approvePayment(req.tenantId, body.alertId);
        if (result.success && result.conversationId) {
            await this.whatsappService.sendDigitalPackage(req.tenantId, result.conversationId);
        }
        return result;
    }

    @Delete('card/:id')
    async deleteCard(
        @Request() req: any,
        @Param('id') cardId: string
    ) {
        if (req.user.role !== 'ADMIN' && req.user.role !== 'SYSTEM_ADMIN') {
            throw new Error('Forbidden: Only admins can delete cards');
        }
        return this.kanbanService.deleteCard(req.tenantId, cardId);
    }
}
