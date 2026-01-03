import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
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
        const userId = req.user?.id || 'system'; // Si no hay auth aún, usamos system
        return this.whatsappService.sendMessage(tenantId, userId, sendMessageDto);
    }

    @Post('webhook')
    async handleWebhook(@Body() payload: any) {
        // Los webhooks no llevan TenantGuard porque vienen de Meta
        return this.whatsappService.handleWebhook(payload);
    }
}
