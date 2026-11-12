-- Nira: complete MySQL 8 DDL (tables, keys, CHECK constraints, indexes, views, function, procedure, triggers).
-- Generated from a database migrated with prisma/migrations using:
--   mysqldump --no-data --routines --triggers --skip-comments nira_dev
-- Apply the real thing with: npx prisma migrate deploy


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `_prisma_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logs` text COLLATE utf8mb4_unicode_ci,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `Amenity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Amenity` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `label` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Amenity_code_key` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `AuditLog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `AuditLog` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tableName` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rowId` int NOT NULL,
  `action` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `oldValue` json DEFAULT NULL,
  `newValue` json DEFAULT NULL,
  `changedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `AuditLog_tableName_rowId_changedAt_idx` (`tableName`,`rowId`,`changedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `Bank`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Bank` (
  `id` int NOT NULL AUTO_INCREMENT,
  `countryId` int NOT NULL,
  `name` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `kind` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `studentAccount` tinyint(1) NOT NULL DEFAULT '0',
  `monthlyFee` decimal(8,2) DEFAULT NULL,
  `currency` char(3) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notes` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `website` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Bank_countryId_name_key` (`countryId`,`name`),
  CONSTRAINT `Bank_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `Country` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `Block`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Block` (
  `blockerId` int NOT NULL,
  `blockedId` int NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`blockerId`,`blockedId`),
  KEY `Block_blockedId_idx` (`blockedId`),
  CONSTRAINT `Block_blockedId_fkey` FOREIGN KEY (`blockedId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Block_blockerId_fkey` FOREIGN KEY (`blockerId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`nira`@`127.0.0.1`*/ /*!50003 TRIGGER `trg_block_bi` BEFORE INSERT ON `block` FOR EACH ROW BEGIN
  IF NEW.`blockerId` = NEW.`blockedId` THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'A user cannot block themselves';
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
DROP TABLE IF EXISTS `BusinessProfile`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `BusinessProfile` (
  `userId` int NOT NULL,
  `displayName` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isVerified` tinyint(1) NOT NULL DEFAULT '0',
  `verifiedAt` datetime(3) DEFAULT NULL,
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`userId`),
  CONSTRAINT `BusinessProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `ChecklistTemplate`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ChecklistTemplate` (
  `id` int NOT NULL AUTO_INCREMENT,
  `countryId` int NOT NULL,
  `cityId` int DEFAULT NULL,
  `category` enum('BASICS','HOUSING','HEALTHCARE','MONEY','GROCERIES','TRANSPORT','SIM','LEGAL','CULTURE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(600) COLLATE utf8mb4_unicode_ci NOT NULL,
  `dueWithinDays` smallint DEFAULT NULL,
  `link` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `position` smallint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `ChecklistTemplate_countryId_title_key` (`countryId`,`title`),
  KEY `ChecklistTemplate_countryId_position_idx` (`countryId`,`position`),
  KEY `ChecklistTemplate_cityId_idx` (`cityId`),
  CONSTRAINT `ChecklistTemplate_cityId_fkey` FOREIGN KEY (`cityId`) REFERENCES `City` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ChecklistTemplate_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `Country` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `City`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `City` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `countryId` int NOT NULL,
  `lat` double DEFAULT NULL,
  `lng` double DEFAULT NULL,
  `regionId` int DEFAULT NULL,
  `photoCredit` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `photoUrl` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `City_countryId_regionId_name_key` (`countryId`,`regionId`,`name`),
  KEY `City_regionId_name_idx` (`regionId`,`name`),
  KEY `City_countryId_name_idx` (`countryId`,`name`),
  KEY `City_name_idx` (`name`),
  KEY `City_lat_lng_idx` (`lat`,`lng`),
  CONSTRAINT `City_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `Country` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `City_regionId_fkey` FOREIGN KEY (`regionId`) REFERENCES `Region` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `Conversation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Conversation` (
  `id` int NOT NULL AUTO_INCREMENT,
  `listingId` int DEFAULT NULL,
  `userAId` int NOT NULL,
  `userBId` int NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `contextKey` int NOT NULL DEFAULT '0',
  `lastMessageAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `lastMessagePreview` varchar(160) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lastSenderId` int DEFAULT NULL,
  `roommateRequestId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Conversation_userAId_userBId_contextKey_key` (`userAId`,`userBId`,`contextKey`),
  KEY `Conversation_userBId_lastMessageAt_idx` (`userBId`,`lastMessageAt`),
  KEY `Conversation_userAId_lastMessageAt_idx` (`userAId`,`lastMessageAt`),
  KEY `Conversation_listingId_idx` (`listingId`),
  KEY `Conversation_roommateRequestId_idx` (`roommateRequestId`),
  CONSTRAINT `Conversation_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `Listing` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Conversation_roommateRequestId_fkey` FOREIGN KEY (`roommateRequestId`) REFERENCES `RoommateRequest` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Conversation_userAId_fkey` FOREIGN KEY (`userAId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Conversation_userBId_fkey` FOREIGN KEY (`userBId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`nira`@`127.0.0.1`*/ /*!50003 TRIGGER `trg_conversation_bi` BEFORE INSERT ON `conversation` FOR EACH ROW BEGIN
  IF NEW.`userAId` >= NEW.`userBId` THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Conversation requires userAId < userBId';
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
DROP TABLE IF EXISTS `CostEstimate`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `CostEstimate` (
  `id` int NOT NULL AUTO_INCREMENT,
  `countryId` int NOT NULL,
  `cityId` int DEFAULT NULL,
  `category` enum('RENT_SHARED_ROOM','RENT_STUDIO','RENT_ONE_BEDROOM','GROCERIES_MONTH','TRANSPORT_MONTH','TRANSPORT_DAY','PHONE_MONTH','MEAL','COFFEE','STAY_NIGHT','ATTRACTION_ENTRY') COLLATE utf8mb4_unicode_ci NOT NULL,
  `tier` tinyint NOT NULL DEFAULT '0',
  `minPrice` decimal(10,2) NOT NULL,
  `maxPrice` decimal(10,2) NOT NULL,
  `currency` char(3) COLLATE utf8mb4_unicode_ci NOT NULL,
  `source` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `CostEstimate_countryId_cityId_category_tier_key` (`countryId`,`cityId`,`category`,`tier`),
  KEY `CostEstimate_cityId_category_idx` (`cityId`,`category`),
  CONSTRAINT `CostEstimate_cityId_fkey` FOREIGN KEY (`cityId`) REFERENCES `City` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `CostEstimate_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `Country` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_cost_range` CHECK (((`minPrice` >= 0) and (`minPrice` <= `maxPrice`))),
  CONSTRAINT `chk_cost_tier` CHECK ((`tier` between 0 and 4))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `Country`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Country` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `currency` char(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'USD',
  `flag` varchar(16) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isoCode` char(2) COLLATE utf8mb4_unicode_ci NOT NULL,
  `lat` double DEFAULT NULL,
  `lng` double DEFAULT NULL,
  `phoneCode` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `photoCredit` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `photoUrl` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Country_name_key` (`name`),
  UNIQUE KEY `Country_isoCode_key` (`isoCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `EmergencyNumber`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `EmergencyNumber` (
  `id` int NOT NULL AUTO_INCREMENT,
  `countryId` int NOT NULL,
  `service` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `number` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notes` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `EmergencyNumber_countryId_service_key` (`countryId`,`service`),
  CONSTRAINT `EmergencyNumber_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `Country` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `ExchangeRate`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ExchangeRate` (
  `base` char(3) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quote` char(3) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rate` decimal(18,8) NOT NULL,
  `fetchedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`base`,`quote`),
  CONSTRAINT `chk_rate_positive` CHECK ((`rate` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `GuideArticle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `GuideArticle` (
  `id` int NOT NULL AUTO_INCREMENT,
  `countryId` int NOT NULL,
  `cityId` int DEFAULT NULL,
  `category` enum('BASICS','HOUSING','HEALTHCARE','MONEY','GROCERIES','TRANSPORT','SIM','LEGAL','CULTURE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `summary` varchar(400) COLLATE utf8mb4_unicode_ci NOT NULL,
  `body` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `sourceName` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sourceUrl` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `position` smallint NOT NULL DEFAULT '0',
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `GuideArticle_countryId_slug_key` (`countryId`,`slug`),
  KEY `GuideArticle_countryId_category_position_idx` (`countryId`,`category`,`position`),
  KEY `GuideArticle_cityId_idx` (`cityId`),
  FULLTEXT KEY `GuideArticle_title_summary_body_idx` (`title`,`summary`,`body`),
  CONSTRAINT `GuideArticle_cityId_fkey` FOREIGN KEY (`cityId`) REFERENCES `City` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `GuideArticle_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `Country` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `Itinerary`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Itinerary` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `cityId` int NOT NULL,
  `days` smallint NOT NULL,
  `peopleCount` smallint NOT NULL,
  `budget` decimal(10,2) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `currency` char(3) COLLATE utf8mb4_unicode_ci NOT NULL,
  `minViableBudget` decimal(10,2) DEFAULT NULL,
  `pace` enum('RELAXED','NORMAL','PACKED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'NORMAL',
  `pctActivities` tinyint NOT NULL DEFAULT '20',
  `pctFood` tinyint NOT NULL DEFAULT '30',
  `pctStay` tinyint NOT NULL DEFAULT '40',
  `pctTransport` tinyint NOT NULL DEFAULT '10',
  `roomsNeeded` smallint NOT NULL DEFAULT '1',
  `shareToken` char(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `startDate` date DEFAULT NULL,
  `stayPreference` enum('ANY','HOSTEL','HOTEL','APARTMENT') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ANY',
  `style` enum('BUDGET','BALANCED','COMFORT') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'BALANCED',
  `title` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Itinerary_shareToken_key` (`shareToken`),
  KEY `Itinerary_userId_createdAt_idx` (`userId`,`createdAt`),
  KEY `Itinerary_cityId_idx` (`cityId`),
  CONSTRAINT `Itinerary_cityId_fkey` FOREIGN KEY (`cityId`) REFERENCES `City` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Itinerary_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_itin_budget` CHECK ((`budget` > 0)),
  CONSTRAINT `chk_itin_days` CHECK ((`days` between 1 and 30)),
  CONSTRAINT `chk_itin_people` CHECK (((`peopleCount` between 1 and 50) and (`roomsNeeded` between 1 and 50))),
  CONSTRAINT `chk_itin_split` CHECK (((`pctStay` between 0 and 100) and (`pctFood` between 0 and 100) and (`pctActivities` between 0 and 100) and (`pctTransport` between 0 and 100) and ((((`pctStay` + `pctFood`) + `pctActivities`) + `pctTransport`) = 100)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `ItineraryInterest`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ItineraryInterest` (
  `itineraryId` int NOT NULL,
  `interest` enum('CULTURE','FOOD','NATURE','NIGHTLIFE','SHOPPING','ADVENTURE','FAMILY') COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`itineraryId`,`interest`),
  CONSTRAINT `ItineraryInterest_itineraryId_fkey` FOREIGN KEY (`itineraryId`) REFERENCES `Itinerary` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `ItineraryItem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ItineraryItem` (
  `id` int NOT NULL AUTO_INCREMENT,
  `itineraryId` int NOT NULL,
  `dayNumber` smallint NOT NULL,
  `poiId` int DEFAULT NULL,
  `listingId` int DEFAULT NULL,
  `timeSlot` enum('STAY','MORNING','LUNCH','AFTERNOON','DINNER','EVENING') COLLATE utf8mb4_unicode_ci NOT NULL,
  `estimatedCost` decimal(10,2) NOT NULL,
  `kind` enum('STAY','FOOD','ACTIVITY','TRANSPORT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `lat` double DEFAULT NULL,
  `lng` double DEFAULT NULL,
  `notes` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `position` smallint NOT NULL DEFAULT '0',
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ItineraryItem_itineraryId_dayNumber_position_idx` (`itineraryId`,`dayNumber`,`position`),
  KEY `ItineraryItem_poiId_idx` (`poiId`),
  KEY `ItineraryItem_listingId_idx` (`listingId`),
  CONSTRAINT `ItineraryItem_itineraryId_fkey` FOREIGN KEY (`itineraryId`) REFERENCES `Itinerary` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ItineraryItem_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `Listing` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `ItineraryItem_poiId_fkey` FOREIGN KEY (`poiId`) REFERENCES `POI` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_item_cost` CHECK ((`estimatedCost` >= 0)),
  CONSTRAINT `chk_item_day` CHECK ((`dayNumber` >= 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `Language`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Language` (
  `code` varchar(8) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`code`),
  UNIQUE KEY `Language_name_key` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `Listing`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Listing` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ownerId` int NOT NULL,
  `cityId` int NOT NULL,
  `type` enum('DORM','APARTMENT','STUDIO','SHARED_ROOM','PRIVATE_ROOM') COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(140) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `isShareable` tinyint(1) NOT NULL DEFAULT '0',
  `legacyPhotos` longtext COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `capacityMax` smallint NOT NULL DEFAULT '1',
  `capacityMin` smallint NOT NULL DEFAULT '1',
  `currency` char(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'USD',
  `currentOccupants` smallint NOT NULL DEFAULT '0',
  `preference` enum('ANYONE','FEMALE_ONLY','MALE_ONLY') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ANYONE',
  `availableFrom` date DEFAULT NULL,
  `bathrooms` smallint NOT NULL DEFAULT '1',
  `bedrooms` smallint NOT NULL DEFAULT '1',
  `billsEstimate` decimal(10,2) DEFAULT NULL,
  `deposit` decimal(10,2) NOT NULL DEFAULT '0.00',
  `description` text COLLATE utf8mb4_unicode_ci,
  `furnished` tinyint(1) NOT NULL DEFAULT '0',
  `guestsAllowed` tinyint(1) NOT NULL DEFAULT '1',
  `lat` double DEFAULT NULL,
  `lng` double DEFAULT NULL,
  `minStayMonths` smallint NOT NULL DEFAULT '1',
  `petsAllowed` tinyint(1) NOT NULL DEFAULT '0',
  `sizeSqm` smallint DEFAULT NULL,
  `smokingAllowed` tinyint(1) NOT NULL DEFAULT '0',
  `status` enum('ACTIVE','RENTED','ARCHIVED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `utilitiesIncluded` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `Listing_cityId_status_price_idx` (`cityId`,`status`,`price`),
  KEY `Listing_ownerId_status_idx` (`ownerId`,`status`),
  KEY `Listing_status_createdAt_idx` (`status`,`createdAt`),
  KEY `Listing_type_idx` (`type`),
  KEY `Listing_availableFrom_idx` (`availableFrom`),
  KEY `Listing_lat_lng_idx` (`lat`,`lng`),
  FULLTEXT KEY `Listing_title_description_idx` (`title`,`description`),
  CONSTRAINT `Listing_cityId_fkey` FOREIGN KEY (`cityId`) REFERENCES `City` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Listing_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_listing_bills` CHECK (((`billsEstimate` is null) or (`billsEstimate` >= 0))),
  CONSTRAINT `chk_listing_capacity` CHECK (((`capacityMin` >= 1) and (`capacityMin` <= `capacityMax`))),
  CONSTRAINT `chk_listing_deposit` CHECK ((`deposit` >= 0)),
  CONSTRAINT `chk_listing_lat` CHECK (((`lat` is null) or (`lat` between -(90) and 90))),
  CONSTRAINT `chk_listing_lng` CHECK (((`lng` is null) or (`lng` between -(180) and 180))),
  CONSTRAINT `chk_listing_min_stay` CHECK ((`minStayMonths` >= 1)),
  CONSTRAINT `chk_listing_occupants` CHECK (((`currentOccupants` >= 0) and (`currentOccupants` <= `capacityMax`))),
  CONSTRAINT `chk_listing_price` CHECK ((`price` >= 0)),
  CONSTRAINT `chk_listing_rooms` CHECK (((`bedrooms` >= 0) and (`bathrooms` >= 0))),
  CONSTRAINT `chk_listing_size` CHECK (((`sizeSqm` is null) or (`sizeSqm` > 0)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`nira`@`127.0.0.1`*/ /*!50003 TRIGGER `trg_listing_occupancy_bu` BEFORE UPDATE ON `listing` FOR EACH ROW BEGIN
  IF NEW.`isShareable` AND NEW.`currentOccupants` >= NEW.`capacityMax` AND NEW.`status` = 'ACTIVE' THEN
    SET NEW.`status` = 'RENTED';
  ELSEIF NEW.`isShareable` AND OLD.`status` = 'RENTED' AND NEW.`status` = 'RENTED'
         AND NEW.`currentOccupants` < OLD.`currentOccupants` THEN
    SET NEW.`status` = 'ACTIVE';
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`nira`@`127.0.0.1`*/ /*!50003 TRIGGER `trg_listing_audit_au` AFTER UPDATE ON `listing` FOR EACH ROW BEGIN
  IF NOT (OLD.`price` <=> NEW.`price`) OR NOT (OLD.`status` <=> NEW.`status`) THEN
    INSERT INTO `AuditLog` (`tableName`, `rowId`, `action`, `oldValue`, `newValue`, `changedAt`)
    VALUES ('Listing', NEW.`id`, 'UPDATE',
            JSON_OBJECT('price', OLD.`price`, 'status', OLD.`status`),
            JSON_OBJECT('price', NEW.`price`, 'status', NEW.`status`),
            NOW(3));
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
DROP TABLE IF EXISTS `ListingAmenity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ListingAmenity` (
  `listingId` int NOT NULL,
  `amenityId` int NOT NULL,
  PRIMARY KEY (`listingId`,`amenityId`),
  KEY `ListingAmenity_amenityId_idx` (`amenityId`),
  CONSTRAINT `ListingAmenity_amenityId_fkey` FOREIGN KEY (`amenityId`) REFERENCES `Amenity` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `ListingAmenity_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `Listing` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `ListingPhoto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ListingPhoto` (
  `id` int NOT NULL AUTO_INCREMENT,
  `listingId` int NOT NULL,
  `url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `storageKey` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `position` smallint NOT NULL DEFAULT '0',
  `caption` varchar(140) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `credit` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ListingPhoto_listingId_position_idx` (`listingId`,`position`),
  CONSTRAINT `ListingPhoto_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `Listing` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `ListingView`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ListingView` (
  `id` int NOT NULL AUTO_INCREMENT,
  `listingId` int NOT NULL,
  `viewerId` int DEFAULT NULL,
  `viewerKey` char(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `viewedOn` date NOT NULL,
  `viewedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ListingView_listingId_viewerKey_viewedOn_key` (`listingId`,`viewerKey`,`viewedOn`),
  KEY `ListingView_viewerId_viewedAt_idx` (`viewerId`,`viewedAt`),
  CONSTRAINT `ListingView_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `Listing` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ListingView_viewerId_fkey` FOREIGN KEY (`viewerId`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `PasswordResetToken`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `PasswordResetToken` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `tokenHash` char(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiresAt` datetime(3) NOT NULL,
  `usedAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `PasswordResetToken_tokenHash_key` (`tokenHash`),
  KEY `PasswordResetToken_userId_idx` (`userId`),
  CONSTRAINT `PasswordResetToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `POI`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `POI` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cityId` int DEFAULT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` enum('RESTAURANT','CAFE','FAST_FOOD','SUPERMARKET','CONVENIENCE','HOSPITAL','CLINIC','PHARMACY','DOCTOR','BANK','ATM','CURRENCY_EXCHANGE','TRANSIT','MOBILE_SHOP','LAUNDRY','GYM','UNIVERSITY','POST_OFFICE','POLICE','HOTEL','HOSTEL','GUEST_HOUSE','CAMP_SITE','ATTRACTION','MUSEUM','VIEWPOINT','GALLERY','HISTORIC','PARK','NIGHTLIFE','SHOPPING') COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lat` double NOT NULL,
  `lng` double NOT NULL,
  `priceTier` tinyint DEFAULT NULL,
  `lastSyncedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `cuisine` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `openingHours` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `osmId` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tags` json DEFAULT NULL,
  `website` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `POI_osmId_key` (`osmId`),
  KEY `POI_cityId_category_idx` (`cityId`,`category`),
  KEY `POI_category_lat_lng_idx` (`category`,`lat`,`lng`),
  KEY `POI_lat_lng_idx` (`lat`,`lng`),
  CONSTRAINT `POI_cityId_fkey` FOREIGN KEY (`cityId`) REFERENCES `City` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_poi_lat` CHECK ((`lat` between -(90) and 90)),
  CONSTRAINT `chk_poi_lng` CHECK ((`lng` between -(180) and 180)),
  CONSTRAINT `chk_poi_tier` CHECK (((`priceTier` is null) or (`priceTier` between 1 and 4)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `PoiQueryCache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `PoiQueryCache` (
  `id` int NOT NULL AUTO_INCREMENT,
  `areaKey` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` enum('RESTAURANT','CAFE','FAST_FOOD','SUPERMARKET','CONVENIENCE','HOSPITAL','CLINIC','PHARMACY','DOCTOR','BANK','ATM','CURRENCY_EXCHANGE','TRANSIT','MOBILE_SHOP','LAUNDRY','GYM','UNIVERSITY','POST_OFFICE','POLICE','HOTEL','HOSTEL','GUEST_HOUSE','CAMP_SITE','ATTRACTION','MUSEUM','VIEWPOINT','GALLERY','HISTORIC','PARK','NIGHTLIFE','SHOPPING') COLLATE utf8mb4_unicode_ci NOT NULL,
  `resultCount` int NOT NULL DEFAULT '0',
  `fetchedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `PoiQueryCache_areaKey_category_key` (`areaKey`,`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `Region`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Region` (
  `id` int NOT NULL AUTO_INCREMENT,
  `countryId` int NOT NULL,
  `isoCode` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `lat` double DEFAULT NULL,
  `lng` double DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Region_countryId_isoCode_key` (`countryId`,`isoCode`),
  KEY `Region_countryId_name_idx` (`countryId`,`name`),
  CONSTRAINT `Region_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `Country` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `Report`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Report` (
  `id` int NOT NULL AUTO_INCREMENT,
  `reporterId` int NOT NULL,
  `reportedUserId` int DEFAULT NULL,
  `listingId` int DEFAULT NULL,
  `reason` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `details` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('OPEN','REVIEWED','DISMISSED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'OPEN',
  `resolvedById` int DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `resolvedAt` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `Report_status_createdAt_idx` (`status`,`createdAt`),
  KEY `Report_reporterId_idx` (`reporterId`),
  KEY `Report_reportedUserId_idx` (`reportedUserId`),
  KEY `Report_listingId_idx` (`listingId`),
  KEY `Report_resolvedById_idx` (`resolvedById`),
  CONSTRAINT `Report_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `Listing` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Report_reportedUserId_fkey` FOREIGN KEY (`reportedUserId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Report_reporterId_fkey` FOREIGN KEY (`reporterId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Report_resolvedById_fkey` FOREIGN KEY (`resolvedById`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `RideService`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `RideService` (
  `id` int NOT NULL AUTO_INCREMENT,
  `countryId` int NOT NULL,
  `name` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `kind` enum('RIDE_HAILING','TAXI','BIKE_SHARE','SCOOTER') COLLATE utf8mb4_unicode_ci NOT NULL,
  `website` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deepLink` varchar(400) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `position` smallint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `RideService_countryId_name_key` (`countryId`,`name`),
  KEY `RideService_countryId_kind_idx` (`countryId`,`kind`),
  CONSTRAINT `RideService_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `Country` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_ride_link` CHECK (((`deepLink` is null) or (`deepLink` like _utf8mb4'http%') or (`deepLink` like _utf8mb4'%://%')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `RoommateRequest`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `RoommateRequest` (
  `id` int NOT NULL AUTO_INCREMENT,
  `listingId` int NOT NULL,
  `requesterId` int NOT NULL,
  `status` enum('OPEN','MATCHED','CLOSED','WITHDRAWN') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'OPEN',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `budgetShare` decimal(10,2) DEFAULT NULL,
  `decidedAt` datetime(3) DEFAULT NULL,
  `message` varchar(600) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `moveInDate` date DEFAULT NULL,
  `openRequesterId` int DEFAULT NULL,
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `RoommateRequest_listingId_openRequesterId_key` (`listingId`,`openRequesterId`),
  KEY `RoommateRequest_listingId_status_idx` (`listingId`,`status`),
  KEY `RoommateRequest_requesterId_status_idx` (`requesterId`,`status`),
  CONSTRAINT `RoommateRequest_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `Listing` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `RoommateRequest_requesterId_fkey` FOREIGN KEY (`requesterId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_request_budget` CHECK (((`budgetShare` is null) or (`budgetShare` >= 0)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`nira`@`127.0.0.1`*/ /*!50003 TRIGGER `trg_request_open_bi` BEFORE INSERT ON `roommaterequest` FOR EACH ROW SET NEW.`openRequesterId` = IF(NEW.`status` = 'OPEN', NEW.`requesterId`, NULL); */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`nira`@`127.0.0.1`*/ /*!50003 TRIGGER `trg_request_open_bu` BEFORE UPDATE ON `roommaterequest` FOR EACH ROW SET NEW.`openRequesterId` = IF(NEW.`status` = 'OPEN', NEW.`requesterId`, NULL); */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
DROP TABLE IF EXISTS `SavedListing`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `SavedListing` (
  `userId` int NOT NULL,
  `listingId` int NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`userId`,`listingId`),
  KEY `SavedListing_listingId_idx` (`listingId`),
  CONSTRAINT `SavedListing_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `Listing` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `SavedListing_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `SimPlan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `SimPlan` (
  `id` int NOT NULL AUTO_INCREMENT,
  `providerId` int NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `kind` enum('PREPAID','POSTPAID') COLLATE utf8mb4_unicode_ci NOT NULL,
  `priceMonthly` decimal(8,2) NOT NULL,
  `currency` char(3) COLLATE utf8mb4_unicode_ci NOT NULL,
  `dataGb` decimal(6,1) DEFAULT NULL,
  `euRoaming` tinyint(1) NOT NULL DEFAULT '0',
  `notes` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `SimPlan_providerId_name_key` (`providerId`,`name`),
  KEY `SimPlan_providerId_kind_idx` (`providerId`,`kind`),
  CONSTRAINT `SimPlan_providerId_fkey` FOREIGN KEY (`providerId`) REFERENCES `SimProvider` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_simplan_data` CHECK (((`dataGb` is null) or (`dataGb` >= 0))),
  CONSTRAINT `chk_simplan_price` CHECK ((`priceMonthly` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `SimProvider`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `SimProvider` (
  `id` int NOT NULL AUTO_INCREMENT,
  `countryId` int NOT NULL,
  `name` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `isMvno` tinyint(1) NOT NULL DEFAULT '0',
  `network` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `website` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `whereToBuy` varchar(300) COLLATE utf8mb4_unicode_ci NOT NULL,
  `documentsNeeded` varchar(300) COLLATE utf8mb4_unicode_ci NOT NULL,
  `studentTip` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `touristTip` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `SimProvider_countryId_name_key` (`countryId`,`name`),
  CONSTRAINT `SimProvider_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `Country` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `SupermarketChain`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `SupermarketChain` (
  `id` int NOT NULL AUTO_INCREMENT,
  `countryId` int NOT NULL,
  `name` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `priceTier` tinyint NOT NULL,
  `notes` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `website` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `SupermarketChain_countryId_name_key` (`countryId`,`name`),
  CONSTRAINT `SupermarketChain_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `Country` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_market_tier` CHECK ((`priceTier` between 1 and 4))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `TransportMode`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `TransportMode` (
  `id` int NOT NULL AUTO_INCREMENT,
  `countryId` int NOT NULL,
  `mode` enum('TRAIN','TRAM','BUS','METRO','BOAT','CABLE_CAR','BIKE','WALK') COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL,
  `howToBuy` varchar(600) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `apps` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `priceRange` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `position` smallint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `TransportMode_countryId_mode_key` (`countryId`,`mode`),
  CONSTRAINT `TransportMode_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `Country` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `TransportPass`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `TransportPass` (
  `id` int NOT NULL AUTO_INCREMENT,
  `countryId` int NOT NULL,
  `cityId` int DEFAULT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(600) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(8,2) DEFAULT NULL,
  `currency` char(3) COLLATE utf8mb4_unicode_ci NOT NULL,
  `validity` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `audience` enum('EVERYONE','YOUTH','STUDENT','TOURIST','SENIOR') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'EVERYONE',
  `url` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `TransportPass_countryId_name_key` (`countryId`,`name`),
  KEY `TransportPass_countryId_audience_idx` (`countryId`,`audience`),
  KEY `TransportPass_cityId_idx` (`cityId`),
  CONSTRAINT `TransportPass_cityId_fkey` FOREIGN KEY (`cityId`) REFERENCES `City` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `TransportPass_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `Country` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `User`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `User` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `passwordHash` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('USER','BUSINESS','ADMIN') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'USER',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `onboardedAt` datetime(3) DEFAULT NULL,
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_email_key` (`email`),
  KEY `User_role_isActive_idx` (`role`,`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `UserChecklistProgress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `UserChecklistProgress` (
  `userId` int NOT NULL,
  `itemId` int NOT NULL,
  `completedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`userId`,`itemId`),
  KEY `UserChecklistProgress_itemId_idx` (`itemId`),
  CONSTRAINT `UserChecklistProgress_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `ChecklistTemplate` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `UserChecklistProgress_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `UserLanguage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `UserLanguage` (
  `userId` int NOT NULL,
  `languageCode` varchar(8) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`userId`,`languageCode`),
  KEY `UserLanguage_languageCode_idx` (`languageCode`),
  CONSTRAINT `UserLanguage_languageCode_fkey` FOREIGN KEY (`languageCode`) REFERENCES `Language` (`code`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `UserLanguage_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `UserProfile`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `UserProfile` (
  `userId` int NOT NULL,
  `occupation` enum('STUDENT','PROFESSIONAL','OTHER') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'OTHER',
  `organization` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `destinationCityId` int DEFAULT NULL,
  `budgetMonthly` decimal(10,2) DEFAULT NULL,
  `budgetCurrency` char(3) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `moveInDate` date DEFAULT NULL,
  `bio` varchar(600) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gender` enum('FEMALE','MALE','NON_BINARY','UNDISCLOSED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'UNDISCLOSED',
  `smoking` enum('NON_SMOKER','OUTSIDE_ONLY','SMOKER') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'NON_SMOKER',
  `hasPets` tinyint(1) NOT NULL DEFAULT '0',
  `okWithPets` tinyint(1) NOT NULL DEFAULT '1',
  `socialStyle` enum('QUIET','BALANCED','SOCIAL') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'BALANCED',
  `sleepSchedule` enum('EARLY_BIRD','FLEXIBLE','NIGHT_OWL') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'FLEXIBLE',
  `roommateGender` enum('ANYONE','FEMALE_ONLY','MALE_ONLY') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ANYONE',
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `homeCountryId` int DEFAULT NULL,
  PRIMARY KEY (`userId`),
  KEY `UserProfile_destinationCityId_idx` (`destinationCityId`),
  KEY `UserProfile_homeCountryId_idx` (`homeCountryId`),
  CONSTRAINT `UserProfile_destinationCityId_fkey` FOREIGN KEY (`destinationCityId`) REFERENCES `City` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `UserProfile_homeCountryId_fkey` FOREIGN KEY (`homeCountryId`) REFERENCES `Country` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `UserProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_profile_budget` CHECK (((`budgetMonthly` is null) or (`budgetMonthly` >= 0)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `v_listing_summary`;
/*!50001 DROP VIEW IF EXISTS `v_listing_summary`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_listing_summary` AS SELECT 
 1 AS `id`,
 1 AS `ownerId`,
 1 AS `title`,
 1 AS `type`,
 1 AS `status`,
 1 AS `address`,
 1 AS `price`,
 1 AS `deposit`,
 1 AS `currency`,
 1 AS `bedrooms`,
 1 AS `bathrooms`,
 1 AS `sizeSqm`,
 1 AS `furnished`,
 1 AS `availableFrom`,
 1 AS `minStayMonths`,
 1 AS `isShareable`,
 1 AS `capacityMin`,
 1 AS `capacityMax`,
 1 AS `currentOccupants`,
 1 AS `spotsLeft`,
 1 AS `genderPreference`,
 1 AS `lat`,
 1 AS `lng`,
 1 AS `createdAt`,
 1 AS `cityId`,
 1 AS `cityName`,
 1 AS `regionId`,
 1 AS `regionName`,
 1 AS `countryId`,
 1 AS `countryName`,
 1 AS `countryCode`,
 1 AS `ownerName`,
 1 AS `ownerVerified`,
 1 AS `coverUrl`,
 1 AS `photoCount`,
 1 AS `openRequests`*/;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `v_roommate_compatibility`;
/*!50001 DROP VIEW IF EXISTS `v_roommate_compatibility`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_roommate_compatibility` AS SELECT 
 1 AS `viewerId`,
 1 AS `requestId`,
 1 AS `requesterId`,
 1 AS `listingId`,
 1 AS `cityId`,
 1 AS `score`*/;
SET character_set_client = @saved_cs_client;
/*!50003 DROP FUNCTION IF EXISTS `fn_distance_km` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE FUNCTION `fn_distance_km`(lat1 DOUBLE, lng1 DOUBLE, lat2 DOUBLE, lng2 DOUBLE) RETURNS double
    NO SQL
    DETERMINISTIC
BEGIN
  DECLARE dlat DOUBLE;
  DECLARE dlng DOUBLE;
  DECLARE a DOUBLE;
  IF lat1 IS NULL OR lng1 IS NULL OR lat2 IS NULL OR lng2 IS NULL THEN
    RETURN NULL;
  END IF;
  SET dlat = RADIANS(lat2 - lat1);
  SET dlng = RADIANS(lng2 - lng1);
  SET a = SIN(dlat / 2) * SIN(dlat / 2)
        + COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * SIN(dlng / 2) * SIN(dlng / 2);
  RETURN 6371.0088 * 2 * ATAN2(SQRT(a), SQRT(1 - a));
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_spots_left` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE FUNCTION `fn_spots_left`(capacity_max INT, occupants INT) RETURNS int
    NO SQL
    DETERMINISTIC
RETURN GREATEST(capacity_max - occupants, 0); ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_mark_listing_rented` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_mark_listing_rented`(IN p_listing_id INT, IN p_owner_id INT, OUT p_closed INT)
BEGIN
  DECLARE v_owner INT DEFAULT NULL;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;
  SELECT `ownerId` INTO v_owner FROM `Listing` WHERE `id` = p_listing_id FOR UPDATE;
  IF v_owner IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'LISTING_NOT_FOUND';
  END IF;
  IF v_owner <> p_owner_id THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'NOT_OWNER';
  END IF;

  UPDATE `Listing` SET `status` = 'RENTED' WHERE `id` = p_listing_id;
  UPDATE `RoommateRequest`
     SET `status` = 'CLOSED', `decidedAt` = NOW(3)
   WHERE `listingId` = p_listing_id AND `status` = 'OPEN';
  SET p_closed = ROW_COUNT();
  COMMIT;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50001 DROP VIEW IF EXISTS `v_listing_summary`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 SQL SECURITY DEFINER */
/*!50001 VIEW `v_listing_summary` AS select `l`.`id` AS `id`,`l`.`ownerId` AS `ownerId`,`l`.`title` AS `title`,`l`.`type` AS `type`,`l`.`status` AS `status`,`l`.`address` AS `address`,`l`.`price` AS `price`,`l`.`deposit` AS `deposit`,`l`.`currency` AS `currency`,`l`.`bedrooms` AS `bedrooms`,`l`.`bathrooms` AS `bathrooms`,`l`.`sizeSqm` AS `sizeSqm`,`l`.`furnished` AS `furnished`,`l`.`availableFrom` AS `availableFrom`,`l`.`minStayMonths` AS `minStayMonths`,`l`.`isShareable` AS `isShareable`,`l`.`capacityMin` AS `capacityMin`,`l`.`capacityMax` AS `capacityMax`,`l`.`currentOccupants` AS `currentOccupants`,`fn_spots_left`(`l`.`capacityMax`,`l`.`currentOccupants`) AS `spotsLeft`,`l`.`preference` AS `genderPreference`,`l`.`lat` AS `lat`,`l`.`lng` AS `lng`,`l`.`createdAt` AS `createdAt`,`c`.`id` AS `cityId`,`c`.`name` AS `cityName`,`r`.`id` AS `regionId`,`r`.`name` AS `regionName`,`co`.`id` AS `countryId`,`co`.`name` AS `countryName`,`co`.`isoCode` AS `countryCode`,coalesce(`bp`.`displayName`,`u`.`name`) AS `ownerName`,coalesce(`bp`.`isVerified`,false) AS `ownerVerified`,(select `p`.`url` from `listingphoto` `p` where (`p`.`listingId` = `l`.`id`) order by `p`.`position`,`p`.`id` limit 1) AS `coverUrl`,(select count(0) from `listingphoto` `p` where (`p`.`listingId` = `l`.`id`)) AS `photoCount`,(select count(0) from `roommaterequest` `rr` where ((`rr`.`listingId` = `l`.`id`) and (`rr`.`status` = 'OPEN'))) AS `openRequests` from (((((`listing` `l` join `city` `c` on((`c`.`id` = `l`.`cityId`))) join `country` `co` on((`co`.`id` = `c`.`countryId`))) left join `region` `r` on((`r`.`id` = `c`.`regionId`))) join `user` `u` on((`u`.`id` = `l`.`ownerId`))) left join `businessprofile` `bp` on((`bp`.`userId` = `l`.`ownerId`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `v_roommate_compatibility`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 SQL SECURITY DEFINER */
/*!50001 VIEW `v_roommate_compatibility` AS select `vp`.`userId` AS `viewerId`,`rr`.`id` AS `requestId`,`rr`.`requesterId` AS `requesterId`,`rr`.`listingId` AS `listingId`,`l`.`cityId` AS `cityId`,round((((((((case when ((`vp`.`budgetMonthly` is null) or (coalesce(`rr`.`budgetShare`,`rp`.`budgetMonthly`) is null) or (greatest(`vp`.`budgetMonthly`,coalesce(`rr`.`budgetShare`,`rp`.`budgetMonthly`)) = 0)) then 15 else ((30 * least(`vp`.`budgetMonthly`,coalesce(`rr`.`budgetShare`,`rp`.`budgetMonthly`))) / greatest(`vp`.`budgetMonthly`,coalesce(`rr`.`budgetShare`,`rp`.`budgetMonthly`))) end) + (case when ((`vp`.`moveInDate` is null) or (coalesce(`rr`.`moveInDate`,`rp`.`moveInDate`) is null)) then 10 else (20 * greatest(0,(1 - (abs((to_days(`vp`.`moveInDate`) - to_days(coalesce(`rr`.`moveInDate`,`rp`.`moveInDate`)))) / 60)))) end)) + (case when (((`l`.`preference` = 'FEMALE_ONLY') and (`vp`.`gender` <> 'FEMALE')) or ((`l`.`preference` = 'MALE_ONLY') and (`vp`.`gender` <> 'MALE')) or ((`vp`.`roommateGender` = 'FEMALE_ONLY') and (coalesce(`rp`.`gender`,'UNDISCLOSED') <> 'FEMALE')) or ((`vp`.`roommateGender` = 'MALE_ONLY') and (coalesce(`rp`.`gender`,'UNDISCLOSED') <> 'MALE')) or ((coalesce(`rp`.`roommateGender`,'ANYONE') = 'FEMALE_ONLY') and (`vp`.`gender` <> 'FEMALE')) or ((coalesce(`rp`.`roommateGender`,'ANYONE') = 'MALE_ONLY') and (`vp`.`gender` <> 'MALE'))) then 0 else 20 end)) + (case when (`vp`.`smoking` = coalesce(`rp`.`smoking`,'NON_SMOKER')) then 10 when (((`vp`.`smoking` = 'NON_SMOKER') and (`rp`.`smoking` = 'SMOKER')) or ((`vp`.`smoking` = 'SMOKER') and (coalesce(`rp`.`smoking`,'NON_SMOKER') = 'NON_SMOKER'))) then 0 else 5 end)) + (case when (((0 <> `vp`.`hasPets`) and (0 = coalesce(`rp`.`okWithPets`,true))) or ((0 <> coalesce(`rp`.`hasPets`,false)) and (0 = `vp`.`okWithPets`))) then 0 else 10 end)) + (case when (`vp`.`socialStyle` = coalesce(`rp`.`socialStyle`,'BALANCED')) then 5 when ('BALANCED' in (`vp`.`socialStyle`,coalesce(`rp`.`socialStyle`,'BALANCED'))) then 2.5 else 0 end)) + (case when (`vp`.`sleepSchedule` = coalesce(`rp`.`sleepSchedule`,'FLEXIBLE')) then 5 when ('FLEXIBLE' in (`vp`.`sleepSchedule`,coalesce(`rp`.`sleepSchedule`,'FLEXIBLE'))) then 2.5 else 0 end)),0) AS `score` from (((`userprofile` `vp` join `listing` `l` on(((`l`.`cityId` = `vp`.`destinationCityId`) and (`l`.`isShareable` = true) and (`l`.`status` = 'ACTIVE')))) join `roommaterequest` `rr` on(((`rr`.`listingId` = `l`.`id`) and (`rr`.`status` = 'OPEN') and (`rr`.`requesterId` <> `vp`.`userId`)))) left join `userprofile` `rp` on((`rp`.`userId` = `rr`.`requesterId`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

