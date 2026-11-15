-- Where the person's university / employer is (geocoded from the profile's organisation name),
-- so the dashboard can rank homes and essentials by distance to campus.
ALTER TABLE `UserProfile`
  ADD COLUMN `organizationLat` DOUBLE NULL,
  ADD COLUMN `organizationLng` DOUBLE NULL;

ALTER TABLE `UserProfile`
  ADD CONSTRAINT `chk_profile_org_point` CHECK (
    (`organizationLat` IS NULL AND `organizationLng` IS NULL)
    OR (`organizationLat` BETWEEN -90 AND 90 AND `organizationLng` BETWEEN -180 AND 180)
  );
