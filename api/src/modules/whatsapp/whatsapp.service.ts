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

        accessToken = accessToken.replace(/\s/g, '').replace(/^"|"$/g, '');
        phoneNumberId = phoneNumberId.toString().replace(/\s/g, '').replace(/^"|"$/g, '');

        const url = `https://graph.facebook.com/${this.apiVersion}/${phoneNumberId}/messages`;

        try {
            let cleanTo = dto.to.replace('+', '');
            // Normalize Mexico numbers (remove the '1')
            if (cleanTo.startsWith('521') && cleanTo.length === 13) {
                cleanTo = '52' + cleanTo.substring(3);
            }
            this.logger.log(`Sending WhatsApp message to ${cleanTo}`);

            const response = await firstValueFrom(
                this.httpService.post(
                    url,
                    {
                        messaging_product: 'whatsapp',
                        recipient_type: 'individual',
                        to: cleanTo,
                        type: (dto as any).imageUrl ? 'image' : 'text',
                        [(dto as any).imageUrl ? 'image' : 'text']: (dto as any).imageUrl 
                            ? { link: (dto as any).imageUrl, caption: dto.content }
                            : { preview_url: false, body: dto.content },
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
                        { contact: { phone: cleanTo } },
                        { lead: { phone: cleanTo } }
                    ]
                },
                include: { contact: true, lead: true }
            });

            if (!conversation) {
                // If no contact/lead exists, create a lead by default
                const lead = await this.prisma.lead.upsert({
                    where: { tenantId_phone: { tenantId, phone: cleanTo } },
                    update: {},
                    create: {
                        phone: cleanTo,
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
                    type: (dto as any).imageUrl ? 'IMAGE' : 'TEXT',
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

    async sendTemplate(tenantId: string, userId: string, dto: { to: string, templateName: string, components: any[] }) {
        let accessToken = '';
        let phoneNumberId = '';

        const whatsappAccount = await this.prisma.whatsAppAccount.findFirst({
            where: { tenantId },
            include: { phoneNumbers: true }
        });

        if (whatsappAccount?.accessToken) {
            accessToken = this.decrypt(whatsappAccount.accessToken);
            if (whatsappAccount.phoneNumbers?.[0]) {
                phoneNumberId = whatsappAccount.phoneNumbers[0].phoneNumberId;
            }
        }

        if (!accessToken) {
            accessToken = this.configService.get('WHATSAPP_ACCESS_TOKEN');
        }
        if (!phoneNumberId) {
            phoneNumberId = this.configService.get('WHATSAPP_PHONE_NUMBER_ID');
        }

        if (!accessToken || !phoneNumberId) {
            throw new InternalServerErrorException('WhatsApp configuration missing for this tenant');
        }

        accessToken = accessToken.replace(/\s/g, '').replace(/^"|"$/g, '');
        phoneNumberId = phoneNumberId.toString().replace(/\s/g, '').replace(/^"|"$/g, '');

        const url = `https://graph.facebook.com/${this.apiVersion}/${phoneNumberId}/messages`;

        try {
            const cleanTo = dto.to.replace('+', '');
            this.logger.log(`Sending WhatsApp Template ${dto.templateName} to ${cleanTo}`);

            const response = await firstValueFrom(
                this.httpService.post(
                    url,
                    {
                        messaging_product: 'whatsapp',
                        to: cleanTo,
                        type: 'template',
                        template: {
                            name: dto.templateName,
                            language: { code: 'es' },
                            components: dto.components
                        },
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

            // Create a readable content preview for the inbox
            let contentPreview = `[Template: ${dto.templateName}]`;
            if (dto.templateName === 'aprobacion_compra') {
                const body = dto.components.find(c => c.type === 'body');
                if (body && body.parameters) {
                    const req = body.parameters[0]?.text || '';
                    const folio = body.parameters[1]?.text || '';
                    const item = body.parameters[2]?.text || '';
                    const amount = body.parameters[3]?.text || '';
                    contentPreview = `📦 APROBACIÓN: ${folio} de ${req}\n🔹 Concepto: ${item}\n💰 Monto: ${amount}`;
                }
            }

            const message = await this.prisma.message.create({
                data: {
                    conversationId: conversation.id,
                    content: contentPreview,
                    senderType: 'AGENT',
                    senderId: userId,
                    type: 'TEXT',
                    status: 'SENT',
                    providerId: wamid,
                }
            });

            await this.prisma.conversation.update({
                where: { id: conversation.id },
                data: { lastMessageAt: new Date() }
            });

            return message;
        } catch (error) {
            const errorData = error.response?.data;
            this.logger.error(`Error sending template: ${errorData ? JSON.stringify(errorData) : error.message}`);
            throw new InternalServerErrorException('Failed to send WhatsApp template');
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
            this.logger.log(`[Webhook] Incoming from phoneId: ${value.metadata.phone_number_id} | resolved tenantId: ${tenantId}`);
            if (!tenantId) {
                this.logger.warn(`Received message for unknown phone number ID: ${value.metadata.phone_number_id}`);
                return;
            }

            const tenant = await this.prisma.tenant.findUnique({
                where: { id: tenantId },
                select: { id: true, slug: true, skills: true }
            });

            const skills = (tenant?.skills as any) || {};
            this.logger.log(`[Webhook] Tenant Skills: ${JSON.stringify(skills)}`);

            for (const msg of value.messages) {
                try {
                    let from = msg.from;
                    
                    // Normalize incoming Mexico numbers (remove the '1')
                    if (from.startsWith('521') && from.length === 13) {
                        from = '52' + from.substring(3);
                        msg.from = from; // Update msg object for skills
                    }
                    
                    const contactName = value.contacts?.[0]?.profile?.name;
                    const wamid = msg.id;

                    let content = '';
                    let type = 'TEXT';

                    if (msg.type === 'text') {
                        content = msg.text.body;
                    } else if (msg.type === 'button') {
                        content = msg.button.text;
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

                    // --- SKILL ROUTING: PURCHASE APPROVAL ---
                    if (skills.purchase_approval) {
                        const isApprovalResponse = await this.handlePurchaseApproval(tenant!, msg, content);
                        if (isApprovalResponse) {
                            this.logger.log(`[Skill Router] Purchase approval processed for ${from}. Skipping other logic.`);
                            continue;
                        }
                    }

                    // --- SKILL ROUTING: QUEUE MANAGEMENT ---
                    this.logger.log(`[Skill Router] Checking Queue Skill... msg.from: ${msg.from} | normalized.from: ${from} | queue_management: ${skills.queue_management}`);
                    if (skills.queue_management) {
                        const isQueueHandled = await this.handleQueueSkill(tenant!, msg, content);
                        if (isQueueHandled) {
                            this.logger.log(`[Skill Router] Queue management handled for ${from}. Skipping other logic.`);
                            continue;
                        }
                    }
                    // ----------------------------------------

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
                            update: {}, // Crucial fix: Do not overwrite the user's real name with their WhatsApp nickname on every message!
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
                            lastCustomerMessageAt: new Date(),
                            status: 'OPEN'
                        }
                    });

                    // --- ACUACORE AGENT DELEGATION ---
                    // Forward message to Acuacore to handle AI agents and Inbox
                    try {
                        const acuacoreApiUrl = process.env.ACUACORE_API_URL || 'http://localhost:3014';
                        const internalKey = process.env.INTERNAL_API_KEY || 'pitaya_internal_dev_key';
                        
                        this.logger.log(`Forwarding message from ${from} to Acuacore for AI processing...`);
                        
                        // Fire and forget to avoid lagging the webhook response
                        firstValueFrom(
                            this.httpService.post(
                                `${acuacoreApiUrl}/api/webhooks/flow/incoming`, 
                                {
                                    userId: from,
                                    content: content,
                                    externalId: wamid
                                },
                                {
                                    headers: {
                                        'x-tenant-id': tenantId,
                                        'x-internal-key': internalKey
                                    }
                                }
                            )
                        ).catch(err => {
                            this.logger.error(`Failed to forward message to Acuacore: ${err.message}`);
                        });
                        
                    } catch (forwardErr) {
                        this.logger.error(`Error during Acuacore forwarding: ${forwardErr.message}`);
                    }
                    // ---------------------------------
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
        const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
        const account = await this.prisma.whatsAppAccount.findFirst({
            where: { tenantId },
            include: { phoneNumbers: true }
        });

        const isSystemAdmin = user?.email === 'system@pitayacode.io' || user?.email === 'admin@pitayacode.io';
        const maskValue = (val: string) => {
            if (!val) return '';
            if (isSystemAdmin) return val;
            return val.length > 8 ? `${val.substring(0, 4)}****${val.substring(val.length - 4)}` : '****';
        };

        const rawToken = account?.accessToken ? this.decrypt(account.accessToken) : '';
        
        let allTenants = [];
        if (user?.email === 'system@pitayacode.io') {
            allTenants = await this.prisma.tenant.findMany({
                select: { id: true, name: true, slug: true }
            });
        }

        return {
            tenantId: tenant?.id,
            tenantName: tenant?.name,
            tenantSlug: tenant?.slug,
            skills: tenant?.skills,
            accessToken: maskValue(rawToken),
            phoneNumberId: maskValue(account?.phoneNumbers?.[0]?.phoneNumberId || ''),
            wabaId: maskValue(account?.wabaId || ''),
            verifyToken: this.configService.get('WHATSAPP_VERIFY_TOKEN'),
            allTenants: allTenants.length > 0 ? allTenants : undefined
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

        // Update Tenant Info if provided (Superadmin only or permitted fields)
        if (dto.tenantSlug || dto.skills) {
            await this.prisma.tenant.update({
                where: { id: tenantId },
                data: {
                    slug: dto.tenantSlug,
                    skills: dto.skills
                }
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
        } else if (dto.phoneNumberId) {
            await this.prisma.whatsAppPhoneNumber.create({
                data: {
                    whatsappAccountId: account.id,
                    phoneNumberId: dto.phoneNumberId,
                    displayPhoneNumber: 'Primary'
                }
            });
        }

        // Handle skills and tenant info updates if provided
        if (dto.skills || dto.tenantName) {
            await this.prisma.tenant.update({
                where: { id: tenantId },
                data: {
                    name: dto.tenantName || undefined,
                    skills: dto.skills || undefined
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

        let accessToken = account?.accessToken ? this.decrypt(account.accessToken) : null;
        let phoneNumberId = account?.phoneNumbers?.[0]?.phoneNumberId;

        // Fallback to ENV if not found in DB
        if (!accessToken) {
            accessToken = this.configService.get('WHATSAPP_ACCESS_TOKEN');
        }
        if (!phoneNumberId) {
            phoneNumberId = this.configService.get('WHATSAPP_PHONE_NUMBER_ID');
        }

        if (!accessToken || !phoneNumberId) {
            this.logger.error(`Cannot send AI response: WhatsApp credentials missing for tenant ${tenantId}`);
            return;
        }

        accessToken = accessToken.replace(/\s/g, '').replace(/^"|"$/g, '');
        phoneNumberId = phoneNumberId.toString().replace(/\s/g, '').replace(/^"|"$/g, '');

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
            const errorData = error.response?.data;
            this.logger.error(`Error sending AI response: ${errorData ? JSON.stringify(errorData) : error.message}`);
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

            const content = `Â¡Pago verificado con Ã©xito! ðŸŽ‰ AquÃ­ tienes tu paquete digital:
- Acceso al Dashboard: https://flow.pitayacode.io/login
- GuÃ­a de ConfiguraciÃ³n (PDF): https://flow.pitayacode.io/downloads/guide.pdf
- Soporte VIP: +123456789 (WhatsApp)

Â¡Gracias por tu compra!`;

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
                            reason: 'COMPROBANTE RECIBIDO: Pendiente de validaciÃ³n humana',
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
                    this.createSystemAlert(tenantId || account.tenantId, `ERROR SISTEMA: Token de WhatsApp expirado - las imÃ¡genes no cargarÃ¡n`);
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

    /**
     * Skill Handler: Purchase Approval
     * Processes approval/rejection responses from WhatsApp.
     */
    private async handleQueueSkill(tenant: { id: string, slug: string }, msg: any, content: string): Promise<boolean> {
        const from = msg.from;
        const normalizedContent = content.toLowerCase().trim();

        // 1. Find the conversation or lead to check current state
        let lead: any = null;
        
        // Variants for Mexico numbers
        let altFrom = from;
        if (from.startsWith('521') && from.length === 13) {
            altFrom = '52' + from.substring(3);
        } else if (from.startsWith('52') && from.length === 12) {
            altFrom = '521' + from.substring(2);
        }

        const conversation = await this.prisma.conversation.findFirst({
            where: {
                tenantId: tenant.id,
                OR: [
                    { contact: { phone: from } },
                    { contact: { phone: altFrom } },
                    { lead: { phone: from } },
                    { lead: { phone: altFrom } }
                ]
            },
            include: { lead: true }
        });

        if (conversation && conversation.lead) {
            lead = conversation.lead;
        } else {
            // Fallback: search lead directly by phone (both variants)
            lead = await this.prisma.lead.findFirst({
                where: {
                    tenantId: tenant.id,
                    phone: { in: [from, altFrom] }
                }
            });
        }

        if (!lead) return false;

        const state = (lead.tags as any)?.queue_state || 'IDLE';

        // 2. State Machine Logic
        if (state === 'IDLE') {
            // Trigger: keywords
            const triggerKeywords = ['turno', 'fila', 'vengo a', 'atencion', 'atención', 'quiero comprar', 'quiero reparar', 'recoger', 'dame un turno'];
            const isTrigger = triggerKeywords.some(k => normalizedContent.includes(k));

            if (!isTrigger) return false;

            this.logger.log(`[Skill Router] Queue management triggered for ${from}`);

            let kind: 'SALE' | 'REPAIR' | 'PICKUP' | null = null;
            if (normalizedContent.includes('comprar') || normalizedContent.includes('venta')) kind = 'SALE';
            else if (normalizedContent.includes('reparar') || normalizedContent.includes('servicio')) kind = 'REPAIR';
            else if (normalizedContent.includes('recoger') || normalizedContent.includes('entrega')) kind = 'PICKUP';

            const tags = (lead.tags as any) || {};
            // A name is ONLY valid if the user explicitly provided it previously (ignoring WhatsApp auto-nicknames)
            const hasValidName = tags.real_name_provided === true && lead.name && lead.name.length > 2;

            if (hasValidName && kind) {
                // Have both! Generate ticket immediately.
                await this.generateTicketAndNotify(tenant.id, from, lead, kind, lead.name);
                return true;
            }

            if (hasValidName && !kind) {
                // Have name, ask for kind
                await this.prisma.lead.update({
                    where: { id: lead.id },
                    data: { tags: { ...tags, queue_state: 'AWAITING_KIND', customer_name: lead.name } }
                });
                await this.sendQueueKindMenu(tenant.id, from, lead.name);
                return true;
            }

            // Don't have a reliable real name.
            const nextState = kind ? 'AWAITING_NAME_FOR_TICKET' : 'AWAITING_NAME';
            
            await this.prisma.lead.update({
                where: { id: lead.id },
                data: { tags: { ...tags, queue_state: nextState, pending_kind: kind } }
            });

            // Customize greeting based on intent
            let askMsg = '¡Hola! 👋 Con gusto te ayudo con tu turno. ¿Cuál es tu nombre completo?';
            if (kind === 'PICKUP') askMsg = '¡Hola! 👋 Para poder entregarte, ¿a nombre de quién está la orden?';
            else if (kind === 'SALE' || kind === 'REPAIR') askMsg = '¡Hola! 👋 Con gusto te atiendo. ¿A nombre de quién hacemos el turno?';

            await this.sendMessage(tenant.id, 'system', {
                to: from,
                content: askMsg
            });
            
            return true;
        }

        if (state === 'AWAITING_NAME' || state === 'AWAITING_NAME_FOR_TICKET') {
            const name = content.trim();
            const tags = (lead.tags as any) || {};

            if (state === 'AWAITING_NAME_FOR_TICKET') {
                const kind = tags.pending_kind;
                await this.generateTicketAndNotify(tenant.id, from, lead, kind, name);
                return true;
            }

            // Normal AWAITING_NAME -> AWAITING_KIND
            await this.prisma.lead.update({
                where: { id: lead.id },
                data: { 
                    name,
                    tags: { ...tags, queue_state: 'AWAITING_KIND', customer_name: name, real_name_provided: true } 
                }
            });

            await this.sendQueueKindMenu(tenant.id, from, name);
            return true;
        }

        if (state === 'AWAITING_KIND') {
            const choice = normalizedContent;
            let kind: 'SALE' | 'REPAIR' | 'PICKUP' | null = null;

            if (choice.includes('1') || choice.includes('comprar') || choice.includes('venta')) kind = 'SALE';
            else if (choice.includes('2') || choice.includes('reparar') || choice.includes('servicio')) kind = 'REPAIR';
            else if (choice.includes('3') || choice.includes('recoger') || choice.includes('entrega')) kind = 'PICKUP';

            if (!kind) {
                await this.sendMessage(tenant.id, 'system', {
                    to: from,
                    content: 'Por favor, selecciona una opción válida:\n1. 🛒 Comprar\n2. 🛠️ Reparar\n3. 📦 Recoger'
                });
                return true;
            }

            const customerName = (lead.tags as any)?.customer_name || lead.name || 'Cliente';
            await this.generateTicketAndNotify(tenant.id, from, lead, kind, customerName);
            return true;
        }

        return false;
    }

    private async generateTicketAndNotify(tenantId: string, from: string, lead: any, kind: 'SALE' | 'REPAIR' | 'PICKUP', customerName: string) {
        try {
            const luxuryResult = await this.createLuxuryTicket(tenantId, {
                customerName,
                customerPhone: from,
                kind: kind
            });

            // Link to track position (Production URL)
            const trackingLink = `https://luxuryos.pitayacode.io/q/${luxuryResult.qrToken}`;
            const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(trackingLink)}`;

            await this.sendMessage(tenantId, 'system', {
                to: from,
                content: `¡Listo ${customerName}! ✅\n\nTu turno es el *${luxuryResult.code}*.\n\n📱 Sigue tu lugar en la fila en tiempo real aquí:\n${trackingLink}\n\nTe avisaremos por este medio cuando sea tu turno. ¡Gracias por tu paciencia! 🙏`,
                imageUrl: qrImageUrl
            } as any);

            // Update name and reset state
            const tags = (lead.tags as any) || {};
            delete tags.pending_kind;
            tags.queue_state = 'IDLE';
            tags.real_name_provided = true; // Mark as explicitly provided by the user!

            await this.prisma.lead.update({
                where: { id: lead.id },
                data: { name: customerName, tags }
            });

        } catch (error) {
            this.logger.error(`[Queue Skill] Failed to create Luxury ticket: ${error.message}`);
            await this.sendMessage(tenantId, 'system', {
                to: from,
                content: 'Lo siento, hubo un error al generar tu turno. Por favor, inténtalo de nuevo en unos minutos o acércate al mostrador.'
            });
        }
    }

    private async sendQueueKindMenu(tenantId: string, to: string, name: string) {
        const message = `Gracias ${name}. ¿Qué vienes a hacer hoy?\n\n` +
            `1. 🛒 *Comprar*\n` +
            `2. 🛠️ *Reparar*\n` +
            `3. 📦 *Recoger*`;

        await this.sendMessage(tenantId, 'system', {
            to,
            content: message
        });
    }

    private async createLuxuryTicket(tenantId: string, data: { customerName: string, customerPhone: string, kind: string }) {
        // LuxuryOS API URL (Production URL in Hetzner)
        const luxuryApiUrl = 'https://luxury-api.pitayacode.io/queue/tickets';
        
        // We'll use the fixed tenant ID for LuxuryOS
        const luxuryTenantId = '071ab28f-da33-4bf8-90ed-f8a1af880078'; 

        this.logger.log(`[Queue Skill] Creating Luxury ticket for ${data.customerName} (${data.customerPhone}) - Kind: ${data.kind}`);

        const response = await firstValueFrom(this.httpService.post(luxuryApiUrl, {
            customerName: data.customerName,
            customerPhone: data.customerPhone,
            kind: data.kind
        }, {
            headers: { 
                'x-tenant-id': luxuryTenantId,
                'Content-Type': 'application/json'
            },
            timeout: 5000
        }));

        return response.data;
    }

    private async handlePurchaseApproval(tenant: { id: string, slug: string }, msg: any, content: string): Promise<boolean> {
        const from = msg.from;
        const normalizedFrom = from.replace(/^521/, '52');
        const normalizedContent = content.toLowerCase().trim();

        // 1. Check if it's an approval/rejection keyword or button
        // Meta templates often send exactly the button text
        const isApproved = normalizedContent.includes('aprobar') || normalizedContent === 'ok' || normalizedContent === 'vobo';
        const isRejected = normalizedContent.includes('rechazar') || normalizedContent === 'no';

        if (!isApproved && !isRejected) {
            return false; // Not an approval message
        }

        // 2. Extract Request ID (Ref: 123)
        const refMatch = content.match(/Ref:\s*(\d+)/i);
        let requestId: number | null = null;

        if (refMatch) {
            requestId = parseInt(refMatch[1], 10);
        } else {
            // Fallback for button clicks: find the most recent PENDING request for this phone
            const lastRequest = await this.prisma.purchaseRequest.findFirst({
                where: {
                    tenantId: tenant.id,
                    status: 'PENDING',
                    phone: { in: [from, normalizedFrom] }
                },
                orderBy: { createdAt: 'desc' }
            });
            if (lastRequest) {
                requestId = lastRequest.id;
                this.logger.log(`[Purchase Approval] Resolved Ref ID ${requestId} from pending requests for ${from} (Button click)`);
            }
        }

        if (!requestId) {
            this.logger.warn(`[Purchase Approval] Approval intent detected but no Ref ID found and no pending request found for ${from}`);
            return false;
        }

        const action = isApproved ? 'approved' : 'rejected';

        // 3. Process with DB and Notify ERP
        try {
            const request = await this.prisma.purchaseRequest.findUnique({
                where: { id: requestId }
            });

            if (!request || request.tenantId !== tenant.id) {
                this.logger.error(`[Purchase Approval] Request ${requestId} not found for tenant ${tenant.slug}`);
                return false;
            }

            if (request.status !== 'PENDING') {
                await this.sendMessage(tenant.id, 'system', {
                    to: from,
                    content: `⚠️ Esta solicitud (Folio: ${request.folio}) ya fue procesada anteriormente como: ${request.status}`
                });
                return true;
            }

            // Update Status
            await this.prisma.purchaseRequest.update({
                where: { id: requestId },
                data: { status: action.toUpperCase() }
            });

            // Notify ERP
            const erpResult = await this.notifyErpOfApproval(request.externalId || requestId, action, from);

            // Response to user
            const approverName = erpResult?.approver_name || 'Usuario';
            const responseMsg = isApproved
                ? `✅ Solicitud ${request.folio} aprobada por ${approverName}. Se ha notificado al ERP.`
                : `❌ Solicitud ${request.folio} ha sido RECHAZADA por ${approverName}.`;

            await this.sendMessage(tenant.id, 'system', {
                to: from,
                content: responseMsg
            });

            this.logger.log({
                skill: 'purchase_approval',
                tenant: tenant.slug,
                phone: from,
                folio: request.folio,
                request_id: requestId,
                action: action,
                approver: approverName,
                result: erpResult ? 'success' : 'erp_notification_failed'
            });

            return true;
        } catch (error) {
            this.logger.error(`[Purchase Approval] Error processing request ${requestId}: ${error.message}`);
            return false;
        }
    }

    /**
     * ERP Integration: Notifies the external system of the user's decision.
     */
    private async notifyErpOfApproval(requestId: number, action: 'approved' | 'rejected', phone: string): Promise<any> {
        // In production this URL would come from configService or an integration table
        const erpWebhookUrl = 'https://ohlala-erp.pitayacode.io/webhooks/approval.php';

        try {
            this.logger.log(`[ERP Sync] Notifying ERP of action ${action} for request ${requestId}`);
            
            const response = await firstValueFrom(this.httpService.post(erpWebhookUrl, {
                request_id: requestId,
                action: action,
                phone: phone
            }, { timeout: 5000 }));

            return response.data;
        } catch (error) {
            this.logger.error(`[ERP Sync Error] Could not notify ERP: ${error.message}`);
            return null; 
        }
    }
}
