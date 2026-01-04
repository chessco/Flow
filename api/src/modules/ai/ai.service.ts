import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleGenAI } from '@google/genai';
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
}

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);
    private genAI: GoogleGenAI | null = null;
    private modelName: string = 'gemini-3-flash';
    private readonly configPath = path.join(process.cwd(), 'ai-config.json');
    private readonly algorithm = 'aes-256-ctr';
    private secretKey: Buffer;

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
            this.genAI = new GoogleGenAI({ apiKey });
            // this.model is removed, we use this.modelName when calling generateContent
            this.modelName = this.getFullConfig().model || 'gemini-3-flash';
            this.logger.log('Gemini AI Initialized successfully');
        } else {
            this.logger.warn('GOOGLE_AI_API_KEY not found. AI features will use mock fallback logic.');
        }
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
            model: 'gemini-3-flash'
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
            model: 'gemini-3-flash',
            timestamp: new Date()
        });
    }

    /**
     * Sugiere respuestas basadas en el contexto de la conversación.
     */
    async suggestReplies(tenantId: string, id: string) {
        const startTime = Date.now();
        this.logger.log(`Generando sugerencias AI para: ${id}`);

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

            const result = await this.genAI.models.generateContent({
                model: this.modelName,
                contents: prompt
            });
            const text = result.text ? result.text : JSON.stringify(result);

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

            const result = await this.genAI.models.generateContent({
                model: this.modelName,
                contents: prompt
            });
            const summary = result.text ? result.text : "Resumen no disponible";

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
            return "Error al generar resumen.";
        }
    }

    /**
     * Refina un texto para hacerlo más profesional.
     */
    async refineText(text: string) {
        const startTime = Date.now();
        if (!text || text.length < 3) return { refined: text };
        this.logger.log(`Refinando texto con Gemini AI`);

        if (!this.genAI) {
            return this.getMockRefinement(text);
        }

        try {
            const safeText = this.applyGuardrails(text);
            const prompt = `Convierte este mensaje informal en uno profesional y amable para WhatsApp, manteniendo el sentido original pero mejorando la ortografía y el tono. Solo devuelve el texto refinado, sin explicaciones.\n\nMensaje: ${safeText}`;
            const result = await this.genAI.models.generateContent({
                model: this.modelName,
                contents: prompt
            });
            const refinedText = result.text ? result.text.trim() : safeText;

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

    async analyzeContext(conversationId: string) {
        const startTime = Date.now();
        if (!this.genAI) return { nextBestAction: "Configure AI to enable analysis", intent: "Unknown" };

        try {
            const messages = await this.prisma.message.findMany({
                where: { conversationId },
                orderBy: { createdAt: 'asc' },
                take: 50
            });

            if (messages.length === 0) return { nextBestAction: "No messages to analyze", intent: "None" };

            const context = messages.map(m => `${m.senderType}: ${this.applyGuardrails(m.content)}`).join('\n');
            const prompt = `Analyze this WhatsApp conversation and extract the following in JSON format:
            {
                "nextBestAction": "A specific, actionable recommendation for the agent (max 15 words) in Spanish",
                "intent": "The customer's primary intent (e.g., Venta, Soporte, Información, Reclamo) in Spanish",
                "sentiment": "Positive, Neutral, or Negative",
                "extractedData": {
                    "email": "Customer email if present/discussed",
                    "budget": "Budget information if discussed",
                    "location": "Location info if mentioned",
                    "meetingDate": "Proposed meeting date/time if discussed"
                }
            }

            Conversation:
            ${context}`;

            const result = await this.genAI.models.generateContent({
                model: this.modelName,
                contents: prompt,
                config: { responseMimeType: 'application/json' }
            });

            const text = result.text ? result.text : "{}";
            const jsonText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const analysis = JSON.parse(jsonText);

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
            return { nextBestAction: "Analysis failed", intent: "Error" };
        }
    }

    /**
     * Genera una respuesta autónoma y detecta si se requiere intervención humana.
     */
    async generateAutonomousResponse(tenantId: string, conversationId: string) {
        const startTime = Date.now();
        this.logger.log(`Generando respuesta autónoma para: ${conversationId}`);

        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId },
            include: {
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 20
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
            const context = [...conversation.messages].reverse().map(m =>
                `${m.senderType === 'CONTACT' ? 'Usuario' : 'Agente'}: ${this.applyGuardrails(m.content)}`
            ).join('\n');

            const prompt = `Eres un asistente virtual experto para una empresa llamada Flow. 
            Tu objetivo es ayudar al usuario de forma amable y profesional por WhatsApp.
            
            REGLAS CRÍTICAS:
            1. Si el usuario hace una pregunta técnica compleja, muestra enojo, pide hablar con un humano, o si no estás seguro de la respuesta, DEBES solicitar intervención humana.
            2. Tu respuesta debe estar en formato JSON con dos campos obligatorios:
               - "content": Tu respuesta al usuario en español.
               - "handoverRequired": Boolean (true si necesitas intervención humana, false si puedes manejarlo solo).
               - "handoverReason": String (opcional, por qué solicitas ayuda).

            Conversación reciente:
            ${context}

            Responde ÚNICAMENTE en formato JSON.`;

            const result = await this.genAI.models.generateContent({
                model: this.modelName,
                contents: prompt,
                config: { responseMimeType: 'application/json' }
            });

            const text = result.text ? result.text : "{}";
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

    async getHandoverAlerts(tenantId: string) {
        return this.prisma.handoverAlert.findMany({
            where: { tenantId, status: 'PENDING' },
            include: {
                conversation: {
                    include: {
                        contact: true,
                        lead: true
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

    private getMockRefinement(text: string) {
        return {
            original: text,
            refined: `Entendido. ${text} Quedo atento a tus comentarios.`
        };
    }
}
