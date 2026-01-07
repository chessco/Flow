import { Controller, Post, Get, Body, Query, Param, UseGuards, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { WhatsappService } from './whatsapp.service';
import { SendMessageDto } from './dto/send-message.dto';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('whatsapp')
export class WhatsappController {
    constructor(private readonly whatsappService: WhatsappService) { }

    @Post('send')
    @Post('send')
    @UseGuards(AuthGuard('jwt'), TenantGuard)
    async sendMessage(@Req() req: any, @Body() sendMessageDto: SendMessageDto) {
        const tenantId = req.tenantId;
        const userId = req.user?.id || 'system';
        return this.whatsappService.sendMessage(tenantId, userId, sendMessageDto);
    }

    @Get('conversations')
    @UseGuards(AuthGuard('jwt'), TenantGuard)
    async getConversations(@Req() req: any) {
        console.log(`[WhatsappController] Getting conversations for tenant: ${req.tenantId}`);
        return this.whatsappService.getConversations(req.tenantId);
    }

    @Get('history/:id')
    @UseGuards(AuthGuard('jwt'), TenantGuard)
    async getHistory(@Req() req: any, @Param('id') id: string) {
        // Note: NestJS allows getting id from @Param('id') but the api.ts uses it differently?
        // Let's use @Param if it's in the path
        return this.whatsappService.getMessageHistory(id, req.tenantId);
    }

    @Get('settings')
    @UseGuards(AuthGuard('jwt'), RolesGuard, TenantGuard)
    @Roles('TENANT_ADMIN')
    async getSettings(@Req() req: any) {
        return this.whatsappService.getSettings(req.tenantId, req.user);
    }

    @Post('settings')
    @UseGuards(AuthGuard('jwt'), RolesGuard, TenantGuard)
    @Roles('TENANT_ADMIN')
    async updateSettings(@Body() dto: any, @Req() req: any) {
        return this.whatsappService.updateSettings(req.tenantId, dto);
    }

    @Get('webhook')
    verifyWebhook(
        @Query('hub.mode') mode: string,
        @Query('hub.verify_token') token: string,
        @Query('hub.challenge') challenge: string,
    ) {
        return this.whatsappService.verifyWebhook(mode, token, challenge);
    }

    @Post('webhook')
    async handleWebhook(@Body() payload: any) {
        console.log('[Webhook Debug] Raw Payload:', JSON.stringify(payload, null, 2));
        // Los webhooks no llevan TenantGuard porque vienen de Meta
        return this.whatsappService.handleWebhook(payload);
    }

    @UseGuards(AuthGuard('jwt'), TenantGuard)
    @Post('conversation/:id/status')
    async updateStatus(@Req() req: any, @Param('id') id: string, @Body() body: { status: string }) {
        return this.whatsappService.updateConversationStatus(id, req.tenantId, body.status);
    }

    @Get('media/:mediaId')
    // Note: To allow <img> tags to work without complex blob fetching, 
    // we make this endpoint public for now. In production, use signed URLs or token in query.
    async getMedia(@Req() req: any, @Param('mediaId') mediaId: string, @Res() res: Response) {
        // We still need a tenantId, but since it's dev we can try to find one or pass it in query if needed.
        // For simplicity in single-tenant dev, we'll fetch the first tenant.
        return this.whatsappService.proxyMedia(null, mediaId, res);
    }
}
