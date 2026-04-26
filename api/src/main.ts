import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);

    // Custom Validation Pipe
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));

    // Enable CORS for web
    const corsOrigins = configService.get<string>('CORS_ORIGINS');
    const origins = corsOrigins ? corsOrigins.split(',').map(o => o.trim()) : [
        'https://flow.pitayacode.io',
        'https://www.flow.pitayacode.io',
        'http://localhost:3000',
        'http://localhost:5173'
    ];

    app.enableCors({
        origin: origins,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
        allowedHeaders: 'Content-Type, Accept, Authorization, x-internal-key, x-tenant-slug, x-tenant-id',
    });

    const port = configService.get<number>('PORT') || 3001;
    await app.listen(port);
    console.log(`🚀 Flow API is running on: http://localhost:${port}`);
}
bootstrap();
