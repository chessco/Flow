import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';
import { ExternalIntegrationController } from './external-integration.controller';
import { AiModule } from '../ai/ai.module';

@Module({
    imports: [HttpModule, AiModule],
    controllers: [WhatsappController, ExternalIntegrationController],
    providers: [WhatsappService],
    exports: [WhatsappService],
})
export class WhatsappModule { }
