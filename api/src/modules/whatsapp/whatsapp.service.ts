import { Injectable, Logger, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { SendMessageDto, MessageType } from './dto/send-message.dto';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class WhatsappService {
    private readonly logger = new Logger(WhatsappService.name);
    private readonly apiVersion = 'v20.0';
    private readonly algorithm = 'aes-256-ctr';
    private secretKey: Buffer;

    constructor(
        private prisma: PrismaService,
        private httpService: HttpService,
        private configService: ConfigService,
        private aiService: AiService,
        private eventEmitter: EventEmitter2
    ) {
        const rawKey = this.configService.get<string>('ENCRYPTION_KEY') || 'pitaya_default_encryption_key_32';
        this.secretKey = crypto.createHash('sha256').update(rawKey).digest();
    }

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
            accessToken = this.decrypt(whatsappAccount.accessToken);
            if (whatsappAccount.phoneNumbers?.[0]) {
                phoneNumberId = whatsappAccount.phoneNumbers[0].phoneNumberId;
            }
        } else {
            this.logger.warn(`No WhatsApp account found in DB for tenant ${tenantId}. Falling back to ENV variables.`);
        }

        // Fallback to ENV if not found in DB
        if (!accessToken) {
            accessToken = this.configService.get('WHATSAPP_ACCESS_TOKEN');
        }
        if (!phoneNumberId) {
            phoneNumberId = this.configService.get('WHATSAPP_PHONE_NUMBER_ID');
        }

        if (!accessToken || !phoneNumberId) {
            throw new InternalServerErrorException('WhatsApp configuration missing for this tenant');
        }

        accessToken = accessToken.replace(/\s/g, '');


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

            // 4. Ensure card exists and is in "Contactado" stage
            await this.ensureCardExists(tenantId, conversation.leadId, conversation.contactId, conversation.lead?.name || conversation.contact?.name);
            await this.ensureContactedStage(tenantId, conversation.id);

            return message;
        } catch (error) {
            const errorData = error.response?.data;
            this.logger.error(`Error sending message: ${errorData ? JSON.stringify(errorData) : error.message}`);

            if (errorData?.error) {
                const { code, type, message } = errorData.error;

                // Specific handling for common Meta API errors
                if (code === 10 || type === 'OAuthException') {
                    const detailedMsg = `Meta API Permission Error (Code 10): ${message}. This usually means the Access Token has expired or lacks 'whatsapp_business_messaging' permissions. Please update the token in WhatsApp Settings.`;
                    this.logger.error(detailedMsg);

                    // 1. Find or create conversation to link the alert (if not already found in sendMessage flow)
                    // We need a conversationId to create a HandoverAlert
                    let conversationId: string | undefined;
                    try {
                        const conversation = await this.prisma.conversation.findFirst({
                            where: {
                                tenantId,
                                OR: [
                                    { contact: { phone: dto.to } },
                                    { lead: { phone: dto.to } }
                                ]
                            }
                        });
                        conversationId = conversation?.id;
                    } catch (e) { }

                    if (conversationId) {
                        // 2. Check for existing active permission alerts to avoid duplicates
                        const systemAlertReasonPrefix = 'ERROR SISTEMA: Token de WhatsApp expirado o sin permisos';
                        const existingAlert = await this.prisma.handoverAlert.findFirst({
                            where: {
                                tenantId,
                                status: 'PENDING',
                                reason: { startsWith: systemAlertReasonPrefix }
                            }
                        });

                        if (!existingAlert) {
                            await this.prisma.handoverAlert.create({
                                data: {
                                    conversationId,
                                    tenantId,
                                    reason: `${systemAlertReasonPrefix} (${message})`,
                                    status: 'PENDING'
                                }
                            });
                            this.logger.log(`Created System HandoverAlert for tenant ${tenantId} due to WhatsApp permission error.`);
                        }
                    }

                    throw new InternalServerErrorException(detailedMsg);
                }

                if (message) {
                    throw new InternalServerErrorException(`Meta API Error: ${message}`);
                }
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
                        },
                        include: { contact: true, lead: true }
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
                            },
                            include: { contact: true, lead: true }
                        });

                    }

                    // Ensure Kanban Card Exists (for both new and existing conversations)
                    await this.ensureCardExists(tenantId, conversation.leadId, conversation.contactId, conversation.lead?.name || conversation.contact?.name || from);

                    // Save Message
                    const savedMessage = await this.prisma.message.create({
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

                        // If it was a payment, we might want to inject a special instruction
                        const isPaymentImage = type === 'IMAGE' && await this.aiService.analyzeImageForPayment(content);
                        const aiResponse = await this.aiService.generateAutonomousResponse(
                            tenantId,
                            conversation.id,
                            isPaymentImage ? 'INSTRUCCIÓN: Se ha recibido un comprobante de pago. DEBES agradecer al usuario y SOLICITAR SU CORREO ELECTRÓNICO para enviar el paquete digital.' : undefined
                        );

                        if (aiResponse) {
                            // 1. Handle Stage Transitions
                            if (aiResponse.suggestedStageName) {
                                await this.executeStageTransition(tenantId, conversation.id, aiResponse.suggestedStageName);
                            } else if (isPaymentImage) {
                                // Fallback for payment if AI didn't suggest it explicitly
                                await this.executeStageTransition(tenantId, conversation.id, 'Pago por Verificar');
                            }

                            // 2. Handle Handover
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

                            // 3. Send AI response to WhatsApp if content exists
                            if (aiResponse.content) {
                                await this.sendInternalAiMessage(tenantId, conversation.id, from, aiResponse.content);
                            }
                        }
                    } else {
                        // Not AI managed, but we still want to detect prices/budgets proactively
                        // Trigger analysis if message contains numbers or is an image
                        if (type === 'IMAGE' || (type === 'TEXT' && /[0-9]/.test(content))) {
                            this.logger.log(`Triggering background AI analysis for extraction (Potential price/payment) - Conv ${conversation.id}`);
                            // Fire and forget to avoid lagging the webhook response
                            this.aiService.analyzeContext(conversation.id).catch(err =>
                                this.logger.error(`Background analysis failed: ${err.message}`)
                            );
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

    async getSettings(tenantId: string, user?: any) {
        const account = await this.prisma.whatsAppAccount.findFirst({
            where: { tenantId },
            include: { phoneNumbers: true }
        });

        const isSystemAdmin = user?.email === 'admin@pitayacode.io';
        const maskValue = (val: string) => {
            if (!val) return '';
            if (isSystemAdmin) return val;
            return val.length > 8 ? `${val.substring(0, 4)}****${val.substring(val.length - 4)}` : '****';
        };

        const rawToken = account?.accessToken ? this.decrypt(account.accessToken) : '';

        return {
            accessToken: maskValue(rawToken),
            phoneNumberId: maskValue(account?.phoneNumbers?.[0]?.phoneNumberId || ''),
            wabaId: maskValue(account?.wabaId || ''),
            verifyToken: this.configService.get('WHATSAPP_VERIFY_TOKEN')
        };
    }

    async updateSettings(tenantId: string, dto: any) {
        const startTime = Date.now();
        let account = await this.prisma.whatsAppAccount.findFirst({
            where: { tenantId }
        });

        // Clean inputs to prevent hidden whitespace/newlines
        if (dto.accessToken) dto.accessToken = dto.accessToken.replace(/\s/g, '');
        if (dto.wabaId) dto.wabaId = dto.wabaId.toString().trim();
        if (dto.phoneNumberId) dto.phoneNumberId = dto.phoneNumberId.toString().trim();

        const isMaskedToken = dto.accessToken?.includes('****');

        const encryptedToken = (dto.accessToken && !isMaskedToken) ? this.encrypt(dto.accessToken) : null;

        if (!account) {
            account = await this.prisma.whatsAppAccount.create({
                data: {
                    tenantId,
                    wabaId: dto.wabaId,
                    accessToken: encryptedToken || '',
                }
            });
        } else {
            const updateData: any = { wabaId: dto.wabaId };
            if (encryptedToken) {
                updateData.accessToken = encryptedToken;
            }

            account = await this.prisma.whatsAppAccount.update({
                where: { id: account.id },
                data: updateData
            });
        }

        this.emitAudit({
            tenantId,
            action: 'whatsapp_update_settings',
            latency: Date.now() - startTime,
            status: 'success'
        });

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

        const accessToken = account?.accessToken ? this.decrypt(account.accessToken) : null;
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

    async sendDigitalPackage(tenantId: string, conversationId: string) {
        try {
            const conversation = await this.prisma.conversation.findUnique({
                where: { id: conversationId },
                include: { contact: true, lead: true }
            });

            if (!conversation) return;

            const to = conversation.contact?.phone || conversation.lead?.phone;
            if (!to) return;

            const content = `¡Pago verificado con éxito! 🎉 Aquí tienes tu paquete digital:
- Acceso al Dashboard: https://flow.pitayacode.io/login
- Guía de Configuración (PDF): https://flow.pitayacode.io/downloads/guide.pdf
- Soporte VIP: +123456789 (WhatsApp)

¡Gracias por tu compra!`;

            await this.sendInternalAiMessage(tenantId, conversationId, to, content);
            this.logger.log(`Digital package delivered to ${to} for conversation ${conversationId}`);

            // AUTOMATION: Tag as "Cliente"
            try {
                const personId = conversation.contactId || conversation.leadId;
                const personType = conversation.contactId ? 'contact' : 'lead';

                if (personId) {
                    const currentPerson = personType === 'contact'
                        ? await this.prisma.contact.findUnique({ where: { id: personId } })
                        : await this.prisma.lead.findUnique({ where: { id: personId } });

                    let tags: string[] = [];
                    try {
                        tags = (currentPerson?.tags as string[]) || [];
                    } catch (e) { tags = []; }

                    if (!tags.includes('Cliente')) {
                        tags.push('Cliente');
                        const data = { tags: tags as any };

                        if (personType === 'contact') {
                            await this.prisma.contact.update({ where: { id: personId }, data });
                        } else {
                            await this.prisma.lead.update({ where: { id: personId }, data });
                        }
                        this.logger.log(`Automation: Added "Cliente" tag to ${personType} ${personId}`);
                    }
                }
            } catch (tagError) {
                this.logger.error(`Error in tagging automation: ${tagError.message}`);
            }
        } catch (error) {
            this.logger.error(`Failed to send digital package: ${error.message}`);
        }
    }

    async executeStageTransition(tenantId: string, conversationId: string, targetStageName: string) {
        try {
            const conversation = await this.prisma.conversation.findUnique({
                where: { id: conversationId }
            });

            if (!conversation) return;

            const card = await this.prisma.card.findFirst({
                where: {
                    tenantId,
                    OR: [
                        { contactId: conversation.contactId || undefined },
                        { leadId: conversation.leadId || undefined }
                    ].filter(cond => Object.values(cond)[0] !== undefined)
                },
                orderBy: { createdAt: 'desc' }
            });

            if (!card) return;

            const stage = await this.prisma.stage.findFirst({
                where: {
                    pipeline: { tenantId },
                    name: targetStageName
                }
            });

            if (stage && card.stageId !== stage.id) {
                await this.prisma.card.update({
                    where: { id: card.id },
                    data: { stageId: stage.id }
                });
                this.logger.log(`AI Automated Kanban: Moved card ${card.id} to stage "${targetStageName}"`);

                // Specialized logic for Payment Verification
                if (targetStageName === 'Pago por Verificar') {
                    // Create HandoverAlert
                    await this.prisma.handoverAlert.create({
                        data: {
                            conversationId,
                            tenantId,
                            reason: 'COMPROBANTE RECIBIDO: Pendiente de validación humana',
                            status: 'PENDING'
                        }
                    });

                    // Disable AI management
                    await this.prisma.conversation.update({
                        where: { id: conversationId },
                        data: { aiManaged: false }
                    });
                    this.logger.log(`Created HandoverAlert for payment verification and disabled AI for conversation ${conversationId}`);
                }
            }
        } catch (error) {
            this.logger.error(`Failed to execute stage transition to ${targetStageName}: ${error.message}`);
        }
    }

    /**
     * Ensures that a card exists for the given conversation.
     * If not, it creates a new card in the first stage of the pipeline.
     */
    private async ensureCardExists(tenantId: string, leadId?: string | null, contactId?: string | null, title?: string) {
        if (!leadId && !contactId) return;

        try {
            // Check if card exists
            const existingCard = await this.prisma.card.findFirst({
                where: {
                    tenantId,
                    OR: [
                        { contactId: contactId || undefined },
                        { leadId: leadId || undefined }
                    ].filter(cond => Object.values(cond)[0] !== undefined)
                }
            });

            if (existingCard) return; // Card already exists, no need to create

            // Create new card
            const pipeline = await this.prisma.pipeline.findFirst({
                where: { tenantId },
                orderBy: { createdAt: 'asc' }
            });

            if (pipeline) {
                const newStage = await this.prisma.stage.findFirst({
                    where: { pipelineId: pipeline.id },
                    orderBy: { order: 'asc' }
                });

                if (newStage) {
                    await this.prisma.card.create({
                        data: {
                            title: title || 'New Opportunity',
                            value: 0,
                            leadId: leadId || undefined,
                            contactId: contactId || undefined,
                            stageId: newStage.id,
                            tenantId,
                            priority: 'MEDIUM'
                        }
                    });
                    this.logger.log(`Created Kanban card for ${leadId ? 'lead ' + leadId : 'contact ' + contactId}`);
                }
            }
        } catch (error) {
            this.logger.error(`Failed to ensure card exists: ${error.message}`);
        }
    }

    private async ensureContactedStage(tenantId: string, conversationId: string) {
        try {
            const conversation = await this.prisma.conversation.findUnique({
                where: { id: conversationId }
            });

            if (!conversation) return;

            const card = await this.prisma.card.findFirst({
                where: {
                    tenantId,
                    OR: [
                        { contactId: conversation.contactId || undefined },
                        { leadId: conversation.leadId || undefined }
                    ].filter(cond => Object.values(cond)[0] !== undefined)
                },
                include: { stage: true },
                orderBy: { createdAt: 'desc' }
            });

            if (!card) return;

            // Only move if it's in the first stage "Nuevo Lead (Meta)"
            if (card.stage?.name !== 'Nuevo Lead (Meta)') return;

            const stage = await this.prisma.stage.findFirst({
                where: {
                    pipeline: { tenantId },
                    name: 'En Seguimiento / Info Enviada'
                }
            });

            if (stage && card.stageId !== stage.id) {
                await this.prisma.card.update({
                    where: { id: card.id },
                    data: { stageId: stage.id }
                });
                this.logger.log(`Automated Kanban: Moved card ${card.id} to En Seguimiento / Info Enviada stage`);
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

        const accessToken = this.decrypt(account.accessToken);

        try {
            // 1. Get Meta URL
            const metaInfoUrl = `https://graph.facebook.com/${this.apiVersion}/${mediaId}`;
            const metaInfoResponse = await firstValueFrom(
                this.httpService.get(metaInfoUrl, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                })
            ).catch(err => {
                const errorMsg = err.response?.data?.error?.message || err.message;
                const errorCode = err.response?.data?.error?.code;
                this.logger.error(`Meta Info API Error: ${errorMsg}`);

                // Token expired or invalid
                if (errorCode === 190 || errorCode === 10) {
                    this.createSystemAlert(tenantId || account.tenantId, `ERROR SISTEMA: Token de WhatsApp expirado - las imágenes no cargarán`);
                }

                throw err;
            });

            const downloadUrl = metaInfoResponse.data.url;
            const mimeType = metaInfoResponse.data.mime_type;

            // 2. Fetch the binary and pipe it to response
            const mediaResponse = await firstValueFrom(
                this.httpService.get(downloadUrl, {
                    // Note: Meta download URLs sometimes fail if Authorization header is sent
                    // but according to docs it should be used. We'll try with it first.
                    headers: { Authorization: `Bearer ${accessToken}` },
                    responseType: 'stream'
                })
            ).catch(async (err) => {
                this.logger.warn(`Retrying media download without Authorization header for media ${mediaId}`);
                // Fallback for some Meta CDNs that don't like the header
                return await firstValueFrom(
                    this.httpService.get(downloadUrl, { responseType: 'stream' })
                );
            });

            res.setHeader('Content-Type', mimeType);
            res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24h
            mediaResponse.data.pipe(res);
        } catch (error) {
            const status = error.response?.status || 500;
            this.logger.error(`Error proxying media: ${error.message}`);
            if (!res.headersSent) {
                res.status(status).send('Error fetching media');
            }
        }
    }

    private async createSystemAlert(tenantId: string, reason: string) {
        try {
            // Find an open conversation for this tenant to link the alert (required by schema)
            const conversation = await this.prisma.conversation.findFirst({
                where: { tenantId },
                orderBy: { lastMessageAt: 'desc' }
            });

            if (!conversation) return;

            // Avoid duplicate active alerts
            const existing = await this.prisma.handoverAlert.findFirst({
                where: {
                    tenantId,
                    reason,
                    status: 'PENDING'
                }
            });

            if (!existing) {
                await this.prisma.handoverAlert.create({
                    data: {
                        tenantId,
                        conversationId: conversation.id,
                        reason,
                        status: 'PENDING'
                    }
                });
                this.logger.log(`Created System Alert for tenant ${tenantId}: ${reason}`);
            }
        } catch (e) {
            this.logger.error(`Failed to create system alert: ${e.message}`);
        }
    }

    private encrypt(text: string): string {
        if (!text) return '';
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv);
        const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
        return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
    }

    private decrypt(text: string): string {
        if (!text) return '';
        try {
            const [iv, content] = text.split(':');
            if (!content) return text; // Not encrypted
            const decipher = crypto.createDecipheriv(this.algorithm, this.secretKey, Buffer.from(iv, 'hex'));
            const decrypted = Buffer.concat([decipher.update(Buffer.from(content, 'hex')), decipher.final()]);
            return decrypted.toString();
        } catch (e) {
            return text; // Fallback
        }
    }

    private emitAudit(event: any) {
        this.eventEmitter.emit('ai.interaction', {
            ...event,
            model: 'WHATSAPP_CONFIG',
            timestamp: new Date()
        });
    }
}
