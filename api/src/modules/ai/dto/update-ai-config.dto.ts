import { IsString, IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';

export class UpdateAiConfigDto {
    @IsOptional()
    @IsString()
    apiKey?: string;

    @IsOptional()
    @IsEnum(['GEMINI', 'OPENAI'])
    provider?: 'GEMINI' | 'OPENAI';

    @IsOptional()
    @IsEnum(['PLATFORM', 'TENANT'])
    mode?: 'PLATFORM' | 'TENANT';

    @IsOptional()
    @IsString()
    model?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(1)
    temperature?: number;

    @IsOptional()
    @IsNumber()
    maxTokens?: number;

    @IsOptional()
    rateLimitEnabled?: boolean;

    @IsOptional()
    @IsString()
    systemPrompt?: string;
}
