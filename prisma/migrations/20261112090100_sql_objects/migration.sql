-- ============================================================================
-- Nira: database objects Prisma cannot express in schema.prisma.
--   * CHECK constraints (domain integrity)
--   * fn_distance_km           – stored function (Haversine)
--   * fn_spots_left            – stored function
--   * v_listing_summary        – view used by search / dashboards
--   * v_roommate_compatibility – view scoring seeker <-> open request pairs
--   * sp_mark_listing_rented   – stored procedure (transaction + row lock)
--   * triggers: audit log, occupancy sync, one-open-request rule, chat pair order
-- ============================================================================

-- ---------------------------------------------------------------- CHECKs
ALTER TABLE `Listing`
  ADD CONSTRAINT `chk_listing_price`      CHECK (`price` >= 0),
  ADD CONSTRAINT `chk_listing_deposit`    CHECK (`deposit` >= 0),
  ADD CONSTRAINT `chk_listing_bills`      CHECK (`billsEstimate` IS NULL OR `billsEstimate` >= 0),
  ADD CONSTRAINT `chk_listing_rooms`      CHECK (`bedrooms` >= 0 AND `bathrooms` >= 0),
  ADD CONSTRAINT `chk_listing_size`       CHECK (`sizeSqm` IS NULL OR `sizeSqm` > 0),
  ADD CONSTRAINT `chk_listing_min_stay`   CHECK (`minStayMonths` >= 1),
  ADD CONSTRAINT `chk_listing_capacity`   CHECK (`capacityMin` >= 1 AND `capacityMin` <= `capacityMax`),
  ADD CONSTRAINT `chk_listing_occupants`  CHECK (`currentOccupants` >= 0 AND `currentOccupants` <= `capacityMax`),
  ADD CONSTRAINT `chk_listing_lat`        CHECK (`lat` IS NULL OR `lat` BETWEEN -90 AND 90),
  ADD CONSTRAINT `chk_listing_lng`        CHECK (`lng` IS NULL OR `lng` BETWEEN -180 AND 180);

ALTER TABLE `UserProfile`
  ADD CONSTRAINT `chk_profile_budget` CHECK (`budgetMonthly` IS NULL OR `budgetMonthly` >= 0);

ALTER TABLE `RoommateRequest`
  ADD CONSTRAINT `chk_request_budget` CHECK (`budgetShare` IS NULL OR `budgetShare` >= 0);

ALTER TABLE `POI`
  ADD CONSTRAINT `chk_poi_tier` CHECK (`priceTier` IS NULL OR `priceTier` BETWEEN 1 AND 4),
  ADD CONSTRAINT `chk_poi_lat`  CHECK (`lat` BETWEEN -90 AND 90),
  ADD CONSTRAINT `chk_poi_lng`  CHECK (`lng` BETWEEN -180 AND 180);

ALTER TABLE `CostEstimate`
  ADD CONSTRAINT `chk_cost_range` CHECK (`minPrice` >= 0 AND `minPrice` <= `maxPrice`),
  ADD CONSTRAINT `chk_cost_tier`  CHECK (`tier` BETWEEN 0 AND 4);

ALTER TABLE `SupermarketChain`
  ADD CONSTRAINT `chk_market_tier` CHECK (`priceTier` BETWEEN 1 AND 4);

ALTER TABLE `SimPlan`
  ADD CONSTRAINT `chk_simplan_price` CHECK (`priceMonthly` >= 0),
  ADD CONSTRAINT `chk_simplan_data`  CHECK (`dataGb` IS NULL OR `dataGb` >= 0);

ALTER TABLE `ExchangeRate`
  ADD CONSTRAINT `chk_rate_positive` CHECK (`rate` > 0);

ALTER TABLE `Itinerary`
  ADD CONSTRAINT `chk_itin_days`   CHECK (`days` BETWEEN 1 AND 30),
  ADD CONSTRAINT `chk_itin_people` CHECK (`peopleCount` BETWEEN 1 AND 50 AND `roomsNeeded` BETWEEN 1 AND 50),
  ADD CONSTRAINT `chk_itin_budget` CHECK (`budget` > 0),
  ADD CONSTRAINT `chk_itin_split`  CHECK (
    `pctStay` BETWEEN 0 AND 100 AND `pctFood` BETWEEN 0 AND 100 AND
    `pctActivities` BETWEEN 0 AND 100 AND `pctTransport` BETWEEN 0 AND 100 AND
    `pctStay` + `pctFood` + `pctActivities` + `pctTransport` = 100);

ALTER TABLE `ItineraryItem`
  ADD CONSTRAINT `chk_item_day`  CHECK (`dayNumber` >= 1),
  ADD CONSTRAINT `chk_item_cost` CHECK (`estimatedCost` >= 0);

-- ---------------------------------------------------------------- functions
-- Great-circle distance in kilometres (Haversine). DETERMINISTIC + NO SQL so it can
-- be created with binary logging enabled and used inside views and ORDER BY.
CREATE FUNCTION `fn_distance_km`(lat1 DOUBLE, lng1 DOUBLE, lat2 DOUBLE, lng2 DOUBLE)
RETURNS DOUBLE
DETERMINISTIC NO SQL
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
END;

CREATE FUNCTION `fn_spots_left`(capacity_max INT, occupants INT)
RETURNS INT
DETERMINISTIC NO SQL
RETURN GREATEST(capacity_max - occupants, 0);

-- ---------------------------------------------------------------- views
-- One row per listing with everything a result card needs.
CREATE OR REPLACE VIEW `v_listing_summary` AS
SELECT
  l.`id`, l.`ownerId`, l.`title`, l.`type`, l.`status`, l.`address`,
  l.`price`, l.`deposit`, l.`currency`, l.`bedrooms`, l.`bathrooms`, l.`sizeSqm`,
  l.`furnished`, l.`availableFrom`, l.`minStayMonths`, l.`isShareable`,
  l.`capacityMin`, l.`capacityMax`, l.`currentOccupants`,
  `fn_spots_left`(l.`capacityMax`, l.`currentOccupants`) AS `spotsLeft`,
  l.`preference` AS `genderPreference`, l.`lat`, l.`lng`, l.`createdAt`,
  c.`id` AS `cityId`, c.`name` AS `cityName`,
  r.`id` AS `regionId`, r.`name` AS `regionName`,
  co.`id` AS `countryId`, co.`name` AS `countryName`, co.`isoCode` AS `countryCode`,
  COALESCE(bp.`displayName`, u.`name`) AS `ownerName`,
  COALESCE(bp.`isVerified`, FALSE) AS `ownerVerified`,
  (SELECT p.`url` FROM `ListingPhoto` p
     WHERE p.`listingId` = l.`id`
     ORDER BY p.`position`, p.`id` LIMIT 1) AS `coverUrl`,
  (SELECT COUNT(*) FROM `ListingPhoto` p WHERE p.`listingId` = l.`id`) AS `photoCount`,
  (SELECT COUNT(*) FROM `RoommateRequest` rr
     WHERE rr.`listingId` = l.`id` AND rr.`status` = 'OPEN') AS `openRequests`
FROM `Listing` l
JOIN `City` c          ON c.`id` = l.`cityId`
JOIN `Country` co      ON co.`id` = c.`countryId`
LEFT JOIN `Region` r   ON r.`id` = c.`regionId`
JOIN `User` u          ON u.`id` = l.`ownerId`
LEFT JOIN `BusinessProfile` bp ON bp.`userId` = l.`ownerId`;

-- Compatibility (0-100) between a viewer and every OPEN roommate request on a listing
-- in the viewer's destination city. Mirrors computeCompatibility() in src/lib/matching.ts.
--   budget 30 | move-in 20 | gender 20 | smoking 10 | pets 10 | social 5 | sleep 5
CREATE OR REPLACE VIEW `v_roommate_compatibility` AS
SELECT
  vp.`userId`      AS `viewerId`,
  rr.`id`          AS `requestId`,
  rr.`requesterId` AS `requesterId`,
  rr.`listingId`   AS `listingId`,
  l.`cityId`       AS `cityId`,
  ROUND(
    -- budget overlap: ratio of the smaller to the larger monthly amount
    CASE WHEN vp.`budgetMonthly` IS NULL OR COALESCE(rr.`budgetShare`, rp.`budgetMonthly`) IS NULL
              OR GREATEST(vp.`budgetMonthly`, COALESCE(rr.`budgetShare`, rp.`budgetMonthly`)) = 0
         THEN 15
         ELSE 30 * LEAST(vp.`budgetMonthly`, COALESCE(rr.`budgetShare`, rp.`budgetMonthly`))
                 / GREATEST(vp.`budgetMonthly`, COALESCE(rr.`budgetShare`, rp.`budgetMonthly`))
    END
    -- move-in proximity: full points on the same day, zero at 60+ days apart
    + CASE WHEN vp.`moveInDate` IS NULL OR COALESCE(rr.`moveInDate`, rp.`moveInDate`) IS NULL THEN 10
           ELSE 20 * GREATEST(0, 1 - ABS(DATEDIFF(vp.`moveInDate`, COALESCE(rr.`moveInDate`, rp.`moveInDate`))) / 60)
      END
    -- gender: listing rule and both people's roommate preferences must hold
    + CASE WHEN (l.`preference` = 'FEMALE_ONLY' AND vp.`gender` <> 'FEMALE')
             OR (l.`preference` = 'MALE_ONLY'   AND vp.`gender` <> 'MALE')
             OR (vp.`roommateGender` = 'FEMALE_ONLY' AND COALESCE(rp.`gender`, 'UNDISCLOSED') <> 'FEMALE')
             OR (vp.`roommateGender` = 'MALE_ONLY'   AND COALESCE(rp.`gender`, 'UNDISCLOSED') <> 'MALE')
             OR (COALESCE(rp.`roommateGender`, 'ANYONE') = 'FEMALE_ONLY' AND vp.`gender` <> 'FEMALE')
             OR (COALESCE(rp.`roommateGender`, 'ANYONE') = 'MALE_ONLY'   AND vp.`gender` <> 'MALE')
           THEN 0 ELSE 20 END
    -- smoking
    + CASE WHEN vp.`smoking` = COALESCE(rp.`smoking`, 'NON_SMOKER') THEN 10
           WHEN (vp.`smoking` = 'NON_SMOKER' AND rp.`smoking` = 'SMOKER')
             OR (vp.`smoking` = 'SMOKER' AND COALESCE(rp.`smoking`, 'NON_SMOKER') = 'NON_SMOKER') THEN 0
           ELSE 5 END
    -- pets
    + CASE WHEN (vp.`hasPets` AND NOT COALESCE(rp.`okWithPets`, TRUE))
             OR (COALESCE(rp.`hasPets`, FALSE) AND NOT vp.`okWithPets`) THEN 0 ELSE 10 END
    -- social style
    + CASE WHEN vp.`socialStyle` = COALESCE(rp.`socialStyle`, 'BALANCED') THEN 5
           WHEN 'BALANCED' IN (vp.`socialStyle`, COALESCE(rp.`socialStyle`, 'BALANCED')) THEN 2.5
           ELSE 0 END
    -- sleep schedule
    + CASE WHEN vp.`sleepSchedule` = COALESCE(rp.`sleepSchedule`, 'FLEXIBLE') THEN 5
           WHEN 'FLEXIBLE' IN (vp.`sleepSchedule`, COALESCE(rp.`sleepSchedule`, 'FLEXIBLE')) THEN 2.5
           ELSE 0 END
  ) AS `score`
FROM `UserProfile` vp
JOIN `Listing` l          ON l.`cityId` = vp.`destinationCityId` AND l.`isShareable` = TRUE AND l.`status` = 'ACTIVE'
JOIN `RoommateRequest` rr ON rr.`listingId` = l.`id` AND rr.`status` = 'OPEN' AND rr.`requesterId` <> vp.`userId`
LEFT JOIN `UserProfile` rp ON rp.`userId` = rr.`requesterId`;

-- ---------------------------------------------------------------- procedure
-- Mark a listing as rented in one transaction: lock the row, verify ownership,
-- set status, close every OPEN roommate request. Returns the number closed.
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
END;

-- ---------------------------------------------------------------- triggers
-- Audit every price or status change of a listing.
CREATE TRIGGER `trg_listing_audit_au`
AFTER UPDATE ON `Listing`
FOR EACH ROW
BEGIN
  IF NOT (OLD.`price` <=> NEW.`price`) OR NOT (OLD.`status` <=> NEW.`status`) THEN
    INSERT INTO `AuditLog` (`tableName`, `rowId`, `action`, `oldValue`, `newValue`, `changedAt`)
    VALUES ('Listing', NEW.`id`, 'UPDATE',
            JSON_OBJECT('price', OLD.`price`, 'status', OLD.`status`),
            JSON_OBJECT('price', NEW.`price`, 'status', NEW.`status`),
            NOW(3));
  END IF;
END;

-- A shareable listing that becomes full is automatically marked RENTED,
-- and one that frees a spot again goes back to ACTIVE.
CREATE TRIGGER `trg_listing_occupancy_bu`
BEFORE UPDATE ON `Listing`
FOR EACH ROW
BEGIN
  IF NEW.`isShareable` AND NEW.`currentOccupants` >= NEW.`capacityMax` AND NEW.`status` = 'ACTIVE' THEN
    SET NEW.`status` = 'RENTED';
  ELSEIF NEW.`isShareable` AND OLD.`status` = 'RENTED' AND NEW.`status` = 'RENTED'
         AND NEW.`currentOccupants` < OLD.`currentOccupants` THEN
    SET NEW.`status` = 'ACTIVE';
  END IF;
END;

-- openRequesterId = requesterId while OPEN, NULL otherwise. Together with
-- UNIQUE(listingId, openRequesterId) this is a "partial unique index":
-- one OPEN request per user per listing, any number of closed ones.
CREATE TRIGGER `trg_request_open_bi`
BEFORE INSERT ON `RoommateRequest`
FOR EACH ROW
SET NEW.`openRequesterId` = IF(NEW.`status` = 'OPEN', NEW.`requesterId`, NULL);

CREATE TRIGGER `trg_request_open_bu`
BEFORE UPDATE ON `RoommateRequest`
FOR EACH ROW
SET NEW.`openRequesterId` = IF(NEW.`status` = 'OPEN', NEW.`requesterId`, NULL);

-- A conversation always stores the smaller user id first and never pairs a user
-- with themselves. (A CHECK cannot be used: MySQL forbids CHECKs on columns with
-- ON DELETE CASCADE foreign keys.)
CREATE TRIGGER `trg_conversation_bi`
BEFORE INSERT ON `Conversation`
FOR EACH ROW
BEGIN
  IF NEW.`userAId` >= NEW.`userBId` THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Conversation requires userAId < userBId';
  END IF;
END;

CREATE TRIGGER `trg_block_bi`
BEFORE INSERT ON `Block`
FOR EACH ROW
BEGIN
  IF NEW.`blockerId` = NEW.`blockedId` THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'A user cannot block themselves';
  END IF;
END;
