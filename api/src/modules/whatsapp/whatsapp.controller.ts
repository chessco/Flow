import { Controller, Post, Get, Body, Query, Param, UseGuards, Req } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { SendMessageDto } from './dto/send-message.dto';
import { TenantGuard } from '../../common/guards/tenant.guard';

@Controller('whatsapp')
export class WhatsappController {
    constructor(private readonly whatsappService: WhatsappService) { }

    @Post('send')
    @UseGuards(TenantGuard)
    async sendMessage(@Req() req: any, @Body() sendMessageDto: SendMessageDto) {
        const tenantId = req.tenantId;
        const userId = req.user?.id || 'system';
        return this.whatsappService.sendMessage(tenantId, userId, sendMessageDto);
    }

    @Get('conversations')
    @UseGuards(TenantGuard)
    async getConversations(@Req() req: any) {
        return this.whatsappService.getConversations(req.tenantId);
    }

    @Get('history/:id')
    @UseGuards(TenantGuard)
    async getHistory(@Req() req: any, @Param('id') id: string) {
        // Note: NestJS allows getting id from @Param('id') but the api.ts uses it differently?
        // Let's use @Param if it's in the path
        return this.whatsappService.getMessageHistory(id, req.tenantId);
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
        // Los webhooks no llevan TenantGuard porque vienen de Meta
        return this.whatsappService.handleWebhook(payload);
    }
}
