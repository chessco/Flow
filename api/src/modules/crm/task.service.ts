import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TaskService {
    constructor(private prisma: PrismaService) { }

    async getTasks(tenantId: string, personId?: string, personType?: 'CONTACT' | 'LEAD') {
        const where: any = { tenantId };
        if (personId) {
            if (personType === 'CONTACT') where.contactId = personId;
            else if (personType === 'LEAD') where.leadId = personId;
        }
        return this.prisma.task.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: { contact: true, lead: true }
        });
    }

    async createTask(tenantId: string, data: any) {
        // Filter data to only include schema-valid fields
        const validFields = ['title', 'description', 'dueDate', 'status', 'priority', 'contactId', 'leadId'];
        const filteredData: any = {};
        validFields.forEach(field => {
            if (data[field] !== undefined) filteredData[field] = data[field];
        });

        return this.prisma.task.create({
            data: {
                ...filteredData,
                tenantId
            }
        });
    }

    async updateTask(tenantId: string, id: string, data: any) {
        // Filter data to only include schema-valid fields
        const validFields = ['title', 'description', 'dueDate', 'status', 'priority', 'contactId', 'leadId'];
        const filteredData: any = {};
        validFields.forEach(field => {
            if (data[field] !== undefined) filteredData[field] = data[field];
        });

        return this.prisma.task.update({
            where: { id, tenantId },
            data: filteredData
        });
    }

    async deleteTask(tenantId: string, id: string) {
        return this.prisma.task.delete({
            where: { id, tenantId }
        });
    }
}
