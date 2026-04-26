import { Controller, Post, Body, Headers, UnauthorizedException, ForbiddenException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WhatsappService } from './whatsapp.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('whatsapp/external')
export class ExternalIntegrationController {
    private readonly logger = new Logger(ExternalIntegrationController.name);

    constructor(
        private readonly whatsappService: WhatsappService,
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService,
    ) { }

    @Post('approval')
    async triggerApproval(
        @Headers('x-internal-key') apiKey: string,
        @Body() body: {
            external_id?: number;
            phone: string;
            folio: string;
            amount: string;
            item: string;
            requestor: string;
            link: string;
            tenant_slug?: string;
        }
    ) {
        // ... (validations remain same)
        const secret = this.configService.get<string>('INTERNAL_API_KEY');

        if (!apiKey || apiKey !== secret) {
            this.logger.warn(`Unauthorized external access attempt with key: ${apiKey}`);
            throw new UnauthorizedException('Invalid API Key');
        }

        // 2. Normalize phone (ensure country code and handle Mexico 521)
        let normalizedPhone = body.phone.replace(/\D/g, '');
        
        // Remove 521 prefix if it exists (common in Mexico contacts but bad for Meta API)
        if (normalizedPhone.startsWith('521') && normalizedPhone.length === 13) {
            normalizedPhone = '52' + normalizedPhone.substring(3);
        } else if (!normalizedPhone.startsWith('52') && normalizedPhone.length === 10) {
            normalizedPhone = '52' + normalizedPhone; 
        }

        this.logger.log(`Triggering external approval for Folio: ${body.folio} (Ext ID: ${body.external_id}) for Tenant: ${body.tenant_slug}`);

        // 3. Resolve Tenant
        let tenant;
        if (body.tenant_slug) {
            tenant = await this.prisma.tenant.findUnique({
                where: { slug: body.tenant_slug }
            });
        }

        if (!tenant) {
            this.logger.warn(`Tenant slug '${body.tenant_slug}' not found, falling back to first tenant`);
            tenant = await this.prisma.tenant.findFirst();
        }

        if (!tenant) {
            throw new Error('No tenant found in Flow system');
        }

        // 4. Check skills
        const skills = (tenant.skills as any) || {};
        if (!skills.purchase_approval) {
            this.logger.warn(`Skill purchase_approval disabled for tenant: ${tenant.slug}`);
            throw new ForbiddenException('Purchase approval skill is disabled for this tenant');
        }

        // 5. Create Purchase Request (Internal ID)
        const request = await this.prisma.purchaseRequest.create({
            data: {
                externalId: body.external_id,
                folio: body.folio,
                amount: body.amount,
                item: body.item,
                requestor: body.requestor,
                phone: normalizedPhone,
                tenantId: tenant.id,
                status: 'PENDING'
            }
        });

        // 6. Send Rich Template Message (with Buttons)
        try {
            await this.whatsappService.sendTemplate(tenant.id, 'system', {
                to: normalizedPhone,
                templateName: 'aprobacion_compra', // Confirmed from Meta portal
                components: [
                    {
                        type: 'body',
                        parameters: [
                            { type: 'text', text: body.requestor },          // {{1}} Hola [Nombre]
                            { type: 'text', text: body.folio },              // {{2}} Solicitud: [Folio]
                            { type: 'text', text: body.item },               // {{3}} Proveedor: [Item/Concepto]
                            { type: 'text', text: body.amount },             // {{4}} Monto: [Monto]
                            { type: 'text', text: request.id.toString() }    // {{5}} Ref: [ID]
                        ]
                    }
                ]
            });
            this.logger.log(`Rich template 'purchase_approval' sent successfully to ${normalizedPhone}`);
        } catch (error) {
            this.logger.warn(`Failed to send rich template, falling back to plain text: ${error.message}`);
            
            // Fallback: Format and Send Plain Text Message
            const message = `Hola ${body.requestor},\n\n` +
                `Tienes una solicitud de compra pendiente:\n\n` +
                `📄 *Solicitud:* ${body.folio}\n` +
                `🏢 *Concepto:* ${body.item}\n` +
                `💰 *Monto:* ${body.amount}\n\n` +
                `Ref: ${request.id}\n\n` +
                `Selecciona una opción:\n` +
                `✅ *APROBAR*\n` +
                `❌ *RECHAZAR*`;

            await this.whatsappService.sendMessage(tenant.id, 'system', {
                to: normalizedPhone,
                content: message
            });
        }

        this.logger.log({
            tenant: tenant.slug,
            phone: normalizedPhone,
            folio: body.folio,
            request_id: request.id,
            action: 'OUTBOUND_SENT',
            result: 'success'
        });

        return {
            success: true,
            internal_id: request.id,
            status: 'PENDING'
        };
    }
}
