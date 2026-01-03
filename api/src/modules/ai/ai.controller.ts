import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { AiService } from './ai.service';
import { TenantGuard } from '../../common/guards/tenant.guard';

@Controller('ai')
@UseGuards(TenantGuard)
export class AiController {
    constructor(private readonly aiService: AiService) { }

    @Get('suggestions/:conversationId')
    async getSuggestions(@Req() req: any, @Param('conversationId') conversationId: string) {
        const tenantId = req.tenantId;
        return this.aiService.suggestReplies(tenantId, conversationId);
    }

    @Get('summarize/:conversationId')
    async getSummary(@Req() req: any, @Param('conversationId') conversationId: string) {
        // Implementación asíncrona de resumen
        return this.aiService.summarizeConversation(conversationId);
    }
}
