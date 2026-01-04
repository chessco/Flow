import { Injectable, Logger, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto, MessageType } from './dto/send-message.dto';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class WhatsappService {
    private readonly logger = new Logger(WhatsappService.name);
    private readonly apiVersion = 'v20.0';

    constructor(
        private prisma: PrismaService,
        private httpService: HttpService,
        private configService: ConfigService,
    ) { }

    /**
     * Verifies the webhook challenge from Meta.
     */
    verifyWebhook(mode: string, token: string, challenge: string) {
        const verifyToken = this.configService.get<string>('WHATSAPP_VERIFY_TOKEN');
        if (mode === 'subscribe' && token === verifyToken) {
            this.logger.log('Webhook verified successfully');
            return challenge;
        }
        throw new ForbiddenException('Invalid verify token');
    }

    /**
     * Sends a WhatsApp message via Meta Graph API and persists it.
     */
    async sendMessage(tenantId: string, userId: string, dto: SendMessageDto) {
        // 1. Fetch credentials from DB
        let accessToken: string | undefined;
        let phoneNumberId: string | undefined;

        const whatsappAccount = await this.prisma.whatsAppAccount.findFirst({
            where: { tenantId },
            include: { phoneNumbers: true },
        });

        if (whatsappAccount && whatsappAccount.phoneNumbers.length > 0) {
            accessToken = whatsappAccount.accessToken;
            phoneNumberId = whatsappAccount.phoneNumbers[0].phoneNumberId;
        } else {
            // Fallback to env-based credentials for transition/dev
            accessToken = this.configService.get<string>('WHATSAPP_ACCESS_TOKEN');
            phoneNumberId = this.configService.get<string>('WHATSAPP_PHONE_NUMBER_ID');
            this.logger.warn(`No WhatsApp account found in DB for tenant ${tenantId}. Falling back to ENV variables.`);
        }

        if (!accessToken || !phoneNumberId) {
            throw new InternalServerErrorException('WhatsApp configuration missing for this tenant');
        }

        const url = `https://graph.facebook.com/${this.apiVersion}/${phoneNumberId}/messages`;

        try {
            const cleanTo = dto.to.replace('+', '');
            this.logger.log(`Sending WhatsApp message to ${cleanTo}`);

            const response = await firstValueFrom(
                this.httpService.post(
                    url,
                    {
                        messaging_product: 'whatsapp',
                        recipient_type: 'individual',
                        to: cleanTo,
                        type: 'text',
                        text: { preview_url: false, body: dto.content },
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        },
                    },
                ),
            );

            const wamid = response.data.messages[0].id;

            // 1. Find or create conversation/contact/lead
            let conversation = await this.prisma.conversation.findFirst({
                where: {
                    tenantId,
                    OR: [
                        { contact: { phone: dto.to } },
                        { lead: { phone: dto.to } }
                    ]
                },
                include: { contact: true, lead: true }
            });

            if (!conversation) {
                // If no contact/lead exists, create a lead by default
                const lead = await this.prisma.lead.upsert({
                    where: { tenantId_phone: { tenantId, phone: dto.to } },
                    update: {},
                    create: {
                        phone: dto.to,
                        tenantId,
                        status: 'NEW'
                    }
                });

                conversation = await this.prisma.conversation.create({
                    data: {
                        leadId: lead.id,
                        tenantId,
                        status: 'OPEN'
                    },
                    include: { contact: true, lead: true }
                });
            }

            // 2. Register message
            const message = await this.prisma.message.create({
                data: {
                    conversationId: conversation.id,
                    content: dto.content,
                    senderType: 'AGENT',
                    senderId: userId,
                    type: 'TEXT',
                    status: 'SENT',
                    providerId: wamid,
                }
            });

            // 3. Update conversation lastMessageAt
            await this.prisma.conversation.update({
                where: { id: conversation.id },
                data: { lastMessageAt: new Date() }
            });

            return message;
        } catch (error) {
            const errorData = error.response?.data;
            this.logger.error(`Error sending message: ${errorData ? JSON.stringify(errorData) : error.message}`);
            if (errorData?.error?.message) {
                throw new InternalServerErrorException(`Meta API Error: ${errorData.error.message}`);
            }
            throw new InternalServerErrorException('Failed to send WhatsApp message through Meta API');
        }
    }

    /**
     * Processes incoming webhooks from WhatsApp.
     */
    async handleWebhook(payload: any) {
        this.logger.log(`Received Webhook Payload: ${JSON.stringify(payload)}`);
        const entry = payload.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;

        if (!value) return;

        // Handle Status Updates (sent, delivered, read, failed)
        if (value.statuses && value.statuses.length > 0) {
            for (const status of value.statuses) {
                await this.prisma.message.updateMany({
                    where: { providerId: status.id },
                    data: { status: status.status.toUpperCase() }
                });
            }
        }

        // Handle Incoming Messages
        if (value.messages && value.messages.length > 0) {
            const tenantId = await this.getTenantIdByPhoneId(value.metadata.phone_number_id);
            if (!tenantId) {
                this.logger.warn(`Received message for unknown phone number ID: ${value.metadata.phone_number_id}`);
                return;
            }

            for (const msg of value.messages) {
                try {
                    const from = msg.from;
                    const contactName = value.contacts?.[0]?.profile?.name;
                    const wamid = msg.id;

                    let content = '';
                    let type = 'TEXT';

                    if (msg.type === 'text') {
                        content = msg.text.body;
                    } else {
                        content = `[${msg.type.toUpperCase()} Media Received]`;
                        type = msg.type.toUpperCase();
                    }

                    // Find/Create Lead and Conversation
                    let conversation = await this.prisma.conversation.findFirst({
                        where: {
                            tenantId,
                            OR: [
                                { contact: { phone: from } },
                                { lead: { phone: from } }
                            ]
                        }
                    });

                    if (!conversation) {
                        const lead = await this.prisma.lead.upsert({
                            where: { tenantId_phone: { tenantId, phone: from } },
                            update: { name: contactName },
                            create: {
                                phone: from,
                                name: contactName,
                                tenantId,
                                status: 'NEW'
                            }
                        });

                        conversation = await this.prisma.conversation.create({
                            data: {
                                leadId: lead.id,
                                tenantId,
                                status: 'OPEN'
                            }
                        });

                        // Auto-create Kanban Card
                        try {
                            const pipeline = await this.prisma.pipeline.findFirst({ where: { tenantId } });
                            if (pipeline) {
                                const newStage = await this.prisma.stage.findFirst({
                                    where: { pipelineId: pipeline.id, order: 0 } // Assuming 0 is 'Nuevo'
                                });
                                if (newStage) {
                                    await this.prisma.card.create({
                                        data: {
                                            title: contactName || from,
                                            value: 0,
                                            leadId: lead.id,
                                            stageId: newStage.id,
                                            tenantId,
                                            priority: 'MEDIUM'
                                        }
                                    });
                                    this.logger.log(`Created Kanban card for lead ${lead.id}`);
                                }
                            }
                        } catch (cardError) {
                            this.logger.error(`Failed to create Kanban card: ${cardError.message}`);
                        }
                    }

                    // Save Message
                    await this.prisma.message.create({
                        data: {
                            conversationId: conversation.id,
                            content: content,
                            senderType: 'CONTACT',
                            type: type,
                            status: 'READ',
                            providerId: wamid,
                        }
                    });

                    // Update Conversation
                    await this.prisma.conversation.update({
                        where: { id: conversation.id },
                        data: { lastMessageAt: new Date() }
                    });
                } catch (msgError) {
                    this.logger.error(`Error processing individual message: ${msgError.message}`);
                }
            }
        }
    }

    /**
     * Fetches all conversations for a tenant.
     */
    async getConversations(tenantId: string) {
        return this.prisma.conversation.findMany({
            where: { tenantId },
            include: {
                contact: true,
                lead: true,
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { lastMessageAt: 'desc' }
        });
    }

    /**
     * Fetches message history for a conversation.
     */
    async getMessageHistory(id: string, tenantId: string) {
        // Try finding conversation by its own ID or by its linked lead/contact ID
        const conversation = await this.prisma.conversation.findFirst({
            where: {
                tenantId,
                OR: [
                    { id: id },
                    { leadId: id },
                    { contactId: id }
                ]
            }
        });

        if (!conversation) {
            throw new ForbiddenException('Conversation not found or access denied');
        }

        return this.prisma.message.findMany({
            where: { conversationId: conversation.id },
            orderBy: { createdAt: 'asc' }
        });
    }

    /**
     * Helper to resolve tenantId from Meta phone_number_id.
     * In a real production environment, this would query the WhatsAppPhoneNumber table.
     * For this setup, we'll try to find any tenant since it's a single-tenant dev setup.
     */
    private async getTenantIdByPhoneId(phoneId: string): Promise<string | null> {
        // Try to find the phone number in our DB first
        const phone = await this.prisma.whatsAppPhoneNumber.findUnique({
            where: { phoneNumberId: phoneId },
            include: { whatsappAccount: true }
        });

        if (phone) return phone.whatsappAccount.tenantId;

        // Fallback: Return first tenant if none found (for dev)
        const firstTenant = await this.prisma.tenant.findFirst();
        return firstTenant?.id || null;
    }
}
