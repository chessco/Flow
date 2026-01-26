import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { CRMService } from './crm.service';
import { AuthGuard } from '@nestjs/passport';
import { TenantGuard } from '../../common/guards/tenant.guard';

@Controller('crm')
@UseGuards(AuthGuard('jwt'), TenantGuard)
export class CRMController {
    constructor(private readonly crmService: CRMService) { }

    @Get('notes/:id')
    async getNotes(
        @Req() req: any,
        @Param('id') personId: string,
        @Query('type') type: 'CONTACT' | 'LEAD'
    ) {
        return this.crmService.getNotes(personId, type, req.tenantId);
    }

    @Post('notes/:id')
    async addNote(
        @Req() req: any,
        @Param('id') personId: string,
        @Query('type') type: 'CONTACT' | 'LEAD',
        @Body() body: { content: string }
    ) {
        const userId = req.user.userId;
        return this.crmService.addNote(personId, type, userId, req.tenantId, body.content);
    }

    @Delete('notes/:noteId')
    async deleteNote(@Req() req: any, @Param('noteId') noteId: string) {
        return this.crmService.deleteNote(noteId, req.tenantId);
    }

    @Post('person/:id')
    async updatePerson(
        @Req() req: any,
        @Param('id') personId: string,
        @Query('type') type: 'CONTACT' | 'LEAD',
        @Body() body: { name?: string, phone?: string, email?: string }
    ) {
        return this.crmService.updatePerson(personId, type, req.tenantId, body);
    }

    @Delete('person/:id')
    async deletePerson(
        @Req() req: any,
        @Param('id') personId: string,
        @Query('type') type: 'CONTACT' | 'LEAD'
    ) {
        if (req.user.role !== 'ADMIN' && req.user.role !== 'SYSTEM_ADMIN') {
            throw new Error('Forbidden: Only admins can delete persons');
        }
        return this.crmService.deletePerson(personId, type, req.tenantId);
    }
}
