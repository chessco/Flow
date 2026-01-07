import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { TaskService } from './task.service';
import { AuthGuard } from '@nestjs/passport';
import { TenantGuard } from '../../common/guards/tenant.guard';

@Controller('crm/tasks')
@UseGuards(AuthGuard('jwt'), TenantGuard)
export class TaskController {
    constructor(private readonly taskService: TaskService) { }

    @Get()
    async getTasks(
        @Req() req: any,
        @Query('personId') personId?: string,
        @Query('personType') personType?: 'CONTACT' | 'LEAD'
    ) {
        return this.taskService.getTasks(req.tenantId, personId, personType);
    }

    @Post()
    async createTask(@Req() req: any, @Body() data: any) {
        return this.taskService.createTask(req.tenantId, data);
    }

    @Patch(':id')
    async updateTask(@Req() req: any, @Param('id') id: string, @Body() data: any) {
        return this.taskService.updateTask(req.tenantId, id, data);
    }

    @Delete(':id')
    async deleteTask(@Req() req: any, @Param('id') id: string) {
        return this.taskService.deleteTask(req.tenantId, id);
    }
}
