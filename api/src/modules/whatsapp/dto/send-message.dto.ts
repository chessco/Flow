import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export enum MessageType {
    TEXT = 'TEXT',
    IMAGE = 'IMAGE',
    DOCUMENT = 'DOCUMENT',
    AUDIO = 'AUDIO',
}

export class SendMessageDto {
    @IsString()
    @IsNotEmpty()
    to: string;

    @IsString()
    @IsNotEmpty()
    content: string;

    @IsEnum(MessageType)
    @IsOptional()
    type?: MessageType = MessageType.TEXT;

    @IsString()
    @IsOptional()
    templateName?: string;
}
