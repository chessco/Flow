import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface AiConfig {
    apiKey: string;
    provider: 'GEMINI' | 'OPENAI';
    mode: 'PLATFORM' | 'TENANT';
    model: string;
    temperature: number;
    maxTokens: number;
    rateLimitEnabled: boolean;
    systemPrompt?: string;
}

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);
    private genAI: GoogleGenerativeAI | null = null;
    private modelName: string = 'gemini-1.5-flash';
    private readonly configPath = path.join(process.cwd(), 'ai-config.json');
    private readonly algorithm = 'aes-256-ctr';
    private secretKey: Buffer;
    private requestTimestamps: number[] = [];
    private readonly MAX_RPM = 30;

    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
        private eventEmitter: EventEmitter2
    ) {
        try {
            this.logger.log('AiService Initializing...');
            const rawKey = this.configService.get<string>('ENCRYPTION_KEY') || 'pitaya_default_encryption_key_32';
            this.secretKey = crypto.createHash('sha256').update(rawKey).digest();
            this.initializeAI();
        } catch (e) {
            console.error('CRITICAL: AiService Constructor Failed:', e);
            this.logger.error('Constructor failed', e.stack);
        }
    }

    private initializeAI() {
        const apiKey = this.getApiKey();
        if (apiKey) {
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.modelName = this.getFullConfig().model || 'gemini-1.5-flash';
            this.logger.log(`Gemini AI Initialized with model: ${this.modelName}`);
        } else {
            this.logger.warn('GOOGLE_AI_API_KEY not found. AI features will use mock fallback logic.');
        }
    }

    private checkRateLimit(): boolean {
        const config = this.getFullConfig();
        if (!config.rateLimitEnabled) return true;

        const now = Date.now();
        const oneMinuteAgo = now - 60000;

        // Filter timestamps from the last minute
        this.requestTimestamps = this.requestTimestamps.filter(ts => ts > oneMinuteAgo);

        if (this.requestTimestamps.length >= this.MAX_RPM) {
            this.logger.warn(`⚠️ ADVERTENCIA: Se superó el límite de ${this.MAX_RPM} solicitudes AI por minuto. Consultas pausadas hasta liberar cupo.`);
            return false;
        }

        this.requestTimestamps.push(now);
        return true;
    }

    public getRateLimitStatus() {
        const config = this.getFullConfig();
        if (!config.rateLimitEnabled) return { isLimited: false, count: 0 };

        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        const count = this.requestTimestamps.filter(ts => ts > oneMinuteAgo).length;

        return {
            isLimited: count >= this.MAX_RPM,
            count,
            limit: this.MAX_RPM,
            remainingRefresh: count >= this.MAX_RPM
                ? Math.ceil((60000 - (now - this.requestTimestamps[0])) / 1000)
                : 0
        };
    }

    private encrypt(text: string): string {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv);
        const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
        return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
    }

    private decrypt(text: string): string {
        try {
            const [iv, content] = text.split(':');
            const decipher = crypto.createDecipheriv(this.algorithm, this.secretKey, Buffer.from(iv, 'hex'));
            const decrypted = Buffer.concat([decipher.update(Buffer.from(content, 'hex')), decipher.final()]);
            return decrypted.toString();
        } catch (e) {
            return text; // Fallback for migration if not encrypted
        }
    }

    public getApiKey(): string | null {
        try {
            if (fs.existsSync(this.configPath)) {
                const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
                if (config.apiKey) {
                    const decrypted = this.decrypt(config.apiKey);
                    this.logger.log(`Loaded API Key from config: ${decrypted.substring(0, 5)}... (Length: ${decrypted.length})`);
                    return decrypted;
                }
            }
        } catch (e) {
            this.logger.error('Error reading ai-config.json');
        }
        const envKey = this.configService.get<string>('GOOGLE_AI_API_KEY');
        if (envKey) {
            this.logger.log(`Loaded API Key from ENV: ${envKey.substring(0, 5)}...`);
            return envKey;
        }
        this.logger.warn('No API Key found in config or ENV');
        return null;
    }

    public getFullConfig(): Partial<AiConfig> {
        try {
            if (fs.existsSync(this.configPath)) {
                const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
                if (config.apiKey) config.apiKey = this.decrypt(config.apiKey);
                return config;
            }
        } catch (e) {
            this.logger.error('Error reading ai-config.json');
        }
        return {
            apiKey: this.configService.get<string>('GOOGLE_AI_API_KEY') || null,
            provider: 'GEMINI',
            model: 'gemini-1.5-flash'
        } as any;
    }

    public async updateConfig(newConfig: Partial<AiConfig>) {
        try {
            let currentConfig = {};
            if (fs.existsSync(this.configPath)) {
                currentConfig = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
            }

            const configToSave = { ...currentConfig, ...newConfig };
            if (newConfig.apiKey) {
                const trimmedKey = newConfig.apiKey.trim();
                this.logger.log(`Saving new API Key: ${trimmedKey.substring(0, 5)}...`);
                configToSave.apiKey = this.encrypt(trimmedKey);
            }

            fs.writeFileSync(this.configPath, JSON.stringify(configToSave, null, 2));
            this.logger.log('AI Config updated successfully');

            // Re-initialize AI with new config
            this.initializeAI();

            return { success: true };
        } catch (e) {
            this.logger.error(`Error updating AI config: ${e.message}`, e.stack);
            return { success: false, error: e.message };
        }
    }

    public async updateApiKey(key: string) {
        return this.updateConfig({ apiKey: key });
    }

    /**
     * Previene la fuga de PII y aplica políticas de uso.
     */
    private applyGuardrails(text: string): string {
        return text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]')
            .replace(/\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g, '[CARD_REDACTED]');
    }

    private emitAudit(event: any) {
        this.eventEmitter.emit('ai.interaction', {
            ...event,
            model: this.modelName,
            timestamp: new Date()
        });
    }

    /**
     * Sugiere respuestas basadas en el contexto de la conversación.
     */
    async suggestReplies(tenantId: string, id: string) {
        const startTime = Date.now();
        // Move rate limit check inside try catch or handle gracefully
        if (!this.checkRateLimit()) {
            this.logger.warn('Rate limit reached for suggestReplies, returning mock data.');
            return this.getMockSuggestions('');
        }

        const conversation = await this.prisma.conversation.findFirst({
            where: {
                tenantId,
                OR: [{ id }, { leadId: id }, { contactId: id }]
            },
            include: {
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 10
                }
            }
        });

        if (!conversation || conversation.messages.length === 0) {
            return this.getMockSuggestions('');
        }

        if (!this.genAI) {
            return this.getMockSuggestions(conversation.messages[0].content);
        }

        try {
            const context = [...conversation.messages].reverse().map(m =>
                `${m.senderType === 'CONTACT' ? 'Usuario' : 'Agente'}: ${this.applyGuardrails(m.content)}`
            ).join('\n');

            const prompt = `Eres un asistente de ventas experto. Basado en esta conversación de WhatsApp, sugiere 3 respuestas cortas y efectivas en formato JSON. 
            Cada respuesta debe tener un "tone" (ej: Amigable, Formal, Directo, Consultivo) y un "text".
            Idioma: Español.
            
            Conversación:
            ${context}
            
            JSON format: [{"tone": "...", "text": "..."}, ...]`;

            const model = this.genAI.getGenerativeModel({ model: this.modelName, apiVersion: 'v1' });

            const result = await model.generateContent(prompt);
            const text = result.response.text() ? result.response.text() : JSON.stringify(result);

            this.emitAudit({
                tenantId,
                action: 'suggest_replies',
                latency: Date.now() - startTime,
                status: 'success',
                conversationId: conversation.id
            });

            const jsonMatch = text.match(/\[.*\]/s);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }

            return this.getMockSuggestions(conversation.messages[0].content);
        } catch (error) {
            this.emitAudit({
                tenantId,
                action: 'suggest_replies',
                latency: Date.now() - startTime,
                status: 'error',
                error: error.message
            });
            this.logger.error(`Error with Gemini suggestReplies: ${error.message}`);

            const isNoCredits = error.message.includes('429') || error.message.toLowerCase().includes('quota');
            if (isNoCredits) {
                await this.createSystemAlert(tenantId, 'ERROR SISTEMA: IA Gemini - Límite de cuota alcanzado (Suggestions)', id);
            } else if (error.message.includes('401') || error.message.includes('403')) {
                await this.createSystemAlert(tenantId, 'ERROR SISTEMA: IA Gemini - API Key inválida o expirada (Suggestions)', id);
            }

            return this.getMockSuggestions(conversation.messages[0].content);
        }
    }

    private getMockSuggestions(content: string) {
        const lowContent = content.toLowerCase();
        if (lowContent.includes('hola') || !content) {
            return [
                { tone: 'Amigable', text: '¡Hola! Qué gusto saludarte. ¿Cómo puedo ayudarte hoy?' },
                { tone: 'Formal', text: 'Buen día. Gracias por contactarnos, ¿en qué podemos asistirle?' },
                { tone: 'Asistente', text: 'Hola, soy el asistente virtual de Flow. ¿Buscas información sobre nuestros servicios?' }
            ];
        }
        return [
            { tone: 'Cortés', text: 'Entendido. Ya estamos revisando esto por ti.' },
            { tone: 'Duda', text: '¿Podrías darme más detalles al respecto?' },
            { tone: 'Espera', text: 'Permíteme un momento, estoy verificando la información.' }
        ];
    }

    /**
     * Analiza el sentimiento y la intención del último mensaje.
     */
    async analyzeMessage(messageId: string) {
        this.logger.log(`Analizando mensaje ${messageId} para detección de intención`);
    }

    /**
     * Resume una conversación completa.
     */
    async summarizeConversation(conversationId: string) {
        const startTime = Date.now();
        if (!this.checkRateLimit()) {
            return "Límite de rate limit alcanzado (15 RPM). Por favor espere un momento.";
        }
        if (!this.genAI) return "Conversación activa. No hay resumen disponible sin configuración de IA.";

        try {
            const messages = await this.prisma.message.findMany({
                where: { conversationId },
                orderBy: { createdAt: 'asc' },
                take: 50
            });

            if (messages.length === 0) return "Sin mensajes para resumir.";

            const context = messages.map(m => `${m.senderType}: ${this.applyGuardrails(m.content)}`).join('\n');
            const prompt = `Resume esta conversación de WhatsApp en 2 oraciones cortas resaltando el interés del cliente y el estado del trato:\n\n${context}`;

            const model = this.genAI.getGenerativeModel({ model: this.modelName });
            const result = await model.generateContent(prompt);
            const summary = result.response.text() ? result.response.text() : "Resumen no disponible";

            this.emitAudit({
                tenantId: 'system', // Summarize usually global or triggered locally
                action: 'summarize',
                latency: Date.now() - startTime,
                status: 'success',
                conversationId
            });

            return { summary };
        } catch (error) {
            this.emitAudit({
                tenantId: 'system',
                action: 'summarize',
                latency: Date.now() - startTime,
                status: 'error',
                error: error.message
            });
            this.logger.error(`Error summarizing: ${error.message}`);

            const isNoCredits = error.message.includes('429') || error.message.toLowerCase().includes('quota');
            if (isNoCredits) {
                await this.createSystemAlert('system', 'ERROR SISTEMA: IA Gemini - Límite de cuota alcanzado (Summary)', conversationId);
            } else if (error.message.includes('401') || error.message.includes('403')) {
                await this.createSystemAlert('system', 'ERROR SISTEMA: IA Gemini - API Key inválida o expirada (Summary)', conversationId);
            }

            return "Error al generar resumen.";
        }
    }

    /**
     * Refina un texto para hacerlo más profesional.
     */
    async refineText(text: string) {
        const startTime = Date.now();
        if (!text || text.length < 3) return { refined: text };
        if (!this.checkRateLimit()) {
            return { refined: text, error: 'Rate limit reached' };
        }

        if (!this.genAI) {
            return this.getMockRefinement(text);
        }

        try {
            const safeText = this.applyGuardrails(text);
            const prompt = `Convierte este mensaje informal en uno profesional y amable para WhatsApp, manteniendo el sentido original pero mejorando la ortografía y el tono. Solo devuelve el texto refinado, sin explicaciones.\n\nMensaje: ${safeText}`;

            const model = this.genAI.getGenerativeModel({ model: this.modelName });
            const result = await model.generateContent(prompt);
            const refinedText = result.response.text() ? result.response.text().trim() : safeText;

            this.emitAudit({
                tenantId: 'system',
                action: 'refine',
                latency: Date.now() - startTime,
                status: 'success'
            });

            return {
                original: text,
                refined: refinedText
            };
        } catch (error) {
            this.emitAudit({
                tenantId: 'system',
                action: 'refine',
                latency: Date.now() - startTime,
                status: 'error',
                error: error.message
            });
            return this.getMockRefinement(text);
        }
    }

    async analyzeImageForPayment(caption?: string) {
        if (!caption || caption === '[IMAGE Media Received]') return false;

        const paymentKeywords = [
            'pago', 'comprobante', 'transferencia', 'recibo', 'baucher', 'voucher',
            'ticket', 'depósito', 'deposito', 'yape', 'plin', 'screenshot', 'captura'
        ];

        const lowercaseCaption = caption.toLowerCase();
        const isLikelyPayment = paymentKeywords.some(keyword => lowercaseCaption.includes(keyword));

        if (isLikelyPayment) {
            this.logger.log(`Payment detected in image caption: "${caption}"`);
            return true;
        }

        return false;
    }

    async analyzeContext(conversationId: string) {
        const startTime = Date.now();
        if (!this.checkRateLimit()) {
            return { nextBestAction: "Rate limit reached (15 RPM). Please wait.", intent: "Límite alcanzado" };
        }
        if (!this.genAI) return { nextBestAction: "Configure AI to enable analysis", intent: "Unknown" };

        try {
            const messages = await this.prisma.message.findMany({
                where: { conversationId },
                orderBy: { createdAt: 'asc' },
                take: 50
            });

            if (messages.length === 0) return { nextBestAction: "No messages to analyze", intent: "None" };

            const conversation = await this.prisma.conversation.findUnique({
                where: { id: conversationId },
                select: { contactId: true, leadId: true, tenantId: true }
            });

            const card = await this.prisma.card.findFirst({
                where: {
                    OR: [
                        { contactId: conversation?.contactId, tenantId: conversation?.tenantId },
                        { leadId: conversation?.leadId, tenantId: conversation?.tenantId }
                    ].filter(q => q && (q.contactId || q.leadId)) as any
                },
                include: { stage: true }
            });

            const currentStageName = card?.stage?.name || 'Nuevo Lead (Meta)';
            const currentStageOrder = card?.stage?.order || 1;

            const context = messages.map(m => `${m.senderType}: ${this.applyGuardrails(m.content)}`).join('\n');
            const config = this.getFullConfig();
            const systemInstructions = config.systemPrompt ? `Instrucciones del Sistema:\n${config.systemPrompt}\n\n` : '';

            const prompt = `${systemInstructions}Analyze this WhatsApp conversation and extract the following in JSON format:
            {
                "nextBestAction": "A specific, actionable recommendation for the agent (max 15 words) in Spanish",
                "intent": "The customer's primary intent (e.g., Venta, Soporte, Información, Reclamo) in Spanish",
                "sentiment": "Positive, Neutral, or Negative",
                "tags": ["A list of 3-5 relevant descriptive tags in Spanish based on conversation context (e.g., Interesado, Urgente, VIP)"],
                "extractedData": {
                    "email": "Customer email if present/discussed",
                    "budget": "Budget OR Price discussed (plain number only, e.g. 1500, null if not clear)",
                    "location": "Location info if mentioned",
                    "meetingDate": "Proposed meeting date/time if discussed"
                },
                "currentStageName": "${currentStageName}",
                "currentStageOrder": ${currentStageOrder}
            }

            Conversation:
            ${context}`;

            const model = this.genAI.getGenerativeModel({
                model: this.modelName,
                apiVersion: 'v1',
                generationConfig: { responseMimeType: 'application/json' }
            });

            const result = await model.generateContent(prompt);
            const text = result.response.text() ? result.response.text() : "{}";
            const jsonText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const analysis = JSON.parse(jsonText);

            // AUTO-UPDATE CARD VALUE if price/budget is detected
            const extractedBudget = analysis.extractedData?.budget;
            if (extractedBudget && card) {
                // Strip currency symbols and commas, keep dots for decimals
                const cleanedBudget = String(extractedBudget).replace(/[^0-9.]/g, '');
                const numericValue = parseFloat(cleanedBudget);

                if (!isNaN(numericValue) && numericValue > 0) {
                    await this.prisma.card.update({
                        where: { id: card.id },
                        data: { value: numericValue }
                    });
                    this.logger.log(`Auto-updated Card ${card.id} value to ${numericValue} from AI analysis (Raw: ${extractedBudget})`);
                }
            }

            // AUTO-UPDATE CONTACT/LEAD EMAIL if detected
            const extractedEmail = analysis.extractedData?.email;
            if (extractedEmail && (card?.contactId || card?.leadId || conversation?.contactId || conversation?.leadId)) {
                const personId = card?.contactId || card?.leadId || conversation?.contactId || conversation?.leadId;
                const personType = (card?.contactId || conversation?.contactId) ? 'contact' : 'lead';

                if (personId) {
                    if (personType === 'contact') {
                        await this.prisma.contact.update({
                            where: { id: personId },
                            data: { email: extractedEmail }
                        });
                    } else {
                        await this.prisma.lead.update({
                            where: { id: personId },
                            data: { email: extractedEmail }
                        });
                    }
                    this.logger.log(`Auto-updated ${personType} ${personId} email to ${extractedEmail} from AI analysis`);
                }
            }

            this.emitAudit({
                tenantId: 'system',
                action: 'analyze_context',
                latency: Date.now() - startTime,
                status: 'success',
                conversationId
            });

            return analysis;
        } catch (error) {
            this.emitAudit({
                tenantId: 'system',
                action: 'analyze_context',
                latency: Date.now() - startTime,
                status: 'error',
                error: error.message
            });
            this.logger.error(`Error analyzing context: ${error.message}`);

            const isNoCredits = error.message.includes('429') || error.message.toLowerCase().includes('quota');
            if (isNoCredits) {
                await this.createSystemAlert('system', 'ERROR SISTEMA: IA Gemini - Límite de cuota alcanzado (Analysis)');
            } else if (error.message.includes('401') || error.message.includes('403')) {
                await this.createSystemAlert('system', 'ERROR SISTEMA: IA Gemini - API Key inválida o expirada (Analysis)');
            }

            return { nextBestAction: "Analysis failed", intent: "Error" };
        }
    }

    /**
     * Genera una respuesta autónoma y detecta si se requiere intervención humana.
     */
    async generateAutonomousResponse(tenantId: string, conversationId: string, additionalInstructions?: string) {
        const startTime = Date.now();
        if (!this.checkRateLimit()) {
            return { content: "Límite de solicitudes AI alcanzado. Un agente revisará pronto.", handoverRequired: true };
        }

        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId },
            include: {
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 50
                }
            }
        });

        if (!conversation) return null;

        if (!this.genAI) {
            return {
                content: "Hola, soy el asistente virtual de Flow. ¿En qué puedo ayudarte hoy?",
                handoverRequired: false
            };
        }

        try {
            const card = await this.prisma.card.findFirst({
                where: {
                    OR: [
                        { contactId: conversation.contactId, tenantId },
                        { leadId: conversation.leadId, tenantId }
                    ].filter(q => q && (q.contactId || q.leadId)) as any
                },
                include: { stage: true }
            });

            const currentStageName = card?.stage?.name || 'Nuevo Lead (Meta)';

            const context = [...conversation.messages].reverse().map(m =>
                `${m.senderType === 'CONTACT' ? 'Usuario' : 'Agente'}: ${this.applyGuardrails(m.content)}`
            ).join('\n');

            const config = this.getFullConfig();
            const systemInstructions = config.systemPrompt || `Eres un asistente virtual experto para una empresa llamada Flow. 
            Tu objetivo es ayudar al usuario de forma amable y profesional por WhatsApp.`;

            const prompt = `${systemInstructions}
            
            ${additionalInstructions ? `INSTRUCCIONES ADICIONALES:\n${additionalInstructions}\n\n` : ''}
            INFORMACIÓN DE ESTADO:
            - Etapa actual del proceso: ${currentStageName}

            REGLAS CRÍTICAS DE CONTROL:
            1. NO REPITAS: Revisa la "Conversación reciente". Si ya dijiste algo casi idéntico o diste la misma promesa, NO la repitas. En su lugar, solicita ayuda humana.
            2. COMPROMISO HUMANO: Si en el historial ya prometiste que un humano (como Francisco o el equipo) hará algo (enviar cuentas, llamar, enviar PDF), y el usuario confirma ("ok", "quedo a la espera") o te lo vuelve a pedir, DEBES poner "handoverRequired": true. No vuelvas a prometer lo mismo.
            3. CONFIRMACIONES CORTAS: Si el usuario solo dice "gracias", "ok" o similar tras una promesa, responde algo muy breve como "A ti. Saludos." o "Perfecto." y pon "handoverRequired": true si es necesario que el humano intervenga.
            4. REGLA DE CUMPLIMIENTO (DIGITAL): Si la "Etapa actual del proceso" es 'Venta Cerrada / Completado', DEBES ofrecer y enviar los links de descarga o acceso a los productos digitales.
            5. TRANSICIONES DE ETAPA (suggestedStageName):
               - Si el usuario muestra interés genuino o pide precios -> "Calificado / Interesado"
               - Si envías cuentas bancarias o el usuario dice que va a pagar -> "Esperando Transferencia"
               - Si detectas que se ha enviado una imagen (ver historial) pero aún no está en 'Pago por Verificar' -> "Pago por Verificar"
               - Por defecto, tras cualquier interacción inicial -> "En Seguimiento / Info Enviada"
            6. FORMATO JSON ESTRICTO:
               {
                 "content": "Tu respuesta al usuario en español",
                 "handoverRequired": boolean,
                 "handoverReason": "Explicación de por qué pides ayuda (opcional)",
                 "suggestedStageName": "Nombre exacto de la etapa sugerida (opcional)"
               }

            Conversación reciente (cronológica):
            ${context}

            Responde ÚNICAMENTE con el objeto JSON.`;

            console.log('[AI Debug] Raw Autonomous Prompt:', prompt);

            const model = this.genAI.getGenerativeModel({
                model: this.modelName,
                apiVersion: 'v1',
                generationConfig: { responseMimeType: 'application/json' }
            });

            const result = await model.generateContent(prompt);
            const text = result.response.text() ? result.response.text() : "{}";
            console.log('[AI Debug] Raw Autonomous Response:', text);

            const jsonText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const response = JSON.parse(jsonText);

            this.emitAudit({
                tenantId,
                action: 'autonomous_response',
                latency: Date.now() - startTime,
                status: 'success',
                conversationId
            });

            return response;
        } catch (error) {
            this.logger.error(`Error in generateAutonomousResponse: ${error.message}`);

            const isNoCredits = error.message.includes('429') || error.message.toLowerCase().includes('quota');
            if (isNoCredits) {
                await this.createSystemAlert(tenantId, 'ERROR SISTEMA: IA Gemini - Límite de cuota alcanzado', conversationId);
            } else if (error.message.includes('401') || error.message.includes('403')) {
                await this.createSystemAlert(tenantId, 'ERROR SISTEMA: IA Gemini - API Key inválida o expirada', conversationId);
            }

            return {
                content: "Lo siento, tengo un problema al procesar tu mensaje. Un agente humano revisará esto a la brevedad.",
                handoverRequired: true,
                handoverReason: "AI Error: " + error.message
            };
        }
    }

    async toggleAiManaged(tenantId: string, conversationId: string, managed: boolean) {
        return this.prisma.conversation.update({
            where: { id: conversationId, tenantId },
            data: { aiManaged: managed }
        });
    }

    async generateTags(tenantId: string, conversationId: string) {
        const analysis = await this.analyzeContext(conversationId);
        const tags = analysis.tags || [];

        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId },
            select: { contactId: true, leadId: true }
        });

        if (conversation) {
            if (conversation.contactId) {
                await this.prisma.contact.update({
                    where: { id: conversation.contactId },
                    data: { tags }
                });
            } else if (conversation.leadId) {
                await this.prisma.lead.update({
                    where: { id: conversation.leadId },
                    data: { tags }
                });
            }
        }

        return { tags };
    }

    async getHandoverAlerts(tenantId: string) {
        return this.prisma.handoverAlert.findMany({
            where: { tenantId, status: 'PENDING' },
            include: {
                conversation: {
                    include: {
                        contact: true,
                        lead: true,
                        messages: {
                            take: 3,
                            orderBy: { createdAt: 'desc' },
                            where: { type: { in: ['image', 'IMAGE', 'text', 'TEXT'] } } // Prioritize images/text
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async resolveHandoverAlert(tenantId: string, alertId: string) {
        return this.prisma.handoverAlert.update({
            where: { id: alertId, tenantId },
            data: { status: 'RESOLVED' }
        });
    }

    async generateRevenueAnalysis(tenantId: string) {
        const startTime = Date.now();
        if (!this.checkRateLimit()) {
            return { summary: "Rate limit alcanzado (15 RPM).", momentum: "LIMITADO", noCredits: true };
        }
        if (!this.genAI) {
            const msg = "Configure su API Key de Gemini para activar el análisis predictivo de ingresos.";
            await this.createSystemAlert(tenantId, `ERROR SISTEMA: IA Gemini - Falta configuración (${msg})`);
            return {
                summary: msg,
                momentum: "INACTIVO",
                error: "MOCK_MODE",
                noCredits: true
            };
        }

        try {
            const deals = await this.prisma.card.findMany({
                where: { tenantId },
                include: { contact: true, lead: true, stage: true }
            });

            if (deals.length === 0) {
                return {
                    summary: "No hay tratos suficientes para realizar un análisis de ingresos.",
                    momentum: "BAJO",
                    error: "NO_DATA"
                };
            }

            const dealsContext = deals.map(d =>
                `- Trato: ${d.title}, Valor: ${d.value}, Etapa: ${d.stage.name}, Prioridad: ${d.priority}`
            ).join('\n');

            const prompt = `Analiza los siguientes tratos comerciales de un CRM y genera un resumen predictivo de ingresos en español.
            Format JSON:
            {
                "summary": "Un resumen de 1-2 oraciones sobre el estado del pipeline y predicción de cierre.",
                "details": "Un análisis más detallado sobre los puntos fuertes y riesgos del pipeline actual (máximo 100 palabras).",
                "momentum": "ALTO" | "MEDIO" | "BAJO",
                "predictedRevenue": "Valor estimado a cerrar en el siguiente mes"
            }

            Tratos:
            ${dealsContext}`;

            const model = this.genAI.getGenerativeModel({
                model: this.modelName,
                apiVersion: 'v1',
                generationConfig: { responseMimeType: 'application/json' }
            });

            const result = await model.generateContent(prompt);
            const text = result.response.text() ? result.response.text() : "{}";
            const analysis = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());

            this.emitAudit({
                tenantId,
                action: 'revenue_analysis',
                latency: Date.now() - startTime,
                status: 'success'
            });

            return analysis;
        } catch (error) {
            this.logger.error(`Error generating revenue analysis: ${error.message}`);
            const isNoCredits = error.message.includes('429') || error.message.toLowerCase().includes('quota');

            if (isNoCredits) {
                await this.createSystemAlert(tenantId, 'ERROR SISTEMA: IA Gemini - Límite de cuota alcanzado (Quota exceeded)');
            } else if (error.message.includes('401') || error.message.includes('403')) {
                await this.createSystemAlert(tenantId, 'ERROR SISTEMA: IA Gemini - API Key inválida o expirada');
            }

            return {
                summary: isNoCredits ? "Límite de créditos de IA alcanzado para este mes." : "Error al generar el análisis de ingresos.",
                momentum: "ERROR",
                error: error.message,
                noCredits: isNoCredits
            };
        }
    }

    private async createSystemAlert(tenantId: string, reason: string, conversationId?: string) {
        try {
            // Avoid duplicate active alerts for the same system error type
            // Extract the main part of the reason to check for duplicates (e.g., "ERROR SISTEMA: IA Gemini")
            const reasonPrefix = reason.split(' - ')[0];
            const existingAlert = await this.prisma.handoverAlert.findFirst({
                where: {
                    tenantId,
                    status: 'PENDING',
                    reason: { startsWith: reasonPrefix }
                }
            });

            if (existingAlert) return;

            let finalConversationId = conversationId;

            if (!finalConversationId) {
                const lastConversation = await this.prisma.conversation.findFirst({
                    where: { tenantId },
                    orderBy: { updatedAt: 'desc' }
                });
                finalConversationId = lastConversation?.id;
            }

            if (finalConversationId) {
                await this.prisma.handoverAlert.create({
                    data: {
                        conversationId: finalConversationId,
                        tenantId,
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

    private getMockRefinement(text: string) {
        return {
            original: text,
            refined: `Entendido. ${text} Quedo atento a tus comentarios.`
        };
    }
}
