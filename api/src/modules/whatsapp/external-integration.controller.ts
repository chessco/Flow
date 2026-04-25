import { Controller, Post, Body, Headers, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WhatsappService } from './whatsapp.service';

@Controller('whatsapp/external')
export class ExternalIntegrationController {
    private readonly logger = new Logger(ExternalIntegrationController.name);

    constructor(
        private readonly whatsappService: WhatsappService,
        private readonly configService: ConfigService,
    ) { }

    @Post('approval')
    async triggerApproval(
        @Headers('x-internal-key') apiKey: string,
        @Body() body: {
            phone: string;
            folio: string;
            amount: string;
            item: string;
            requestor: string;
            link: string;
        }
    ) {
        const secret = this.configService.get<string>('INTERNAL_API_KEY');

        if (!apiKey || apiKey !== secret) {
            this.logger.warn(`Unauthorized external access attempt from: ${apiKey}`);
            throw new UnauthorizedException('Invalid API Key');
        }

        this.logger.log(`Triggering external approval for Folio: ${body.folio} to ${body.phone}`);

        // 1. Format the message
        const message = `🔔 *NUEVA SOLICITUD DE COMPRA*\n\n` +
            `Representa una nueva solicitud de aprobación en *Ohlala! ERP*.\n\n` +
            `*FOLIO:* ${body.folio}\n` +
            `*INVERSIÓN:* ${body.amount}\n` +
            `*ÍTEM:* ${body.item}\n` +
            `*SOLICITANTE:* ${body.requestor}\n\n` +
            `👉 *REVISAR AQUÍ:* ${body.link}\n\n` +
            `_Nota: Se requiere iniciar sesión en el ERP para procesar._`;

        // 2. Identify the tenant
        // Since we are in a dev setup, we'll use the first tenant available or a default
        // In a real multi-tenant setup, PHP should also send the tenantId.
        // For now, let's fetch the first tenantId.
        const tenant = await (this.whatsappService as any).prisma.tenant.findFirst();
        const tenantId = tenant?.id;

        if (!tenantId) {
            throw new Error('No tenant found in Flow system');
        }

        // 3. Send the message
        // We use 'system' as the userId since this is an automated trigger
        return this.whatsappService.sendMessage(tenantId, 'system', {
            to: body.phone,
            content: message
        });
    }
}
