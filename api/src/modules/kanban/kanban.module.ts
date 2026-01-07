import { Module } from '@nestjs/common';
import { KanbanService } from './kanban.service';
import { KanbanController } from './kanban.controller';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
    imports: [WhatsappModule],
    controllers: [KanbanController],
    providers: [KanbanService],
    exports: [KanbanService],
})
export class KanbanModule { }
