import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateWhatsAppSettingsDto {
    @IsString()
    @IsNotEmpty()
    accessToken: string;

    @IsString()
    @IsNotEmpty()
    phoneNumberId: string;

    @IsString()
    @IsNotEmpty()
    wabaId: string;

    @IsString()
    @IsOptional()
    verifyToken?: string;
}
