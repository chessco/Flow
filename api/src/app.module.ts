import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './modules/prisma/prisma.module';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';
import { KanbanModule } from './modules/kanban/kanban.module';
import { AiModule } from './modules/ai/ai.module';
import { AuthModule } from './modules/auth/auth.module';
import { CRMModule } from './modules/crm/crm.module';
import { AppGateway } from './app.gateway';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PrismaModule,
        WhatsappModule,
        KanbanModule,
        AiModule,
        AuthModule,
        CRMModule,
    ],
    controllers: [],
    providers: [AppGateway],
})
export class AppModule { }
