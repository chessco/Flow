import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AiAuditService } from './ai-audit.service';

@Module({
    imports: [
        EventEmitterModule.forRoot()
    ],
    controllers: [AiController],
    providers: [AiService, AiAuditService],
    exports: [AiService],
})
export class AiModule { }
