-- CreateTable
CREATE TABLE `Task` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `dueDate` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'New',
    `priority` VARCHAR(191) NOT NULL DEFAULT 'Medium',
    `contactId` VARCHAR(191) NULL,
    `leadId` VARCHAR(191) NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Task_tenantId_idx`(`tenantId`),
    INDEX `Task_contactId_idx`(`contactId`),
    INDEX `Task_leadId_idx`(`leadId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_contactId_fkey` FOREIGN KEY (`contactId`) REFERENCES `Contact`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `Lead`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
