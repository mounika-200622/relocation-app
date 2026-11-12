-- Taxis / ride-hailing per country, and a (lat, lng) index on City for
-- "which city am I in?" lookups from the phone's GPS.
-- CreateTable
CREATE TABLE `RideService` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `countryId` INTEGER NOT NULL,
    `name` VARCHAR(80) NOT NULL,
    `kind` ENUM('RIDE_HAILING', 'TAXI', 'BIKE_SHARE', 'SCOOTER') NOT NULL,
    `website` VARCHAR(200) NULL,
    `deepLink` VARCHAR(400) NULL,
    `phone` VARCHAR(30) NULL,
    `notes` VARCHAR(300) NULL,
    `position` SMALLINT NOT NULL DEFAULT 0,

    INDEX `RideService_countryId_kind_idx`(`countryId`, `kind`),
    UNIQUE INDEX `RideService_countryId_name_key`(`countryId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `City_lat_lng_idx` ON `City`(`lat`, `lng`);

-- AddForeignKey
ALTER TABLE `RideService` ADD CONSTRAINT `RideService_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `Country`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `RideService` ADD CONSTRAINT `chk_ride_link` CHECK (`deepLink` IS NULL OR `deepLink` LIKE 'http%' OR `deepLink` LIKE '%://%');
