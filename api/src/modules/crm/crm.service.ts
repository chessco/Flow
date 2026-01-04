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
}
