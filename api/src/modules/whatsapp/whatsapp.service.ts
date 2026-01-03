import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto, MessageType } from './dto/send-message.dto';

@Injectable()
export class WhatsappService {
    private readonly logger = new Logger(WhatsappService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Envía un mensaje a través de WhatsApp Cloud API y lo registra en la DB.
     */
    async sendMessage(tenantId: string, userId: string, dto: SendMessageDto) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
        });

        if (!tenant || !tenant.whatsappConfig) {
            throw new InternalServerErrorException('WhatsApp configuration missing for this tenant');
        }

        // Nota: En producción, usaríamos un cliente HTTP (como Axios/HttpService) 
        // para llamar a graph.facebook.com/v18.0/${phone_number_id}/messages

        try {
            this.logger.log(`Enviando mensaje WhatsApp a ${dto.to} para tenant ${tenantId}`);

            // 1. Buscar o crear la conversación
            let conversation = await this.prisma.conversation.findFirst({
                where: {
                    tenantId,
                    contact: { phone: dto.to }
                }
            });

            if (!conversation) {
                const contact = await this.prisma.contact.upsert({
                    where: { tenantId_phone: { tenantId, phone: dto.to } },
                    update: {},
                    create: {
                        name: dto.to, // Nombre temporal hasta recibirlo de la API
                        phone: dto.to,
                        tenantId,
                    }
                });

                conversation = await this.prisma.conversation.create({
                    data: {
                        contactId: contact.id,
                        tenantId,
                        status: 'OPEN'
                    }
                });
            }

            // 2. Registrar el mensaje en la base de datos
            const message = await this.prisma.message.create({
                data: {
                    conversationId: conversation.id,
                    content: dto.content,
                    senderType: 'AGENT',
                    senderId: userId,
                    type: dto.type,
                    status: 'SENT',
                }
            });

            // 3. Actualizar fecha de último mensaje en la conversación
            await this.prisma.conversation.update({
                where: { id: conversation.id },
                data: { lastMessageAt: new Date() }
            });

            return message;
        } catch (error) {
            this.logger.error(`Error enviando mensaje: ${error.message}`);
            throw new InternalServerErrorException('Failed to send WhatsApp message');
        }
    }

    /**
     * Procesa webhooks entrantes de WhatsApp.
     * Este método debe ser extremadamente rápido (async).
     */
    async handleWebhook(payload: any) {
        this.logger.log('Recibiendo webhook de WhatsApp (MODO SIMULADO)');

        // Simulación: si recibimos un mensaje, enviamos una respuesta automática en 2s
        const { from, text } = payload;
        if (from && text) {
            this.logger.log(`[SIMULADOR] Simulación de entrada de mensaje desde ${from}`);
            // Aquí se ejecutaría la lógica asíncrona de AI y triggers
        }
    }
}
