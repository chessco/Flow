-- CreateTable
CREATE TABLE `Tenant` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `logoUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Tenant_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'AGENT',
    `tenantId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_tenantId_idx`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Contact` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `avatar` VARCHAR(191) NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `tags` JSON NULL,

    INDEX `Contact_tenantId_idx`(`tenantId`),
    UNIQUE INDEX `Contact_tenantId_phone_key`(`tenantId`, `phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Lead` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'NEW',
    `tenantId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `tags` JSON NULL,

    INDEX `Lead_tenantId_idx`(`tenantId`),
    UNIQUE INDEX `Lead_tenantId_phone_key`(`tenantId`, `phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WhatsAppAccount` (
    `id` VARCHAR(191) NOT NULL,
    `wabaId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `accessToken` TEXT NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `WhatsAppAccount_wabaId_key`(`wabaId`),
    INDEX `WhatsAppAccount_tenantId_idx`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WhatsAppPhoneNumber` (
    `id` VARCHAR(191) NOT NULL,
    `phoneNumberId` VARCHAR(191) NOT NULL,
    `displayPhoneNumber` VARCHAR(191) NOT NULL,
    `whatsappAccountId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `WhatsAppPhoneNumber_phoneNumberId_key`(`phoneNumberId`),
    INDEX `WhatsAppPhoneNumber_whatsappAccountId_idx`(`whatsappAccountId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Pipeline` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Pipeline_tenantId_idx`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Stage` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL,
    `pipelineId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Stage_pipelineId_idx`(`pipelineId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Card` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `value` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `contactId` VARCHAR(191) NULL,
    `leadId` VARCHAR(191) NULL,
    `stageId` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `priority` VARCHAR(191) NOT NULL DEFAULT 'MEDIUM',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Card_tenantId_stageId_idx`(`tenantId`, `stageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Conversation` (
    `id` VARCHAR(191) NOT NULL,
    `contactId` VARCHAR(191) NULL,
    `leadId` VARCHAR(191) NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `lastMessageAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` VARCHAR(191) NOT NULL DEFAULT 'OPEN',
    `aiManaged` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Conversation_tenantId_idx`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HandoverAlert` (
    `id` VARCHAR(191) NOT NULL,
    `conversationId` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `reason` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `HandoverAlert_tenantId_idx`(`tenantId`),
    INDEX `HandoverAlert_conversationId_idx`(`conversationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Message` (
    `id` VARCHAR(191) NOT NULL,
    `conversationId` VARCHAR(191) NOT NULL,
    `senderType` VARCHAR(191) NOT NULL,
    `senderId` VARCHAR(191) NULL,
    `content` TEXT NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'TEXT',
    `status` VARCHAR(191) NOT NULL DEFAULT 'SENT',
    `providerId` VARCHAR(191) NULL,
    `isAI` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `mediaUrl` TEXT NULL,

    INDEX `Message_conversationId_idx`(`conversationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Note` (
    `id` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `contactId` VARCHAR(191) NULL,
    `leadId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Note_tenantId_idx`(`tenantId`),
    INDEX `Note_contactId_idx`(`contactId`),
    INDEX `Note_leadId_idx`(`leadId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Contact` ADD CONSTRAINT `Contact_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Lead` ADD CONSTRAINT `Lead_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WhatsAppAccount` ADD CONSTRAINT `WhatsAppAccount_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WhatsAppPhoneNumber` ADD CONSTRAINT `WhatsAppPhoneNumber_whatsappAccountId_fkey` FOREIGN KEY (`whatsappAccountId`) REFERENCES `WhatsAppAccount`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pipeline` ADD CONSTRAINT `Pipeline_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Stage` ADD CONSTRAINT `Stage_pipelineId_fkey` FOREIGN KEY (`pipelineId`) REFERENCES `Pipeline`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Card` ADD CONSTRAINT `Card_contactId_fkey` FOREIGN KEY (`contactId`) REFERENCES `Contact`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Card` ADD CONSTRAINT `Card_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `Lead`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Card` ADD CONSTRAINT `Card_stageId_fkey` FOREIGN KEY (`stageId`) REFERENCES `Stage`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Conversation` ADD CONSTRAINT `Conversation_contactId_fkey` FOREIGN KEY (`contactId`) REFERENCES `Contact`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Conversation` ADD CONSTRAINT `Conversation_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `Lead`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Conversation` ADD CONSTRAINT `Conversation_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HandoverAlert` ADD CONSTRAINT `HandoverAlert_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `Conversation`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `Conversation`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Note` ADD CONSTRAINT `Note_contactId_fkey` FOREIGN KEY (`contactId`) REFERENCES `Contact`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Note` ADD CONSTRAINT `Note_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `Lead`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Note` ADD CONSTRAINT `Note_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Note` ADD CONSTRAINT `Note_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
