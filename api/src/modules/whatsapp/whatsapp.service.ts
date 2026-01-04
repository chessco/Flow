import { Injectable, Logger, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
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
        private aiService: AiService,
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
            include: { phoneNumbers: true }
        });

        if (whatsappAccount?.accessToken) {
            accessToken = whatsappAccount.accessToken;
            if (whatsappAccount.phoneNumbers?.[0]) {
                phoneNumberId = whatsappAccount.phoneNumbers[0].phoneNumberId;
            }
        } else {
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

            // 4. Ensure card is in "Contactado" stage
            await this.ensureContactedStage(tenantId, conversation.id);

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
            this.logger.log(`RESOLVED TENANT_ID: ${tenantId} for phoneId: ${value.metadata.phone_number_id}`);
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
                    } else if (msg.type === 'image') {
                        const mediaId = msg.image.id;
                        content = msg.image.caption || `[IMAGE Media Received]`;
                        const mediaUrl = `/whatsapp/media/${mediaId}`; // Internal proxy link
                        type = 'IMAGE';
                        // We will save this mediaUrl in the next step
                        (msg as any).mediaUrl = mediaUrl;
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
                            const pipeline = await this.prisma.pipeline.findFirst({
                                where: { tenantId },
                                orderBy: { createdAt: 'asc' } // Be consistent
                            });
                            if (pipeline) {
                                const newStage = await this.prisma.stage.findFirst({
                                    where: { pipelineId: pipeline.id },
                                    orderBy: { order: 'asc' }
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
                            mediaUrl: (msg as any).mediaUrl || null,
                        }
                    });

                    // Update Conversation
                    const updatedConversation = await this.prisma.conversation.update({
                        where: { id: conversation.id },
                        data: {
                            lastMessageAt: new Date(),
                            status: 'OPEN'
                        }
                    });

                    // AI Autonomous Response Logic
                    if (updatedConversation.aiManaged) {
                        this.logger.log(`Conversation ${conversation.id} is AI managed. Generating response...`);
                        const aiResponse = await this.aiService.generateAutonomousResponse(tenantId, conversation.id);

                        if (aiResponse) {
                            if (aiResponse.handoverRequired) {
                                this.logger.log(`Handover required for conversation ${conversation.id}. Reason: ${aiResponse.handoverReason}`);

                                // Create Alert
                                await this.prisma.handoverAlert.create({
                                    data: {
                                        conversationId: conversation.id,
                                        tenantId,
                                        reason: aiResponse.handoverReason || 'AI requested human intervention',
                                        status: 'PENDING'
                                    }
                                });

                                // Disable AI Autonomous mode
                                await this.prisma.conversation.update({
                                    where: { id: conversation.id },
                                    data: { aiManaged: false }
                                });
                            }

                            // Send AI response to WhatsApp if content exists
                            if (aiResponse.content) {
                                await this.sendInternalAiMessage(tenantId, conversation.id, from, aiResponse.content);
                            }
                        }
                    }
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
        const conversations = await this.prisma.conversation.findMany({
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

        // Deduplicate in memory by contactId or leadId
        // We keep the first occurrence because they are already sorted by lastMessageAt desc
        const seenPeople = new Set<string>();
        const uniqueConversations = conversations.filter(c => {
            const personId = c.contactId || c.leadId;
            if (!personId || seenPeople.has(personId)) return false;
            seenPeople.add(personId);
            return true;
        });

        return uniqueConversations;
    }

    async getSettings(tenantId: string) {
        const account = await this.prisma.whatsAppAccount.findFirst({
            where: { tenantId },
            include: { phoneNumbers: true }
        });

        return {
            accessToken: account?.accessToken || '',
            phoneNumberId: account?.phoneNumbers?.[0]?.phoneNumberId || '',
            wabaId: account?.wabaId || '',
            verifyToken: this.configService.get('WHATSAPP_VERIFY_TOKEN')
        };
    }

    async updateSettings(tenantId: string, dto: any) {
        let account = await this.prisma.whatsAppAccount.findFirst({
            where: { tenantId }
        });

        if (!account) {
            account = await this.prisma.whatsAppAccount.create({
                data: {
                    tenantId,
                    wabaId: dto.wabaId,
                    accessToken: dto.accessToken,
                }
            });
        } else {
            account = await this.prisma.whatsAppAccount.update({
                where: { id: account.id },
                data: {
                    wabaId: dto.wabaId,
                    accessToken: dto.accessToken,
                }
            });
        }

        // Handle phone number
        const phone = await this.prisma.whatsAppPhoneNumber.findFirst({
            where: { whatsappAccountId: account.id }
        });

        if (phone) {
            await this.prisma.whatsAppPhoneNumber.update({
                where: { id: phone.id },
                data: { phoneNumberId: dto.phoneNumberId }
            });
        } else {
            await this.prisma.whatsAppPhoneNumber.create({
                data: {
                    whatsappAccountId: account.id,
                    phoneNumberId: dto.phoneNumberId,
                    displayPhoneNumber: 'Primary'
                }
            });
        }

        return { success: true };
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

        if (phone) {
            this.logger.log(`Found tenantId ${phone.whatsappAccount.tenantId} for phoneId ${phoneId}`);
            return phone.whatsappAccount.tenantId;
        }

        // Fallback: Return first tenant if none found (for dev)
        const firstTenant = await this.prisma.tenant.findFirst();
        this.logger.log(`Fallback: First tenantId found: ${firstTenant?.id}`);
        return firstTenant?.id || null;
    }

    /**
     * Internal helper to send AI responses and register them.
     */
    private async sendInternalAiMessage(tenantId: string, conversationId: string, to: string, content: string) {
        // Fetch credentials (similar to sendMessage but internal)
        const account = await this.prisma.whatsAppAccount.findFirst({
            where: { tenantId },
            include: { phoneNumbers: true }
        });

        const accessToken = account?.accessToken;
        const phoneNumberId = account?.phoneNumbers?.[0]?.phoneNumberId;

        if (!accessToken || !phoneNumberId) {
            this.logger.error(`Cannot send AI response: WhatsApp credentials missing for tenant ${tenantId}`);
            return;
        }

        const url = `https://graph.facebook.com/${this.apiVersion}/${phoneNumberId}/messages`;

        try {
            const cleanTo = to.replace('+', '');
            const response = await firstValueFrom(
                this.httpService.post(
                    url,
                    {
                        messaging_product: 'whatsapp',
                        recipient_type: 'individual',
                        to: cleanTo,
                        type: 'text',
                        text: { preview_url: false, body: content },
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

            // Register AI response message
            await this.prisma.message.create({
                data: {
                    conversationId,
                    content,
                    senderType: 'AI',
                    type: 'TEXT',
                    status: 'SENT',
                    providerId: wamid,
                    isAI: true
                }
            });

            this.logger.log(`Sent AI response for conversation ${conversationId}`);

            // Ensure card is in "Contactado" stage
            await this.ensureContactedStage(tenantId, conversationId);
        } catch (error) {
            this.logger.error(`Error sending AI response: ${error.message}`);
        }
    }

    async updateConversationStatus(id: string, tenantId: string, status: string) {
        return this.prisma.conversation.updateMany({
            where: {
                id,
                tenantId
            },
            data: { status }
        });
    }

    private async ensureContactedStage(tenantId: string, conversationId: string) {
        try {
            const conversation = await this.prisma.conversation.findUnique({
                where: { id: conversationId }
            });

            if (!conversation) return;

            // Find the card linked to this contact or lead
            const card = await this.prisma.card.findFirst({
                where: {
                    tenantId,
                    OR: [
                        { contactId: conversation.contactId || undefined },
                        { leadId: conversation.leadId || undefined }
                    ].filter(cond => Object.values(cond)[0] !== undefined)
                },
                orderBy: { createdAt: 'desc' } // Pick most recent card
            });

            if (!card) return;

            // Find the "En Seguimiento" stage in any of the tenant's pipelines
            const stage = await this.prisma.stage.findFirst({
                where: {
                    pipeline: { tenantId },
                    name: 'En Seguimiento'
                }
            });

            if (stage && card.stageId !== stage.id) {
                await this.prisma.card.update({
                    where: { id: card.id },
                    data: { stageId: stage.id }
                });
                this.logger.log(`Automated Kanban: Moved card ${card.id} to En Seguimiento stage`);
            }
        } catch (error) {
            this.logger.error(`Failed to ensure contacted stage: ${error.message}`);
        }
    }

    async proxyMedia(tenantId: string | null, mediaId: string, res: any) {
        const account = await this.prisma.whatsAppAccount.findFirst({
            where: tenantId ? { tenantId } : {}
        });

        if (!account?.accessToken) {
            throw new ForbiddenException('No WhatsApp configuration found');
        }

        try {
            // 1. Get Meta URL
            const metaInfoUrl = `https://graph.facebook.com/${this.apiVersion}/${mediaId}`;
            const metaInfoResponse = await firstValueFrom(
                this.httpService.get(metaInfoUrl, {
                    headers: { Authorization: `Bearer ${account.accessToken}` }
                })
            ).catch(err => {
                this.logger.error(`Meta Info API Error: ${err.message}`);
                throw err;
            });

            const downloadUrl = metaInfoResponse.data.url;
            const mimeType = metaInfoResponse.data.mime_type;

            // 2. Fetch the binary and pipe it to response
            const mediaResponse = await firstValueFrom(
                this.httpService.get(downloadUrl, {
                    headers: { Authorization: `Bearer ${account.accessToken}` },
                    responseType: 'stream'
                })
            );

            res.setHeader('Content-Type', mimeType);
            mediaResponse.data.pipe(res);
        } catch (error) {
            this.logger.error(`Error proxying media: ${error.message}`);
            if (!res.headersSent) {
                res.status(500).send('Error fetching media');
            }
        }
    }
}
