import { Module } from '@nestjs/common';
import { CRMService } from './crm.service';
import { CRMController } from './crm.controller';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [CRMController, TaskController],
    providers: [CRMService, TaskService],
    exports: [CRMService, TaskService]
})
export class CRMModule { }
