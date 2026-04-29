import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { CombinedAuthGuard } from '../../common/guards/combined-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('users')
@UseGuards(CombinedAuthGuard, RolesGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    @Roles('ADMIN', 'MANAGER')
    async findAll(@Req() req: any) {
        return this.usersService.findAll(req.user.tenantId);
    }

    @Get(':id')
    @Roles('ADMIN', 'MANAGER')
    async findOne(@Param('id') id: string, @Req() req: any) {
        return this.usersService.findOne(id, req.user.tenantId);
    }

    @Post()
    @Roles('ADMIN')
    async create(@Body() data: any, @Req() req: any) {
        return this.usersService.create(data, req.user.tenantId);
    }

    @Put(':id')
    @Roles('ADMIN')
    async update(@Param('id') id: string, @Body() data: any, @Req() req: any) {
        return this.usersService.update(id, data, req.user.tenantId);
    }

    @Delete(':id')
    @Roles('ADMIN')
    async remove(@Param('id') id: string, @Req() req: any) {
        return this.usersService.remove(id, req.user.tenantId);
    }
}
