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
        const userId = req.user.id;
        return this.crmService.addNote(personId, type, userId, req.tenantId, body.content);
    }

    @Delete('notes/:noteId')
    async deleteNote(@Req() req: any, @Param('noteId') noteId: string) {
        return this.crmService.deleteNote(noteId, req.tenantId);
    }
}
