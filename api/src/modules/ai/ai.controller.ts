import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AiService } from './ai.service';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CombinedAuthGuard } from '../../common/guards/combined-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UpdateAiConfigDto } from './dto/update-ai-config.dto';

@Controller('ai')
@UseGuards(CombinedAuthGuard, TenantGuard)
export class AiController {
    constructor(private readonly aiService: AiService) { }

    @Get('status')
    async getStatus() {
        return this.aiService.getRateLimitStatus();
    }

    @Get('suggestions/:conversationId')
    async getSuggestions(@Req() req: any, @Param('conversationId') conversationId: string) {
        const tenantId = req.tenantId;
        return this.aiService.suggestReplies(tenantId, conversationId);
    }

    @Get('summarize/:conversationId')
    async getSummary(@Req() req: any, @Param('conversationId') conversationId: string) {
        return this.aiService.summarizeConversation(conversationId);
    }

    @Get('context/:conversationId')
    async getContext(@Req() req: any, @Param('conversationId') conversationId: string) {
        return this.aiService.analyzeContext(conversationId);
    }

    @Post('refine')
    async refineText(@Body('text') text: string) {
        return this.aiService.refineText(text);
    }

    @Get('config')
    @UseGuards(RolesGuard)
    @Roles('TENANT_ADMIN', 'SYSTEM_ADMIN')
    async getConfig() {
        return this.aiService.getFullConfig();
    }

    @Post('config')
    @UseGuards(RolesGuard)
    @Roles('TENANT_ADMIN', 'SYSTEM_ADMIN')
    async updateConfig(@Body() config: UpdateAiConfigDto) {
        return this.aiService.updateConfig(config);
    }

    @Post('conversation/:id/managed')
    async toggleManaged(@Req() req: any, @Param('id') id: string, @Body('managed') managed: boolean) {
        const tenantId = req.tenantId;
        return this.aiService.toggleAiManaged(tenantId, id, managed);
    }

    @Get('alerts')
    async getAlerts(@Req() req: any) {
        const tenantId = req.tenantId;
        return this.aiService.getHandoverAlerts(tenantId);
    }

    @Get('revenue-analysis')
    async getRevenueAnalysis(@Req() req: any) {
        const tenantId = req.tenantId;
        return this.aiService.generateRevenueAnalysis(tenantId);
    }

    @Post('alerts/:id/resolve')
    async resolveAlert(@Req() req: any, @Param('id') id: string) {
        const tenantId = req.tenantId;
        return this.aiService.resolveHandoverAlert(tenantId, id);
    }

    @Post('generate-tags/:conversationId')
    async generateTags(@Req() req: any, @Param('conversationId') conversationId: string) {
        const tenantId = req.tenantId;
        return this.aiService.generateTags(tenantId, conversationId);
    }

    @Post('debug')
    @UseGuards(RolesGuard)
    @Roles('TENANT_ADMIN', 'SYSTEM_ADMIN')
    async debugAi(@Body() body: { systemPrompt: string; userPrompt: string; model?: string }) {
        return this.aiService.generateDebugResponse(
            body.systemPrompt,
            body.userPrompt,
            body.model
        );
    }
}
