import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { KanbanService } from './kanban.service';
import { TenantGuard } from '../../common/guards/tenant.guard';

@Controller('kanban')
@UseGuards(TenantGuard)
export class KanbanController {
    constructor(private readonly kanbanService: KanbanService) { }

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
}
