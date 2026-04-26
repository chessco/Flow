-- AlterTable
ALTER TABLE `PurchaseRequest` ADD COLUMN `externalId` INTEGER NULL;

-- CreateIndex
CREATE INDEX `PurchaseRequest_externalId_idx` ON `PurchaseRequest`(`externalId`);
