import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';
import { AiModule } from '../ai/ai.module';

@Module({
    imports: [HttpModule, AiModule],
    controllers: [WhatsappController],
    providers: [WhatsappService],
    exports: [WhatsappService],
})
export class WhatsappModule { }
