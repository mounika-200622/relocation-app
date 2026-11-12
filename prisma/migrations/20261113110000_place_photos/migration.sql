-- Cover photos (with attribution) for countries and cities, and a credit line
-- for listing photos that come from Wikimedia Commons.
-- AlterTable
ALTER TABLE `City` ADD COLUMN `photoCredit` VARCHAR(300) NULL,
    ADD COLUMN `photoUrl` VARCHAR(300) NULL;

-- AlterTable
ALTER TABLE `Country` ADD COLUMN `photoCredit` VARCHAR(300) NULL,
    ADD COLUMN `photoUrl` VARCHAR(300) NULL;

-- AlterTable
ALTER TABLE `ListingPhoto` ADD COLUMN `credit` VARCHAR(300) NULL;
