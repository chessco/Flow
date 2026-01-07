import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CRMService {
    private readonly logger = new Logger(CRMService.name);

    constructor(private prisma: PrismaService) { }

    async getNotes(personId: string, personType: 'CONTACT' | 'LEAD', tenantId: string) {
        return this.prisma.note.findMany({
            where: {
                tenantId,
                ...(personType === 'CONTACT' ? { contactId: personId } : { leadId: personId })
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async addNote(personId: string, personType: 'CONTACT' | 'LEAD', userId: string, tenantId: string, content: string) {
        return this.prisma.note.create({
            data: {
                content,
                tenantId,
                userId,
                ...(personType === 'CONTACT' ? { contactId: personId } : { leadId: personId })
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        });
    }

    async deleteNote(noteId: string, tenantId: string) {
        return this.prisma.note.deleteMany({
            where: {
                id: noteId,
                tenantId
            }
        });
    }

    async updatePerson(personId: string, type: 'CONTACT' | 'LEAD', tenantId: string, data: { name?: string, phone?: string, email?: string }) {
        if (type === 'CONTACT') {
            return this.prisma.contact.update({
                where: { id: personId },
                data: {
                    name: data.name,
                    phone: data.phone,
                    email: data.email
                }
            });
        } else {
            return this.prisma.lead.update({
                where: { id: personId },
                data: {
                    name: data.name,
                    phone: data.phone,
                    email: data.email
                }
            });
        }
    }

    async deletePerson(personId: string, type: 'CONTACT' | 'LEAD', tenantId: string) {
        this.logger.log(`Deleting ${type} ${personId} for tenant ${tenantId}`);

        return await this.prisma.$transaction(async (tx) => {
            // 1. Delete Cards
            await tx.card.deleteMany({
                where: {
                    tenantId,
                    ...(type === 'CONTACT' ? { contactId: personId } : { leadId: personId })
                }
            });

            // 2. Delete Notes
            await tx.note.deleteMany({
                where: {
                    tenantId,
                    ...(type === 'CONTACT' ? { contactId: personId } : { leadId: personId })
                }
            });

            // 3. Delete Messages & Conversations
            const conversations = await tx.conversation.findMany({
                where: {
                    tenantId,
                    ...(type === 'CONTACT' ? { contactId: personId } : { leadId: personId })
                }
            });

            for (const conv of conversations) {
                await tx.handoverAlert.deleteMany({ where: { conversationId: conv.id } });
                await tx.message.deleteMany({ where: { conversationId: conv.id } });
            }

            await tx.conversation.deleteMany({
                where: {
                    tenantId,
                    ...(type === 'CONTACT' ? { contactId: personId } : { leadId: personId })
                }
            });

            // 4. Finally delete the person
            if (type === 'CONTACT') {
                return tx.contact.delete({ where: { id: personId } });
            } else {
                return tx.lead.delete({ where: { id: personId } });
            }
        });
    }
}
