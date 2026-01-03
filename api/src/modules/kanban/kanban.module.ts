import { Module } from '@nestjs/common';
import { KanbanService } from './kanban.service';

@Module({
    providers: [KanbanService],
    exports: [KanbanService],
})
export class KanbanModule { }
